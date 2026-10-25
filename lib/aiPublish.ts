import crypto from "crypto";
import express from "express";
import { safeUrl } from "./siteContent";
import * as db from "./db";
import { handleMcp } from "./aiMcp";

/**
 * Create-only article API for outside AI / automation tools (ChatGPT Actions, Make, Zapier…).
 *
 *   POST /api/ai/articles   create one article (draft or published)
 *   POST /api/ai/images     upload one image, returns a URL for coverImage / <img>
 *
 * Auth is a dedicated key, NOT the admin cookie. The key lives only in the Netlify environment
 * variable AI_PUBLISH_API_KEY (several keys may be separated by commas, to rotate without downtime).
 * Revoke = delete/replace the variable and redeploy. There is deliberately no update/delete here.
 * Articles are written with the same table and the same db.createArticle() as the admin.
 */

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const ARTICLE_CATEGORIES = new Set(["大人理財", "兒童理財", "企業永續", "金融科技"]);

const MIN_KEY_LENGTH = 32;
const IMAGE_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

const sha256 = (value: string) => crypto.createHash("sha256").update(value).digest();

function configuredKeys(): string[] {
  return String(process.env.AI_PUBLISH_API_KEY ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter((k) => k.length >= MIN_KEY_LENGTH);
}

/**
 * For clients that can only call a URL (no custom headers, e.g. ChatGPT custom MCP with "no authentication"):
 * the secret rides in the path /api/ai/mcp/<token>. The token is HMAC(key, "mcp-url-v1"), so it never reveals
 * the real key, works only for the MCP endpoint, and stops working the moment the key is changed or removed.
 */
export function mcpUrlToken(key: string): string {
  return crypto.createHmac("sha256", key).update("mcp-url-v1").digest("hex");
}

function presentedKey(req: express.Request): string {
  const auth = String(req.headers.authorization ?? "");
  const bearer = /^Bearer\s+(.+)$/i.exec(auth);
  return (bearer ? bearer[1] : String(req.headers["x-api-key"] ?? "")).trim();
}

/** Constant-time check of the presented key against every configured key. */
function keyIsValid(presented: string, keys: string[]): boolean {
  if (!presented) return false;
  const given = sha256(presented);
  let ok = false;
  for (const key of keys) ok = crypto.timingSafeEqual(given, sha256(key)) || ok;
  return ok;
}

/** Belt and braces: the site also sanitises on display, but never store active content. */
export function stripActiveContent(html: string): string {
  return html
    .replace(/<\s*(script|style|iframe|object|embed|form|link|meta|base)\b[\s\S]*?(<\s*\/\s*\1\s*>|$)/gi, "")
    .replace(/<\s*(script|style|iframe|object|embed|form|link|meta|base)\b[^>]*>/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|src)\s*=\s*("|')\s*(javascript|data|vbscript):[^"']*\2/gi, '$1=$2#$2');
}

const pick = (body: any, ...names: string[]) => {
  for (const n of names) if (body?.[n] !== undefined && body[n] !== null) return body[n];
  return undefined;
};

type Parsed = { input: db.ArticleInput } | { error: string };

function parseAiArticle(body: any): Parsed {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { error: "請以 JSON 物件送出文章資料" };

  const title = String(pick(body, "title") ?? "").trim();
  if (!title) return { error: "缺少必要欄位：title（標題）" };
  if (title.length > 200) return { error: "title 不可超過 200 字" };

  const slug = String(pick(body, "slug") ?? "").trim().toLowerCase();
  if (!slug) return { error: "缺少必要欄位：slug（網址名稱，英文小寫、數字、連字號，例如 kids-money-tips）" };
  if (slug.length > 80 || !SLUG_PATTERN.test(slug) || slug.startsWith("art-")) {
    return { error: "slug 只能用英文小寫、數字和連字號（-），最長 80 字，且不能以 art- 開頭" };
  }

  const bodyHtml = String(pick(body, "contentHtml", "content_html", "body") ?? "").trim();
  if (!bodyHtml) return { error: "缺少必要欄位：contentHtml（文章內文 HTML）" };
  if (bodyHtml.length > 200000) return { error: "contentHtml 太長（上限 200,000 字元）" };

  const status = String(pick(body, "status") ?? "draft").trim().toLowerCase();
  if (status !== "draft" && status !== "published") return { error: 'status 只能是 "draft" 或 "published"' };

  const category = String(pick(body, "category") ?? "").trim();
  if (category && !ARTICLE_CATEGORIES.has(category)) {
    return { error: `category 只能是：${[...ARTICLE_CATEGORIES].join("、")}（或留空）` };
  }

  const coverRaw = String(pick(body, "coverImage", "cover_image") ?? "").trim();
  const coverImage = /^(https?:\/\/|\/(?!\/))/i.test(coverRaw) ? safeUrl(coverRaw) : "";
  if (coverRaw && !coverImage) return { error: "coverImage 必須是 https:// 開頭的網址（可先用 /api/ai/images 上傳）" };

  const publishedRaw = pick(body, "publishedAt", "published_at");
  let publishedAt = new Date().toISOString();
  if (publishedRaw !== undefined && String(publishedRaw).trim() !== "") {
    const parsed = new Date(String(publishedRaw));
    if (Number.isNaN(parsed.getTime())) return { error: "publishedAt 必須是 ISO 8601 時間，例如 2026-11-01T09:00:00+08:00" };
    publishedAt = parsed.toISOString();
  }

  return {
    input: {
      title,
      slug,
      summary: String(pick(body, "excerpt", "summary") ?? "").trim().slice(0, 500),
      seoDescription: String(pick(body, "seoDescription", "seo_description") ?? "").trim().slice(0, 300),
      author: String(pick(body, "author") ?? "").trim().slice(0, 60),
      coverImage,
      body: stripActiveContent(bodyHtml),
      category,
      published: status === "published",
      publishedAt,
    },
  };
}

/** Shared by the REST endpoint and the MCP tool so both follow identical rules. */
export async function createArticleCore(body: unknown): Promise<{ status: number; body: Record<string, unknown> }> {
  const parsed = parseAiArticle(body);
  if ("error" in parsed) return { status: 400, body: { error: parsed.error } };
  try {
    if (await db.getArticleByKey(parsed.input.slug)) {
      return { status: 409, body: { error: `slug「${parsed.input.slug}」已經有文章使用，請換一個網址名稱` } };
    }
    const article = await db.createArticle(parsed.input);
    console.log(`AI publish: created article ${article.id} (${article.published ? "published" : "draft"})`);
    return {
      status: 201,
      body: {
        success: true,
        id: article.id,
        slug: article.slug,
        status: article.published ? "published" : "draft",
        publishedAt: article.publishedAt,
        isLive: db.isArticleLive(article),
        url: `/articles/${article.slug}`,
      },
    };
  } catch (err: any) {
    const message = String(err?.message || "");
    if (/網址|slug|duplicate/i.test(message) && /已|duplicate/i.test(message)) {
      return { status: 409, body: { error: "這個 slug 已經有文章使用，請換一個網址名稱" } };
    }
    console.error("AI publish create error:", message);
    return { status: 500, body: { error: "建立文章失敗" } };
  }
}

export function createAiPublishRouter(): express.Router {
  const router = express.Router();

  // 1. Method guard: only POST is ever allowed on these paths.
  router.all(["/articles", "/images", "/mcp", "/mcp/:token"], (req, res, next) => {
    if (req.method === "POST") return next();
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "這個網址只接受 POST" });
  });

  // 2. Key guard.
  router.use((req, res, next) => {
    const keys = configuredKeys();
    if (keys.length === 0) {
      // Fails closed: with no key configured the API is simply off.
      return res.status(503).json({ error: "AI 發布功能尚未啟用（伺服器未設定 API Key）" });
    }
    const urlToken = /^\/mcp\/([0-9a-f]{64})$/.exec(req.path)?.[1];
    if (urlToken) {
      if (keys.some((k) => keyIsValid(urlToken, [mcpUrlToken(k)]))) return next();
      console.warn("AI publish: rejected request with invalid MCP URL token");
      return res.status(401).json({ error: "連結無效" });
    }
    if (!keyIsValid(presentedKey(req), keys)) {
      console.warn("AI publish: rejected request with missing/invalid key");
      return res.status(401).json({ error: "API Key 無效或未提供" });
    }
    next();
  });

  router.post("/articles", async (req, res) => {
    const result = await createArticleCore(req.body);
    res.status(result.status).json(result.body);
  });

  // MCP endpoint (for ChatGPT custom MCP servers etc.): same key, same rules, one create-only tool.
  router.post(["/mcp", "/mcp/:token"], async (req, res) => {
    const reply = await handleMcp(req.body, createArticleCore);
    if (reply === null) return res.status(202).end();
    res.json(reply);
  });

  // Photos from the classroom etc.: JSON { contentType, dataBase64 } -> public URL.
  router.post("/images", async (req, res) => {
    try {
      const contentType = String(req.body?.contentType ?? "").toLowerCase();
      const ext = IMAGE_TYPES[contentType];
      if (!ext) return res.status(400).json({ error: "contentType 只支援 image/png、image/jpeg、image/webp、image/gif" });
      const data = Buffer.from(String(req.body?.dataBase64 ?? ""), "base64");
      if (data.length === 0) return res.status(400).json({ error: "缺少 dataBase64（圖片的 base64 內容）" });
      if (data.length > MAX_IMAGE_BYTES) return res.status(413).json({ error: "圖片太大，請壓縮到 4MB 以內" });
      const path = `uploads/${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${ext}`;
      const url = await db.uploadSiteAsset(data, contentType, path);
      res.status(201).json({ success: true, url });
    } catch (err: any) {
      console.error("AI publish upload error:", String(err?.message || ""));
      res.status(500).json({ error: "上傳圖片失敗" });
    }
  });

  return router;
}

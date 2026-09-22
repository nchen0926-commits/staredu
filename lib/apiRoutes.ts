import crypto from "crypto";
import express from "express";
import Stripe from "stripe";
import { resolveSiteContent, safeUrl } from "./siteContent";
import { syncLeadToMailerLite } from "./mailerlite";
import {
  verifyAdminPassword,
  createSessionToken,
  verifySessionToken,
  parseCookies,
  buildSessionCookie,
  buildClearSessionCookie,
  SESSION_COOKIE_NAME,
} from "./adminAuth";
import * as db from "./db";

let stripeClient: Stripe | null = null;
const getStripe = () => {
  if (!stripeClient && process.env.STRIPE_SECRET_KEY) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-02-24.acacia" as any,
    });
  }
  return stripeClient;
};

/**
 * All /api/* route handlers, shared between the local dev server
 * (server.ts, mounted at /api) and the Netlify Function that serves
 * the same paths in production (netlify/functions/api.ts).
 */
export function createApiRouter(): express.Router {
  const router = express.Router();

  const isAdmin = (req: express.Request) =>
    verifySessionToken(parseCookies(req.headers.cookie)[SESSION_COOKIE_NAME]);

  const requireAdmin: express.RequestHandler = (req, res, next) => {
    if (isAdmin(req)) {
      return next();
    }
    res.status(401).json({ error: "需要管理員登入" });
  };

  // --- Admin auth ---

  router.post("/admin/login", (req, res) => {
    try {
      const { password } = req.body || {};
      if (typeof password !== "string" || !verifyAdminPassword(password)) {
        return res.status(401).json({ error: "密碼錯誤" });
      }
      const token = createSessionToken();
      res.setHeader("Set-Cookie", buildSessionCookie(token, process.env.NODE_ENV === "production"));
      res.json({ success: true });
    } catch (err: any) {
      console.error("Admin login error:", err);
      res.status(500).json({ error: err?.message || "登入時發生錯誤" });
    }
  });

  router.post("/admin/logout", (req, res) => {
    res.setHeader("Set-Cookie", buildClearSessionCookie(process.env.NODE_ENV === "production"));
    res.json({ success: true });
  });

  router.get("/admin/session", (req, res) => {
    const cookies = parseCookies(req.headers.cookie);
    res.json({ authenticated: verifySessionToken(cookies[SESSION_COOKIE_NAME]) });
  });

  // --- Editable site content (logo, nav, home/footer text, ...) ---

  router.get("/site-content", async (req, res) => {
    res.json(await db.getSiteContent());
  });

  router.post("/site-content", requireAdmin, async (req, res) => {
    try {
      // Re-validate server-side: drops unknown keys, caps lengths, sanitizes links.
      const content = resolveSiteContent(req.body);
      await db.saveSiteContent(content);
      res.json({ success: true, content });
    } catch (err: any) {
      console.error("Site content save error:", err);
      res.status(500).json({ error: err?.message || "儲存網站內容失敗" });
    }
  });

  // --- Image upload (admin only) ---

  const IMAGE_TYPES: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/svg+xml": "svg",
  };
  const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

  router.post(
    "/admin/upload",
    requireAdmin,
    express.raw({ type: "image/*", limit: "5mb" }),
    async (req, res) => {
      try {
        const contentType = String(req.headers["content-type"] || "").split(";")[0].trim().toLowerCase();
        const ext = IMAGE_TYPES[contentType];
        if (!ext) {
          return res.status(415).json({ error: "只支援 PNG、JPG、WebP、GIF、SVG 圖片" });
        }
        const body = req.body;
        if (!Buffer.isBuffer(body) || body.length === 0) {
          return res.status(400).json({ error: "沒有收到圖片檔案" });
        }
        if (body.length > MAX_UPLOAD_BYTES) {
          return res.status(413).json({ error: "圖片太大，請壓縮到 4MB 以內" });
        }
        const path = `uploads/${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${ext}`;
        const url = await db.uploadSiteAsset(body, contentType, path);
        res.json({ success: true, url });
      } catch (err: any) {
        console.error("Upload error:", err);
        res.status(500).json({ error: err?.message || "上傳失敗" });
      }
    }
  );

  // --- Articles ---

  const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const BOT_AGENT = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless/i;

  // Returns the cleaned article, or a message describing what is wrong.
  const parseArticle = (input: any): db.ArticleInput | string => {
    const title = String(input?.title ?? "").trim().slice(0, 200);
    if (!title) return "請填寫文章標題";

    const slug = String(input?.slug ?? "").trim().toLowerCase();
    if (slug && (slug.length > 80 || !SLUG_PATTERN.test(slug) || slug.startsWith("art-"))) {
      return "網址名稱只能用英文小寫、數字和連字號（-），例如 kids-money-tips，而且不能以 art- 開頭";
    }

    const parsed = new Date(input?.publishedAt);
    return {
      title,
      slug,
      summary: String(input?.summary ?? "").trim().slice(0, 500),
      seoDescription: String(input?.seoDescription ?? "").trim().slice(0, 300),
      author: String(input?.author ?? "").trim().slice(0, 60),
      coverImage: safeUrl(String(input?.coverImage ?? "")),
      body: String(input?.body ?? "").slice(0, 200000),
      published: Boolean(input?.published),
      publishedAt: Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString(),
    };
  };

  // Public list: only articles that are live (published and their time has come), no body text.
  router.get("/articles", async (req, res) => {
    try {
      const articles = await db.listArticles(true);
      res.json(articles.map(({ body, viewCount, ...rest }) => rest));
    } catch (err) {
      // Keep the public page working (empty) if the table isn't set up yet.
      console.error("Load articles error:", err);
      res.json([]);
    }
  });

  router.get("/articles/:key", async (req, res) => {
    try {
      const article = await db.getArticleByKey(req.params.key);
      const admin = isAdmin(req);
      // Drafts and not-yet-due articles are only visible to a logged-in admin (for previewing).
      if (!article || (!db.isArticleLive(article) && !admin)) {
        return res.status(404).json({ error: "找不到這篇文章" });
      }
      if (admin) return res.json(article);
      const { viewCount, ...publicArticle } = article;
      res.json(publicArticle);
    } catch (err: any) {
      console.error("Load article error:", err);
      res.status(500).json({ error: err?.message || "讀取文章失敗" });
    }
  });

  // Counts one view. Ignores the admin previewing, crawlers, and articles that aren't live.
  router.post("/articles/:key/view", async (req, res) => {
    try {
      if (isAdmin(req) || BOT_AGENT.test(String(req.headers["user-agent"] || ""))) {
        return res.json({ counted: false });
      }
      const article = await db.getArticleByKey(req.params.key);
      if (!article || !db.isArticleLive(article)) return res.json({ counted: false });
      await db.incrementArticleViews(article.id);
      res.json({ counted: true });
    } catch {
      res.json({ counted: false });
    }
  });

  router.get("/admin/articles", requireAdmin, async (req, res) => {
    try {
      res.json(await db.listArticles(false));
    } catch (err: any) {
      console.error("Admin load articles error:", err);
      res.status(500).json({ error: err?.message || "讀取文章失敗" });
    }
  });

  router.post("/articles", requireAdmin, async (req, res) => {
    try {
      const input = parseArticle(req.body);
      if (typeof input === "string") return res.status(400).json({ error: input });
      res.json({ success: true, article: await db.createArticle(input) });
    } catch (err: any) {
      console.error("Article create error:", err);
      res.status(500).json({ error: err?.message || "新增文章失敗" });
    }
  });

  router.put("/articles/:id", requireAdmin, async (req, res) => {
    try {
      const input = parseArticle(req.body);
      if (typeof input === "string") return res.status(400).json({ error: input });
      const article = await db.updateArticle(req.params.id, input);
      if (!article) return res.status(404).json({ error: "找不到這篇文章" });
      res.json({ success: true, article });
    } catch (err: any) {
      console.error("Article update error:", err);
      res.status(500).json({ error: err?.message || "儲存文章失敗" });
    }
  });

  router.delete("/articles/:id", requireAdmin, async (req, res) => {
    try {
      const removed = await db.deleteArticle(req.params.id);
      if (!removed) return res.status(404).json({ error: "找不到這篇文章" });
      res.json({ success: true });
    } catch (err: any) {
      console.error("Article delete error:", err);
      res.status(500).json({ error: err?.message || "刪除文章失敗" });
    }
  });

  // --- Email signups (lead capture popup) ---

  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  router.post("/leads", async (req, res) => {
    try {
      const { email, source, website } = req.body || {};
      // Honeypot: a real visitor never fills this hidden field. Pretend
      // success so a bot can't tell it was rejected.
      if (typeof website === "string" && website.trim()) {
        return res.json({ success: true });
      }
      const cleaned = String(email ?? "").trim().toLowerCase();
      if (!cleaned || cleaned.length > 200 || !EMAIL_PATTERN.test(cleaned)) {
        return res.status(400).json({ error: "請輸入正確的 Email 格式" });
      }
      await db.createLead(cleaned, String(source ?? "").slice(0, 200));
      // Best-effort: MailerLite being down must not fail the visitor's own signup.
      await syncLeadToMailerLite(cleaned);
      res.json({ success: true });
    } catch (err: any) {
      console.error("Lead create error:", err);
      res.status(500).json({ error: err?.message || "送出失敗，請稍後再試" });
    }
  });

  router.get("/admin/leads", requireAdmin, async (req, res) => {
    try {
      res.json(await db.listLeads());
    } catch (err: any) {
      console.error("Admin load leads error:", err);
      res.status(500).json({ error: err?.message || "讀取名單失敗" });
    }
  });

  router.delete("/admin/leads/:id", requireAdmin, async (req, res) => {
    try {
      const removed = await db.deleteLead(req.params.id);
      if (!removed) return res.status(404).json({ error: "找不到這筆資料" });
      res.json({ success: true });
    } catch (err: any) {
      console.error("Lead delete error:", err);
      res.status(500).json({ error: err?.message || "刪除失敗" });
    }
  });

  // --- Config ---

  router.get("/config", async (req, res) => {
    try {
      res.json(await db.getConfig());
    } catch (err: any) {
      console.error("Load config error:", err);
      res.status(500).json({ error: err?.message || "Failed to load config" });
    }
  });

  router.post("/config", requireAdmin, async (req, res) => {
    try {
      const { homeBanners, physicalBanner, onlineBanner } = req.body || {};
      const config = await db.saveConfig({ homeBanners, physicalBanner, onlineBanner });
      res.json({ success: true, config });
    } catch (err: any) {
      console.error("Config save error:", err);
      res.status(500).json({ error: err?.message || "Failed to save configuration" });
    }
  });

  // --- Courses ---

  // Payment/registration links must be real web addresses (no javascript: etc.).
  const cleanPaymentUrl = (value: unknown) => {
    const v = String(value ?? "").trim().slice(0, 1000);
    return /^https?:\/\//i.test(v) ? v : "";
  };

  router.get("/courses", async (req, res) => {
    try {
      const { type } = req.query;
      res.json(await db.listCourses(typeof type === "string" ? type : undefined));
    } catch (err: any) {
      console.error("Load courses error:", err);
      res.status(500).json({ error: err?.message || "Failed to load courses" });
    }
  });

  router.get("/courses/:id", async (req, res) => {
    try {
      const course = await db.getCourse(req.params.id);
      if (course) {
        res.json(course);
      } else {
        res.status(404).json({ error: "Course not found" });
      }
    } catch (err: any) {
      console.error("Load course error:", err);
      res.status(500).json({ error: err?.message || "Failed to load course" });
    }
  });

  router.post("/courses", requireAdmin, async (req, res) => {
    try {
      const { title, type, category, price, priceUnit, paymentUrl, description, image, tags, location, duration, details, startDate, endDate } = req.body || {};
      const course = await db.createCourse({
        type: type === "online" ? "online" : "physical",
        paymentUrl: cleanPaymentUrl(paymentUrl),
        priceUnit: typeof priceUnit === "string" ? priceUnit.trim().slice(0, 10) : (type === "online" ? "月" : ""),
        title: title || "",
        category: category || "",
        price: Number(price) || 0,
        description: description || "",
        image: image || "",
        tags: Array.isArray(tags) ? tags : (tags ? String(tags).split(",").map((t: string) => t.trim()).filter(Boolean) : []),
        location: location || "",
        duration: duration || "",
        details: details || "",
        startDate: startDate || "",
        endDate: endDate || "",
      });
      res.json({ success: true, course });
    } catch (err: any) {
      console.error("Course create error:", err);
      res.status(500).json({ error: err?.message || "Failed to create course" });
    }
  });

  router.put("/courses/:id", requireAdmin, async (req, res) => {
    try {
      const { title, type, category, price, priceUnit, paymentUrl, description, image, tags, location, duration, details, startDate, endDate } = req.body || {};
      const patch: any = {};
      if (title !== undefined) patch.title = title;
      if (type !== undefined) patch.type = type;
      if (category !== undefined) patch.category = category;
      if (price !== undefined) patch.price = Number(price) || 0;
      if (typeof priceUnit === "string") patch.priceUnit = priceUnit.trim().slice(0, 10);
      if (paymentUrl !== undefined) patch.paymentUrl = cleanPaymentUrl(paymentUrl);
      if (description !== undefined) patch.description = description;
      if (image !== undefined) patch.image = image;
      if (tags !== undefined) patch.tags = Array.isArray(tags) ? tags : String(tags).split(",").map((t: string) => t.trim()).filter(Boolean);
      if (location !== undefined) patch.location = location;
      if (duration !== undefined) patch.duration = duration;
      if (details !== undefined) patch.details = details;
      if (startDate !== undefined) patch.startDate = startDate;
      if (endDate !== undefined) patch.endDate = endDate;

      const course = await db.updateCourse(req.params.id, patch);
      if (course) {
        res.json({ success: true, course });
      } else {
        res.status(404).json({ error: "Course not found" });
      }
    } catch (err: any) {
      console.error("Course update error:", err);
      res.status(500).json({ error: err?.message || "Failed to update course" });
    }
  });

  router.delete("/courses/:id", requireAdmin, async (req, res) => {
    try {
      const removed = await db.deleteCourse(req.params.id);
      if (removed) {
        res.json({ success: true, course: removed });
      } else {
        res.status(404).json({ error: "Course not found" });
      }
    } catch (err: any) {
      console.error("Course delete error:", err);
      res.status(500).json({ error: err?.message || "Failed to delete course" });
    }
  });

  // --- Stripe checkout ---

  router.post("/create-checkout-session", async (req, res) => {
    try {
      const { courseId } = req.body || {};
      const course = await db.getCourse(courseId);

      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      // A payment link set in the admin (e.g. ECPay) always wins.
      if (course.paymentUrl) {
        return res.json({ url: course.paymentUrl });
      }

      const stripe = getStripe();
      const origin = req.headers.origin || "http://localhost:3000";

      if (!stripe) {
        // The demo flow ends on a fake "order confirmed" page, so it must never
        // reach real visitors. Enable it only on purpose, e.g. for local testing.
        if (process.env.ALLOW_DEMO_CHECKOUT === "1") {
          return res.json({
            url: `${origin}/success?session_id=demo_session_${course.id}&course_id=${course.id}`,
          });
        }
        return res.status(503).json({ error: "目前尚未開放線上付款，請聯絡我們報名，謝謝！" });
      }

      // Only a per-month price is billed as a recurring subscription; any other unit is a one-time payment.
      const isSubscription = course.type === "online" && course.priceUnit === "月";

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "twd",
              product_data: {
                name: course.title,
                description: course.description,
                images: course.image.startsWith("http") ? [course.image] : [],
              },
              unit_amount: course.price * 100,
              ...(isSubscription && {
                recurring: {
                  interval: "month",
                },
              }),
            },
            quantity: 1,
          },
        ],
        mode: isSubscription ? "subscription" : "payment",
        success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}&course_id=${course.id}`,
        cancel_url: `${origin}/${course.type === "physical" ? "physical-courses" : "online-courses"}`,
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Stripe Checkout Error:", error);
      res.status(500).json({ error: error.message || "Failed to create checkout session" });
    }
  });

  router.get("/checkout-session/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const stripe = getStripe();

      if (!stripe || sessionId.startsWith("demo_session_")) {
        return res.json({
          id: sessionId,
          payment_status: "paid",
          status: "complete",
          demo: true,
        });
      }

      const session = await stripe.checkout.sessions.retrieve(sessionId);
      res.json(session);
    } catch (error: any) {
      console.error("Retrieve Session Error:", error);
      res.status(500).json({ error: error.message || "Failed to retrieve session" });
    }
  });

  return router;
}

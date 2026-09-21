import * as db from "../../lib/db";
import { resolveSiteContent, safeUrl } from "../../lib/siteContent";
import { descriptionFromHtml, escapeHtml, htmlToSemantic, renderPage } from "../../lib/seoRender";

/**
 * Server-rendered output for what search engines and AI crawlers read:
 *   /articles, /articles/:key  -> real HTML, meta tags and structured data
 *   /sitemap.xml               -> generated from the live articles
 *   /llms.txt                  -> plain-language site guide for AI assistants
 * Everything else about the site is still the normal client-side app; if
 * anything here fails we fall back to serving that app's index.html.
 */

interface NetlifyEvent {
  path: string;
  rawUrl?: string;
  queryStringParameters?: Record<string, string | undefined> | null;
}

interface NetlifyResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

const SITE = (process.env.SITE_URL || "https://e-staredu.com").replace(/\/$/, "");
const CACHE = "public, max-age=0, s-maxage=120, stale-while-revalidate=300";

type Route =
  | { type: "sitemap" }
  | { type: "llms" }
  | { type: "articles" }
  | { type: "article"; key: string }
  | { type: "unknown" };

function resolveRoute(event: NetlifyEvent): Route {
  const paths: string[] = [];
  try {
    if (event.rawUrl) paths.push(new URL(event.rawUrl).pathname);
  } catch {
    // ignore malformed URL
  }
  paths.push(event.path);

  for (const raw of paths) {
    let path = raw.replace(/^\/\.netlify\/functions\/seo/, "") || "/";
    try {
      path = decodeURIComponent(path);
    } catch {
      // keep as is
    }
    if (path === "/sitemap.xml") return { type: "sitemap" };
    if (path === "/llms.txt") return { type: "llms" };
    if (/^\/articles\/?$/.test(path)) return { type: "articles" };
    const match = path.match(/^\/articles\/([^/]+)\/?$/);
    if (match) return { type: "article", key: match[1] };
  }

  const hint = event.queryStringParameters?.route;
  if (hint === "sitemap") return { type: "sitemap" };
  if (hint === "llms") return { type: "llms" };
  if (hint === "articles") return { type: "articles" };
  return { type: "unknown" };
}

async function loadTemplate(): Promise<string> {
  const origin = (process.env.URL || SITE).replace(/\/$/, "");
  const res = await fetch(`${origin}/index.html`);
  if (!res.ok) throw new Error(`index.html responded ${res.status}`);
  return res.text();
}

const html = (statusCode: number, body: string): NetlifyResponse => ({
  statusCode,
  headers: { "content-type": "text/html; charset=utf-8", "cache-control": CACHE },
  body,
});

const articleUrl = (article: db.Article) => `${SITE}/articles/${article.slug || article.id}`;
const day = (iso: string) => iso.slice(0, 10);

const wrap = (inner: string) =>
  `<main style="max-width:48rem;margin:0 auto;padding:2rem 1rem;font-family:sans-serif;line-height:1.8;color:#1e293b">${inner}</main>`;

export const handler = async (event: NetlifyEvent): Promise<NetlifyResponse> => {
  try {
    const route = resolveRoute(event);
    const content = resolveSiteContent(await db.getSiteContent());
    const brand = content.brand.name;
    const publisherName = content.footer.companyName || brand;
    const logo = safeUrl(content.brand.logoUrl);
    const logoUrl = logo.startsWith("/") ? `${SITE}${logo}` : logo || `${SITE}/logo.png`;

    if (route.type === "sitemap") {
      const articles = await db.listArticles(true).catch(() => [] as db.Article[]);
      const pages = ["/", "/physical-courses", "/online-courses", "/articles"];
      const urls = [
        ...pages.map((p) => `  <url><loc>${SITE}${p === "/" ? "/" : p}</loc></url>`),
        ...articles.map((a) => `  <url><loc>${escapeHtml(articleUrl(a))}</loc><lastmod>${day(a.updatedAt)}</lastmod></url>`),
      ];
      return {
        statusCode: 200,
        headers: { "content-type": "application/xml; charset=utf-8", "cache-control": CACHE },
        body: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`,
      };
    }

    if (route.type === "llms") {
      const articles = await db.listArticles(true).catch(() => [] as db.Article[]);
      const lines = [
        `# ${brand}`,
        "",
        `> ${content.brand.tagline || content.footer.description}`,
        "",
        content.footer.description,
        "",
        "## 主要頁面",
        `- [首頁](${SITE}/)`,
        `- [實體營隊 / 課程](${SITE}/physical-courses)`,
        `- [線上課程](${SITE}/online-courses)`,
        `- [文章](${SITE}/articles)`,
        "",
        "## 文章",
        ...(articles.length
          ? articles.map((a) => `- [${a.title}](${articleUrl(a)})${a.summary ? `: ${a.summary.replace(/\s+/g, " ")}` : ""}`)
          : ["- （目前尚無文章）"]),
        "",
        "## 聯絡",
        ...(content.footer.email ? [`- Email：${content.footer.email}`] : []),
        ...(content.footer.phone ? [`- 電話：${content.footer.phone}`] : []),
        ...(content.footer.address ? [`- 地址：${content.footer.address}`] : []),
        "",
      ];
      return {
        statusCode: 200,
        headers: { "content-type": "text/plain; charset=utf-8", "cache-control": CACHE },
        body: lines.join("\n"),
      };
    }

    const template = await loadTemplate();

    if (route.type === "articles") {
      const articles = await db.listArticles(true).catch(() => [] as db.Article[]);
      const description = `${brand}的文章與分享。`;
      const list = articles
        .map(
          (a) =>
            `<li><a href="${escapeHtml(articleUrl(a))}">${escapeHtml(a.title)}</a>${
              a.summary ? ` — ${escapeHtml(a.summary)}` : ""
            }</li>`
        )
        .join("");
      return html(
        200,
        renderPage(template, {
          title: `文章 | ${brand}`,
          description,
          canonical: `${SITE}/articles`,
          ogType: "website",
          bodyHtml: wrap(`<h1>文章</h1>${list ? `<ul>${list}</ul>` : "<p>目前還沒有文章。</p>"}`),
          jsonLd: [
            {
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              name: "文章",
              url: `${SITE}/articles`,
              inLanguage: "zh-TW",
              hasPart: articles.slice(0, 50).map((a) => ({ "@type": "Article", headline: a.title, url: articleUrl(a) })),
            },
          ],
        })
      );
    }

    if (route.type === "article") {
      const article = await db.getArticleByKey(route.key);
      if (!article || !db.isArticleLive(article)) {
        // Unknown, draft, or not yet due: let the app show its "not found" page, with a real 404 for crawlers.
        return html(404, template);
      }

      const url = articleUrl(article);
      const description = article.seoDescription || article.summary || descriptionFromHtml(article.body);
      const cover = safeUrl(article.coverImage);
      const image = cover.startsWith("/") ? `${SITE}${cover}` : cover || undefined;
      const author = article.author || publisherName;

      const bodyHtml = wrap(
        `<article><h1>${escapeHtml(article.title)}</h1>` +
          `<p>${escapeHtml(day(article.publishedAt))} · ${escapeHtml(author)}</p>` +
          (image ? `<p><img src="${escapeHtml(image)}" alt="${escapeHtml(article.title)}" style="max-width:100%;height:auto"></p>` : "") +
          `${htmlToSemantic(article.body)}</article>`
      );

      return html(
        200,
        renderPage(template, {
          title: `${article.title} | ${brand}`,
          description,
          canonical: url,
          ogType: "article",
          image,
          publishedTime: article.publishedAt,
          modifiedTime: article.updatedAt,
          bodyHtml,
          jsonLd: [
            {
              "@context": "https://schema.org",
              "@type": "Article",
              headline: article.title,
              description,
              ...(image ? { image: [image] } : {}),
              datePublished: article.publishedAt,
              dateModified: article.updatedAt,
              inLanguage: "zh-TW",
              author: { "@type": "Organization", name: author },
              publisher: {
                "@type": "Organization",
                name: publisherName,
                logo: { "@type": "ImageObject", url: logoUrl },
              },
              mainEntityOfPage: { "@type": "WebPage", "@id": url },
            },
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "首頁", item: `${SITE}/` },
                { "@type": "ListItem", position: 2, name: "文章", item: `${SITE}/articles` },
                { "@type": "ListItem", position: 3, name: article.title, item: url },
              ],
            },
          ],
        })
      );
    }

    return html(200, await loadTemplate());
  } catch (err) {
    console.error("SEO function error:", err);
    try {
      return html(200, await loadTemplate());
    } catch {
      return { statusCode: 500, headers: { "content-type": "text/plain; charset=utf-8" }, body: "Temporarily unavailable" };
    }
  }
};

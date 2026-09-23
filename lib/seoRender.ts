/**
 * Helpers for the server-rendered pages that search engines and AI crawlers
 * read (netlify/functions/seo.ts). The site itself is a client-rendered app,
 * and most crawlers do not run JavaScript, so without this they would see an
 * empty page. Pure string functions; no DOM needed.
 */

const ENTITY = /&(?![a-zA-Z]+;|#\d+;|#x[0-9a-fA-F]+;)/g;

export function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Escapes text that may already contain valid entities (e.g. HTML written by the editor). */
function escapeLoose(value: string): string {
  return value.replace(ENTITY, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function isHtml(text: string): boolean {
  return /<(p|h[1-6]|ul|ol|li|div|br|img|strong|b|em|span|blockquote|a)[\s>/]/i.test(text);
}

export interface FaqItem {
  question: string;
  answer: string;
}

/**
 * Pulls "Q...：...A：..." pairs out of the free-text 常見問題 content
 * (admin writes plain text, not a structured form) so it can be marked up
 * as real Q&A HTML and FAQPage JSON-LD. Any section headers or other text
 * between pairs (e.g. "一、關於課程") are simply not matched and ignored.
 * Returns [] if the text doesn't follow this pattern.
 */
export function parseFaq(body: string): FaqItem[] {
  // The answer stops at a blank line (paragraph break), the next question,
  // or the end — not just the next "Q", so a section header like "二、心態與
  // 實踐" sitting between pairs doesn't get swallowed into the prior answer.
  const pattern = /Q\d*[：:]\s*([^\n]+)\n\s*A\d*[：:]\s*([^\n]+)(?=\n\s*\n|\n\s*Q\d*[：:]|\s*$)/g;
  const items: FaqItem[] = [];
  for (const match of body.matchAll(pattern)) {
    const question = match[1].trim();
    const answer = match[2].trim();
    if (question && answer) items.push({ question, answer });
  }
  return items;
}

function readAttr(attrs: string, name: string): string {
  const match = attrs.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i'));
  return match ? (match[1] ?? match[2] ?? '') : '';
}

const KEEP_TAGS = new Set([
  'p', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'blockquote',
  'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'sub', 'sup',
]);

/**
 * Turns the editor's HTML into a small, attribute-free, safe subset
 * (headings, paragraphs, lists, bold/italic, links, images). Anything else
 * is dropped, so nothing in the article can inject script into the page.
 */
export function htmlToSemantic(source: string): string {
  const html = isHtml(source)
    ? source
    : source
        .replace(/\r\n/g, '\n')
        .split(/\n{2,}/)
        .map((block) => (block.trim() ? `<p>${escapeHtml(block.trim()).replace(/\n/g, '<br>')}</p>` : ''))
        .join('');

  const out: string[] = [];
  let skipping = false;

  for (const token of html.match(/<[^>]*>|[^<]+/g) ?? []) {
    if (!token.startsWith('<')) {
      if (!skipping) out.push(escapeLoose(token));
      continue;
    }
    const match = token.match(/^<\s*(\/?)\s*([a-zA-Z][a-zA-Z0-9]*)([^>]*)>$/);
    if (!match) continue;
    const closing = match[1] === '/';
    const tag = match[2].toLowerCase();
    const attrs = match[3];

    if (tag === 'script' || tag === 'style') {
      skipping = !closing;
      continue;
    }
    if (skipping) continue;

    if (tag === 'img') {
      const src = readAttr(attrs, 'src');
      if (/^https?:\/\//i.test(src)) {
        out.push(`<img src="${escapeLoose(src)}" alt="${escapeLoose(readAttr(attrs, 'alt'))}">`);
      }
    } else if (tag === 'a') {
      const href = readAttr(attrs, 'href');
      if (closing) out.push('</a>');
      else out.push(/^(https?:\/\/|mailto:|tel:)/i.test(href) ? `<a href="${escapeLoose(href)}">` : '<a>');
    } else if (tag === 'br' || tag === 'hr') {
      out.push('<br>');
    } else if (KEEP_TAGS.has(tag)) {
      out.push(closing ? `</${tag}>` : `<${tag}>`);
    }
  }
  return out.join('');
}

/** Plain-text summary of some HTML, for meta descriptions. */
export function descriptionFromHtml(source: string, max = 160): string {
  const text = source
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export interface PageMeta {
  title: string;
  description: string;
  canonical: string;
  ogType: 'website' | 'article';
  image?: string;
  jsonLd?: unknown[];
  bodyHtml: string;
  publishedTime?: string;
  modifiedTime?: string;
  noindex?: boolean;
}

function upsertMeta(html: string, attr: 'name' | 'property', key: string, content: string): string {
  const tag = `<meta ${attr}="${key}" content="${escapeHtml(content)}" />`;
  const pattern = new RegExp(`<meta\\s+${attr}="${key}"[^>]*>`, 'i');
  return pattern.test(html) ? html.replace(pattern, () => tag) : html.replace('</head>', () => `    ${tag}\n  </head>`);
}

/** Puts the page-specific title/meta/structured data/content into the app's index.html. */
export function renderPage(template: string, meta: PageMeta): string {
  let html = template;

  html = html.replace(/<title>[\s\S]*?<\/title>/i, () => `<title>${escapeHtml(meta.title)}</title>`);
  html = upsertMeta(html, 'name', 'description', meta.description);
  html = upsertMeta(html, 'property', 'og:title', meta.title);
  html = upsertMeta(html, 'property', 'og:description', meta.description);
  html = upsertMeta(html, 'property', 'og:url', meta.canonical);
  html = upsertMeta(html, 'property', 'og:type', meta.ogType);
  html = upsertMeta(html, 'name', 'twitter:card', meta.image ? 'summary_large_image' : 'summary');
  html = upsertMeta(html, 'name', 'twitter:title', meta.title);
  html = upsertMeta(html, 'name', 'twitter:description', meta.description);
  if (meta.image) {
    html = upsertMeta(html, 'property', 'og:image', meta.image);
    html = upsertMeta(html, 'name', 'twitter:image', meta.image);
  }
  if (meta.publishedTime) html = upsertMeta(html, 'property', 'article:published_time', meta.publishedTime);
  if (meta.modifiedTime) html = upsertMeta(html, 'property', 'article:modified_time', meta.modifiedTime);
  if (meta.noindex) html = upsertMeta(html, 'name', 'robots', 'noindex, nofollow');

  const canonicalTag = `<link rel="canonical" href="${escapeHtml(meta.canonical)}" />`;
  html = /<link\s+rel="canonical"[^>]*>/i.test(html)
    ? html.replace(/<link\s+rel="canonical"[^>]*>/i, () => canonicalTag)
    : html.replace('</head>', () => `    ${canonicalTag}\n  </head>`);

  const jsonLd = (meta.jsonLd ?? [])
    .map((item) => `    <script type="application/ld+json">${JSON.stringify(item).replace(/</g, '\\u003c')}</script>`)
    .join('\n');
  if (jsonLd) html = html.replace('</head>', () => `${jsonLd}\n  </head>`);

  // React replaces this content as soon as the app loads; crawlers read it as-is.
  html = html.replace('<div id="root"></div>', () => `<div id="root">${meta.bodyHtml}</div>`);
  return html;
}

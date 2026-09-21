import DOMPurify from 'dompurify';

/**
 * Article text is stored as HTML written in the visual editor. Anything
 * shown to visitors (or pasted into the editor) goes through this first:
 * only a fixed set of formatting tags/attributes survives, links must be
 * http(s)/mailto/tel, images must be normal web addresses, and inline
 * styles are cut down to colour, alignment and image width.
 */

const ALLOWED_TAGS = [
  'p', 'br', 'h2', 'h3', 'h4', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
  'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'hr', 'span', 'div', 'font', 'sub', 'sup',
];
const ALLOWED_ATTR = ['href', 'src', 'alt', 'title', 'style', 'color', 'target', 'rel'];
const ALLOWED_STYLE_PROPS = new Set(['color', 'background-color', 'text-align', 'width']);

let hookInstalled = false;

function installHook() {
  if (hookInstalled) return;
  hookInstalled = true;

  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    const el = node as HTMLElement;

    if (el.hasAttribute?.('style')) {
      const kept: string[] = [];
      for (let i = 0; i < el.style.length; i++) {
        const prop = el.style[i];
        const value = el.style.getPropertyValue(prop);
        if (ALLOWED_STYLE_PROPS.has(prop) && !/url\(|expression|javascript|@import/i.test(value)) {
          kept.push(`${prop}: ${value}`);
        }
      }
      if (kept.length) el.setAttribute('style', kept.join('; '));
      else el.removeAttribute('style');
    }

    if (el.tagName === 'A') {
      const href = el.getAttribute('href') || '';
      if (!/^(https?:\/\/|mailto:|tel:)/i.test(href)) {
        el.removeAttribute('href');
      } else if (/^https?:/i.test(href)) {
        el.setAttribute('target', '_blank');
        el.setAttribute('rel', 'noopener noreferrer');
      }
    }

    if (el.tagName === 'IMG') {
      const src = el.getAttribute('src') || '';
      if (!/^(https?:\/\/|\/)/i.test(src)) el.removeAttribute('src');
    }
  });
}

export function sanitizeArticleHtml(html: string): string {
  installHook();
  return String(
    DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR, ALLOW_DATA_ATTR: false })
  );
}

export function isHtml(text: string): boolean {
  return /<(p|h[1-6]|ul|ol|li|div|br|img|strong|b|em|span|blockquote|a)[\s>/]/i.test(text);
}

/** Plain text -> HTML paragraphs (for text that was never written in the editor). */
export function textToHtml(text: string): string {
  const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return text
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((block) => (block.trim() ? `<p>${escape(block.trim()).replace(/\n/g, '<br>')}</p>` : ''))
    .join('');
}

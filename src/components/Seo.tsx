import { useEffect } from 'react';

interface SeoProps {
  title: string;
  description: string;
  noindex?: boolean;
}

function setMetaTag(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function removeMetaTag(attr: 'name' | 'property', key: string) {
  document.head.querySelector(`meta[${attr}="${key}"]`)?.remove();
}

/**
 * Sets the document title and meta description/OG tags per route. This is a
 * client-side-only SPA, so tags only exist after JS runs — fine for
 * Google (which executes JS), but link-preview crawlers (LINE/FB/Slack)
 * only ever see the static defaults baked into index.html.
 */
export default function Seo({ title, description, noindex }: SeoProps) {
  useEffect(() => {
    const fullTitle = `${title} | 小管家兒童理財`;
    document.title = fullTitle;
    setMetaTag('name', 'description', description);
    setMetaTag('property', 'og:title', fullTitle);
    setMetaTag('property', 'og:description', description);

    if (noindex) {
      setMetaTag('name', 'robots', 'noindex, nofollow');
    } else {
      removeMetaTag('name', 'robots');
    }
  }, [title, description, noindex]);

  return null;
}

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSiteContent } from '../hooks/useSiteContent';

interface SeoProps {
  title: string;
  description: string;
  noindex?: boolean;
}

const SITE = 'https://e-staredu.com';

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

function setCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/**
 * Sets the document title, meta description/OG tags and canonical link per
 * route. This is a client-side-only SPA, so tags only exist after JS runs —
 * fine for Google (which executes JS), but link-preview crawlers (LINE/FB/
 * Slack) only ever see the static defaults baked into index.html. Article
 * pages get real server-rendered tags separately (netlify/functions/seo.ts).
 */
export default function Seo({ title, description, noindex }: SeoProps) {
  const { content } = useSiteContent();
  const { pathname } = useLocation();

  useEffect(() => {
    const fullTitle = `${title} | ${content.brand.name}`;
    document.title = fullTitle;
    setMetaTag('name', 'description', description);
    setMetaTag('property', 'og:title', fullTitle);
    setMetaTag('property', 'og:description', description);

    const canonical = `${SITE}${pathname === '/' ? '/' : pathname.replace(/\/$/, '')}`;
    setCanonical(canonical);
    setMetaTag('property', 'og:url', canonical);

    if (noindex) {
      setMetaTag('name', 'robots', 'noindex, nofollow');
    } else {
      removeMetaTag('name', 'robots');
    }
  }, [title, description, noindex, pathname, content.brand.name]);

  return null;
}

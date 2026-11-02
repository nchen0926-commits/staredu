import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackEvent } from '../utils/track';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Sends a GA4 page_view on every route change. The gtag script in
 * index.html has automatic pageviews turned off (send_page_view: false)
 * specifically so this is the only thing sending them — this is a
 * client-side-routed SPA, so without this Google would only ever see
 * the very first page someone lands on.
 */
export default function Analytics() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window.gtag !== 'function') return;
    // Admin is behind a password and isn't meant to be measured as site traffic.
    if (location.pathname.startsWith('/admin')) return;

    window.gtag('event', 'page_view', {
      page_path: location.pathname + location.search + location.hash,
      page_title: document.title,
      page_location: window.location.href,
    });
  }, [location.pathname, location.search, location.hash]);

  // Click measuring for the whole site: LINE links (nav, footer, pages, article buttons) and any element marked data-track.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target instanceof Element ? e.target : null;
      if (!target) return;
      const marked = target.closest('[data-track]') as HTMLElement | null;
      if (marked?.dataset.track) {
        trackEvent(marked.dataset.track, { label: marked.dataset.trackLabel ?? '', link_text: (marked.textContent ?? '').trim().slice(0, 40) });
      }
      const link = target.closest('a[href]') as HTMLAnchorElement | null;
      if (link && /^https?:\/\/(lin\.ee|line\.me|page\.line\.me)\//i.test(link.href)) {
        trackEvent('click_line', { link_url: link.href, link_text: (link.textContent ?? '').trim().slice(0, 40) });
      }
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  return null;
}

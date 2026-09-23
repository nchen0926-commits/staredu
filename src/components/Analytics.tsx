import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

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

  return null;
}

/** Sends a custom event to Google Analytics 4 (not for the password-protected admin, and a no-op if GA isn't loaded). */
export function trackEvent(name: string, params: Record<string, string | number> = {}) {
  if (typeof window === 'undefined' || typeof (window as any).gtag !== 'function') return;
  if (window.location.pathname.startsWith('/admin')) return;
  try {
    (window as any).gtag('event', name, { page_path: window.location.pathname, ...params });
  } catch {
    // measuring must never break the page
  }
}

import { useEffect, useSyncExternalStore } from 'react';
import { defaultSiteContent, resolveSiteContent, SiteContent } from '../../lib/siteContent';

interface Snapshot {
  content: SiteContent;
  loaded: boolean;
}

let snapshot: Snapshot = { content: defaultSiteContent, loaded: false };
let requested = false;
const listeners = new Set<() => void>();

function publish(next: Snapshot) {
  snapshot = next;
  listeners.forEach((listener) => listener());
}

export async function refreshSiteContent(): Promise<void> {
  requested = true;
  try {
    const res = await fetch('/api/site-content');
    const raw = res.ok ? await res.json() : {};
    publish({ content: resolveSiteContent(raw), loaded: true });
  } catch (err) {
    console.error('Failed to load site content:', err);
    publish({ content: snapshot.content, loaded: true });
  }
}

/** Lets the admin page show a saved change everywhere without a reload. */
export function setSiteContent(raw: unknown) {
  publish({ content: resolveSiteContent(raw), loaded: true });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useSiteContent(): Snapshot {
  const current = useSyncExternalStore(subscribe, () => snapshot);
  useEffect(() => {
    if (!requested) refreshSiteContent();
  }, []);
  return current;
}

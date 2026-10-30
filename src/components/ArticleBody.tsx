import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { isHtml, sanitizeArticleHtml, textToHtml } from '../utils/sanitizeHtml';
import SubscribeForm from './SubscribeForm';

/** Renders an article written in the visual editor (filtered first, so nothing typed can run as code). */
export default function ArticleBody({ body }: { body: string }) {
  const html = useMemo(() => sanitizeArticleHtml(isHtml(body) ? body : textToHtml(body)), [body]);
  // Same object every render: a new one would make React rewrite the HTML and wipe the forms added below.
  const inner = useMemo(() => ({ __html: html }), [html]);
  const ref = useRef<HTMLDivElement>(null);
  const [slots, setSlots] = useState<HTMLElement[]>([]);

  // Each 訂閱表單 block the writer placed gets a real email form appended under its text.
  useEffect(() => {
    const found = Array.from(ref.current?.querySelectorAll('.subscribe-box') ?? []).map((box) => {
      const slot = document.createElement('div');
      box.appendChild(slot);
      return slot;
    });
    setSlots(found);
    return () => found.forEach((s) => s.remove());
  }, [html]);

  return (
    <>
      <div ref={ref} className="article-html" dangerouslySetInnerHTML={inner} />
      {slots.map((slot, i) => createPortal(<SubscribeForm />, slot, String(i)))}
    </>
  );
}

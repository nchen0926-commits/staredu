import { useMemo } from 'react';
import { isHtml, sanitizeArticleHtml, textToHtml } from '../utils/sanitizeHtml';

/** Renders an article written in the visual editor (filtered first, so nothing typed can run as code). */
export default function ArticleBody({ body }: { body: string }) {
  const html = useMemo(() => sanitizeArticleHtml(isHtml(body) ? body : textToHtml(body)), [body]);
  return <div className="article-html" dangerouslySetInnerHTML={{ __html: html }} />;
}

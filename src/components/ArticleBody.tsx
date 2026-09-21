import { Fragment, ReactNode } from 'react';
import { safeUrl } from '../../lib/siteContent';
import { formatImageUrl } from '../utils/imageUtils';

/**
 * Renders the article text written in the admin. Deliberately tiny format,
 * built as React elements (never raw HTML) so nothing typed can run as code:
 *   - blank line       -> new paragraph
 *   - "## text"        -> sub-heading
 *   - "**text**"       -> bold
 *   - "![說明](網址)"   -> picture (on its own paragraph)
 */
function renderInline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.length > 4 && part.startsWith('**') && part.endsWith('**') ? (
      <strong key={i} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>
    ) : (
      part
    )
  );
}

export default function ArticleBody({ body }: { body: string }) {
  const blocks = body.replace(/\r\n/g, '\n').split(/\n{2,}/);

  return (
    <div className="space-y-6 text-slate-700 leading-loose text-base sm:text-lg">
      {blocks.map((block, i) => {
        const text = block.trim();
        if (!text) return null;

        const image = text.match(/^!\[(.*?)\]\((\S+?)\)$/);
        if (image) {
          const url = safeUrl(image[2]);
          if (!url) return null;
          return (
            <img
              key={i}
              src={formatImageUrl(url)}
              alt={image[1]}
              loading="lazy"
              className="w-full h-auto rounded-2xl"
            />
          );
        }

        if (text.startsWith('## ')) {
          const [heading, ...rest] = text.split('\n');
          return (
            <Fragment key={i}>
              <h2 className="text-2xl font-black text-slate-900 pt-4">{renderInline(heading.slice(3))}</h2>
              {rest.length > 0 && <p className="whitespace-pre-line">{renderInline(rest.join('\n'))}</p>}
            </Fragment>
          );
        }

        return (
          <p key={i} className="whitespace-pre-line">
            {renderInline(text)}
          </p>
        );
      })}
    </div>
  );
}

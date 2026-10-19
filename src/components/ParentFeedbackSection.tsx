import InitialAvatar from './InitialAvatar';
import { useSiteContent } from '../hooks/useSiteContent';
import { formatImageUrl } from '../utils/imageUtils';
import { readableTextColor, type TestimonialItem } from '../../lib/siteContent';

interface ParentFeedbackSectionProps {
  title: string;
  subtitle?: string;
  screenshotsTitle: string;
  /** Page background, so the heading stays readable on any colour. */
  bgColor: string;
}

/**
 * 家長回饋 block of 小管家兒童理財.
 * - Entries with a text quote: round avatar (name + role under it) on the left, quote on the right.
 * - Entries with an image (LINE screenshots / photos): gathered together in a gallery below.
 * An entry with both shows in both places. Uses the same editable list as StoriesSection.
 */
export default function ParentFeedbackSection({ title, subtitle, screenshotsTitle, bgColor }: ParentFeedbackSectionProps) {
  const { content } = useSiteContent();
  const items = content.testimonials.items.filter((item: TestimonialItem) => item.segment === 'kids' || item.segment === '');
  const quotes = items.filter((item) => item.quote.trim() !== '');
  const shots = items.filter((item) => item.imageUrl.trim() !== '');

  if (quotes.length === 0 && shots.length === 0) return null;

  const headingColor = readableTextColor(bgColor);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
      <div className="text-center space-y-2" style={{ color: headingColor }}>
        <h2 className="text-3xl sm:text-4xl font-black">{title}</h2>
        {subtitle && <p className="text-base sm:text-lg opacity-80">{subtitle}</p>}
      </div>

      {quotes.length > 0 && (
        <div className="space-y-6">
          {quotes.map((item, idx) => (
            <figure
              key={idx}
              className="grid-paper rounded-[2rem] border border-white/70 shadow-md p-6 sm:p-9 flex flex-col sm:flex-row gap-6 sm:gap-10 items-center sm:items-start"
            >
              <div className="shrink-0 w-40 text-center space-y-2">
                {item.avatarUrl ? (
                  <img
                    src={formatImageUrl(item.avatarUrl)}
                    alt={item.name || '家長頭像'}
                    loading="lazy"
                    className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover mx-auto border-4 border-amber-100"
                  />
                ) : (
                  <InitialAvatar
                    name={item.name}
                    className="w-28 h-28 sm:w-32 sm:h-32 rounded-full mx-auto border-4 border-amber-100"
                  />
                )}
                {(item.name || item.role) && (
                  <p className="text-lg font-bold text-slate-700 leading-snug">
                    {item.name}
                    {item.role && <span className="block text-sm font-medium text-slate-500">（{item.role}）</span>}
                  </p>
                )}
              </div>

              <blockquote className="relative flex-1 pt-8 pb-8 sm:pl-6 sm:pr-6">
                <span aria-hidden="true" className="absolute left-0 top-0 text-6xl leading-none font-black text-amber-400 select-none">“</span>
                <p className="text-lg sm:text-2xl font-bold text-slate-800 leading-relaxed whitespace-pre-line">{item.quote}</p>
                <span aria-hidden="true" className="absolute right-0 bottom-0 text-6xl leading-none font-black text-amber-400 select-none">”</span>
              </blockquote>
            </figure>
          ))}
        </div>
      )}

      {shots.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-center text-xl sm:text-2xl font-black" style={{ color: headingColor }}>{screenshotsTitle}</h3>
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-5">
            {shots.map((item, idx) => (
              <figure key={idx} className="break-inside-avoid mb-5 bg-white rounded-2xl border border-white/70 shadow-md overflow-hidden">
                <img
                  src={formatImageUrl(item.imageUrl)}
                  alt={item.activityName || item.name || '家長回饋截圖'}
                  loading="lazy"
                  className="w-full h-auto"
                />
                {(item.activityName || item.date) && (
                  <figcaption className="px-4 py-3 text-xs font-bold text-amber-600">
                    {item.activityName}
                    {item.date && <span className="text-slate-400 font-normal"> · {item.date}</span>}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

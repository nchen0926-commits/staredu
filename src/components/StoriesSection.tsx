import { useSiteContent } from '../hooks/useSiteContent';
import { formatImageUrl } from '../utils/imageUtils';
import type { TestimonialItem } from '../../lib/siteContent';

interface StoriesSectionProps {
  /** 'all' (used on the home page) shows every story regardless of tag. */
  segment: 'kids' | 'adult' | 'enterprise' | 'all';
  title: string;
  subtitle?: string;
  id?: string;
}

/**
 * Shared "學員回饋／活動紀錄" block used on Home, 小管家兒童理財 and 大人的理財.
 * All items live in one editable list (site_content.testimonials.items); each
 * item is tagged with which page it belongs to. Old entries saved before this
 * tagging existed have segment: '' and are treated as 'kids' (that's the only
 * page this section existed on before).
 */
export default function StoriesSection({ segment, title, subtitle, id }: StoriesSectionProps) {
  const { content } = useSiteContent();
  const items = content.testimonials.items.filter((item: TestimonialItem) => {
    if (segment === 'all') return true;
    if (segment === 'kids') return item.segment === 'kids' || item.segment === '';
    return item.segment === segment;
  });

  if (items.length === 0) return null;

  return (
    <div id={id} className={id ? 'scroll-mt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8'}>
      <div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900">{title}</h2>
        {subtitle && <p className="text-slate-500 mt-1">{subtitle}</p>}
      </div>
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-6">
        {items.map((item, idx) => (
          <figure
            key={idx}
            className="break-inside-avoid mb-6 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
          >
            {item.imageUrl && (
              <img
                src={formatImageUrl(item.imageUrl)}
                alt={item.activityName || item.name || '活動照片'}
                loading="lazy"
                className="w-full h-auto"
              />
            )}
            {(item.quote || item.name || item.activityName) && (
              <figcaption className="p-5 space-y-1">
                {item.activityName && (
                  <p className="text-xs font-bold text-amber-600 uppercase tracking-wide">
                    {item.activityName}
                    {item.date && <span className="text-slate-400 font-normal normal-case"> · {item.date}</span>}
                  </p>
                )}
                {item.quote && <p className="text-slate-700 leading-relaxed">{item.quote}</p>}
                {item.name && <p className="text-sm font-bold text-slate-500">{item.name}</p>}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </div>
  );
}

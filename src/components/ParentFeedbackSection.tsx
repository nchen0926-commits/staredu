import { useState } from 'react';
import InitialAvatar from './InitialAvatar';
import { useSiteContent } from '../hooks/useSiteContent';
import { formatImageUrl } from '../utils/imageUtils';
import { readableTextColor, type TestimonialItem } from '../../lib/siteContent';

const LIMIT = 3;

interface ParentFeedbackSectionProps {
  title: string;
  subtitle?: string;
  /** Page background, so the heading stays readable on any colour. */
  bgColor: string;
}

/**
 * 家長回饋 block of 小管家兒童理財.
 * - Entries with a text quote: round avatar (name + role under it) on the left, quote on the right.
 * - Entries with an image (LINE screenshots / photos): gathered together in a gallery below.
 * An entry with both shows in both places. Uses the same editable list as StoriesSection.
 */
export default function ParentFeedbackSection({ title, subtitle, bgColor }: ParentFeedbackSectionProps) {
  const { content } = useSiteContent();
  const [open, setOpen] = useState(false);
  const items = content.testimonials.items.filter((item: TestimonialItem) => item.segment === 'kids' || item.segment === '');
  const quotes = items.filter((item) => item.quote.trim() !== '');

  if (quotes.length === 0) return null;

  const headingColor = readableTextColor(bgColor);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="text-center space-y-2" style={{ color: headingColor }}>
        <h2 className="text-3xl sm:text-4xl font-black">{title}</h2>
        {subtitle && <p className="text-lg sm:text-xl opacity-80">{subtitle}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {(open ? quotes : quotes.slice(0, LIMIT)).map((item, idx) => (
          <figure key={idx} className="grid-paper rounded-3xl border border-white/70 shadow-md p-5 flex gap-4 items-start">
            <div className="shrink-0 w-24 text-center space-y-1">
              {item.avatarUrl ? (
                <img
                  src={formatImageUrl(item.avatarUrl)}
                  alt={item.name || '家長頭像'}
                  loading="lazy"
                  className="w-16 h-16 rounded-full object-cover mx-auto border-4 border-amber-100"
                />
              ) : (
                <InitialAvatar name={item.name} className="w-16 h-16 rounded-full mx-auto border-4 border-amber-100" />
              )}
              {(item.name || item.role) && (
                <p className="text-base font-bold text-slate-700 leading-tight">
                  {item.name}
                  {item.role && <span className="block text-sm font-medium text-slate-500">（{item.role}）</span>}
                </p>
              )}
            </div>
            <blockquote className="flex-1 text-lg font-bold text-slate-800 leading-relaxed whitespace-pre-line">
              <span aria-hidden="true" className="text-amber-400 font-black">“</span>
              {item.quote}
            </blockquote>
          </figure>
        ))}
      </div>
      {quotes.length > LIMIT && (
        <div className="text-center">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="px-8 py-3 rounded-2xl text-lg font-bold bg-white text-blue-700 shadow-md active:scale-95"
          >
            {open ? '收起 ↑' : `看更多家長回饋（${quotes.length - LIMIT}）↓`}
          </button>
        </div>
      )}
    </div>
  );
}

import type { ReactNode } from 'react';
import { formatImageUrl } from '../utils/imageUtils';
import { readableTextColor, type SiteContent } from '../../lib/siteContent';

type KidsPage = SiteContent['kidsPage'];

function lines(text: string): string[] {
  return text.split('\n').map((l) => l.trim()).filter(Boolean);
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block px-4 py-1.5 rounded-full bg-amber-100 text-amber-700 text-base font-black">{children}</span>
  );
}

/** 適合哪類爸媽 + 報名後，家長可以獲得（圖示卡片） */
export function AudienceSection({ page }: { page: KidsPage }) {
  const onBg = readableTextColor(page.bgColor);
  const audience = lines(page.audienceList);
  const benefits = page.benefits;
  if (audience.length === 0 && benefits.length === 0) return null;
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="text-center space-y-3" style={{ color: onBg }}>
        {page.audienceBadge && <Badge>{page.audienceBadge}</Badge>}
        <h2 className="text-3xl sm:text-4xl font-black leading-tight">{page.audienceTitle}</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {audience.length > 0 && (
          <div className="bg-white rounded-3xl border border-white/70 shadow-md p-6 sm:p-8 space-y-4">
            <h3 className="text-2xl font-black text-slate-800">{page.audienceListTitle}</h3>
            <ul className="space-y-3">
              {audience.map((t, i) => (
                <li key={i} className="flex gap-3 text-xl font-bold text-slate-700 leading-snug">
                  <span aria-hidden="true" className="text-amber-500">✔</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {benefits.length > 0 && (
          <div className="bg-amber-50 rounded-3xl border border-amber-100 shadow-md p-6 sm:p-8 space-y-4">
            <h3 className="text-2xl font-black text-slate-800">☀ {page.benefitsTitle}</h3>
            <ul className="space-y-4">
              {benefits.map((b, i) => (
                <li key={i} className="flex gap-4 items-center">
                  <span className="shrink-0 w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center text-3xl select-none" aria-hidden="true">{b.icon}</span>
                  <div>
                    <p className="text-xl font-black text-amber-700 leading-snug">{b.title}</p>
                    {b.description && <p className="text-lg text-slate-700 leading-snug">{b.description}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

/** 穿插在各區塊之間的照片：1 張置中寬圖、2 張並排。照片來自「照片相簿」，用編號挑。 */
export function PhotoStrip({ page, ids }: { page: KidsPage; ids: number[] }) {
  const photos = ids.map((i) => page.classPhotos[i]).filter((p) => p && p.imageUrl);
  if (photos.length === 0) return null;
  const single = photos.length === 1;
  return (
    <div className={`${single ? 'max-w-3xl' : 'max-w-4xl'} mx-auto px-4 sm:px-6 lg:px-8`}>
      <div className={`grid gap-3 sm:gap-4 ${single ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {photos.map((p, i) => (
          <figure key={i} className="relative rounded-3xl overflow-hidden shadow-md border-4 border-white/80 bg-white">
            <img
              src={formatImageUrl(p.imageUrl)}
              alt={p.caption}
              loading="lazy"
              className={`w-full object-cover ${single ? 'aspect-[16/9] object-top' : 'aspect-square'}`}
            />
            {p.caption && (
              <figcaption className="absolute left-2 bottom-2 px-3 py-1 rounded-full bg-black/60 text-white text-base sm:text-lg font-bold">
                {p.caption}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </div>
  );
}

/** 報名流程：最後一步的按鈕跳回現有課程 */
export function EnrollSection({ page }: { page: KidsPage }) {
  const onBg = readableTextColor(page.bgColor);
  if (page.enrollSteps.length === 0) return null;
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="text-center space-y-3" style={{ color: onBg }}>
        {page.enrollBadge && <Badge>{page.enrollBadge}</Badge>}
        <h2 className="text-3xl sm:text-4xl font-black">{page.enrollTitle}</h2>
      </div>
      <ol className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {page.enrollSteps.map((s, i) => (
          <li key={i} className="bg-white rounded-3xl border border-white/70 shadow-md p-5 flex gap-4 items-start">
            <span className="shrink-0 w-11 h-11 rounded-full bg-amber-400 text-white text-xl font-black flex items-center justify-center">{i + 1}</span>
            <div className="space-y-1">
              <p className="text-xl font-black text-slate-800">{s.title}</p>
              <p className="text-lg text-slate-600 leading-relaxed">{s.description}</p>
            </div>
          </li>
        ))}
      </ol>
      {page.enrollButtonText && (
        <div className="text-center">
          <a
            href="#courses"
            className="inline-flex items-center px-10 py-4 rounded-2xl text-lg font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-900/20 transition-all active:scale-95"
          >
            {page.enrollButtonText}
          </a>
        </div>
      )}
    </div>
  );
}

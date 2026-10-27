import type { ReactNode } from 'react';
import { readableTextColor, type SiteContent } from '../../lib/siteContent';

type KidsPage = SiteContent['kidsPage'];

function lines(text: string): string[] {
  return text.split('\n').map((l) => l.trim()).filter(Boolean);
}

/** 【關鍵字】 becomes bold text. */
function withBold(text: string): ReactNode[] {
  return text.split(/(【[^】]+】)/g).map((part, i) =>
    part.startsWith('【') && part.endsWith('】')
      ? <strong key={i} className="font-black text-amber-700">{part.slice(1, -1)}</strong>
      : <span key={i}>{part}</span>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block px-4 py-1.5 rounded-full bg-amber-100 text-amber-700 text-sm font-black">{children}</span>
  );
}

/** 適合哪類爸媽 + 報名後，家長可以獲得 */
export function AudienceSection({ page }: { page: KidsPage }) {
  const onBg = readableTextColor(page.bgColor);
  const audience = lines(page.audienceList);
  const benefits = lines(page.benefitsList);
  if (audience.length === 0 && benefits.length === 0) return null;
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="text-center space-y-3" style={{ color: onBg }}>
        {page.audienceBadge && <Badge>{page.audienceBadge}</Badge>}
        <h2 className="text-3xl sm:text-4xl font-black leading-tight">{page.audienceTitle}</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {audience.length > 0 && (
          <div className="bg-white rounded-3xl border border-white/70 shadow-md p-6 sm:p-8 space-y-4">
            <h3 className="text-xl font-black text-slate-800">{page.audienceListTitle}</h3>
            <ul className="space-y-3">
              {audience.map((t, i) => (
                <li key={i} className="flex gap-3 text-lg font-bold text-slate-700 leading-snug">
                  <span aria-hidden="true" className="text-amber-500">✔</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {benefits.length > 0 && (
          <div className="bg-amber-50 rounded-3xl border border-amber-100 shadow-md p-6 sm:p-8 space-y-4">
            <h3 className="text-xl font-black text-slate-800">☀ {page.benefitsTitle}</h3>
            <ul className="space-y-3">
              {benefits.map((t, i) => (
                <li key={i} className="flex gap-3 text-base sm:text-lg text-slate-700 leading-relaxed">
                  <span aria-hidden="true" className="text-amber-500">✔</span>
                  <span>{withBold(t)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {page.audienceNote && (
        <p className="text-center text-base sm:text-lg font-bold" style={{ color: onBg }}>{page.audienceNote}</p>
      )}
    </div>
  );
}

/** 報名流程 + 官方 LINE + 社群 + 課程說明 */
export function EnrollSection({ page }: { page: KidsPage }) {
  const onBg = readableTextColor(page.bgColor);
  const socials = [
    { label: 'FB 粉專', url: page.facebookPageUrl },
    { label: 'FB 社團', url: page.facebookGroupUrl },
    { label: 'IG', url: page.instagramUrl },
  ].filter((s) => s.url);
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
      {page.enrollSteps.length > 0 && (
        <div className="space-y-8">
          <div className="text-center space-y-3" style={{ color: onBg }}>
            {page.enrollBadge && <Badge>{page.enrollBadge}</Badge>}
            <h2 className="text-3xl sm:text-4xl font-black">{page.enrollTitle}</h2>
          </div>
          <ol className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {page.enrollSteps.map((s, i) => (
              <li key={i} className="bg-white rounded-3xl border border-white/70 shadow-md p-5 flex gap-4 items-start">
                <span className="shrink-0 w-10 h-10 rounded-full bg-amber-400 text-white font-black flex items-center justify-center">{i + 1}</span>
                <div className="space-y-1">
                  <p className="text-lg font-black text-slate-800">{s.title}</p>
                  <p className="text-base text-slate-600 leading-relaxed">{s.description}</p>
                </div>
              </li>
            ))}
          </ol>

          {(page.lineUrl || socials.length > 0) && (
            <div className="bg-green-50 border border-green-200 rounded-3xl p-6 sm:p-8 text-center space-y-4">
              <p className="text-lg sm:text-xl font-black text-slate-800">{page.lineBoxTitle}</p>
              {page.lineUrl && (
                <a
                  href={page.lineUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-8 py-3 rounded-2xl text-base font-bold text-white bg-green-500 hover:bg-green-600 shadow-md transition-all active:scale-95"
                >
                  {page.lineButtonText}
                </a>
              )}
              {page.lineHint && <p className="text-sm sm:text-base text-slate-600">{page.lineHint}</p>}
              {socials.length > 0 && (
                <div className="flex flex-wrap justify-center gap-3 pt-2">
                  {socials.map((s) => (
                    <a
                      key={s.label}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-2 rounded-full bg-white border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50"
                    >
                      {s.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {page.policies.length > 0 && (
        <div className="space-y-8">
          <div className="text-center space-y-3" style={{ color: onBg }}>
            {page.policyBadge && <Badge>{page.policyBadge}</Badge>}
            <h2 className="text-3xl sm:text-4xl font-black">{page.policyTitle}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {page.policies.map((p, i) => (
              <div key={i} className="bg-white rounded-3xl border border-white/70 shadow-md p-5 space-y-2">
                <p className="text-lg font-black text-slate-800">{p.icon} {p.title}</p>
                <p className="text-base text-slate-600 leading-relaxed whitespace-pre-line">{p.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

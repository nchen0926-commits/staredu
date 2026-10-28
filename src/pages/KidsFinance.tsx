import { useEffect, useState } from 'react';
import { Course } from '../types';
import CourseCard from '../components/CourseCard';
import Seo from '../components/Seo';
import ParentFeedbackSection from '../components/ParentFeedbackSection';
import { AudienceSection, PhotoStrip } from '../components/SignupInfoSections';
import { useSiteContent } from '../hooks/useSiteContent';
import { formatImageUrl } from '../utils/imageUtils';
import { readableTextColor } from '../../lib/siteContent';

function bulletLines(text: string): string[] {
  return text.split('\n').map((line) => line.trim()).filter(Boolean);
}

export default function KidsFinance() {
  const { content } = useSiteContent();
  const page = content.kidsPage;
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    fetch('/api/courses')
      .then((res) => res.json())
      .then((data) => setCourses(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  // The page colour is editable in the admin; headings that sit directly on it flip between dark and white.
  const onBg = readableTextColor(page.bgColor);

  return (
    <div className="space-y-16 pb-28 pt-14 min-h-screen" style={{ backgroundColor: page.bgColor }}>
      <Seo
        title="小管家兒童理財"
        description="小管家兒童理財是星育學苑旗下的兒童金融教育品牌，用原創故事、遊戲與生活任務，陪孩子建立受用一生的金錢觀念。"
      />

      {/* Hero：左文字、右照片 */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div className="text-center md:text-left space-y-5" style={{ color: onBg }}>
            <h1 className="text-4xl sm:text-5xl font-black leading-tight">{page.heroTitle}</h1>
            <p className="text-xl sm:text-2xl leading-relaxed opacity-85">{page.heroSubtitle}</p>
            <a
              href="#courses"
              className="inline-flex items-center px-10 py-4 rounded-2xl text-lg font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-900/20 transition-all active:scale-95"
            >
              {page.heroCtaText}
            </a>
          </div>
          {page.heroImageUrl && (
            <img
              src={formatImageUrl(page.heroImageUrl)}
              alt="孩子們開心地一起上理財課"
              className="w-full aspect-[4/3] object-cover rounded-[2rem] shadow-xl border-8 border-white/80"
            />
          )}
        </div>
      </div>

      {/* 認識我是誰（短版，連到外部介紹） */}
      {page.introText && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
          <div className="flex items-center gap-4 bg-white/85 rounded-full pl-2 pr-6 py-2 shadow-md">
            {page.introImageUrl && (
              <img src={formatImageUrl(page.introImageUrl)} alt="陳亮君 亮亮老師" className="w-16 h-16 rounded-full object-cover object-top shrink-0" />
            )}
            <div className="text-left">
              <p className="text-lg sm:text-xl font-bold text-slate-800 leading-snug">{page.introText}</p>
              {page.founderLinkUrl && (
                <a href={page.founderLinkUrl} className="text-base sm:text-lg font-bold text-blue-700 underline underline-offset-4">
                  {page.founderLinkText} ↗
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 適合哪類爸媽 */}
      <AudienceSection page={page} />

      <PhotoStrip page={page} ids={[1, 2]} />

      {/* 三大收穫 */}
      {page.gains.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid-paper rounded-[2.5rem] shadow-md px-5 sm:px-10 py-12 sm:py-16 space-y-12">
            <div className="text-center space-y-3">
              <h2 className="text-4xl sm:text-5xl font-black bg-linear-to-r from-amber-500 to-yellow-400 bg-clip-text text-transparent">
                {page.gainsTitle}
              </h2>
              {page.gainsSubtitle && <p className="text-xl sm:text-2xl font-bold text-slate-800">{page.gainsSubtitle}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {page.gains.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-[2rem] px-7 pt-9 pb-8 text-center space-y-4"
                  style={{ backgroundColor: item.bgColor, borderBottom: `10px solid ${item.borderColor}` }}
                >
                  <div className="w-24 h-24 rounded-full bg-white mx-auto flex items-center justify-center text-5xl select-none" aria-hidden="true">
                    {item.icon}
                  </div>
                  <h3 className="text-3xl font-black text-slate-800">{item.title}</h3>
                  <details className="group text-left">
                    <summary className="list-none cursor-pointer text-center text-lg font-bold text-blue-700 [&::-webkit-details-marker]:hidden group-open:hidden">看說明 ↓</summary>
                    <p className="text-lg text-slate-700 leading-relaxed">{item.description}</p>
                  </details>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <PhotoStrip page={page} ids={[0]} />

      {/* 課程特色（四大塊） */}
      {page.highlights.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2" style={{ color: onBg }}>
            <h2 className="text-3xl sm:text-4xl font-black">{page.highlightsTitle}</h2>
            {page.highlightsSubtitle && <p className="text-xl sm:text-2xl font-bold opacity-85">{page.highlightsSubtitle}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {page.highlights.map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-[2rem] p-7 sm:p-9 flex items-center justify-between gap-4 min-h-[9rem] overflow-hidden"
                style={{ border: `10px solid ${item.borderColor}` }}
              >
                <div className="space-y-3 min-w-0">
                  <h3 className="text-3xl sm:text-4xl font-black text-slate-800">{item.title}</h3>
                  <ul className="space-y-1.5 text-slate-700 text-lg sm:text-xl leading-relaxed list-disc pl-5">
                    {bulletLines(item.description).map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                </div>
                {item.imageUrl ? (
                  <img
                    src={formatImageUrl(item.imageUrl)}
                    alt={item.title}
                    loading="lazy"
                    className="w-32 sm:w-44 h-auto max-h-48 object-contain shrink-0"
                  />
                ) : (
                  item.icon && (
                    <span className="text-6xl sm:text-7xl shrink-0 select-none" aria-hidden="true">
                      {item.icon}
                    </span>
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <PhotoStrip page={page} ids={[3]} />

      {/* 中段報名按鈕 */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <a
          href="#courses"
          className="inline-flex items-center px-10 py-4 rounded-2xl text-lg font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-900/20 transition-all active:scale-95"
        >
          {page.ctaText}
        </a>
      </div>

      {/* 現有課程 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div id="courses" className="scroll-mt-24 space-y-8">
          <h2 className="text-3xl sm:text-4xl font-black text-center" style={{ color: onBg }}>{page.coursesTitle}</h2>
          {courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/60">
              <p className="text-slate-400 text-sm">課程籌備中，敬請期待</p>
            </div>
          )}
        </div>
      </div>

      {/* 家長回饋：頭像在左、文字在右；LINE 截圖集中放下方 */}
      <ParentFeedbackSection
        title={page.storiesTitle}
        subtitle={page.storiesSubtitle}
        bgColor={page.bgColor}
      />

      {/* 兒童理財學習地圖：4 個系列 × 3 個年齡層 */}
      {page.learningMap.rows.length > 0 && (
        <details className="group max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <summary className="list-none cursor-pointer text-center space-y-4 [&::-webkit-details-marker]:hidden" style={{ color: onBg }}>
            <h2 className="text-3xl sm:text-4xl font-black">{page.learningMap.title}</h2>
            <span className="inline-flex items-center px-8 py-3.5 rounded-2xl text-lg font-bold bg-white text-blue-700 shadow-md group-open:hidden">
              {page.mapButtonText}
            </span>
          </summary>
          <div className="pt-8">
          <div className="grid-paper rounded-[2.5rem] shadow-md px-4 sm:px-8 py-10 sm:py-14 space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl sm:text-5xl font-black text-slate-800">{page.learningMap.title}</h2>
              {page.learningMap.subtitle && (
                <p className="text-sm sm:text-base font-bold tracking-[0.25em] text-slate-500">{page.learningMap.subtitle}</p>
              )}
            </div>

            <div className="space-y-4">
              {/* 年齡層標題（桌機版才顯示在最上方；手機版寫在每個格子裡） */}
              <div className="hidden md:grid grid-cols-[9rem_repeat(3,minmax(0,1fr))] gap-x-8">
                <div />
                {page.learningMap.stages.map((stage, i) => (
                  <div key={i} className="rounded-2xl px-4 py-3 text-center text-white shadow-sm" style={{ backgroundColor: stage.bgColor }}>
                    <p className="text-2xl font-black">{stage.title}</p>
                    {stage.subtitle && <p className="text-base opacity-90">{stage.subtitle}</p>}
                  </div>
                ))}
              </div>

              {page.learningMap.rows.map((row, r) => (
                <div key={r} className="grid grid-cols-1 md:grid-cols-[9rem_repeat(3,minmax(0,1fr))] gap-3 md:gap-x-8 items-stretch">
                  <div
                    className="rounded-2xl px-4 py-3 md:py-4 text-white flex md:flex-col items-center md:justify-center gap-2 md:gap-0 md:text-center shadow-sm"
                    style={{ backgroundColor: row.bgColor }}
                  >
                    <p className="text-base font-bold opacity-90">{row.label}</p>
                    <p className="text-2xl font-black leading-snug">{row.title}</p>
                  </div>
                  {page.learningMap.stages.map((stage, c) => {
                    const cell = row.cells[c];
                    if (!cell) return <div key={c} className="hidden md:block" />;
                    return (
                      <div
                        key={c}
                        className="relative bg-white rounded-2xl border-2 p-4 text-center space-y-2 shadow-sm"
                        style={{ borderColor: row.bgColor }}
                      >
                        <span
                          className="md:hidden inline-block text-sm font-bold text-white rounded-full px-2.5 py-0.5"
                          style={{ backgroundColor: stage.bgColor }}
                        >
                          {stage.title}
                          {stage.subtitle ? `｜${stage.subtitle}` : ''}
                        </span>
                        {cell.icons && (
                          <p className="text-3xl sm:text-4xl leading-none select-none" aria-hidden="true">
                            {cell.icons}
                          </p>
                        )}
                        <p className="text-base sm:text-lg font-bold text-slate-700 leading-relaxed">{cell.text}</p>
                        {c < page.learningMap.stages.length - 1 && (
                          <span
                            aria-hidden="true"
                            className="hidden md:flex absolute top-1/2 -right-7 -translate-y-1/2 z-10 w-6 h-6 items-center justify-center rounded-full text-white text-sm font-black"
                            style={{ backgroundColor: row.bgColor }}
                          >
                            →
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          </div>
        </details>
      )}

      {/* 結尾：創辦人一句話 + 大按鈕 */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6" style={{ color: onBg }}>
        {page.founderQuote && (
          <div className="space-y-3">
            <p className="text-3xl sm:text-5xl font-black leading-tight">「{page.founderQuote}」</p>
            {page.founderName && <p className="text-lg sm:text-xl font-bold opacity-80">— {page.founderName}</p>}
          </div>
        )}
        <a
          href="#courses"
          className="inline-flex items-center gap-2 px-12 py-5 rounded-2xl text-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-900/20 transition-all active:scale-95"
        >
          {page.ctaText}
        </a>
      </div>

      {/* 手機下方固定按鈕 */}
      <a
        href="#courses"
        className="md:hidden fixed bottom-3 left-4 right-4 z-40 text-center py-3.5 rounded-2xl text-lg font-bold text-white bg-blue-600 shadow-xl shadow-blue-900/30 active:scale-95"
      >
        {page.ctaText}
      </a>
    </div>
  );
}

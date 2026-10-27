import { useEffect, useState } from 'react';
import { Course } from '../types';
import CourseCard from '../components/CourseCard';
import Seo from '../components/Seo';
import ParentFeedbackSection from '../components/ParentFeedbackSection';
import { AudienceSection, EnrollSection } from '../components/SignupInfoSections';
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
    <div className="space-y-16 pb-20 pt-14 min-h-screen" style={{ backgroundColor: page.bgColor }}>
      <Seo
        title="小管家兒童理財"
        description="小管家兒童理財是星育學苑旗下的兒童金融教育品牌，用原創故事、遊戲與生活任務，陪孩子建立受用一生的金錢觀念。"
      />

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4" style={{ color: onBg }}>
        <h1 className="text-3xl sm:text-5xl font-black leading-tight">{page.heroTitle}</h1>
        <p className="text-base sm:text-xl leading-relaxed max-w-2xl mx-auto opacity-85">{page.heroSubtitle}</p>
      </div>

      {/* 課程特色（四大塊） */}
      {page.highlights.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2" style={{ color: onBg }}>
            <h2 className="text-3xl sm:text-4xl font-black">{page.highlightsTitle}</h2>
            {page.highlightsSubtitle && <p className="text-lg sm:text-xl font-bold opacity-85">{page.highlightsSubtitle}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {page.highlights.map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-[2rem] p-7 sm:p-9 flex items-center justify-between gap-4 min-h-[13rem] overflow-hidden"
                style={{ border: `10px solid ${item.borderColor}` }}
              >
                <div className="space-y-3 min-w-0">
                  <h3 className="text-3xl sm:text-4xl font-black text-slate-800">{item.title}</h3>
                  <ul className="space-y-1.5 text-slate-700 text-base sm:text-lg leading-relaxed list-disc pl-5">
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

      {/* 三大收穫 */}
      {page.gains.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid-paper rounded-[2.5rem] shadow-md px-5 sm:px-10 py-12 sm:py-16 space-y-12">
            <div className="text-center space-y-3">
              <h2 className="text-4xl sm:text-5xl font-black bg-linear-to-r from-amber-500 to-yellow-400 bg-clip-text text-transparent">
                {page.gainsTitle}
              </h2>
              {page.gainsSubtitle && <p className="text-lg sm:text-xl font-bold text-slate-800">{page.gainsSubtitle}</p>}
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
                  <h3 className="text-2xl font-black text-slate-800">{item.title}</h3>
                  <p className="text-base text-slate-700 leading-relaxed text-left">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 兒童理財學習地圖：4 個系列 × 3 個年齡層 */}
      {page.learningMap.rows.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid-paper rounded-[2.5rem] shadow-md px-4 sm:px-8 py-10 sm:py-14 space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl sm:text-5xl font-black text-slate-800">{page.learningMap.title}</h2>
              {page.learningMap.subtitle && (
                <p className="text-xs sm:text-sm font-bold tracking-[0.25em] text-slate-500">{page.learningMap.subtitle}</p>
              )}
            </div>

            <div className="space-y-4">
              {/* 年齡層標題（桌機版才顯示在最上方；手機版寫在每個格子裡） */}
              <div className="hidden md:grid grid-cols-[9rem_repeat(3,minmax(0,1fr))] gap-x-8">
                <div />
                {page.learningMap.stages.map((stage, i) => (
                  <div key={i} className="rounded-2xl px-4 py-3 text-center text-white shadow-sm" style={{ backgroundColor: stage.bgColor }}>
                    <p className="text-xl font-black">{stage.title}</p>
                    {stage.subtitle && <p className="text-sm opacity-90">{stage.subtitle}</p>}
                  </div>
                ))}
              </div>

              {page.learningMap.rows.map((row, r) => (
                <div key={r} className="grid grid-cols-1 md:grid-cols-[9rem_repeat(3,minmax(0,1fr))] gap-3 md:gap-x-8 items-stretch">
                  <div
                    className="rounded-2xl px-4 py-3 md:py-4 text-white flex md:flex-col items-center md:justify-center gap-2 md:gap-0 md:text-center shadow-sm"
                    style={{ backgroundColor: row.bgColor }}
                  >
                    <p className="text-sm font-bold opacity-90">{row.label}</p>
                    <p className="text-xl font-black leading-snug">{row.title}</p>
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
                          className="md:hidden inline-block text-xs font-bold text-white rounded-full px-2.5 py-0.5"
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
                        <p className="text-sm sm:text-base font-bold text-slate-700 leading-relaxed">{cell.text}</p>
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
      )}

      {/* 適合哪類爸媽 */}
      <AudienceSection page={page} />

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

      {/* 報名流程、官方 LINE、課程說明 */}
      <EnrollSection page={page} />

      {/* 家長回饋：頭像在左、文字在右；LINE 截圖集中放下方 */}
      <ParentFeedbackSection
        title={page.storiesTitle}
        subtitle={page.storiesSubtitle}
        screenshotsTitle={page.screenshotsTitle}
        bgColor={page.bgColor}
      />

      {/* 報名 CTA：捲回上方課程清單，各課程自己的「立即報名」按鈕在那裡 */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <a
          href="#courses"
          className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl text-base font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-900/20 transition-all active:scale-95"
        >
          {page.ctaText}
        </a>
      </div>
    </div>
  );
}

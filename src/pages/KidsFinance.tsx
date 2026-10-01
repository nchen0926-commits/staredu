import { useEffect, useState } from 'react';
import { Course } from '../types';
import CourseCard from '../components/CourseCard';
import Seo from '../components/Seo';
import StoriesSection from '../components/StoriesSection';
import { useSiteContent } from '../hooks/useSiteContent';
import { BookOpen, Sparkles, HeartHandshake } from 'lucide-react';

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

  return (
    <div className="space-y-16 pb-20">
      <Seo
        title="小管家兒童理財"
        description="小管家兒童理財是星育學苑旗下的兒童金融教育品牌，用原創故事、遊戲與生活任務，陪孩子建立受用一生的金錢觀念。"
      />

      {/* Hero */}
      <div className="bg-linear-to-b from-amber-50 to-transparent pt-14 pb-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight">{page.heroTitle}</h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">{page.heroSubtitle}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* 品牌／課程理念、為什麼孩子需要金融素養、原創故事特色 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {([
            [Sparkles, page.philosophyTitle, page.philosophyBody],
            [HeartHandshake, page.whyTitle, page.whyBody],
            [BookOpen, page.featuresTitle, page.featuresBody],
          ] as const).map(([Icon, title, body], idx) => (
            <div key={idx} className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-100 shadow-sm space-y-3">
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">{title}</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        {/* 現有課程 */}
        <div id="courses" className="scroll-mt-24 space-y-8">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">{page.coursesTitle}</h2>
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

      {/* 學員回饋／活動紀錄 */}
      <StoriesSection segment="kids" title={page.storiesTitle} subtitle={page.storiesSubtitle} />

      {/* 報名 CTA：捲回上方課程清單，各課程自己的「立即報名」按鈕在那裡 */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <a
          href="#courses"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold text-white bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-md shadow-orange-500/20 transition-all active:scale-95"
        >
          {page.ctaText}
        </a>
      </div>
    </div>
  );
}

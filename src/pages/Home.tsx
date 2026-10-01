import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Course, AppConfig, Article } from '../types';
import CourseCard from '../components/CourseCard';
import Seo from '../components/Seo';
import StoriesSection from '../components/StoriesSection';
import { formatImageUrl } from '../utils/imageUtils';
import { formatDate } from '../utils/formatDate';
import { useSiteContent } from '../hooks/useSiteContent';
import { ChevronLeft, ChevronRight, Wallet, Users2, Building2 } from 'lucide-react';
import type { EntryCard as EntryCardData } from '../../lib/siteContent';

const ENTRY_ICONS = { adult: Wallet, kids: Users2, enterprise: Building2 } as const;

function EntryCard({ data, kind }: { data: EntryCardData; kind: keyof typeof ENTRY_ICONS }) {
  const Icon = ENTRY_ICONS[kind];
  return (
    <Link
      to={data.url}
      className="group flex flex-col bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-7 sm:p-8 space-y-4"
    >
      <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
        <Icon className="w-6 h-6" />
      </div>
      <div className="space-y-2 flex-grow">
        <h3 className="text-xl font-black text-slate-900 leading-snug">{data.title}</h3>
        <p className="text-sm text-slate-500 leading-relaxed whitespace-pre-line">{data.description}</p>
      </div>
      <span className="text-sm font-bold text-amber-600 group-hover:translate-x-1 transition-transform inline-block w-fit">
        {data.ctaText}
      </span>
    </Link>
  );
}

export default function Home() {
  const { content } = useSiteContent();
  const { home, brand } = content;
  const [courses, setCourses] = useState<Course[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [currentBannerIdx, setCurrentBannerIdx] = useState(0);

  useEffect(() => {
    fetch('/api/courses')
      .then((res) => res.json())
      .then((data) => setCourses(Array.isArray(data) ? data.slice(0, 6) : []))
      .catch(console.error);

    fetch('/api/articles')
      .then((res) => res.json())
      .then((data) => setArticles(Array.isArray(data) ? data.slice(0, 3) : []))
      .catch(console.error);

    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => setConfig(data))
      .catch(console.error);
  }, []);

  const rawBanners = config?.homeBanners ?? [];
  const banners = rawBanners
    .map((b) => (typeof b === 'string' ? { image: b, linkUrl: '' } : { image: b?.image || '', linkUrl: b?.linkUrl || '' }))
    .filter((b) => b.image);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIdx((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  return (
    <div className="space-y-16 sm:space-y-20 pb-20">
      <Seo
        title="首頁"
        description="星育學苑是同時服務大人、孩子與企業的金融素養教育品牌，提供大人的理財、小管家兒童理財課程，以及企業員工財務素養講座。"
      />

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16 text-center space-y-6">
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 leading-tight tracking-tight whitespace-pre-line">
          {home.heroTitle}
        </h1>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed whitespace-pre-line max-w-2xl mx-auto">
          {home.heroSubtitle}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/adult-finance"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-md transition-all active:scale-95"
          >
            {home.heroCtaAdult}
          </Link>
          <Link
            to="/kids-finance"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-sm font-bold text-white bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-md shadow-orange-500/20 transition-all active:scale-95"
          >
            {home.heroCtaKids}
          </Link>
        </div>
      </div>

      {/* Supporting banner carousel (edited in 後台 → 橫幅圖片設置) */}
      {banners.length > 0 && (
        <div className="relative w-full aspect-16/9 md:aspect-21/9 max-h-[280px] overflow-hidden bg-slate-900 shadow-lg">
          {banners.map((banner, idx) => {
            const isExternal = /^https?:\/\//.test(banner.linkUrl || '');
            const hasLink = Boolean(banner.linkUrl?.trim());
            const image = (
              <img
                src={formatImageUrl(banner.image)}
                alt={`星育學苑宣傳橫幅 ${idx + 1}`}
                className="w-full h-full object-cover object-center transition-transform duration-500 hover:scale-[1.01]"
              />
            );
            return (
              <div
                key={idx}
                className={`absolute inset-0 transition-opacity duration-1000 ${
                  idx === currentBannerIdx ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              >
                {hasLink ? (
                  isExternal ? (
                    <a href={banner.linkUrl} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                      {image}
                    </a>
                  ) : (
                    <Link to={banner.linkUrl!} className="block w-full h-full">
                      {image}
                    </Link>
                  )
                ) : (
                  image
                )}
              </div>
            );
          })}
          {banners.length > 1 && (
            <>
              <button
                onClick={() => setCurrentBannerIdx((prev) => (prev === 0 ? banners.length - 1 : prev - 1))}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-md transition-all"
                aria-label="Previous banner"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={() => setCurrentBannerIdx((prev) => (prev + 1) % banners.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-md transition-all"
                aria-label="Next banner"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
      )}

      {/* 品牌洞察 */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-snug">{home.insightTitle}</h2>
        <p className="text-slate-600 leading-loose whitespace-pre-line">{home.insightBody}</p>
      </div>

      {/* 三大服務入口 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <EntryCard data={home.entryAdult} kind="adult" />
          <EntryCard data={home.entryKids} kind="kids" />
          <EntryCard data={home.entryEnterprise} kind="enterprise" />
        </div>
      </div>

      {/* 熱門課程 */}
      {courses.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-amber-600 font-bold text-sm">{home.coursesSection.eyebrow}</div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{home.coursesSection.title}</h2>
            </div>
            <Link to="/kids-finance" className="text-sm font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 group">
              {home.coursesSection.linkText}
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      )}

      {/* 理財文章 */}
      {articles.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-amber-600 font-bold text-sm">{home.articlesSection.eyebrow}</div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{home.articlesSection.title}</h2>
            </div>
            <Link to="/articles" className="text-sm font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 group">
              {home.articlesSection.linkText}
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Link
                key={article.id}
                to={`/articles/${article.slug || article.id}`}
                className="group block bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                {article.coverImage && (
                  <div className="aspect-16/10 overflow-hidden bg-slate-100">
                    <img
                      src={formatImageUrl(article.coverImage)}
                      alt={article.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}
                <div className="p-5 space-y-1.5">
                  <p className="text-xs font-bold text-amber-600">{formatDate(article.publishedAt)}</p>
                  <h3 className="text-base font-bold text-slate-900 line-clamp-2 group-hover:text-amber-600 transition-colors">
                    {article.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 企業合作 Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-slate-900 text-white p-8 sm:p-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <p className="text-amber-400 text-sm font-bold">{home.enterpriseBanner.subtitle}</p>
            <h2 className="text-2xl sm:text-3xl font-black leading-snug">{home.enterpriseBanner.title}</h2>
            <p className="text-slate-300 leading-relaxed whitespace-pre-line">{home.enterpriseBanner.description}</p>
          </div>
          <Link
            to="/enterprise"
            className="shrink-0 px-7 py-3.5 rounded-xl text-sm font-bold text-slate-900 bg-white hover:bg-slate-100 shadow-md transition-all active:scale-95 w-fit"
          >
            {home.enterpriseBanner.ctaText}
          </Link>
        </div>
      </div>

      {/* 關於星育學苑 */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900">{home.aboutTitle || `關於${brand.name}`}</h2>
        <p className="text-slate-600 leading-loose whitespace-pre-line text-left sm:text-center">{home.aboutBody}</p>
      </div>

      {/* 學員／活動成果（三個 segment 的資料彙整） */}
      <StoriesSection segment="all" title={home.storiesTitle} subtitle={home.storiesSubtitle} id="testimonials" />
    </div>
  );
}

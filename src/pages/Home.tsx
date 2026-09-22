import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Course, AppConfig } from '../types';
import CourseCard from '../components/CourseCard';
import Seo from '../components/Seo';
import { formatImageUrl } from '../utils/imageUtils';
import { useSiteContent } from '../hooks/useSiteContent';
import { Users, MonitorPlay, ChevronLeft, ChevronRight, Award, ShieldCheck, HeartHandshake, Lightbulb } from 'lucide-react';

const ADVANTAGE_ICONS = [Lightbulb, Award, HeartHandshake, ShieldCheck];

export default function Home() {
  const { content } = useSiteContent();
  const { home, brand, testimonials } = content;
  const [courses, setCourses] = useState<Course[]>([]);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [currentBannerIdx, setCurrentBannerIdx] = useState(0);

  useEffect(() => {
    fetch('/api/courses')
      .then((res) => res.json())
      .then((data) => setCourses(data))
      .catch(console.error);

    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => setConfig(data))
      .catch(console.error);
  }, []);

  const rawBanners = config?.homeBanners?.length
    ? config.homeBanners
    : ['https://images.unsplash.com/photo-1579621970588-a35d0e7ab9b6?auto=format&fit=crop&q=80&w=1600'];

  const banners = rawBanners.map((b) => {
    if (typeof b === 'string') {
      return { image: b, linkUrl: '' };
    }
    return { image: b?.image || '', linkUrl: b?.linkUrl || '' };
  });

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIdx((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const physicalCourses = courses.filter((c) => c.type === 'physical');
  const onlineCourses = courses.filter((c) => c.type === 'online');

  return (
    <div className="space-y-16 pb-20">
      <Seo
        title="首頁"
        description="小管家兒童理財提供兒童理財教育實體營隊、週末工作坊與線上訂閱課程，透過生活化情境與實作，培養孩子的金錢觀念與理財素養。"
      />
      <h1 className="sr-only">{brand.name}：兒童理財教育實體營隊與線上訂閱課程</h1>
      {/* Hero Carousel */}
      <div className="relative w-full aspect-16/9 md:aspect-21/9 max-h-[280px] overflow-hidden bg-slate-900 shadow-lg">
        {banners.map((banner, idx) => {
          const isExternal = banner.linkUrl?.startsWith('http://') || banner.linkUrl?.startsWith('https://');
          const hasLink = Boolean(banner.linkUrl?.trim());

          const imageContent = (
            <img
              src={formatImageUrl(banner.image)}
              alt={`小管家兒童理財首頁宣傳橫幅 ${idx + 1}`}
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
                  <a
                    href={banner.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full h-full cursor-pointer"
                    title={`前往連結：${banner.linkUrl}`}
                  >
                    {imageContent}
                  </a>
                ) : (
                  <Link
                    to={banner.linkUrl!}
                    className="block w-full h-full cursor-pointer"
                    title={`前往頁面：${banner.linkUrl}`}
                  >
                    {imageContent}
                  </Link>
                )
              ) : (
                imageContent
              )}
            </div>
          );
        })}

        {/* Carousel Controls */}
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
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
              {banners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentBannerIdx(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    idx === currentBannerIdx ? 'bg-amber-400 w-8' : 'bg-white/50'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Core Advantages */}
      {home.advantages.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {home.advantages.map((item, idx) => {
              const Icon = ADVANTAGE_ICONS[idx % ADVANTAGE_ICONS.length];
              return (
                <div key={idx} className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-[24px] font-bold text-slate-900 leading-snug">{item.title}</h3>
                    <p className="text-[18px] text-slate-600 mt-2 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Featured Physical Courses */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
              <Users className="w-4 h-4" />
              <span>{home.physicalSection.eyebrow}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              {home.physicalSection.title}
            </h2>
          </div>
          <Link
            to="/physical-courses"
            className="text-sm font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 group"
          >
            {home.physicalSection.linkText}
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {physicalCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </div>

      {/* Featured Online Subscriptions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
              <MonitorPlay className="w-4 h-4" />
              <span>{home.onlineSection.eyebrow}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              {home.onlineSection.title}
            </h2>
          </div>
          <Link
            to="/online-courses"
            className="text-sm font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 group"
          >
            {home.onlineSection.linkText}
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {onlineCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </div>

      {/* Parent testimonials */}
      {testimonials.items.length > 0 && (
        <div id="testimonials" className="scroll-mt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">{testimonials.title}</h2>
            {testimonials.subtitle && <p className="text-slate-500 mt-1">{testimonials.subtitle}</p>}
          </div>
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-6">
            {testimonials.items.map((item, idx) => (
              <figure
                key={idx}
                className="break-inside-avoid mb-6 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
              >
                {item.imageUrl && (
                  <img
                    src={formatImageUrl(item.imageUrl)}
                    alt={item.name ? `${item.name}的回饋` : '家長回饋截圖'}
                    loading="lazy"
                    className="w-full h-auto"
                  />
                )}
                {(item.quote || item.name) && (
                  <figcaption className="p-5 space-y-1">
                    {item.quote && <p className="text-slate-700 leading-relaxed">{item.quote}</p>}
                    {item.name && <p className="text-sm font-bold text-amber-600">{item.name}</p>}
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

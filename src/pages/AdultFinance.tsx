import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Article } from '../types';
import Seo from '../components/Seo';
import StoriesSection from '../components/StoriesSection';
import { formatImageUrl } from '../utils/imageUtils';
import { formatDate } from '../utils/formatDate';
import { useSiteContent } from '../hooks/useSiteContent';

export default function AdultFinance() {
  const { content } = useSiteContent();
  const page = content.adultPage;
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    fetch('/api/articles?category=' + encodeURIComponent('大人理財'))
      .then((res) => res.json())
      .then((data) => setArticles(Array.isArray(data) ? data.slice(0, 6) : []))
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-16 pb-20">
      <Seo
        title="大人的理財"
        description="大人的理財是星育學苑旗下的成人金融素養品牌，從現金流、風險、投資到家庭財務，陪你建立自己的金錢判斷力。"
      />

      {/* Hero */}
      <div className="bg-linear-to-b from-slate-100 to-transparent pt-14 pb-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight whitespace-pre-line">{page.heroTitle}</h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed whitespace-pre-line max-w-2xl mx-auto">{page.heroSubtitle}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* 需求分流：你現在最想解決哪一種錢的問題 */}
        <div className="space-y-8">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 text-center">{page.needsIntro}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {page.needs.map((need) => (
              <div
                key={need.id}
                id={need.id}
                className="scroll-mt-24 bg-white p-6 sm:p-7 rounded-2xl border border-slate-100 shadow-sm space-y-2"
              >
                <h3 className="text-lg font-bold text-slate-900">{need.title}</h3>
                <p className="text-sm text-slate-500 italic">「{need.question}」</p>
                <p className="text-sm text-slate-600 leading-relaxed">{need.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 大人的理財文章 */}
        {articles.length > 0 && (
          <div className="space-y-8">
            <div className="flex items-end justify-between gap-4">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">{page.articlesTitle}</h2>
              <Link to="/articles" className="text-sm font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 group shrink-0">
                看更多
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

        {/* 課程籌備中 */}
        <div className="bg-white rounded-3xl border border-slate-200/60 p-8 sm:p-10 text-center space-y-3">
          <span className="inline-block px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-xs font-bold">{page.courseStatus}</span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">{page.courseName}</h2>
          <p className="text-slate-600">{page.courseSubtitle}</p>
          <p className="text-sm text-slate-500 leading-relaxed max-w-xl mx-auto">{page.courseBody}</p>
        </div>
      </div>

      {/* 學員回饋 */}
      <StoriesSection segment="adult" title={page.storiesTitle} subtitle={page.storiesSubtitle} />

      {/* 結尾 CTA：帶孩子一起學理財 */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-snug whitespace-pre-line">{page.endingTitle}</h2>
        <Link
          to="/kids-finance"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold text-white bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-md shadow-orange-500/20 transition-all active:scale-95"
        >
          {page.endingCtaText}
        </Link>
      </div>
    </div>
  );
}

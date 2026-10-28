import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import Seo from '../components/Seo';
import { Article } from '../types';
import { formatImageUrl } from '../utils/imageUtils';
import { formatDate } from '../utils/formatDate';
import { useSiteContent } from '../hooks/useSiteContent';

export default function Articles() {
  const { content } = useSiteContent();
  const CATEGORIES = content.articlesPage.categories.map((c) => c.name).filter(Boolean);
  const showStats = content.articlesPage.showStats;
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');

  useEffect(() => {
    fetch('/api/articles')
      .then((res) => res.json())
      .then((data) => setArticles(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = category ? articles.filter((a) => a.category === category) : articles;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16 space-y-10">
      <Seo title="理財文章" description="星育學苑的理財文章：大人的理財、小管家兒童理財、企業永續合作與金融科技學習分享。" />
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900">理財文章</h1>
        {showStats && articles.length > 0 && (
          <p className="text-base font-bold text-slate-500">
            共 {articles.length} 篇文章，累計閱讀 {articles.reduce((sum, a) => sum + (a.viewCount ?? 0), 0).toLocaleString()} 次
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCategory('')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            category === '' ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
          }`}
        >
          全部
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              category === c ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {!loading && filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/60 p-8">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-700">目前還沒有文章</h2>
          <p className="text-sm text-slate-400 mt-1">敬請期待</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((article) => (
            <Link
              key={article.id}
              to={`/articles/${article.slug || article.id}`}
              className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
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
              <div className="p-5 sm:p-6 space-y-2">
                <p className="text-xs font-bold text-amber-600">
                  {article.category && <span className="mr-2 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700">{article.category}</span>}
                  {formatDate(article.publishedAt)}
                  {showStats && <span className="ml-2 text-slate-400">👁 {(article.viewCount ?? 0).toLocaleString()}</span>}
                </p>
                <h2 className="text-lg font-bold text-slate-900 line-clamp-2 group-hover:text-amber-600 transition-colors">
                  {article.title}
                </h2>
                {article.summary && (
                  <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">{article.summary}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

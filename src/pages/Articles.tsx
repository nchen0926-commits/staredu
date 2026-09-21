import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import Seo from '../components/Seo';
import { Article } from '../types';
import { formatImageUrl } from '../utils/imageUtils';
import { formatDate } from '../utils/formatDate';

export default function Articles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/articles')
      .then((res) => res.json())
      .then((data) => setArticles(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16 space-y-10">
      <Seo title="文章" description="小管家兒童理財的文章與親子理財學習分享。" />
      <h1 className="text-3xl sm:text-4xl font-black text-slate-900">文章</h1>

      {!loading && articles.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/60 p-8">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-700">目前還沒有文章</h2>
          <p className="text-sm text-slate-400 mt-1">敬請期待</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <Link
              key={article.id}
              to={`/articles/${article.id}`}
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
                <p className="text-xs font-bold text-amber-600">{formatDate(article.publishedAt)}</p>
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

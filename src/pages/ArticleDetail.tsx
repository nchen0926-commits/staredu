import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Seo from '../components/Seo';
import ArticleBody from '../components/ArticleBody';
import { Article } from '../types';
import { formatImageUrl } from '../utils/imageUtils';
import { formatDate, formatDateTime } from '../utils/formatDate';

export default function ArticleDetail() {
  const { id } = useParams();
  const [article, setArticle] = useState<Article | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading');

  useEffect(() => {
    setState('loading');
    fetch(`/api/articles/${id}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('not found'))))
      .then((data: Article) => {
        setArticle(data);
        setState('ready');
        // Count one view per browser session (the server ignores you when you're logged in as admin).
        const viewedKey = `viewed:${data.id}`;
        try {
          if (!sessionStorage.getItem(viewedKey)) {
            sessionStorage.setItem(viewedKey, '1');
            fetch(`/api/articles/${data.id}/view`, { method: 'POST' }).catch(() => {});
          }
        } catch {
          // private mode etc.: skip counting
        }
      })
      .catch(() => setState('missing'));
  }, [id]);

  const isLive = Boolean(article && article.published && new Date(article.publishedAt).getTime() <= Date.now());

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <Link to="/articles" className="inline-flex items-center gap-1.5 text-sm font-bold text-amber-600 hover:text-amber-700">
        <ArrowLeft className="w-4 h-4" /> 回到文章列表
      </Link>

      {state === 'missing' && (
        <div className="mt-8 text-center py-20 bg-white rounded-3xl border border-slate-200/60 p-8">
          <Seo title="找不到文章" description="找不到這篇文章" noindex />
          <h1 className="text-lg font-bold text-slate-700">找不到這篇文章</h1>
          <p className="text-sm text-slate-400 mt-1">它可能已經被移除，或還沒有發佈。</p>
        </div>
      )}

      {state === 'ready' && article && (
        <article className="mt-6 space-y-8">
          <Seo
            title={article.title}
            description={article.summary || article.title}
            noindex={!isLive}
          />
          {!isLive && (
            <div className="px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-bold">
              {article.published
                ? `這篇文章排程在 ${formatDateTime(article.publishedAt)} 自動發佈，現在只有登入後台的你看得到。`
                : '這是還沒發佈的草稿，只有登入後台的你看得到。'}
            </div>
          )}
          <header className="space-y-3">
            <p className="text-sm font-bold text-amber-600">
              {formatDate(article.publishedAt)}
              {article.author && <span className="text-slate-500 font-medium"> · {article.author}</span>}
            </p>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight">{article.title}</h1>
            {article.summary && <p className="text-lg text-slate-500 leading-relaxed">{article.summary}</p>}
          </header>
          {article.coverImage && (
            <img
              src={formatImageUrl(article.coverImage)}
              alt={article.title}
              className="w-full h-auto rounded-3xl"
            />
          )}
          <ArticleBody body={article.body} />
        </article>
      )}
    </div>
  );
}

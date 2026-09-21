import Seo from '../components/Seo';
import { useSiteContent } from '../hooks/useSiteContent';

interface ContentPageProps {
  pageKey: 'terms' | 'privacy' | 'faq';
}

/** 服務條款 / 隱私權政策 / 常見問題 — text is edited in the admin. */
export default function ContentPage({ pageKey }: ContentPageProps) {
  const { content, loaded } = useSiteContent();
  const page = content.pages[pageKey];
  const summary = page.body.replace(/\s+/g, ' ').slice(0, 120) || page.title;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
      <Seo title={page.title} description={summary} noindex={!page.body} />
      <h1 className="text-3xl sm:text-4xl font-black text-slate-900">{page.title}</h1>
      {page.body ? (
        <div className="mt-8 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-10 text-slate-700 leading-loose whitespace-pre-line">
          {page.body}
        </div>
      ) : (
        loaded && <p className="mt-8 text-slate-500">內容準備中，敬請期待。</p>
      )}
    </div>
  );
}

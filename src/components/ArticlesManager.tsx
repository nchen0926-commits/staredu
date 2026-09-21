import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Trash2, Save, ExternalLink, Eye } from 'lucide-react';
import { Article } from '../types';
import { formatImageUrl } from '../utils/imageUtils';
import { formatDateTime } from '../utils/formatDate';
import { sanitizeArticleHtml } from '../utils/sanitizeHtml';
import ImageUploadField from './ImageUploadField';
import RichTextEditor from './RichTextEditor';

interface ArticlesManagerProps {
  onToast: (text: string, type?: 'success' | 'error') => void;
  onUnauthorized: () => void;
}

interface ArticleForm {
  id?: string;
  slug: string;
  title: string;
  summary: string;
  seoDescription: string;
  author: string;
  coverImage: string;
  body: string;
  published: boolean;
  publishedLocal: string; // Taipei time, "YYYY-MM-DDTHH:mm"
}

type Status = 'draft' | 'scheduled' | 'live';

const inputClass =
  'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white';

const SITE = 'https://e-staredu.com';

const toTaipeiLocal = (date: Date) =>
  date.toLocaleString('sv-SE', { timeZone: 'Asia/Taipei' }).replace(' ', 'T').slice(0, 16);
const localToIso = (local: string) => new Date(`${local}:00+08:00`).toISOString();

const statusOf = (article: { published: boolean; publishedAt: string }): Status =>
  !article.published ? 'draft' : new Date(article.publishedAt).getTime() > Date.now() ? 'scheduled' : 'live';

const STATUS_BADGE: Record<Status, { label: string; className: string }> = {
  draft: { label: '草稿', className: 'bg-slate-200 text-slate-600' },
  scheduled: { label: '排程中', className: 'bg-sky-100 text-sky-700' },
  live: { label: '已發佈', className: 'bg-emerald-100 text-emerald-700' },
};

const toForm = (article: Article): ArticleForm => ({
  id: article.id,
  slug: article.slug,
  title: article.title,
  summary: article.summary,
  seoDescription: article.seoDescription,
  author: article.author,
  coverImage: article.coverImage,
  body: article.body,
  published: article.published,
  publishedLocal: toTaipeiLocal(new Date(article.publishedAt)),
});

export default function ArticlesManager({ onToast, onUnauthorized }: ArticlesManagerProps) {
  const [articles, setArticles] = useState<Article[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState<ArticleForm | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const res = await fetch('/api/admin/articles');
      if (res.status === 401) return onUnauthorized();
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoadError(data.error || '讀取文章失敗');
        setArticles([]);
        return;
      }
      setLoadError('');
      setArticles(data);
    } catch {
      setLoadError('讀取文章時發生網路錯誤');
      setArticles([]);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startNew = () =>
    setForm({
      slug: '',
      title: '',
      summary: '',
      seoDescription: '',
      author: '',
      coverImage: '',
      body: '',
      published: false,
      publishedLocal: toTaipeiLocal(new Date()),
    });

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!form) return;
    if (!form.title.trim()) {
      onToast('請填寫文章標題', 'error');
      return;
    }
    if (!form.publishedLocal) {
      onToast('請選擇發佈時間', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(form.id ? `/api/articles/${form.id}` : '/api/articles', {
        method: form.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          slug: form.slug,
          summary: form.summary,
          seoDescription: form.seoDescription,
          author: form.author,
          coverImage: form.coverImage,
          body: sanitizeArticleHtml(form.body),
          published: form.published,
          publishedAt: localToIso(form.publishedLocal),
        }),
      });
      if (res.status === 401) return onUnauthorized();
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        onToast(data.error || '儲存失敗，請重試', 'error');
        return;
      }
      const status = statusOf(data.article);
      onToast(
        status === 'live'
          ? '文章已儲存並發佈！'
          : status === 'scheduled'
            ? `文章已儲存，會在 ${formatDateTime(data.article.publishedAt)} 自動發佈`
            : '文章已存成草稿'
      );
      setForm(null);
      await load();
    } catch {
      onToast('儲存時發生網路錯誤', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (article: Article) => {
    if (!window.confirm(`確定要刪除「${article.title}」嗎？此操作無法復原。`)) return;
    try {
      const res = await fetch(`/api/articles/${article.id}`, { method: 'DELETE' });
      if (res.status === 401) return onUnauthorized();
      if (res.ok) {
        onToast('文章已刪除');
        await load();
      } else {
        const data = await res.json().catch(() => ({}));
        onToast(data.error || '刪除失敗', 'error');
      }
    } catch {
      onToast('刪除時發生網路錯誤', 'error');
    }
  };

  if (form) {
    const formIso = form.publishedLocal ? localToIso(form.publishedLocal) : '';
    const formStatus: Status = !form.published
      ? 'draft'
      : formIso && new Date(formIso).getTime() > Date.now()
        ? 'scheduled'
        : 'live';

    return (
      <form onSubmit={handleSave} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
        <h3 className="text-xl font-black text-slate-900">{form.id ? '編輯文章' : '寫新文章'}</h3>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">文章標題 *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className={inputClass}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            簡短摘要<span className="ml-2 font-normal text-slate-400">顯示在文章列表卡片上（選填）</span>
          </label>
          <textarea
            rows={2}
            value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">封面圖片（選填）</label>
          <ImageUploadField
            value={form.coverImage}
            onChange={(url) => setForm({ ...form, coverImage: url })}
            placeholder="按右邊「上傳圖片」，或貼上圖片網址"
            onError={(msg) => onToast(msg, 'error')}
            onUnauthorized={onUnauthorized}
          />
          {form.coverImage && (
            <img
              src={formatImageUrl(form.coverImage)}
              alt="封面預覽"
              className="mt-3 w-full sm:w-64 aspect-16/10 object-cover rounded-xl border border-slate-200"
            />
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">文章內容</label>
          <RichTextEditor
            key={form.id || 'new'}
            initialHtml={form.body}
            onChange={(html) => setForm((current) => (current ? { ...current, body: html } : current))}
            onError={(msg) => onToast(msg, 'error')}
            onUnauthorized={onUnauthorized}
          />
          <p className="text-xs text-slate-400 mt-1.5">
            圖片可以直接貼上、拖進來，或按工具列的圖片按鈕；點一下圖片可以調整大小、填圖片說明。
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
          <div>
            <h4 className="text-sm font-bold text-slate-800">發佈設定</h4>
            <p className="text-xs text-slate-500 mt-0.5">寫好先存著，設一個未來的時間，到時候會自動上線，不用你再回來按。</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">發佈時間（台灣時間）</label>
              <input
                type="datetime-local"
                value={form.publishedLocal}
                onChange={(e) => setForm({ ...form, publishedLocal: e.target.value })}
                className={inputClass}
              />
            </div>
            <label className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white cursor-pointer">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => setForm({ ...form, published: e.target.checked })}
                className="w-4 h-4 accent-amber-500"
              />
              <span className="text-sm font-bold text-slate-700">發佈（勾選後，到了發佈時間就會上線）</span>
            </label>
          </div>
          <p
            className={`text-sm font-bold ${
              formStatus === 'live' ? 'text-emerald-700' : formStatus === 'scheduled' ? 'text-sky-700' : 'text-slate-500'
            }`}
          >
            {formStatus === 'live' && '按儲存後會立刻上線。'}
            {formStatus === 'scheduled' && `已排程：會在 ${formatDateTime(formIso)} 自動上線，在那之前訪客看不到。`}
            {formStatus === 'draft' && '目前是草稿，訪客看不到（沒勾選「發佈」）。'}
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
          <div>
            <h4 className="text-sm font-bold text-slate-800">搜尋引擎與 AI 設定（選填，建議填寫）</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              這些是給 Google 和 ChatGPT、Claude 等 AI 助理讀的，會影響文章被搜尋到、被引用的機會。
            </p>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              網址名稱<span className="ml-2 font-normal text-slate-400">英文小寫、數字、連字號；留空會自動產生</span>
            </label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })}
              placeholder="例：kids-money-tips"
              className={inputClass}
            />
            <p className="text-xs text-slate-400 mt-1 break-all">
              文章網址：{SITE}/articles/{form.slug || '（自動產生）'}
            </p>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              搜尋摘要<span className="ml-2 font-normal text-slate-400">出現在 Google 搜尋結果的那兩行字，約 80～150 字；留空會用上面的簡短摘要</span>
            </label>
            <textarea
              rows={2}
              value={form.seoDescription}
              maxLength={300}
              onChange={(e) => setForm({ ...form, seoDescription: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              作者<span className="ml-2 font-normal text-slate-400">留空會用網站的公司名稱</span>
            </label>
            <input
              type="text"
              value={form.author}
              onChange={(e) => setForm({ ...form, author: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setForm(null)}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-md shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            <Save className="w-4 h-4" /> {saving ? '儲存中...' : '儲存文章'}
          </button>
        </div>
      </form>
    );
  }

  const totalViews = (articles ?? []).reduce((sum, a) => sum + (a.viewCount ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h3 className="text-lg font-bold text-slate-900">文章</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            寫好的文章會顯示在網站的「文章」頁面
            {articles && articles.length > 0 && <span className="ml-2 font-bold text-slate-700">累計觀看 {totalViews.toLocaleString()} 次</span>}
          </p>
        </div>
        <button
          onClick={startNew}
          className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm shadow-md shadow-amber-500/20 active:scale-95 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> 寫新文章
        </button>
      </div>

      {loadError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-sm font-bold">{loadError}</div>
      )}

      {articles === null ? (
        <div className="py-16 text-center text-sm text-slate-400">載入中...</div>
      ) : articles.length === 0 && !loadError ? (
        <div className="py-16 text-center text-sm text-slate-400 bg-white rounded-2xl border border-slate-100">
          還沒有文章，按右上角「寫新文章」開始寫第一篇
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => {
            const badge = STATUS_BADGE[statusOf(article)];
            return (
              <div
                key={article.id}
                className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm"
              >
                {article.coverImage ? (
                  <img
                    src={formatImageUrl(article.coverImage)}
                    alt=""
                    className="w-full sm:w-32 aspect-16/10 object-cover rounded-xl bg-slate-100 shrink-0"
                  />
                ) : (
                  <div className="hidden sm:block w-32 aspect-16/10 rounded-xl bg-slate-100 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
                    <span className={`text-[11px] font-black px-2 py-0.5 rounded-md ${badge.className}`}>{badge.label}</span>
                    <span className="text-xs text-slate-400">{formatDateTime(article.publishedAt)}</span>
                    <span className="flex items-center gap-1 text-xs font-bold text-slate-500">
                      <Eye className="w-3.5 h-3.5" /> {(article.viewCount ?? 0).toLocaleString()} 次觀看
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 truncate">{article.title}</h4>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`/articles/${article.slug || article.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> 查看
                  </a>
                  <button
                    onClick={() => setForm(toForm(article))}
                    className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100"
                  >
                    編輯
                  </button>
                  <button
                    onClick={() => handleDelete(article)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                    title="刪除文章"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

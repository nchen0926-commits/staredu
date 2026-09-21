import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Plus, Trash2, Save, ImagePlus, Heading2, Bold, ExternalLink, Loader2 } from 'lucide-react';
import { Article } from '../types';
import { formatImageUrl } from '../utils/imageUtils';
import { formatDate } from '../utils/formatDate';
import { uploadImage, UploadError } from '../utils/uploadImage';
import ImageUploadField from './ImageUploadField';

interface ArticlesManagerProps {
  onToast: (text: string, type?: 'success' | 'error') => void;
  onUnauthorized: () => void;
}

interface ArticleForm {
  id?: string;
  title: string;
  summary: string;
  coverImage: string;
  body: string;
  published: boolean;
  date: string;
}

const inputClass =
  'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white';

const todayInTaipei = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' });

const toForm = (article: Article): ArticleForm => ({
  id: article.id,
  title: article.title,
  summary: article.summary,
  coverImage: article.coverImage,
  body: article.body,
  published: article.published,
  date: new Date(article.publishedAt).toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' }),
});

export default function ArticlesManager({ onToast, onUnauthorized }: ArticlesManagerProps) {
  const [articles, setArticles] = useState<Article[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState<ArticleForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [insertingImage, setInsertingImage] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);

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
    setForm({ title: '', summary: '', coverImage: '', body: '', published: false, date: todayInTaipei() });

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!form) return;
    if (!form.title.trim()) {
      onToast('請填寫文章標題', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(form.id ? `/api/articles/${form.id}` : '/api/articles', {
        method: form.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          summary: form.summary,
          coverImage: form.coverImage,
          body: form.body,
          published: form.published,
          publishedAt: `${form.date || todayInTaipei()}T12:00:00+08:00`,
        }),
      });
      if (res.status === 401) return onUnauthorized();
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        onToast(data.error || '儲存失敗，請重試', 'error');
        return;
      }
      onToast(form.published ? '文章已儲存並發佈！' : '文章已存成草稿');
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

  // Insert text at the cursor (or around the selection) in the article body.
  const insertIntoBody = (before: string, after = '', placeholder = '') => {
    const el = bodyRef.current;
    if (!el || !form) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = form.body.slice(start, end) || placeholder;
    const body = form.body.slice(0, start) + before + selected + after + form.body.slice(end);
    setForm({ ...form, body });
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + before.length + selected.length + after.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const handleInsertImage = async (file: File | undefined) => {
    if (!file) return;
    setInsertingImage(true);
    try {
      const url = await uploadImage(file);
      insertIntoBody(`\n\n![](${url})\n\n`);
    } catch (err) {
      if (err instanceof UploadError && err.status === 401) {
        onUnauthorized();
      } else {
        onToast(err instanceof Error ? err.message : '上傳失敗', 'error');
      }
    } finally {
      setInsertingImage(false);
      if (imageInput.current) imageInput.current.value = '';
    }
  };

  if (form) {
    return (
      <form onSubmit={handleSave} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-5">
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
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <button
              type="button"
              onClick={() => insertIntoBody('\n\n## ', '\n\n', '小標題')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <Heading2 className="w-3.5 h-3.5" /> 小標題
            </button>
            <button
              type="button"
              onClick={() => insertIntoBody('**', '**', '粗體文字')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <Bold className="w-3.5 h-3.5" /> 粗體
            </button>
            <button
              type="button"
              onClick={() => imageInput.current?.click()}
              disabled={insertingImage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 disabled:opacity-50 disabled:pointer-events-none transition-colors"
            >
              {insertingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
              {insertingImage ? '上傳中...' : '插入圖片'}
            </button>
            <input
              ref={imageInput}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(e) => handleInsertImage(e.target.files?.[0])}
            />
          </div>
          <textarea
            ref={bodyRef}
            rows={16}
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            placeholder="在這裡寫文章。空一行就是新的段落。"
            className={`${inputClass} leading-relaxed`}
          />
          <p className="text-xs text-slate-400 mt-1.5">
            排版小提醒：空一行 = 新段落；用上面的按鈕加小標題、粗體；「插入圖片」會把圖片放在游標所在位置。
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-5 sm:items-end">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">文章日期</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className={inputClass}
            />
          </div>
          <label className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm({ ...form, published: e.target.checked })}
              className="w-4 h-4 accent-amber-500"
            />
            <span className="text-sm font-bold text-slate-700">發佈到網站（沒勾選就是草稿，訪客看不到）</span>
          </label>
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h3 className="text-lg font-bold text-slate-900">文章</h3>
          <p className="text-xs text-slate-500 mt-0.5">寫好的文章會顯示在網站的「文章」頁面</p>
        </div>
        <button
          onClick={startNew}
          className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm shadow-md shadow-amber-500/20 active:scale-95 transition-all"
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
          {articles.map((article) => (
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
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[11px] font-black px-2 py-0.5 rounded-md ${
                      article.published ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {article.published ? '已發佈' : '草稿'}
                  </span>
                  <span className="text-xs text-slate-400">{formatDate(article.publishedAt)}</span>
                </div>
                <h4 className="font-bold text-slate-900 truncate">{article.title}</h4>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={`/articles/${article.id}`}
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
          ))}
        </div>
      )}
    </div>
  );
}

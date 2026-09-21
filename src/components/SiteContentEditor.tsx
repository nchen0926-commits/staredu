import { useEffect, useState, type ReactNode } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';
import { resolveSiteContent, SiteContent } from '../../lib/siteContent';
import { setSiteContent } from '../hooks/useSiteContent';
import { formatImageUrl } from '../utils/imageUtils';
import ImageUploadField from './ImageUploadField';

interface SiteContentEditorProps {
  onToast: (text: string, type?: 'success' | 'error') => void;
  onUnauthorized: () => void;
}

const inputClass =
  'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white';

function Card({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-5">
      <div>
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-700 mb-1.5">
        {label}
        {hint && <span className="ml-2 font-normal text-slate-400">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

function TextField(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  placeholder?: string;
}) {
  return (
    <Field label={props.label} hint={props.hint}>
      <input
        type="text"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        className={inputClass}
      />
    </Field>
  );
}

function AddButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
    >
      <Plus className="w-3.5 h-3.5" /> {children}
    </button>
  );
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
      title="刪除"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}

export default function SiteContentEditor({ onToast, onUnauthorized }: SiteContentEditorProps) {
  const [data, setData] = useState<SiteContent | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/site-content')
      .then((res) => (res.ok ? res.json() : {}))
      .then((raw) => setData(resolveSiteContent(raw)))
      .catch(() => {
        setData(resolveSiteContent({}));
        onToast('讀取網站內容失敗，目前顯示的是預設內容', 'error');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!data) {
    return <div className="py-20 text-center text-sm text-slate-400">載入中...</div>;
  }

  const update = (change: (draft: SiteContent) => void) =>
    setData((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      change(next);
      return next;
    });

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/site-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const saved = await res.json();
        setSiteContent(saved.content);
        setData(resolveSiteContent(saved.content));
        onToast('網站內容已儲存，前台已同步更新！');
      } else if (res.status === 401) {
        onUnauthorized();
      } else {
        const err = await res.json().catch(() => ({}));
        onToast(err.error || '儲存失敗，請重試', 'error');
      }
    } catch (err) {
      console.error('Save site content error:', err);
      onToast('儲存時發生網路錯誤', 'error');
    } finally {
      setSaving(false);
    }
  };

  const { brand, nav, home, physicalPage, onlinePage, footer } = data;

  return (
    <div className="space-y-8">
      <Card title="網站 Logo 與名稱" description="會顯示在網頁最上方的導覽列，以及最下方的頁尾">
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          <div className="w-24 h-24 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
            <img
              src={formatImageUrl(brand.logoUrl) || '/logo-icon.svg'}
              alt="Logo 預覽"
              className="w-full h-full object-contain p-2"
            />
          </div>
          <div className="flex-1 w-full space-y-4">
            <Field label="Logo 圖片" hint="建議正方形、背景透明的 PNG 或 SVG；留空則使用原本的 Logo">
              <ImageUploadField
                value={brand.logoUrl}
                onChange={(url) => update((d) => { d.brand.logoUrl = url; })}
                placeholder="按右邊「上傳圖片」，或貼上圖片網址"
                onError={(msg) => onToast(msg, 'error')}
                onUnauthorized={onUnauthorized}
              />
            </Field>
            <TextField
              label="網站名稱"
              value={brand.name}
              onChange={(v) => update((d) => { d.brand.name = v; })}
            />
          </div>
        </div>
      </Card>

      <Card title="導覽列" description="網頁最上方的選單文字與右上角的橘色按鈕">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <TextField label="首頁" value={nav.homeLabel} onChange={(v) => update((d) => { d.nav.homeLabel = v; })} />
          <TextField label="實體營隊選單" value={nav.physicalLabel} onChange={(v) => update((d) => { d.nav.physicalLabel = v; })} />
          <TextField label="線上訂閱選單" value={nav.onlineLabel} onChange={(v) => update((d) => { d.nav.onlineLabel = v; })} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField
            label="橘色按鈕文字"
            hint="留空就不顯示這顆按鈕"
            value={nav.memberLabel}
            onChange={(v) => update((d) => { d.nav.memberLabel = v; })}
          />
          <TextField
            label="橘色按鈕連結"
            hint="例：/online-courses 或 https://..."
            value={nav.memberUrl}
            onChange={(v) => update((d) => { d.nav.memberUrl = v; })}
          />
        </div>
      </Card>

      <Card title="首頁" description="首頁輪播圖下方的介紹卡片與兩個課程區塊的標題（輪播圖請到「橫幅圖片設置」修改）">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-800">介紹卡片</span>
            <AddButton onClick={() => update((d) => { d.home.advantages.push({ title: '', description: '' }); })}>
              新增一張卡片
            </AddButton>
          </div>
          {home.advantages.map((item, idx) => (
            <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg">卡片 #{idx + 1}</span>
                <RemoveButton onClick={() => update((d) => { d.home.advantages.splice(idx, 1); })} />
              </div>
              <TextField label="標題" value={item.title} onChange={(v) => update((d) => { d.home.advantages[idx].title = v; })} />
              <Field label="說明">
                <textarea
                  rows={2}
                  value={item.description}
                  onChange={(e) => update((d) => { d.home.advantages[idx].description = e.target.value; })}
                  className={inputClass}
                />
              </Field>
            </div>
          ))}
        </div>

        {([
          ['physicalSection', '實體營隊區塊'],
          ['onlineSection', '線上訂閱區塊'],
        ] as const).map(([key, title]) => (
          <div key={key} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
            <span className="text-sm font-bold text-slate-800">{title}</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <TextField label="小標" value={home[key].eyebrow} onChange={(v) => update((d) => { d.home[key].eyebrow = v; })} />
              <TextField label="大標題" value={home[key].title} onChange={(v) => update((d) => { d.home[key].title = v; })} />
              <TextField label="「查看全部」連結文字" value={home[key].linkText} onChange={(v) => update((d) => { d.home[key].linkText = v; })} />
            </div>
          </div>
        ))}
      </Card>

      <Card title="課程頁面" description="「實體營隊 / 課程」與「線上訂閱課程」兩個頁面的標題文字">
        <TextField
          label="實體營隊頁標題"
          value={physicalPage.title}
          onChange={(v) => update((d) => { d.physicalPage.title = v; })}
        />
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
          <span className="text-sm font-bold text-slate-800">線上訂閱頁</span>
          <TextField label="頁面標題" value={onlinePage.title} onChange={(v) => update((d) => { d.onlinePage.title = v; })} />
          <TextField label="橘色區塊小標" value={onlinePage.valueEyebrow} onChange={(v) => update((d) => { d.onlinePage.valueEyebrow = v; })} />
          <TextField label="橘色區塊大標題" value={onlinePage.valueTitle} onChange={(v) => update((d) => { d.onlinePage.valueTitle = v; })} />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">優點列表</span>
              <AddButton onClick={() => update((d) => { d.onlinePage.points.push(''); })}>新增一項</AddButton>
            </div>
            {onlinePage.points.map((point, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={point}
                  onChange={(e) => update((d) => { d.onlinePage.points[idx] = e.target.value; })}
                  className={inputClass}
                />
                <RemoveButton onClick={() => update((d) => { d.onlinePage.points.splice(idx, 1); })} />
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card title="頁尾與聯絡資訊" description="網頁最下方的簡介、聯絡方式與社群連結；欄位留空就不會顯示">
        <Field label="簡介文字">
          <textarea
            rows={3}
            value={footer.description}
            onChange={(e) => update((d) => { d.footer.description = e.target.value; })}
            className={inputClass}
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <TextField label="Email" value={footer.email} onChange={(v) => update((d) => { d.footer.email = v; })} />
          <TextField label="電話" value={footer.phone} onChange={(v) => update((d) => { d.footer.phone = v; })} />
          <TextField label="地址" value={footer.address} onChange={(v) => update((d) => { d.footer.address = v; })} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <TextField label="Facebook 連結" placeholder="https://..." value={footer.facebookUrl} onChange={(v) => update((d) => { d.footer.facebookUrl = v; })} />
          <TextField label="Instagram 連結" placeholder="https://..." value={footer.instagramUrl} onChange={(v) => update((d) => { d.footer.instagramUrl = v; })} />
          <TextField label="YouTube 連結" placeholder="https://..." value={footer.youtubeUrl} onChange={(v) => update((d) => { d.footer.youtubeUrl = v; })} />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-slate-800">頁尾底部連結</span>
              <p className="text-xs text-slate-400 mt-0.5">例如服務條款、隱私權政策；「連結」沒填的項目不會顯示在網站上</p>
            </div>
            <AddButton onClick={() => update((d) => { d.footer.legalLinks.push({ label: '', url: '' }); })}>新增一項</AddButton>
          </div>
          {footer.legalLinks.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="text"
                value={item.label}
                onChange={(e) => update((d) => { d.footer.legalLinks[idx].label = e.target.value; })}
                placeholder="顯示文字，例：服務條款"
                className={`${inputClass} sm:max-w-[14rem]`}
              />
              <input
                type="text"
                value={item.url}
                onChange={(e) => update((d) => { d.footer.legalLinks[idx].url = e.target.value; })}
                placeholder="連結，例：https://..."
                className={inputClass}
              />
              <RemoveButton onClick={() => update((d) => { d.footer.legalLinks.splice(idx, 1); })} />
            </div>
          ))}
        </div>
      </Card>

      <div className="sticky bottom-4 flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-8 py-3.5 bg-amber-500 hover:bg-amber-600 active:scale-95 disabled:opacity-50 disabled:pointer-events-none text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-amber-500/30 cursor-pointer"
        >
          <Save className="w-4 h-4" /> {saving ? '儲存中...' : '儲存網站內容'}
        </button>
      </div>
    </div>
  );
}

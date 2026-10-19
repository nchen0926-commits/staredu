import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Plus, Trash2, Save, Upload, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import { DEFAULT_KIDS_BG, resolveSiteContent, safeColor, SiteContent } from '../../lib/siteContent';
import { setSiteContent } from '../hooks/useSiteContent';
import { formatImageUrl } from '../utils/imageUtils';
import ImageUploadField from './ImageUploadField';
import { uploadImage, UploadError } from '../utils/uploadImage';

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

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

/** Colour swatch (opens the browser's colour picker) plus a hex box for pasting an exact colour. */
function ColorField(props: { label: string; hint?: string; value: string; fallback: string; onChange: (value: string) => void }) {
  const [draft, setDraft] = useState(props.value);
  useEffect(() => setDraft(props.value), [props.value]);
  const valid = HEX_RE.test(draft.trim());
  return (
    <Field label={props.label} hint={props.hint}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={safeColor(props.value, props.fallback)}
          onChange={(e) => props.onChange(e.target.value)}
          className="h-10 w-14 rounded-lg border border-slate-200 bg-white p-1 cursor-pointer shrink-0"
          aria-label={props.label}
        />
        <input
          type="text"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            if (HEX_RE.test(e.target.value.trim())) props.onChange(e.target.value.trim().toLowerCase());
          }}
          placeholder="#F7D170"
          className={`${inputClass} max-w-[9rem] font-mono ${valid ? '' : 'border-red-300'}`}
        />
        {!valid && <span className="text-xs text-red-500">色碼要像 #F7D170 這樣 6 碼</span>}
      </div>
    </Field>
  );
}

function OrderButtons(props: { index: number; count: number; onMove: (to: number) => void }) {
  return (
    <div className="flex items-center">
      <button
        type="button"
        disabled={props.index === 0}
        onClick={() => props.onMove(props.index - 1)}
        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:pointer-events-none"
        title="往前移"
      >
        <ChevronUp className="w-4 h-4" />
      </button>
      <button
        type="button"
        disabled={props.index === props.count - 1}
        onClick={() => props.onMove(props.index + 1)}
        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:pointer-events-none"
        title="往後移"
      >
        <ChevronDown className="w-4 h-4" />
      </button>
    </div>
  );
}

const PAGE_BG_PRESETS: Array<{ label: string; value: string }> = [
  { label: '鮮黃（預設）', value: DEFAULT_KIDS_BG },
  { label: '蜜橘', value: '#FFB866' },
  { label: '天藍', value: '#8EC9F5' },
  { label: '粉嫩', value: '#F9B8CF' },
  { label: '薄荷', value: '#A8E2C0' },
  { label: '白色', value: '#FFFFFF' },
];

export default function SiteContentEditor({ onToast, onUnauthorized }: SiteContentEditorProps) {
  const [data, setData] = useState<SiteContent | null>(null);
  const [saving, setSaving] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);
  const bulkInput = useRef<HTMLInputElement>(null);

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

  const MAX_TESTIMONIALS = 20;

  const handleBulkUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const room = Math.max(MAX_TESTIMONIALS - data.testimonials.items.length, 0);
    const files = Array.from(fileList).slice(0, room);
    if (files.length < fileList.length) {
      onToast(`口碑最多 ${MAX_TESTIMONIALS} 則，這次只會上傳前 ${files.length} 張`, 'error');
    }
    if (files.length === 0) return;

    setBulkUploading(true);
    let added = 0;
    try {
      for (const file of files) {
        const url = await uploadImage(file);
        update((d) => { d.testimonials.items.push({ imageUrl: url, avatarUrl: '', name: '', role: '', quote: '', activityName: '', date: '', segment: 'kids' }); });
        added += 1;
      }
      onToast(`已加入 ${added} 張截圖，記得按最下方的「儲存網站內容」`);
    } catch (err) {
      if (err instanceof UploadError && err.status === 401) {
        onUnauthorized();
      } else {
        const reason = err instanceof Error ? err.message : '上傳失敗';
        onToast(`已加入 ${added} 張，第 ${added + 1} 張失敗：${reason}`, 'error');
      }
    } finally {
      setBulkUploading(false);
      if (bulkInput.current) bulkInput.current.value = '';
    }
  };

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

  const { brand, nav, home, kidsPage, adultPage, enterprisePage, footer, testimonials, pages, leadCapture } = data;
  const SEGMENT_OPTIONS: Array<{ value: SiteContent['testimonials']['items'][number]['segment']; label: string }> = [
    { value: 'kids', label: '小管家兒童理財' },
    { value: 'adult', label: '大人的理財' },
    { value: 'enterprise', label: '企業永續合作' },
  ];

  return (
    <div className="space-y-8">
      <Card title="網站 Logo 與名稱" description="網頁最上方左邊：Logo 圖片＋右邊一行大字、一行小字（頁尾只顯示大字）">
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
              label="大字（Logo 右邊第一行，網站名稱）"
              value={brand.name}
              onChange={(v) => update((d) => { d.brand.name = v; })}
            />
            <TextField
              label="小字（Logo 右邊第二行）"
              hint="留空就只顯示大字；手機版畫面太窄，小字會自動隱藏"
              value={brand.tagline}
              onChange={(v) => update((d) => { d.brand.tagline = v; })}
            />
          </div>
        </div>
      </Card>

      <Card
        title="上方選單"
        description="網頁最上方右邊的選單，可以自由新增、刪除、調整順序；「連結」沒填的項目不會顯示"
      >
        <div className="space-y-3">
          {nav.menu.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className="flex flex-col shrink-0">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => update((d) => { const [m] = d.nav.menu.splice(idx, 1); d.nav.menu.splice(idx - 1, 0, m); })}
                  className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:pointer-events-none"
                  title="往前移"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={idx === nav.menu.length - 1}
                  onClick={() => update((d) => { const [m] = d.nav.menu.splice(idx, 1); d.nav.menu.splice(idx + 1, 0, m); })}
                  className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:pointer-events-none"
                  title="往後移"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
              <input
                type="text"
                value={item.label}
                onChange={(e) => update((d) => { d.nav.menu[idx].label = e.target.value; })}
                placeholder="選單文字，例：實體課"
                className={`${inputClass} sm:max-w-[14rem]`}
              />
              <input
                type="text"
                list="menu-link-options"
                value={item.url}
                onChange={(e) => update((d) => { d.nav.menu[idx].url = e.target.value; })}
                placeholder="連結：點一下可以選，也可以貼 https://..."
                className={inputClass}
              />
              <RemoveButton onClick={() => update((d) => { d.nav.menu.splice(idx, 1); })} />
            </div>
          ))}
          <datalist id="menu-link-options">
            <option value="/">首頁</option>
            <option value="/adult-finance">大人的理財頁</option>
            <option value="/kids-finance">小管家兒童理財頁</option>
            <option value="/enterprise">企業永續合作頁</option>
            <option value="/physical-courses">實體課程頁（舊網址，仍可用）</option>
            <option value="/online-courses">線上課程頁（舊網址，仍可用）</option>
            <option value="/#testimonials">首頁的學員與活動成果區塊</option>
            <option value="/articles">理財文章列表頁</option>
            <option value="/faq">常見問題頁</option>
          </datalist>
          <AddButton onClick={() => update((d) => { d.nav.menu.push({ label: '', url: '' }); })}>
            新增選單項目
          </AddButton>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
          <div>
            <span className="text-sm font-bold text-slate-800">最右邊的橘色按鈕</span>
            <p className="text-xs text-slate-400 mt-0.5">預留給之後的「會員中心」；文字和連結兩個都填了才會顯示</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              label="按鈕文字"
              placeholder="例：會員中心"
              value={nav.memberLabel}
              onChange={(v) => update((d) => { d.nav.memberLabel = v; })}
            />
            <TextField
              label="按鈕連結"
              placeholder="例：/member 或 https://..."
              value={nav.memberUrl}
              onChange={(v) => update((d) => { d.nav.memberUrl = v; })}
            />
          </div>
        </div>
      </Card>

      <Card title="首頁" description="首頁的標題、三大服務入口卡片、企業合作橫幅與「關於星育學苑」文字（輪播圖請到「橫幅圖片設置」修改）">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="主標題">
            <textarea rows={2} value={home.heroTitle} onChange={(e) => update((d) => { d.home.heroTitle = e.target.value; })} className={inputClass} />
          </Field>
          <Field label="副標題">
            <textarea rows={2} value={home.heroSubtitle} onChange={(e) => update((d) => { d.home.heroSubtitle = e.target.value; })} className={inputClass} />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField label="「大人的理財」按鈕文字" value={home.heroCtaAdult} onChange={(v) => update((d) => { d.home.heroCtaAdult = v; })} />
          <TextField label="「小管家兒童理財」按鈕文字" value={home.heroCtaKids} onChange={(v) => update((d) => { d.home.heroCtaKids = v; })} />
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
          <span className="text-sm font-bold text-slate-800">品牌洞察區塊</span>
          <TextField label="標題" value={home.insightTitle} onChange={(v) => update((d) => { d.home.insightTitle = v; })} />
          <Field label="內文">
            <textarea rows={4} value={home.insightBody} onChange={(e) => update((d) => { d.home.insightBody = e.target.value; })} className={inputClass} />
          </Field>
        </div>

        {([
          ['entryAdult', '入口卡片：大人的理財'],
          ['entryKids', '入口卡片：小管家兒童理財'],
          ['entryEnterprise', '入口卡片：企業永續合作'],
        ] as const).map(([key, title]) => (
          <div key={key} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
            <span className="text-sm font-bold text-slate-800">{title}</span>
            <TextField label="標題" value={home[key].title} onChange={(v) => update((d) => { d.home[key].title = v; })} />
            <Field label="說明">
              <textarea rows={2} value={home[key].description} onChange={(e) => update((d) => { d.home[key].description = e.target.value; })} className={inputClass} />
            </Field>
            <TextField label="按鈕文字" value={home[key].ctaText} onChange={(v) => update((d) => { d.home[key].ctaText = v; })} />
          </div>
        ))}

        {([
          ['coursesSection', '熱門課程區塊'],
          ['articlesSection', '理財文章區塊'],
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

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
          <span className="text-sm font-bold text-slate-800">企業合作橫幅</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField label="小標" value={home.enterpriseBanner.subtitle} onChange={(v) => update((d) => { d.home.enterpriseBanner.subtitle = v; })} />
            <TextField label="標題" value={home.enterpriseBanner.title} onChange={(v) => update((d) => { d.home.enterpriseBanner.title = v; })} />
          </div>
          <Field label="說明">
            <textarea rows={2} value={home.enterpriseBanner.description} onChange={(e) => update((d) => { d.home.enterpriseBanner.description = e.target.value; })} className={inputClass} />
          </Field>
          <TextField label="按鈕文字" value={home.enterpriseBanner.ctaText} onChange={(v) => update((d) => { d.home.enterpriseBanner.ctaText = v; })} />
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
          <span className="text-sm font-bold text-slate-800">關於星育學苑</span>
          <TextField label="標題" value={home.aboutTitle} onChange={(v) => update((d) => { d.home.aboutTitle = v; })} />
          <Field label="內文">
            <textarea rows={5} value={home.aboutBody} onChange={(e) => update((d) => { d.home.aboutBody = e.target.value; })} className={inputClass} />
          </Field>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
          <span className="text-sm font-bold text-slate-800">學員與活動成果區塊（彙整三條產品線的口碑，內容在下方「學員與活動成果」設定）</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField label="標題" value={home.storiesTitle} onChange={(v) => update((d) => { d.home.storiesTitle = v; })} />
            <TextField label="說明（選填）" value={home.storiesSubtitle} onChange={(v) => update((d) => { d.home.storiesSubtitle = v; })} />
          </div>
        </div>
      </Card>

      <Card title="小管家兒童理財" description="兒童理財頁由上到下：標題 → 課程特色 → 三大收穫 → 現有課程 → 家長回饋 → 報名按鈕（課程資料在「實體課程」「線上課程」分頁管理）">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField label="主標題" value={kidsPage.heroTitle} onChange={(v) => update((d) => { d.kidsPage.heroTitle = v; })} />
          <TextField label="副標題" value={kidsPage.heroSubtitle} onChange={(v) => update((d) => { d.kidsPage.heroSubtitle = v; })} />
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
          <div>
            <span className="text-sm font-bold text-slate-800">整頁底色</span>
            <p className="text-xs text-slate-400 mt-0.5">兒童理財頁的背景顏色；標題文字會依底色自動變深色或白色，換成深色也看得到字</p>
          </div>
          <ColorField
            label="底色"
            value={kidsPage.bgColor}
            fallback={DEFAULT_KIDS_BG}
            onChange={(v) => update((d) => { d.kidsPage.bgColor = v; })}
          />
          <div className="flex flex-wrap gap-2">
            {PAGE_BG_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => update((d) => { d.kidsPage.bgColor = preset.value; })}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:border-amber-400 transition-colors"
              >
                <span className="w-4 h-4 rounded-full border border-slate-300" style={{ backgroundColor: preset.value }} />
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-sm font-bold text-slate-800">課程特色（白色卡片，預設四塊）</span>
              <p className="text-xs text-slate-400 mt-0.5">每張卡片：圖示、標題、重點條列（一行一點）、邊框顏色；有上傳圖片就顯示圖片，沒有就顯示圖示</p>
            </div>
            <AddButton onClick={() => update((d) => { d.kidsPage.highlights.push({ icon: '⭐', title: '', description: '', borderColor: '#FBE48A', imageUrl: '' }); })}>
              新增一塊
            </AddButton>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField label="區塊標題" value={kidsPage.highlightsTitle} onChange={(v) => update((d) => { d.kidsPage.highlightsTitle = v; })} />
            <TextField label="區塊副標（選填）" value={kidsPage.highlightsSubtitle} onChange={(v) => update((d) => { d.kidsPage.highlightsSubtitle = v; })} />
          </div>
          {kidsPage.highlights.map((item, idx) => (
            <div key={idx} className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg">特色 #{idx + 1}</span>
                <div className="flex items-center gap-1">
                  <OrderButtons
                    index={idx}
                    count={kidsPage.highlights.length}
                    onMove={(to) => update((d) => { const [m] = d.kidsPage.highlights.splice(idx, 1); d.kidsPage.highlights.splice(to, 0, m); })}
                  />
                  <RemoveButton onClick={() => update((d) => { d.kidsPage.highlights.splice(idx, 1); })} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-[6rem_1fr] gap-3">
                <TextField label="圖示" hint="一個表情符號" value={item.icon} onChange={(v) => update((d) => { d.kidsPage.highlights[idx].icon = v; })} />
                <TextField label="標題" value={item.title} onChange={(v) => update((d) => { d.kidsPage.highlights[idx].title = v; })} />
              </div>
              <Field label="重點條列" hint="一行一點">
                <textarea rows={4} value={item.description} onChange={(e) => update((d) => { d.kidsPage.highlights[idx].description = e.target.value; })} className={inputClass} />
              </Field>
              <ColorField
                label="邊框顏色"
                value={item.borderColor}
                fallback="#FBE48A"
                onChange={(v) => update((d) => { d.kidsPage.highlights[idx].borderColor = v; })}
              />
              <Field label="卡片右側圖片（選填）" hint="例如角色插圖；建議透明背景 PNG">
                <ImageUploadField
                  value={item.imageUrl}
                  onChange={(url) => update((d) => { d.kidsPage.highlights[idx].imageUrl = url; })}
                  placeholder="按右邊「上傳圖片」，或貼上圖片網址"
                  onError={(msg) => onToast(msg, 'error')}
                  onUnauthorized={onUnauthorized}
                />
              </Field>
            </div>
          ))}
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-sm font-bold text-slate-800">三大收穫（馬卡龍色卡片，預設三塊）</span>
              <p className="text-xs text-slate-400 mt-0.5">每張卡片：圖示、標題、說明、卡片底色、下方粗邊的顏色</p>
            </div>
            <AddButton onClick={() => update((d) => { d.kidsPage.gains.push({ icon: '⭐', title: '', description: '', bgColor: '#DEDEFA', borderColor: '#9B9CF4' }); })}>
              新增一塊
            </AddButton>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField label="區塊標題" value={kidsPage.gainsTitle} onChange={(v) => update((d) => { d.kidsPage.gainsTitle = v; })} />
            <TextField label="區塊副標（選填）" value={kidsPage.gainsSubtitle} onChange={(v) => update((d) => { d.kidsPage.gainsSubtitle = v; })} />
          </div>
          {kidsPage.gains.map((item, idx) => (
            <div key={idx} className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg">收穫 #{idx + 1}</span>
                <div className="flex items-center gap-1">
                  <OrderButtons
                    index={idx}
                    count={kidsPage.gains.length}
                    onMove={(to) => update((d) => { const [m] = d.kidsPage.gains.splice(idx, 1); d.kidsPage.gains.splice(to, 0, m); })}
                  />
                  <RemoveButton onClick={() => update((d) => { d.kidsPage.gains.splice(idx, 1); })} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-[6rem_1fr] gap-3">
                <TextField label="圖示" hint="一個表情符號" value={item.icon} onChange={(v) => update((d) => { d.kidsPage.gains[idx].icon = v; })} />
                <TextField label="標題" value={item.title} onChange={(v) => update((d) => { d.kidsPage.gains[idx].title = v; })} />
              </div>
              <Field label="說明">
                <textarea rows={3} value={item.description} onChange={(e) => update((d) => { d.kidsPage.gains[idx].description = e.target.value; })} className={inputClass} />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ColorField
                  label="卡片底色"
                  value={item.bgColor}
                  fallback="#DEDEFA"
                  onChange={(v) => update((d) => { d.kidsPage.gains[idx].bgColor = v; })}
                />
                <ColorField
                  label="下方粗邊顏色"
                  value={item.borderColor}
                  fallback="#9B9CF4"
                  onChange={(v) => update((d) => { d.kidsPage.gains[idx].borderColor = v; })}
                />
              </div>
            </div>
          ))}
        </div>

        <TextField label="課程區塊標題" value={kidsPage.coursesTitle} onChange={(v) => update((d) => { d.kidsPage.coursesTitle = v; })} />
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
          <div>
            <span className="text-sm font-bold text-slate-800">家長回饋區塊</span>
            <p className="text-xs text-slate-400 mt-0.5">內容在下方「學員與活動成果」新增：有「文字留言」的顯示成「頭像在左、文字在右」，有「截圖／照片」的集中放在最下面</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField label="區塊標題" value={kidsPage.storiesTitle} onChange={(v) => update((d) => { d.kidsPage.storiesTitle = v; })} />
            <TextField label="區塊說明（選填）" value={kidsPage.storiesSubtitle} onChange={(v) => update((d) => { d.kidsPage.storiesSubtitle = v; })} />
          </div>
          <TextField label="LINE 截圖區小標題" value={kidsPage.screenshotsTitle} onChange={(v) => update((d) => { d.kidsPage.screenshotsTitle = v; })} />
        </div>
        <TextField label="底部報名按鈕文字" value={kidsPage.ctaText} onChange={(v) => update((d) => { d.kidsPage.ctaText = v; })} />
      </Card>

      <Card title="大人的理財" description="成人理財頁的標題、需求分流卡片、文章區塊標題與課程籌備區塊">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="主標題">
            <textarea rows={2} value={adultPage.heroTitle} onChange={(e) => update((d) => { d.adultPage.heroTitle = e.target.value; })} className={inputClass} />
          </Field>
          <Field label="副標題">
            <textarea rows={2} value={adultPage.heroSubtitle} onChange={(e) => update((d) => { d.adultPage.heroSubtitle = e.target.value; })} className={inputClass} />
          </Field>
        </div>
        <TextField label="需求分流區塊標題" value={adultPage.needsIntro} onChange={(v) => update((d) => { d.adultPage.needsIntro = v; })} />
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-800">需求分流卡片</span>
            <AddButton onClick={() => update((d) => { d.adultPage.needs.push({ id: '', title: '', question: '', body: '' }); })}>
              新增一張卡片
            </AddButton>
          </div>
          {adultPage.needs.map((need, idx) => (
            <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg">卡片 #{idx + 1}</span>
                <RemoveButton onClick={() => update((d) => { d.adultPage.needs.splice(idx, 1); })} />
              </div>
              <TextField
                label="錨點 ID"
                hint="英文小寫、不要有空格；用於選單直接連到這張卡片，例：invest"
                value={need.id}
                onChange={(v) => update((d) => { d.adultPage.needs[idx].id = v; })}
              />
              <TextField label="標題" value={need.title} onChange={(v) => update((d) => { d.adultPage.needs[idx].title = v; })} />
              <TextField label="問題句（斜體引言）" value={need.question} onChange={(v) => update((d) => { d.adultPage.needs[idx].question = v; })} />
              <Field label="說明">
                <textarea rows={2} value={need.body} onChange={(e) => update((d) => { d.adultPage.needs[idx].body = e.target.value; })} className={inputClass} />
              </Field>
            </div>
          ))}
        </div>
        <TextField label="文章區塊標題" value={adultPage.articlesTitle} onChange={(v) => update((d) => { d.adultPage.articlesTitle = v; })} />
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
          <span className="text-sm font-bold text-slate-800">課程籌備區塊</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField label="課程名稱" value={adultPage.courseName} onChange={(v) => update((d) => { d.adultPage.courseName = v; })} />
            <TextField label="狀態標籤" hint="例：課程籌備中" value={adultPage.courseStatus} onChange={(v) => update((d) => { d.adultPage.courseStatus = v; })} />
          </div>
          <TextField label="副標題" value={adultPage.courseSubtitle} onChange={(v) => update((d) => { d.adultPage.courseSubtitle = v; })} />
          <Field label="內容方向說明">
            <textarea rows={2} value={adultPage.courseBody} onChange={(e) => update((d) => { d.adultPage.courseBody = e.target.value; })} className={inputClass} />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField label="學員回饋區塊標題" value={adultPage.storiesTitle} onChange={(v) => update((d) => { d.adultPage.storiesTitle = v; })} />
          <TextField label="學員回饋區塊說明（選填）" value={adultPage.storiesSubtitle} onChange={(v) => update((d) => { d.adultPage.storiesSubtitle = v; })} />
        </div>
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
          <span className="text-sm font-bold text-slate-800">結尾區塊（導向小管家兒童理財）</span>
          <Field label="標題">
            <textarea rows={2} value={adultPage.endingTitle} onChange={(e) => update((d) => { d.adultPage.endingTitle = e.target.value; })} className={inputClass} />
          </Field>
          <TextField label="按鈕文字" value={adultPage.endingCtaText} onChange={(v) => update((d) => { d.adultPage.endingCtaText = v; })} />
        </div>
      </Card>

      <Card title="企業永續合作" description="企業頁的標題、三項固定服務、為什麼是星育、學習成果與 ESG／員工福祉文字（洽詢表單資料在「企業洽詢」分頁查看）">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="主標題">
            <textarea rows={2} value={enterprisePage.heroTitle} onChange={(e) => update((d) => { d.enterprisePage.heroTitle = e.target.value; })} className={inputClass} />
          </Field>
          <Field label="副標題">
            <textarea rows={3} value={enterprisePage.heroSubtitle} onChange={(e) => update((d) => { d.enterprisePage.heroSubtitle = e.target.value; })} className={inputClass} />
          </Field>
        </div>
        <TextField label="頂部按鈕文字" value={enterprisePage.heroCtaText} onChange={(v) => update((d) => { d.enterprisePage.heroCtaText = v; })} />

        <div className="space-y-3">
          <span className="text-sm font-bold text-slate-800">三項合作方式（固定三項，也是洽詢表單的合作方式選項——文字改了選項就會跟著改）</span>
          {enterprisePage.services.map((service, idx) => (
            <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
              <span className="text-xs font-black px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg">服務 #{idx + 1}</span>
              <TextField label="標題" value={service.title} onChange={(v) => update((d) => { d.enterprisePage.services[idx].title = v; })} />
              <Field label="說明">
                <textarea rows={3} value={service.description} onChange={(e) => update((d) => { d.enterprisePage.services[idx].description = e.target.value; })} className={inputClass} />
              </Field>
            </div>
          ))}
        </div>

        <TextField label="「為什麼是星育」標題" value={enterprisePage.whyUsTitle} onChange={(v) => update((d) => { d.enterprisePage.whyUsTitle = v; })} />
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-800">「為什麼是星育」項目</span>
            <AddButton onClick={() => update((d) => { d.enterprisePage.whyUs.push({ title: '', description: '' }); })}>新增一項</AddButton>
          </div>
          {enterprisePage.whyUs.map((item, idx) => (
            <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg">#{idx + 1}</span>
                <RemoveButton onClick={() => update((d) => { d.enterprisePage.whyUs.splice(idx, 1); })} />
              </div>
              <TextField label="標題" value={item.title} onChange={(v) => update((d) => { d.enterprisePage.whyUs[idx].title = v; })} />
              <Field label="說明">
                <textarea rows={2} value={item.description} onChange={(e) => update((d) => { d.enterprisePage.whyUs[idx].description = e.target.value; })} className={inputClass} />
              </Field>
            </div>
          ))}
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
          <span className="text-sm font-bold text-slate-800">學習成果區塊</span>
          <TextField label="標題" value={enterprisePage.outcomesTitle} onChange={(v) => update((d) => { d.enterprisePage.outcomesTitle = v; })} />
          <TextField label="說明" value={enterprisePage.outcomesBody} onChange={(v) => update((d) => { d.enterprisePage.outcomesBody = v; })} />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">成果項目標籤</span>
              <AddButton onClick={() => update((d) => { d.enterprisePage.outcomesList.push(''); })}>新增一項</AddButton>
            </div>
            {enterprisePage.outcomesList.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => update((d) => { d.enterprisePage.outcomesList[idx] = e.target.value; })}
                  className={inputClass}
                />
                <RemoveButton onClick={() => update((d) => { d.enterprisePage.outcomesList.splice(idx, 1); })} />
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
          <span className="text-sm font-bold text-slate-800">ESG／員工福祉區塊</span>
          <TextField label="標題" value={enterprisePage.esgTitle} onChange={(v) => update((d) => { d.enterprisePage.esgTitle = v; })} />
          <Field label="說明">
            <textarea rows={3} value={enterprisePage.esgBody} onChange={(e) => update((d) => { d.enterprisePage.esgBody = e.target.value; })} className={inputClass} />
          </Field>
          <TextField label="表單區塊標題（同時也是按鈕文字所在的洽談段落標題）" value={enterprisePage.esgCtaText} onChange={(v) => update((d) => { d.enterprisePage.esgCtaText = v; })} />
        </div>
      </Card>

      <Card title="頁尾與聯絡資訊" description="網頁最下方的簡介、聯絡方式與社群連結；欄位留空就不會顯示">
        <Field label="頁尾簡介語" hint="Logo 下方那一段介紹文字">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField
            label="LINE ID"
            hint="官方帳號請連 @ 一起填，例：@staredu；也可以貼 LINE 連結"
            placeholder="@xxxxxxx"
            value={footer.lineId}
            onChange={(v) => update((d) => { d.footer.lineId = v; })}
          />
          <TextField
            label="公司名稱（最下方版權文字）"
            hint="顯示成「© 年份 公司名稱」；留空就用上面的網站名稱"
            placeholder="例：○○股份有限公司"
            value={footer.companyName}
            onChange={(v) => update((d) => { d.footer.companyName = v; })}
          />
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
              <p className="text-xs text-slate-400 mt-0.5">額外的連結（服務條款、隱私權政策、常見問題請用下面的「頁面內容」，填了內容就會自動出現）</p>
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

      <Card
        title="學員與活動成果"
        description="首頁、小管家兒童理財、大人的理財三個頁面都會用到的口碑／活動紀錄；每一則都要選「顯示在哪一頁」，一則都沒有的頁面就不會顯示這個區塊。小管家兒童理財頁：有「文字留言」的會顯示成「頭像在左、文字在右」（頭像、稱呼、身分都可以填），有「截圖／照片」的會集中放在下方"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-bold text-slate-800">內容（最多 20 則）</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => bulkInput.current?.click()}
                disabled={bulkUploading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 disabled:pointer-events-none transition-colors"
              >
                {bulkUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                {bulkUploading ? '上傳中，請稍候...' : '一次上傳多張截圖'}
              </button>
              <AddButton
                onClick={() => update((d) => {
                  d.testimonials.items.push({ imageUrl: '', avatarUrl: '', name: '', role: '', quote: '', activityName: '', date: '', segment: 'kids' });
                })}
              >
                新增一則
              </AddButton>
            </div>
            <input
              ref={bulkInput}
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(e) => handleBulkUpload(e.target.files)}
            />
          </div>
          {testimonials.items.map((item, idx) => (
            <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg">#{idx + 1}</span>
                <RemoveButton onClick={() => update((d) => { d.testimonials.items.splice(idx, 1); })} />
              </div>
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                {item.imageUrl && (
                  <img
                    src={formatImageUrl(item.imageUrl)}
                    alt="截圖預覽"
                    className="w-full sm:w-40 rounded-xl border border-slate-200 bg-white object-contain"
                  />
                )}
                <div className="flex-1 w-full space-y-3">
                  <Field label="顯示在哪一頁">
                    <select
                      value={item.segment || 'kids'}
                      onChange={(e) => update((d) => { d.testimonials.items[idx].segment = e.target.value as typeof item.segment; })}
                      className={inputClass}
                    >
                      {SEGMENT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="留言截圖／活動照片" hint="可以只放照片，也可以只寫文字">
                    <ImageUploadField
                      value={item.imageUrl}
                      onChange={(url) => update((d) => { d.testimonials.items[idx].imageUrl = url; })}
                      placeholder="按右邊「上傳圖片」上傳"
                      onError={(msg) => onToast(msg, 'error')}
                      onUnauthorized={onUnauthorized}
                    />
                  </Field>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <TextField
                      label="活動名稱（選填）"
                      placeholder="例：暑期理財營第 3 梯"
                      value={item.activityName}
                      onChange={(v) => update((d) => { d.testimonials.items[idx].activityName = v; })}
                    />
                    <TextField
                      label="日期（選填）"
                      placeholder="例：2026/07"
                      value={item.date}
                      onChange={(v) => update((d) => { d.testimonials.items[idx].date = v; })}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <TextField
                      label="稱呼（選填）"
                      placeholder="例：林媽媽"
                      value={item.name}
                      onChange={(v) => update((d) => { d.testimonials.items[idx].name = v; })}
                    />
                    <TextField
                      label="身分（選填）"
                      hint="顯示在稱呼下方"
                      placeholder="例：小二學生家長"
                      value={item.role}
                      onChange={(v) => update((d) => { d.testimonials.items[idx].role = v; })}
                    />
                  </div>
                  <Field label="頭像（選填）" hint="小管家兒童理財頁會顯示成圓形頭像；沒放就顯示稱呼的第一個字">
                    <ImageUploadField
                      value={item.avatarUrl}
                      onChange={(url) => update((d) => { d.testimonials.items[idx].avatarUrl = url; })}
                      placeholder="按右邊「上傳圖片」上傳"
                      onError={(msg) => onToast(msg, 'error')}
                      onUnauthorized={onUnauthorized}
                    />
                  </Field>
                  <Field label="文字留言（選填）">
                    <textarea
                      rows={2}
                      value={item.quote}
                      onChange={(e) => update((d) => { d.testimonials.items[idx].quote = e.target.value; })}
                      className={inputClass}
                    />
                  </Field>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card
        title="頁面內容：服務條款、隱私權政策、常見問題"
        description="填寫內容後，網站最下方會自動出現對應連結；內容留空的頁面不會顯示連結。換行會照原樣顯示"
      >
        {([
          ['terms', '服務條款'],
          ['privacy', '隱私權政策'],
          ['faq', '常見問題'],
        ] as const).map(([key, label]) => (
          <div key={key} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
            <span className="text-sm font-bold text-slate-800">{label}</span>
            <TextField
              label="頁面標題"
              value={pages[key].title}
              onChange={(v) => update((d) => { d.pages[key].title = v; })}
            />
            <Field label="內容">
              <textarea
                rows={8}
                value={pages[key].body}
                onChange={(e) => update((d) => { d.pages[key].body = e.target.value; })}
                placeholder="貼上或輸入這個頁面的完整文字"
                className={inputClass}
              />
            </Field>
          </div>
        ))}
      </Card>

      <Card title="訂閱名單彈窗" description="訪客一進站會跳出的「留 Email」視窗；收集到的名單在後台「訂閱名單」分頁查看">
        <label className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer w-fit">
          <input
            type="checkbox"
            checked={leadCapture.enabled}
            onChange={(e) => update((d) => { d.leadCapture.enabled = e.target.checked; })}
            className="w-4 h-4 accent-amber-500"
          />
          <span className="text-sm font-bold text-slate-700">開啟彈窗（取消勾選就整個關掉，不會有人看到）</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField label="標題" value={leadCapture.title} onChange={(v) => update((d) => { d.leadCapture.title = v; })} />
          <TextField label="副標題（選填）" value={leadCapture.subtitle} onChange={(v) => update((d) => { d.leadCapture.subtitle = v; })} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField label="輸入框提示文字" value={leadCapture.placeholder} onChange={(v) => update((d) => { d.leadCapture.placeholder = v; })} />
          <TextField label="按鈕文字" value={leadCapture.buttonText} onChange={(v) => update((d) => { d.leadCapture.buttonText = v; })} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField label="送出後的標題" value={leadCapture.successTitle} onChange={(v) => update((d) => { d.leadCapture.successTitle = v; })} />
          <TextField label="送出後的說明文字" value={leadCapture.successMessage} onChange={(v) => update((d) => { d.leadCapture.successMessage = v; })} />
        </div>
        <TextField
          label="小提醒文字（選填）"
          hint="顯示在按鈕下方，用小字說明用途"
          value={leadCapture.disclaimer}
          onChange={(v) => update((d) => { d.leadCapture.disclaimer = v; })}
        />
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

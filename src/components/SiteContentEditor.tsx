import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Plus, Trash2, Save, Upload, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import { resolveSiteContent, SiteContent } from '../../lib/siteContent';
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
        update((d) => { d.testimonials.items.push({ imageUrl: url, name: '', quote: '' }); });
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

  const { brand, nav, home, physicalPage, onlinePage, footer, testimonials, pages, leadCapture } = data;

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
            <option value="/physical-courses">實體課程頁</option>
            <option value="/online-courses">線上課程頁</option>
            <option value="/#testimonials">首頁的家長口碑區塊</option>
            <option value="/articles">文章列表頁</option>
            <option value="/faq">常見問題頁</option>
            <option value="/">首頁</option>
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

      <Card title="家長口碑" description="首頁最下方的口碑區塊；一則都沒有的時候，這個區塊不會顯示">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField label="區塊標題" value={testimonials.title} onChange={(v) => update((d) => { d.testimonials.title = v; })} />
          <TextField label="區塊說明" value={testimonials.subtitle} onChange={(v) => update((d) => { d.testimonials.subtitle = v; })} />
        </div>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-bold text-slate-800">口碑內容（最多 20 則）</span>
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
              <AddButton onClick={() => update((d) => { d.testimonials.items.push({ imageUrl: '', name: '', quote: '' }); })}>
                新增一則口碑
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
                <span className="text-xs font-black px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg">口碑 #{idx + 1}</span>
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
                  <Field label="留言截圖" hint="可以只放截圖，也可以只寫文字">
                    <ImageUploadField
                      value={item.imageUrl}
                      onChange={(url) => update((d) => { d.testimonials.items[idx].imageUrl = url; })}
                      placeholder="按右邊「上傳圖片」上傳截圖"
                      onError={(msg) => onToast(msg, 'error')}
                      onUnauthorized={onUnauthorized}
                    />
                  </Field>
                  <TextField
                    label="家長稱呼（選填）"
                    placeholder="例：林媽媽"
                    value={item.name}
                    onChange={(v) => update((d) => { d.testimonials.items[idx].name = v; })}
                  />
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

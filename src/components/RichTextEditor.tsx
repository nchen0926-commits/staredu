import { useEffect, useRef, useState, type ClipboardEvent, type DragEvent, type ReactNode } from 'react';
import {
  Bold, Italic, Underline, Strikethrough, List, ListOrdered, AlignLeft, AlignCenter, AlignRight,
  Quote, Link2, ImagePlus, Minus, Undo2, Redo2, Eraser, Highlighter, Palette, Loader2, Trash2,
} from 'lucide-react';
import { isHtml, sanitizeArticleHtml, textToHtml } from '../utils/sanitizeHtml';
import { uploadImage, UploadError } from '../utils/uploadImage';

interface RichTextEditorProps {
  initialHtml: string;
  onChange: (html: string) => void;
  onError: (message: string) => void;
  onUnauthorized: () => void;
}

const TEXT_COLORS: [string, string][] = [
  ['深灰', '#1e293b'], ['灰色', '#64748b'], ['紅色', '#dc2626'], ['橘色', '#ea580c'],
  ['金黃', '#d97706'], ['綠色', '#16a34a'], ['藍色', '#2563eb'], ['紫色', '#7c3aed'],
];
const HIGHLIGHTS: [string, string][] = [
  ['黃色', '#fef08a'], ['綠色', '#bbf7d0'], ['藍色', '#bfdbfe'], ['粉紅', '#fbcfe8'],
  ['橘色', '#fed7aa'], ['取消螢光筆', 'transparent'],
];
const IMAGE_SIZES = [25, 50, 75, 100];

function Btn(props: { title: string; onClick: () => void; active?: boolean; disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      title={props.title}
      aria-label={props.title}
      disabled={props.disabled}
      // Keep the text selection inside the editor when a toolbar button is pressed.
      onMouseDown={(e) => e.preventDefault()}
      onClick={props.onClick}
      className={`p-2 rounded-lg transition-colors disabled:opacity-40 ${
        props.active ? 'bg-amber-100 text-amber-700' : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      {props.children}
    </button>
  );
}

const Divider = () => <span className="w-px h-6 bg-slate-200 mx-1 shrink-0" />;

const escapeAttr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

export default function RichTextEditor({ initialHtml, onChange, onError, onUnauthorized }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const savedRange = useRef<Range | null>(null);
  const [menu, setMenu] = useState<'color' | 'highlight' | null>(null);
  const [active, setActive] = useState({ bold: false, italic: false, underline: false });
  const [uploading, setUploading] = useState(false);
  const [selectedImg, setSelectedImg] = useState<HTMLImageElement | null>(null);
  const [altText, setAltText] = useState('');

  // Load the article into the editor once; after that the editor owns its content.
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    el.innerHTML = sanitizeArticleHtml(isHtml(initialHtml) ? initialHtml : textToHtml(initialHtml));
    try {
      document.execCommand('defaultParagraphSeparator', false, 'p');
      document.execCommand('styleWithCSS', false, 'true');
    } catch {
      // older browsers: formatting still works, just with different markup
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshActive = () => {
    try {
      setActive({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
      });
    } catch {
      // ignore
    }
  };

  // Remember where the cursor is, so toolbar/menus/uploads can put things back there.
  useEffect(() => {
    const onSelection = () => {
      const sel = window.getSelection();
      const el = editorRef.current;
      if (sel && sel.rangeCount && el && el.contains(sel.anchorNode)) {
        savedRange.current = sel.getRangeAt(0).cloneRange();
        refreshActive();
      }
    };
    document.addEventListener('selectionchange', onSelection);
    return () => document.removeEventListener('selectionchange', onSelection);
  }, []);

  const emit = () => {
    const el = editorRef.current;
    if (!el) return;
    const html = el.innerHTML.replace(/ class="rte-selected"/g, '');
    const empty = !el.textContent?.trim() && !el.querySelector('img,hr');
    onChange(empty ? '' : html);
  };

  const restoreSelection = () => {
    const el = editorRef.current;
    const sel = window.getSelection();
    if (!el || !sel) return;
    if (sel.rangeCount && el.contains(sel.anchorNode)) return;
    if (savedRange.current) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    } else {
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  };

  const run = (command: string, value?: string) => {
    editorRef.current?.focus();
    restoreSelection();
    document.execCommand(command, false, value);
    emit();
    refreshActive();
  };

  const addLink = () => {
    const url = window.prompt('請貼上連結網址（要以 https:// 開頭）')?.trim();
    if (!url) return;
    if (!/^(https?:\/\/|mailto:|tel:)/i.test(url)) {
      onError('連結要以 https:// 開頭');
      return;
    }
    editorRef.current?.focus();
    restoreSelection();
    if (window.getSelection()?.isCollapsed) {
      run('insertHTML', `<a href="${escapeAttr(url)}">${escapeAttr(url)}</a>`);
    } else {
      run('createLink', url);
    }
  };

  const selectImage = (img: HTMLImageElement | null) => {
    selectedImg?.classList.remove('rte-selected');
    if (img) img.classList.add('rte-selected');
    setSelectedImg(img);
    setAltText(img?.alt ?? '');
  };

  const insertImages = async (files: File[]) => {
    if (files.length === 0) return;
    setUploading(true);
    try {
      for (const file of files) {
        const url = await uploadImage(file);
        const el = editorRef.current;
        if (!el) return;
        el.focus();
        restoreSelection();
        document.execCommand('insertImage', false, url);
        const inserted = Array.from(el.querySelectorAll('img')).filter((i) => i.getAttribute('src') === url);
        const img = inserted[inserted.length - 1];
        if (img) img.style.width = '50%';
        emit();
      }
    } catch (err) {
      if (err instanceof UploadError && err.status === 401) onUnauthorized();
      else onError(err instanceof Error ? err.message : '上傳失敗');
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const imageFiles = (list: FileList | null) => Array.from(list ?? []).filter((f) => f.type.startsWith('image/'));

  const onPaste = (e: ClipboardEvent<HTMLDivElement>) => {
    const files = imageFiles(e.clipboardData.files);
    if (files.length) {
      e.preventDefault();
      insertImages(files);
      return;
    }
    e.preventDefault();
    const html = e.clipboardData.getData('text/html');
    if (html) document.execCommand('insertHTML', false, sanitizeArticleHtml(html));
    else document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
    emit();
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    const files = imageFiles(e.dataTransfer.files);
    if (files.length) {
      e.preventDefault();
      insertImages(files);
    }
  };

  const resizeImage = (percent: number) => {
    if (!selectedImg?.isConnected) return selectImage(null);
    selectedImg.style.width = `${percent}%`;
    emit();
  };

  const removeImage = () => {
    if (selectedImg?.isConnected) selectedImg.remove();
    setSelectedImg(null);
    emit();
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20">
      <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-slate-100 bg-slate-50/70 rounded-t-2xl">
        <Btn title="復原" onClick={() => run('undo')}><Undo2 className="w-4 h-4" /></Btn>
        <Btn title="重做" onClick={() => run('redo')}><Redo2 className="w-4 h-4" /></Btn>
        <Divider />
        <select
          value=""
          onChange={(e) => e.target.value && run('formatBlock', `<${e.target.value}>`)}
          className="h-9 px-2 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700"
          aria-label="段落樣式"
        >
          <option value="">段落樣式</option>
          <option value="p">內文</option>
          <option value="h2">大標題</option>
          <option value="h3">小標題</option>
          <option value="h4">更小的標題</option>
        </select>
        <Divider />
        <Btn title="粗體" active={active.bold} onClick={() => run('bold')}><Bold className="w-4 h-4" /></Btn>
        <Btn title="斜體" active={active.italic} onClick={() => run('italic')}><Italic className="w-4 h-4" /></Btn>
        <Btn title="底線" active={active.underline} onClick={() => run('underline')}><Underline className="w-4 h-4" /></Btn>
        <Btn title="刪除線" onClick={() => run('strikeThrough')}><Strikethrough className="w-4 h-4" /></Btn>

        <div className="relative">
          <Btn title="文字顏色" onClick={() => setMenu(menu === 'color' ? null : 'color')}><Palette className="w-4 h-4" /></Btn>
          {menu === 'color' && (
            <div className="absolute z-20 top-full left-0 mt-1 p-2 bg-white border border-slate-200 rounded-xl shadow-lg flex gap-1.5">
              {TEXT_COLORS.map(([name, color]) => (
                <button
                  key={color}
                  type="button"
                  title={name}
                  aria-label={name}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { run('foreColor', color); setMenu(null); }}
                  className="w-6 h-6 rounded-full border border-slate-200"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          )}
        </div>
        <div className="relative">
          <Btn title="螢光筆" onClick={() => setMenu(menu === 'highlight' ? null : 'highlight')}><Highlighter className="w-4 h-4" /></Btn>
          {menu === 'highlight' && (
            <div className="absolute z-20 top-full left-0 mt-1 p-2 bg-white border border-slate-200 rounded-xl shadow-lg flex gap-1.5">
              {HIGHLIGHTS.map(([name, color]) => (
                <button
                  key={color}
                  type="button"
                  title={name}
                  aria-label={name}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { run('hiliteColor', color); setMenu(null); }}
                  className="w-6 h-6 rounded-full border border-slate-300 text-[10px] text-slate-500 leading-none"
                  style={{ backgroundColor: color === 'transparent' ? '#fff' : color }}
                >
                  {color === 'transparent' ? '✕' : ''}
                </button>
              ))}
            </div>
          )}
        </div>
        <Divider />
        <Btn title="靠左" onClick={() => run('justifyLeft')}><AlignLeft className="w-4 h-4" /></Btn>
        <Btn title="置中" onClick={() => run('justifyCenter')}><AlignCenter className="w-4 h-4" /></Btn>
        <Btn title="靠右" onClick={() => run('justifyRight')}><AlignRight className="w-4 h-4" /></Btn>
        <Divider />
        <Btn title="項目符號" onClick={() => run('insertUnorderedList')}><List className="w-4 h-4" /></Btn>
        <Btn title="編號清單" onClick={() => run('insertOrderedList')}><ListOrdered className="w-4 h-4" /></Btn>
        <Btn title="引用" onClick={() => run('formatBlock', '<blockquote>')}><Quote className="w-4 h-4" /></Btn>
        <Btn title="分隔線" onClick={() => run('insertHorizontalRule')}><Minus className="w-4 h-4" /></Btn>
        <Divider />
        <Btn title="插入連結" onClick={addLink}><Link2 className="w-4 h-4" /></Btn>
        <Btn
          title="插入圖片（放在游標的位置）"
          disabled={uploading}
          onClick={() => {
            editorRef.current?.focus();
            fileInput.current?.click();
          }}
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
        </Btn>
        <Btn title="清除格式" onClick={() => run('removeFormat')}><Eraser className="w-4 h-4" /></Btn>
        <input
          ref={fileInput}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => insertImages(imageFiles(e.target.files))}
        />
      </div>

      {selectedImg && (
        <div className="flex flex-wrap items-center gap-3 px-3 py-2 border-b border-amber-100 bg-amber-50 text-xs">
          <span className="font-bold text-amber-800">已選取圖片</span>
          <div className="flex items-center gap-1">
            <span className="text-slate-500">大小：</span>
            {IMAGE_SIZES.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => resizeImage(size)}
                className="px-2.5 py-1 rounded-md bg-white border border-amber-200 font-bold text-amber-800 hover:bg-amber-100"
              >
                {size}%
              </button>
            ))}
          </div>
          <label className="flex items-center gap-1.5 flex-1 min-w-[12rem]">
            <span className="text-slate-500 shrink-0">圖片說明：</span>
            <input
              type="text"
              value={altText}
              onChange={(e) => {
                setAltText(e.target.value);
                if (selectedImg.isConnected) {
                  selectedImg.alt = e.target.value;
                  emit();
                }
              }}
              placeholder="用一句話描述這張圖（對搜尋引擎和視障讀者很重要）"
              className="w-full px-2.5 py-1 rounded-md border border-amber-200 bg-white"
            />
          </label>
          <button
            type="button"
            onClick={removeImage}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-red-600 hover:bg-red-50 font-bold"
          >
            <Trash2 className="w-3.5 h-3.5" /> 刪除圖片
          </button>
        </div>
      )}

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        data-placeholder="在這裡寫文章，就像在 Word 裡一樣。上面的按鈕可以設定標題、粗體、顏色、清單，也能把圖片放進文字中間。"
        onInput={emit}
        onPaste={onPaste}
        onDrop={onDrop}
        onKeyUp={refreshActive}
        onFocus={() => setMenu(null)}
        onClick={(e) => {
          setMenu(null);
          const target = e.target as HTMLElement;
          selectImage(target.tagName === 'IMG' ? (target as HTMLImageElement) : null);
        }}
        className="article-html min-h-[26rem] max-h-[70vh] overflow-y-auto px-5 py-4 focus:outline-hidden"
      />
    </div>
  );
}

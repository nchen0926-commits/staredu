import { useRef, useState } from 'react';
import { Loader2, Upload } from 'lucide-react';
import { uploadImage, UploadError } from '../utils/uploadImage';

interface ImageUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  required?: boolean;
  inputClassName?: string;
  onError: (message: string) => void;
  onUnauthorized: () => void;
}

/** A URL text box plus an 「上傳圖片」 button that fills it in. */
export default function ImageUploadField({
  value,
  onChange,
  placeholder,
  required,
  inputClassName = 'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white',
  onError,
  onUnauthorized,
}: ImageUploadFieldProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      onChange(await uploadImage(file));
    } catch (err) {
      if (err instanceof UploadError && err.status === 401) {
        onUnauthorized();
      } else {
        onError(err instanceof Error ? err.message : '上傳失敗');
      }
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className={inputClassName}
      />
      <button
        type="button"
        onClick={() => fileInput.current?.click()}
        disabled={uploading}
        className="shrink-0 flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 disabled:opacity-50 disabled:pointer-events-none transition-colors"
      >
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        {uploading ? '上傳中...' : '上傳圖片'}
      </button>
      <input
        ref={fileInput}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}

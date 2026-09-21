export class UploadError extends Error {
  status: number;
  constructor(message: string, status = 0) {
    super(message);
    this.status = status;
  }
}

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'];
const MAX_BYTES = 4 * 1024 * 1024;
const RESIZE_ABOVE_BYTES = 1.5 * 1024 * 1024;
const MAX_DIMENSION = 2000;

/** Shrinks big photos in the browser first so uploads stay fast and under the server limit. */
async function prepare(file: File): Promise<Blob> {
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') return file;
  if (file.size <= RESIZE_ABOVE_BYTES) return file;

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  const outType = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/webp';
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, outType, 0.85));
  return blob && blob.size < file.size ? blob : file;
}

/** Uploads an image via the admin-only API and returns its public URL. */
export async function uploadImage(file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new UploadError('只支援 PNG、JPG、WebP、GIF、SVG 圖片');
  }

  let body: Blob;
  try {
    body = await prepare(file);
  } catch {
    throw new UploadError('這張圖片無法讀取，請換一張或先轉成 PNG / JPG');
  }
  if (body.size > MAX_BYTES) {
    throw new UploadError('圖片太大，請先壓縮到 4MB 以內');
  }

  let res: Response;
  try {
    res = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: { 'Content-Type': body.type || file.type },
      body,
    });
  } catch {
    throw new UploadError('上傳時發生網路錯誤，請稍後再試');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.url) {
    throw new UploadError(data.error || '上傳失敗，請稍後再試', res.status);
  }
  return data.url as string;
}

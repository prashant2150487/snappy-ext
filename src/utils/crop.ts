export interface Point { x: number; y: number }
export interface Rect { x: number; y: number; width: number; height: number }
export interface CropResult { blob: Blob; url: string; width: number; height: number }

export const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

export function normalizeRect(a: Point, b: Point): Rect {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(a.x - b.x),
    height: Math.abs(a.y - b.y),
  };
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load the screenshot.'));
    img.src = src;
  });
}

/**
 * Crops `rect` (CSS px inside the overlay) out of the full-resolution screenshot.
 * The overlay displays the image stretched to its own size, so
 * scale = naturalSize / displaySize handles any DPR or browser zoom.
 * The caller owns the returned object URL and must revoke it.
 */
export async function cropImage(
  img: HTMLImageElement,
  rect: Rect,
  display: { width: number; height: number },
): Promise<CropResult> {
  const sx = img.naturalWidth / display.width;
  const sy = img.naturalHeight / display.height;

  const x = clamp(Math.round(rect.x * sx), 0, img.naturalWidth - 1);
  const y = clamp(Math.round(rect.y * sy), 0, img.naturalHeight - 1);
  const w = Math.max(1, Math.min(Math.round(rect.width * sx), img.naturalWidth - x));
  const h = Math.max(1, Math.min(Math.round(rect.height * sy), img.naturalHeight - y));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not available.');
  ctx.drawImage(img, x, y, w, h, 0, 0, w, h);

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Failed to encode PNG.'))), 'image/png'),
  );

  canvas.width = canvas.height = 0; // release the pixel buffer right away
  return { blob, url: URL.createObjectURL(blob), width: w, height: h };
}
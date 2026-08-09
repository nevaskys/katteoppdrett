/**
 * Compress an image (File or data URL) to a small JPEG data URL so it can be
 * stored safely without blowing up request/row size limits.
 */
export async function compressImage(
  input: File | Blob | string,
  maxSize = 1200,
  quality = 0.75
): Promise<string> {
  const dataUrl = typeof input === 'string' ? input : await readAsDataUrl(input);

  const img = await loadImage(dataUrl);
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  const width = Math.round(img.width * scale);
  const height = Math.round(img.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, width, height);

  let out = canvas.toDataURL('image/jpeg', quality);
  // Keep shrinking if still large (target < ~700KB base64)
  let q = quality;
  while (out.length > 700_000 && q > 0.35) {
    q -= 0.15;
    out = canvas.toDataURL('image/jpeg', q);
  }
  return out;
}

function readAsDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error('Kunne ikke lese filen'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Kunne ikke laste bildet'));
    img.src = src;
  });
}

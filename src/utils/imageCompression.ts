/**
 * Kompres file gambar di sisi klien agar ringan disimpan dan dimuat (< 350 KB).
 */
export async function compressImageFile(
  file: File,
  maxDimension = 1280,
  initialQuality = 0.8
): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Pilih file gambar yang valid (PNG, JPG, atau WebP).');
  }

  if (file.size > 8 * 1024 * 1024) {
    throw new Error('Ukuran file gambar mentah maksimal 8 MB.');
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Gagal membaca file gambar.'));
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
    reader.readAsDataURL(file);
  });

  // Jika SVG atau gambar kecil sudah di bawah 220 KB, langsung gunakan
  if (file.type === 'image/svg+xml' && dataUrl.length <= 320000) {
    return dataUrl;
  }

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Format gambar tidak dapat dimuat.'));
    image.src = dataUrl;
  });

  const ratio = Math.min(1, maxDimension / Math.max(img.width, img.height));
  const targetWidth = Math.max(1, Math.round(img.width * ratio));
  const targetHeight = Math.max(1, Math.round(img.height * ratio));

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Peramban tidak mendukung pemrosesan gambar.');
  }
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  const outputMime =
    file.type === 'image/png' && maxDimension <= 512
      ? 'image/png'
      : 'image/jpeg';

  let quality = initialQuality;
  let result = canvas.toDataURL(outputMime, quality);

  while (result.length > 320000 && quality > 0.35) {
    quality -= 0.12;
    result = canvas.toDataURL('image/jpeg', quality);
  }

  if (result.length > 340000) {
    throw new Error(
      'Ukuran gambar masih terlalu besar setelah dikompresi. Gunakan gambar beresolusi lebih kecil atau tautan URL.'
    );
  }

  return result;
}

/**
 * Utility untuk kompresi dan manipulasi gambar di browser (client-side).
 * Mengurangi ukuran gambar hingga ~30KB - 70KB sebelum disimpan ke database/localStorage,
 * sehingga mencegah penumpukan data base64 yang besar.
 */

export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

/**
 * Kompresi gambar dari File, Blob, atau Data URL ke format JPEG terkompresi.
 */
export async function compressImageSource(
  imageSource: string | File | Blob,
  options: ImageCompressionOptions = {}
): Promise<string> {
  const { maxWidth = 800, maxHeight = 800, quality = 0.8 } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        let { width, height } = img;

        // Skalakan ukuran dengan tetap menjaga aspect ratio
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          if (typeof imageSource === 'string') {
            resolve(imageSource);
          } else {
            reject(new Error('Gagal menginisialisasi canvas context'));
          }
          return;
        }

        // Gambar ke canvas dengan smoothing aktif
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

        // Bersihkan object URL jika sumbernya File/Blob
        if (typeof imageSource !== 'string' && img.src.startsWith('blob:')) {
          URL.revokeObjectURL(img.src);
        }

        resolve(compressedDataUrl);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (err) => {
      if (typeof imageSource !== 'string' && img.src.startsWith('blob:')) {
        URL.revokeObjectURL(img.src);
      }
      reject(new Error('Gagal memuat format gambar untuk dikompresi'));
    };

    if (typeof imageSource === 'string') {
      img.src = imageSource;
    } else {
      img.src = URL.createObjectURL(imageSource);
    }
  });
}

/**
 * Mengambil satu frame foto dari elemen video kamera dan mengompresinya menjadi Data URL JPEG.
 */
export function captureVideoFrame(
  video: HTMLVideoElement,
  options: ImageCompressionOptions = {}
): string {
  const { maxWidth = 800, maxHeight = 800, quality = 0.8 } = options;

  const canvas = document.createElement('canvas');
  let width = video.videoWidth || 640;
  let height = video.videoHeight || 480;

  if (width > maxWidth || height > maxHeight) {
    if (width / height > maxWidth / maxHeight) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
    } else {
      width = Math.round((width * maxHeight) / height);
      height = maxHeight;
    }
  }

  canvas.width = Math.max(1, width);
  canvas.height = Math.max(1, height);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Gagal menginisialisasi canvas 2D context');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(video, 0, 0, width, height);

  return canvas.toDataURL('image/jpeg', quality);
}

/**
 * Validasi berkas gambar (tipe dan ukuran awal sebelum kompresi).
 */
export function validateImageFile(
  file: File,
  maxSizeBytes: number = 10 * 1024 * 1024
): { valid: boolean; error?: string } {
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'File yang dipilih harus berupa gambar (JPG, PNG, WEBP, GIF).' };
  }

  if (file.size > maxSizeBytes) {
    const maxMb = Math.round(maxSizeBytes / (1024 * 1024));
    return { valid: false, error: `Ukuran file maksimal adalah ${maxMb}MB sebelum kompresi.` };
  }

  return { valid: true };
}

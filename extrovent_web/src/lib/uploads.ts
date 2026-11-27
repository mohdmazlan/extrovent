import { apiFetch } from './apiClient';

export const MAX_IMAGES = 5;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export function validateImages(files: File[]): string | null {
  if (files.length > MAX_IMAGES) return `Max ${MAX_IMAGES} images allowed`;
  for (const f of files) {
    if (f.size > MAX_IMAGE_BYTES) return `${f.name} exceeds 10MB`;
    if (!f.type.startsWith('image/')) return `${f.name} is not an image`;
  }
  return null;
}

export function resizeImageTo500(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 500;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas unavailable')); return; }
        // cover crop
        const scale = Math.max(size / img.width, size / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (size - w) / 2;
        const y = (size - h) / 2;
        ctx.drawImage(img, x, y, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export async function uploadPostImages(postId: string, files: File[]): Promise<void> {
  const fd = new FormData();
  fd.append('post_id', String(postId));
  files.forEach((f) => fd.append('images[]', f));
  await apiFetch('/post/upload', { method: 'POST', formData: fd });
}

export async function uploadGalleryImages(target: { place_id?: string; activity_id?: string; event_id?: string }, files: File[]): Promise<void> {
  const fd = new FormData();
  if (target.place_id) fd.append('place_id', String(target.place_id));
  if (target.activity_id) fd.append('activity_id', String(target.activity_id));
  if (target.event_id) fd.append('event_id', String(target.event_id));
  files.forEach((f) => fd.append('images[]', f));
  await apiFetch('/gallery/upload', { method: 'POST', formData: fd });
}

export function fileListToArray(list: FileList | null): File[] {
  return list ? Array.from(list) : [];
}

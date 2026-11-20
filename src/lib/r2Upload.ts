import { supabase, r2MediaUrl } from './supabase';

export interface Compressed360Result {
  mainBlob: Blob;
  thumbBlob: Blob;
  mainSizeText: string;
  thumbSizeText: string;
  width: number;
  height: number;
}

export interface R2UploadResult {
  panoramaUrl: string;
  thumbUrl: string;
  fileSizeWebP: string;
  thumbSizeWebP: string;
  uploadedToR2: boolean;
}

const MAX_MAIN_WIDTH = 4096;
const MAX_MAIN_HEIGHT = 2048;
const MAX_MAIN_BYTES = 2 * 1024 * 1024; // 2 MB strict block
const TARGET_MAX_BYTES = 1.5 * 1024 * 1024; // 1.5 MB target ceiling

const MAX_THUMB_WIDTH = 480;
const MAX_THUMB_HEIGHT = 270;
const MAX_THUMB_BYTES = 30 * 1024; // <= 30 KB

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo decodificar la imagen seleccionada.'));
    };
    img.src = url;
  });
}

function canvasToWebPBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Error al comprimir a formato WebP en navegador.'));
          return;
        }
        resolve(blob);
      },
      'image/webp',
      quality
    );
  });
}

export function formatBytesToMB(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb >= 0.1) {
    return `${mb.toFixed(1)} MB WebP`;
  }
  const kb = Math.max(1, Math.round(bytes / 1024));
  return `${kb} KB WebP`;
}

/**
 * Compresses an input image file in-browser via <canvas>:
 * - Main 360 image: max 4096x2048 px, WebP target 800KB-1.5MB, blocked if > 2MB.
 * - Thumbnail image: max 480x270 px, WebP <= 30KB.
 */
export async function compressImageTo360WebP(file: File): Promise<Compressed360Result> {
  const img = await loadImageFromFile(file);

  // 1. Scale main image to max 4096x2048 preserving ratio
  let targetW = img.naturalWidth || img.width;
  let targetH = img.naturalHeight || img.height;
  const scale = Math.min(1, MAX_MAIN_WIDTH / targetW, MAX_MAIN_HEIGHT / targetH);
  targetW = Math.round(targetW * scale);
  targetH = Math.round(targetH * scale);

  const mainCanvas = document.createElement('canvas');
  mainCanvas.width = targetW;
  mainCanvas.height = targetH;
  const mainCtx = mainCanvas.getContext('2d');
  if (!mainCtx) throw new Error('Contexto Canvas 2D no disponible.');
  mainCtx.drawImage(img, 0, 0, targetW, targetH);

  // Iterative quality adjustment to target <= 1.5 MB and enforce <= 2 MB
  const qualities = [0.88, 0.82, 0.76, 0.7, 0.62, 0.54];
  let mainBlob = await canvasToWebPBlob(mainCanvas, qualities[0]);
  for (let i = 1; i < qualities.length; i++) {
    if (mainBlob.size <= TARGET_MAX_BYTES) break;
    mainBlob = await canvasToWebPBlob(mainCanvas, qualities[i]);
  }

  if (mainBlob.size > MAX_MAIN_BYTES) {
    throw new Error(
      `La imagen WebP resultante (${formatBytesToMB(mainBlob.size)}) supera el límite máximo permitido de 2.0 MB.`
    );
  }

  // 2. Generate WebP thumbnail <= 30 KB
  const thumbScale = Math.min(1, MAX_THUMB_WIDTH / targetW, MAX_THUMB_HEIGHT / targetH);
  const thumbW = Math.max(160, Math.round(targetW * thumbScale));
  const thumbH = Math.max(90, Math.round(targetH * thumbScale));

  const thumbCanvas = document.createElement('canvas');
  thumbCanvas.width = thumbW;
  thumbCanvas.height = thumbH;
  const thumbCtx = thumbCanvas.getContext('2d');
  if (!thumbCtx) throw new Error('Contexto Canvas 2D para miniatura no disponible.');
  thumbCtx.drawImage(img, 0, 0, thumbW, thumbH);

  const thumbQualities = [0.76, 0.66, 0.56, 0.45, 0.35];
  let thumbBlob = await canvasToWebPBlob(thumbCanvas, thumbQualities[0]);
  for (let i = 1; i < thumbQualities.length; i++) {
    if (thumbBlob.size <= MAX_THUMB_BYTES) break;
    thumbBlob = await canvasToWebPBlob(thumbCanvas, thumbQualities[i]);
  }

  return {
    mainBlob,
    thumbBlob,
    mainSizeText: formatBytesToMB(mainBlob.size),
    thumbSizeText: `${Math.max(1, Math.round(thumbBlob.size / 1024))} KB WebP`,
    width: targetW,
    height: targetH,
  };
}

function uploadFormWithProgress(
  endpoint: string,
  form: FormData,
  anonKey: string,
  onUploadProgress?: (fraction: number) => void
): Promise<{ publicUrl?: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', endpoint, true);
    if (anonKey) {
      xhr.setRequestHeader('apikey', anonKey);
      xhr.setRequestHeader('Authorization', `Bearer ${anonKey}`);
    }

    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable && evt.total > 0 && onUploadProgress) {
        onUploadProgress(evt.loaded / evt.total);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText || '{}'));
        } catch {
          resolve({});
        }
      } else {
        reject(new Error(`Error HTTP ${xhr.status} subiendo a R2`));
      }
    };

    xhr.onerror = () => reject(new Error('Error de red subiendo a R2'));
    xhr.send(form);
  });
}

async function uploadBlobViaPresignedR2(
  blob: Blob,
  fileKey: string,
  onUploadProgress?: (fraction: number) => void
): Promise<string | null> {
  const supaUrl = (import.meta.env.PUBLIC_SUPABASE_URL || 'https://tjmetsamjalxttldhduu.supabase.co').replace(/\/$/, '');
  const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '';
  const endpoint = `${supaUrl}/functions/v1/r2-presigned-url`;

  // 1. Direct multipart/form-data upload with real XHR upload progress
  try {
    const form = new FormData();
    form.append('file', new File([blob], fileKey.split('/').pop() || 'scene.webp', { type: 'image/webp' }));
    form.append('filePath', fileKey);
    form.append('contentType', 'image/webp');

    const json = await uploadFormWithProgress(endpoint, form, anonKey, onUploadProgress);
    if (json?.publicUrl) {
      return json.publicUrl;
    }
  } catch {
    // Fallback to presigned PUT below
  }

  // 2. Fallback: Request presigned PUT URL and upload directly
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.functions.invoke('r2-presigned-url', {
      body: {
        filePath: fileKey,
        fileName: fileKey,
        contentType: 'image/webp',
        fileSize: blob.size,
      },
    });

    if (error || !data?.uploadUrl) return null;

    const putRes = await fetch(data.uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'image/webp',
      },
      body: blob,
    });

    if (!putRes.ok) return null;

    if (data.publicUrl) return data.publicUrl as string;
    if (r2MediaUrl && !r2MediaUrl.includes('.r2.cloudflarestorage.com')) {
      return `${r2MediaUrl.replace(/\/$/, '')}/${fileKey.replace(/^\//, '')}`;
    }
    return `${endpoint}?key=${encodeURIComponent(fileKey)}`;
  } catch {
    return null;
  }
}

export type R2Section = 'sedes' | 'habitaciones' | 'servicios' | 'promociones';
export type R2MediaKind = '360' | 'portada';

export interface R2UploadTarget {
  section: R2Section;
  slug: string;
  kind?: R2MediaKind;
  customName?: string;
}

export type UploadProgressCallback = (percent: number, stage: string) => void;

export function sanitizeR2Slug(rawName: string, fallback = 'imagen'): string {
  return (
    rawName
      .trim()
      .replace(/\.[^.]+$/, '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || fallback
  );
}

export function extractR2KeyFromUrl(mediaUrl: string): string | null {
  if (!mediaUrl) return null;
  try {
    const parsed = new URL(mediaUrl);
    const keyParam = parsed.searchParams.get('key');
    if (keyParam) return decodeURIComponent(keyParam).replace(/^\/+/, '');
    const path = decodeURIComponent(parsed.pathname).replace(/^\/+/, '');
    return path || null;
  } catch {
    return mediaUrl.replace(/^\/+/, '') || null;
  }
}

export function getFileNameFromUrl(mediaUrl: string): string {
  const key = extractR2KeyFromUrl(mediaUrl);
  if (!key) return '';
  return key.split('/').pop() || '';
}

async function renameSingleR2Key(oldKey: string, newKey: string): Promise<string> {
  const supaUrl = (import.meta.env.PUBLIC_SUPABASE_URL || 'https://tjmetsamjalxttldhduu.supabase.co').replace(/\/$/, '');
  const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '';
  const res = await fetch(`${supaUrl}/functions/v1/r2-presigned-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(anonKey ? { apikey: anonKey, Authorization: `Bearer ${anonKey}` } : {}),
    },
    body: JSON.stringify({ action: 'rename', oldKey, newKey }),
  });
  const json = await res.json();
  if (!res.ok || !json?.publicUrl) {
    throw new Error(json?.error || `Error al renombrar archivo en R2 (${res.status})`);
  }
  return json.publicUrl as string;
}

export async function renameR2Media(
  oldUrl: string,
  newName: string,
  oldThumbUrl?: string | null
): Promise<{ newUrl: string; newThumbUrl?: string; newKey: string }> {
  const oldKey = extractR2KeyFromUrl(oldUrl);
  if (!oldKey) throw new Error('No se pudo determinar la ruta del archivo en R2.');

  const lastSlash = oldKey.lastIndexOf('/');
  const folderPrefix = lastSlash >= 0 ? oldKey.slice(0, lastSlash) : '';
  const currentFileName = lastSlash >= 0 ? oldKey.slice(lastSlash + 1) : oldKey;
  const extMatch = currentFileName.match(/(\.[a-z0-9]+)$/i);
  const ext = extMatch ? extMatch[1].toLowerCase() : '.webp';
  const cleanSlug = sanitizeR2Slug(newName);
  const newKey = folderPrefix ? `${folderPrefix}/${cleanSlug}${ext}` : `${cleanSlug}${ext}`;

  const newUrl = await renameSingleR2Key(oldKey, newKey);

  let newThumbUrl: string | undefined;
  if (oldThumbUrl) {
    const oldThumbKey = extractR2KeyFromUrl(oldThumbUrl);
    if (oldThumbKey && oldThumbKey !== oldKey) {
      const thumbSlash = oldThumbKey.lastIndexOf('/');
      const thumbFolder = thumbSlash >= 0 ? oldThumbKey.slice(0, thumbSlash) : folderPrefix;
      const newThumbKey = thumbFolder ? `${thumbFolder}/${cleanSlug}-thumb.webp` : `${cleanSlug}-thumb.webp`;
      newThumbUrl = await renameSingleR2Key(oldThumbKey, newThumbKey);
    }
  }

  return { newUrl, newThumbUrl, newKey };
}

/**
 * Compresses the 360 image + thumbnail in browser and uploads both to Cloudflare R2
 * organized by {section}/{slug}/{kind}/{name}.webp
 */
export async function compressAndUpload360Scene(
  file: File,
  target: R2UploadTarget | string = { section: 'habitaciones', slug: 'general', kind: '360' },
  onProgress?: UploadProgressCallback
): Promise<R2UploadResult> {
  onProgress?.(12, 'Comprimiendo WebP...');
  const compressed = await compressImageTo360WebP(file);
  onProgress?.(35, 'Subiendo a Cloudflare R2...');

  const timestamp = Date.now();
  const customSlug =
    typeof target !== 'string' && target.customName?.trim()
      ? sanitizeR2Slug(target.customName)
      : '';
  const baseSlug = customSlug || sanitizeR2Slug(file.name);
  const fileBase = customSlug ? customSlug : `${timestamp}-${baseSlug}`;

  let folderPrefix: string;
  if (typeof target === 'string') {
    folderPrefix = target.replace(/^\/+|\/+$/g, '');
  } else {
    const cleanSection = target.section;
    const cleanSlug = target.slug.toLowerCase().replace(/[^a-z0-9-_]/g, '-') || 'general';
    const cleanKind = target.kind || '360';
    folderPrefix = `${cleanSection}/${cleanSlug}/${cleanKind}`;
  }

  const mainKey = `${folderPrefix}/${fileBase}.webp`;
  const thumbKey = `${folderPrefix}/${fileBase}-thumb.webp`;

  const [r2MainUrl, r2ThumbUrl] = await Promise.all([
    uploadBlobViaPresignedR2(compressed.mainBlob, mainKey, (frac) => {
      onProgress?.(Math.round(35 + frac * 55), 'Subiendo a Cloudflare R2...');
    }),
    uploadBlobViaPresignedR2(compressed.thumbBlob, thumbKey),
  ]);

  if (r2MainUrl && r2ThumbUrl) {
    onProgress?.(94, 'Guardando en Supabase...');
    return {
      panoramaUrl: r2MainUrl,
      thumbUrl: r2ThumbUrl,
      fileSizeWebP: compressed.mainSizeText,
      thumbSizeWebP: compressed.thumbSizeText,
      uploadedToR2: true,
    };
  }

  throw new Error('No se pudo subir la imagen a Cloudflare R2. Verifica la conexión con la Edge Function r2-presigned-url.');
}

export interface HeroMediaUploadResult {
  mediaUrl: string;
  mediaTipo: 'imagen' | 'video';
  sizeText: string;
}

/**
 * Uploads an image (compressed to WebP) or video (MP4/WebM) to Cloudflare R2 under `hero/`
 * and returns the full public https:// URL.
 */
export async function uploadHeroMediaToR2(
  file: File,
  onProgress?: UploadProgressCallback,
  customName?: string
): Promise<HeroMediaUploadResult> {
  const timestamp = Date.now();
  const customSlug = customName?.trim() ? sanitizeR2Slug(customName, 'hero') : '';
  const baseSlug = customSlug || sanitizeR2Slug(file.name, 'hero');
  const fileBase = customSlug ? customSlug : `${timestamp}-${baseSlug}`;

  const isVideo = file.type.startsWith('video/');
  if (isVideo) {
    if (!['video/mp4', 'video/webm'].includes(file.type)) {
      throw new Error('Formato de video no permitido. Usa MP4 o WebM.');
    }
    onProgress?.(15, 'Preparando video...');
    const ext = file.type === 'video/webm' ? 'webm' : 'mp4';
    const fileKey = `hero/${fileBase}.${ext}`;
    const supaUrl = (import.meta.env.PUBLIC_SUPABASE_URL || 'https://tjmetsamjalxttldhduu.supabase.co').replace(/\/$/, '');
    const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '';
    const form = new FormData();
    form.append('file', file);
    form.append('filePath', fileKey);
    form.append('contentType', file.type);

    const json = await uploadFormWithProgress(
      `${supaUrl}/functions/v1/r2-presigned-url`,
      form,
      anonKey,
      (frac) => {
        onProgress?.(Math.round(15 + frac * 78), 'Subiendo video a R2...');
      }
    );
    if (!json?.publicUrl) {
      throw new Error('No se obtuvo publicUrl del video en R2.');
    }
    onProgress?.(95, 'Guardando en Supabase...');
    return {
      mediaUrl: json.publicUrl,
      mediaTipo: 'video',
      sizeText: formatBytesToMB(file.size),
    };
  }

  onProgress?.(12, 'Comprimiendo WebP...');
  const compressed = await compressImageTo360WebP(file);
  onProgress?.(35, 'Subiendo a Cloudflare R2...');
  const mainKey = `hero/${fileBase}.webp`;
  const r2Url = await uploadBlobViaPresignedR2(compressed.mainBlob, mainKey, (frac) => {
    onProgress?.(Math.round(35 + frac * 57), 'Subiendo a Cloudflare R2...');
  });
  if (!r2Url) {
    throw new Error('No se pudo subir la imagen del Hero a Cloudflare R2.');
  }
  onProgress?.(95, 'Guardando en Supabase...');
  return {
    mediaUrl: r2Url,
    mediaTipo: 'imagen',
    sizeText: compressed.mainSizeText,
  };
}

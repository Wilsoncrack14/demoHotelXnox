import { ROOMS, SERVICES, PROMOTIONS, SEDES, type Scene360, type Hotspot360 } from './hotelData';

const STORAGE_KEY = 'hotel_xnox_scenes_v3_real360';

export type EntityCategory = 'habitaciones' | 'sedes' | 'servicios' | 'promociones';

export interface WhatsAppModalPayload {
  sede?: string;
  itemTitle?: string;
  category?: string;
  priceText?: string;
}

export function triggerWhatsAppModal(payload: WhatsAppModalPayload = {}) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('xnox:open-whatsapp', { detail: payload }));
  }
}

export function getStoredScenesMap(): Record<string, Scene360[]> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveEntityScenes(entityKey: string, scenes: Scene360[]) {
  if (typeof window === 'undefined') return;
  try {
    const map = getStoredScenesMap();
    map[entityKey] = scenes;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    window.dispatchEvent(new CustomEvent('xnox:scenes-updated', { detail: { entityKey, scenes } }));
  } catch (e) {
    console.error('Error saving scenes to localStorage:', e);
  }
}

export function resetEntityScenes(entityKey?: string) {
  if (typeof window === 'undefined') return;
  if (!entityKey) {
    window.localStorage.removeItem(STORAGE_KEY);
  } else {
    const map = getStoredScenesMap();
    delete map[entityKey];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  }
  window.dispatchEvent(new CustomEvent('xnox:scenes-updated', { detail: { entityKey } }));
}

export function getEntityScenes(entityKey: string, defaultScenes: Scene360[]): Scene360[] {
  const map = getStoredScenesMap();
  return map[entityKey] && map[entityKey].length > 0 ? map[entityKey] : defaultScenes;
}

export interface AdminEditableEntity {
  key: string;
  category: EntityCategory;
  title: string;
  subtitle: string;
  fullLabel: string;
  defaultScenes: Scene360[];
}

export function getAllAdminEntities(): AdminEditableEntity[] {
  const list: AdminEditableEntity[] = [];

  for (const room of ROOMS) {
    list.push({
      key: `habitaciones:${room.slug}`,
      category: 'habitaciones',
      title: room.title,
      subtitle: room.sedeName,
      fullLabel: `${room.title} — ${room.sedeName}`,
      defaultScenes: room.scenes,
    });
  }

  for (const sede of SEDES) {
    list.push({
      key: `sedes:${sede.slug}`,
      category: 'sedes',
      title: sede.name,
      subtitle: sede.address,
      fullLabel: `${sede.name} — Exterior & Recepción`,
      defaultScenes: [
        {
          id: `sede-${sede.slug}-1`,
          title: 'Ingreso & Recepción 360°',
          adminTitle: 'Ingreso & Recepción',
          isPrimary: true,
          fileSizeWebP: '1.3 MB WebP',
          panoramaUrl: sede.panoramaUrl,
          thumbUrl: '/images/thumb-ingreso.webp',
          hotspots: sede.hotspots,
        },
      ],
    });
  }

  for (const serv of SERVICES) {
    list.push({
      key: `servicios:${serv.slug}`,
      category: 'servicios',
      title: serv.title,
      subtitle: serv.topBarPriceText,
      fullLabel: `${serv.title} — Servicios`,
      defaultScenes: serv.scenes,
    });
  }

  for (const promo of PROMOTIONS) {
    list.push({
      key: `promociones:${promo.slug}`,
      category: 'promociones',
      title: promo.title,
      subtitle: promo.badgeText,
      fullLabel: `${promo.title} — Promoción (${promo.badgeText})`,
      defaultScenes: promo.scenes,
    });
  }

  return list;
}

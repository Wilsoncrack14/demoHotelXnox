import {
  ROOMS,
  SERVICES,
  PROMOTIONS,
  SEDES,
  ENTITY_UUID_MAP,
  type Scene360,
} from './hotelData';

const STORAGE_KEY = 'hotel_xnox_r2_live_v1';

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
  return map[entityKey] ? map[entityKey] : defaultScenes;
}

export interface AdminEditableEntity {
  key: string;
  entityUuid: string;
  dbEntidadTipo: 'habitacion' | 'servicio';
  category: EntityCategory;
  slug: string;
  title: string;
  subtitle: string;
  fullLabel: string;
  defaultScenes: Scene360[];
}

export function getAllAdminEntities(): AdminEditableEntity[] {
  const list: AdminEditableEntity[] = [];

  for (const room of ROOMS) {
    const key = `habitaciones:${room.slug}`;
    list.push({
      key,
      entityUuid: room.id || ENTITY_UUID_MAP[key],
      dbEntidadTipo: 'habitacion',
      category: 'habitaciones',
      slug: room.slug,
      title: room.title,
      subtitle: room.sedeName,
      fullLabel: `${room.title} — ${room.sedeName}`,
      defaultScenes: [],
    });
  }

  for (const sede of SEDES) {
    const key = `sedes:${sede.slug}`;
    list.push({
      key,
      entityUuid: sede.id || ENTITY_UUID_MAP[key],
      dbEntidadTipo: 'habitacion',
      category: 'sedes',
      slug: sede.slug,
      title: sede.name,
      subtitle: sede.address,
      fullLabel: `${sede.name} — Exterior & Recepción`,
      defaultScenes: [],
    });
  }

  for (const serv of SERVICES) {
    const key = `servicios:${serv.slug}`;
    list.push({
      key,
      entityUuid: serv.id || ENTITY_UUID_MAP[key],
      dbEntidadTipo: 'servicio',
      category: 'servicios',
      slug: serv.slug,
      title: serv.title,
      subtitle: serv.topBarPriceText,
      fullLabel: `${serv.title} — Servicios`,
      defaultScenes: [],
    });
  }

  for (const promo of PROMOTIONS) {
    const key = `promociones:${promo.slug}`;
    list.push({
      key,
      entityUuid: promo.id || ENTITY_UUID_MAP[key],
      dbEntidadTipo: 'servicio',
      category: 'promociones',
      slug: promo.slug,
      title: promo.title,
      subtitle: promo.badgeText,
      fullLabel: `${promo.title} — Promoción (${promo.badgeText})`,
      defaultScenes: [],
    });
  }

  return list;
}

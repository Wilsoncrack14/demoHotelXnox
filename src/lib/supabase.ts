import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  SEDES,
  ROOMS,
  SERVICES,
  PROMOTIONS,
  ENTITY_UUID_MAP,
  EMPTY_PLACEHOLDER_IMG,
  type Scene360,
  type Hotspot360,
} from '../data/hotelData';
import { SEDE_WHATSAPP_MAP } from './whatsapp';

export interface DbSede {
  id: string;
  nombre: string;
  slug: string;
  direccion: string;
  google_maps_url: string;
  waze_url: string;
  whatsapp_numero: string;
  imagen_portada_url: string;
  orden: number;
  activo: boolean;
}

export interface DbHabitacion {
  id: string;
  sede_id: string;
  nombre: string;
  slug: string;
  descripcion: string;
  tarifa: number;
  moneda: string;
  portada_webp_url: string;
  etiqueta_promo: string | null;
  orden: number;
  activo: boolean;
}

export interface DbServicio {
  id: string;
  sede_id: string;
  nombre: string;
  slug: string;
  descripcion: string;
  tarifa: number;
  moneda: string;
  portada_webp_url: string;
  etiqueta_promo: string | null;
  orden: number;
  activo: boolean;
}

export interface DbEscena360 {
  id: string;
  entidad_tipo: 'habitacion' | 'servicio';
  entidad_id: string;
  titulo: string;
  imagen_360_webp_url: string;
  miniatura_webp_url: string;
  orden: number;
  es_principal: boolean;
  pitch_inicial?: number | null;
  yaw_inicial?: number | null;
}

export interface DbHotspot {
  id: string;
  escena_id: string;
  tipo: 'navegacion' | 'informativo';
  pitch: number;
  yaw: number;
  escena_destino_id: string | null;
  titulo: string;
  descripcion: string | null;
  imagen_detalle_url: string | null;
  precio_adicional: number | null;
}

export interface DbPromocion {
  id: string;
  sede_id: string;
  titulo: string;
  slug: string;
  descripcion: string;
  precio_promo: number;
  precio_regular: number;
  imagen_webp_url: string;
  fecha_fin: string;
  activo: boolean;
}

export interface DbHeroSlide {
  id: string;
  titulo: string;
  subtitulo: string | null;
  etiqueta_superior: string | null;
  media_url: string;
  media_tipo: 'imagen' | 'video';
  boton_texto: string;
  boton_url: string;
  orden: number;
  activo: boolean;
}

const supabaseUrl =
  import.meta.env.PUBLIC_SUPABASE_URL || 'https://tjmetsamjalxttldhduu.supabase.co';
const supabaseAnonKey =
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_WvOJXnoPIK63aQViJqjsvw_grwDhoAA';
export const r2MediaUrl = import.meta.env.PUBLIC_R2_MEDIA_URL || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUuid(str?: string): boolean {
  return Boolean(str && UUID_REGEX.test(str));
}

export function resolveEntityUuid(keyOrSlugOrId: string): string {
  if (isValidUuid(keyOrSlugOrId)) return keyOrSlugOrId;
  if (ENTITY_UUID_MAP[keyOrSlugOrId]) return ENTITY_UUID_MAP[keyOrSlugOrId];
  for (const [k, uuid] of Object.entries(ENTITY_UUID_MAP)) {
    if (k.endsWith(`:${keyOrSlugOrId}`)) return uuid;
  }
  return keyOrSlugOrId;
}

export function resolveMediaUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return EMPTY_PLACEHOLDER_IMG;
  if (
    pathOrUrl.startsWith('http://') ||
    pathOrUrl.startsWith('https://') ||
    pathOrUrl.startsWith('data:') ||
    pathOrUrl.startsWith('blob:') ||
    pathOrUrl.startsWith('/')
  ) {
    return pathOrUrl;
  }
  if (r2MediaUrl && !r2MediaUrl.includes('.r2.cloudflarestorage.com')) {
    return `${r2MediaUrl.replace(/\/$/, '')}/${pathOrUrl.replace(/^\//, '')}`;
  }
  return `${supabaseUrl.replace(/\/$/, '')}/functions/v1/r2-presigned-url?key=${encodeURIComponent(
    pathOrUrl.replace(/^\//, '')
  )}`;
}

export function getFallbackDbSedes(): DbSede[] {
  return SEDES.map((s, idx) => ({
    id: s.id,
    nombre: s.name,
    slug: s.slug,
    direccion: s.address,
    google_maps_url: s.googleMapsUrl,
    waze_url: s.wazeUrl,
    whatsapp_numero: SEDE_WHATSAPP_MAP[s.slug] || '51987654321',
    imagen_portada_url: '',
    orden: idx + 1,
    activo: true,
  }));
}

export function getFallbackDbHabitaciones(): DbHabitacion[] {
  return ROOMS.map((r, idx) => ({
    id: r.id,
    sede_id: '11111111-1111-4111-8111-111111111101',
    nombre: r.title,
    slug: r.slug,
    descripcion: r.amenities.join(' • '),
    tarifa: r.priceNumeric,
    moneda: 'S/',
    portada_webp_url: '',
    etiqueta_promo: idx === 0 ? 'TOUR 360°' : null,
    orden: idx + 1,
    activo: true,
  }));
}

export function getFallbackDbServicios(): DbServicio[] {
  return SERVICES.map((s, idx) => ({
    id: s.id,
    sede_id: '11111111-1111-4111-8111-111111111101',
    nombre: s.title,
    slug: s.slug,
    descripcion: s.description,
    tarifa: Number(s.priceText.replace(/\D/g, '')) || 50,
    moneda: 'S/',
    portada_webp_url: '',
    etiqueta_promo: s.category,
    orden: idx + 1,
    activo: true,
  }));
}

export function getFallbackDbPromociones(): DbPromocion[] {
  return PROMOTIONS.map((p) => ({
    id: p.id,
    sede_id: '11111111-1111-4111-8111-111111111101',
    titulo: p.title,
    slug: p.slug,
    descripcion: p.includesList.join(' • '),
    precio_promo: Number(p.promoPrice.replace(/\D/g, '')) || 140,
    precio_regular: Number(p.oldPrice.replace(/\D/g, '')) || 190,
    imagen_webp_url: '',
    fecha_fin: '2026-12-31',
    activo: true,
  }));
}

async function getPrimarySceneCoverMap(entityIds: string[]): Promise<Record<string, string>> {
  if (!supabase || entityIds.length === 0) return {};
  const validIds = entityIds.filter(isValidUuid);
  if (validIds.length === 0) return {};

  try {
    const { data, error } = await supabase
      .from('escenas_360')
      .select('entidad_id, miniatura_webp_url, imagen_360_webp_url, es_principal, orden')
      .in('entidad_id', validIds)
      .order('es_principal', { ascending: false })
      .order('orden', { ascending: true });

    if (error || !data) return {};
    const map: Record<string, string> = {};
    for (const row of data as Array<{
      entidad_id: string;
      miniatura_webp_url: string;
      imagen_360_webp_url: string;
    }>) {
      if (!map[row.entidad_id]) {
        const cover = row.miniatura_webp_url || row.imagen_360_webp_url;
        if (cover) map[row.entidad_id] = cover;
      }
    }
    return map;
  } catch {
    return {};
  }
}

export async function fetchSedesFromDb(): Promise<DbSede[]> {
  if (!supabase) return getFallbackDbSedes();
  try {
    const { data, error } = await supabase
      .from('sedes')
      .select('*')
      .eq('activo', true)
      .order('orden', { ascending: true });
    if (error || !data || data.length === 0) return getFallbackDbSedes();
    const rows = data as DbSede[];
    const missingIds = rows.filter((r) => !r.imagen_portada_url).map((r) => r.id);
    if (missingIds.length > 0) {
      const coverMap = await getPrimarySceneCoverMap(missingIds);
      return rows.map((r) => ({
        ...r,
        imagen_portada_url: r.imagen_portada_url || coverMap[r.id] || '',
      }));
    }
    return rows;
  } catch {
    return getFallbackDbSedes();
  }
}

export async function fetchHabitacionesFromDb(sedeId?: string): Promise<DbHabitacion[]> {
  if (!supabase) return getFallbackDbHabitaciones();
  try {
    let query = supabase
      .from('habitaciones')
      .select('*')
      .eq('activo', true)
      .order('orden', { ascending: true });
    if (sedeId) query = query.eq('sede_id', sedeId);
    const { data, error } = await query;
    if (error || !data || data.length === 0) return getFallbackDbHabitaciones();
    const rows = data as DbHabitacion[];
    const missingIds = rows.filter((r) => !r.portada_webp_url).map((r) => r.id);
    if (missingIds.length > 0) {
      const coverMap = await getPrimarySceneCoverMap(missingIds);
      return rows.map((r) => ({
        ...r,
        portada_webp_url: r.portada_webp_url || coverMap[r.id] || '',
      }));
    }
    return rows;
  } catch {
    return getFallbackDbHabitaciones();
  }
}

export async function fetchServiciosFromDb(sedeId?: string): Promise<DbServicio[]> {
  if (!supabase) return getFallbackDbServicios();
  try {
    let query = supabase
      .from('servicios')
      .select('*')
      .eq('activo', true)
      .order('orden', { ascending: true });
    if (sedeId) query = query.eq('sede_id', sedeId);
    const { data, error } = await query;
    if (error || !data || data.length === 0) return getFallbackDbServicios();
    const rows = data as DbServicio[];
    const missingIds = rows.filter((r) => !r.portada_webp_url).map((r) => r.id);
    if (missingIds.length > 0) {
      const coverMap = await getPrimarySceneCoverMap(missingIds);
      return rows.map((r) => ({
        ...r,
        portada_webp_url: r.portada_webp_url || coverMap[r.id] || '',
      }));
    }
    return rows;
  } catch {
    return getFallbackDbServicios();
  }
}

export async function fetchPromocionesFromDb(sedeId?: string): Promise<DbPromocion[]> {
  if (!supabase) return getFallbackDbPromociones();
  try {
    let query = supabase.from('promociones').select('*').eq('activo', true);
    if (sedeId) query = query.eq('sede_id', sedeId);
    const { data, error } = await query;
    if (error || !data || data.length === 0) return getFallbackDbPromociones();
    const rows = data as DbPromocion[];
    const missingIds = rows.filter((r) => !r.imagen_webp_url).map((r) => r.id);
    if (missingIds.length > 0) {
      const coverMap = await getPrimarySceneCoverMap(missingIds);
      return rows.map((r) => ({
        ...r,
        imagen_webp_url: r.imagen_webp_url || coverMap[r.id] || '',
      }));
    }
    return rows;
  } catch {
    return getFallbackDbPromociones();
  }
}

export async function fetchHeroSlidesFromDb(): Promise<DbHeroSlide[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('hero_slides')
      .select('*')
      .eq('activo', true)
      .order('orden', { ascending: true });
    if (error || !data) return [];
    return data as DbHeroSlide[];
  } catch {
    return [];
  }
}

export async function updateParentEntityCover(
  category: 'habitaciones' | 'servicios' | 'sedes' | 'promociones',
  entityUuid: string,
  coverUrl: string
): Promise<string | null> {
  if (!supabase || !isValidUuid(entityUuid)) return 'Supabase no configurado o UUID inválido';
  try {
    let errorMsg: string | null = null;
    if (category === 'habitaciones') {
      const { error } = await supabase
        .from('habitaciones')
        .update({ portada_webp_url: coverUrl })
        .eq('id', entityUuid);
      if (error) errorMsg = error.message;
    } else if (category === 'servicios') {
      const { error } = await supabase
        .from('servicios')
        .update({ portada_webp_url: coverUrl })
        .eq('id', entityUuid);
      if (error) errorMsg = error.message;
    } else if (category === 'sedes') {
      const { error } = await supabase
        .from('sedes')
        .update({ imagen_portada_url: coverUrl })
        .eq('id', entityUuid);
      if (error) errorMsg = error.message;
    } else if (category === 'promociones') {
      const { error } = await supabase
        .from('promociones')
        .update({ imagen_webp_url: coverUrl })
        .eq('id', entityUuid);
      if (error) errorMsg = error.message;
    }
    return errorMsg;
  } catch (e) {
    return e instanceof Error ? e.message : 'Error actualizando portada';
  }
}

export async function fetchEscenas360ForEntity(
  _entidadTipo: 'habitacion' | 'servicio',
  entidadIdOrSlug: string,
  defaultScenes: Scene360[]
): Promise<Scene360[]> {
  if (!supabase) return defaultScenes;
  const targetUuid = resolveEntityUuid(entidadIdOrSlug);
  if (!isValidUuid(targetUuid)) return defaultScenes;

  try {
    const { data: escenasData, error: escError } = await supabase
      .from('escenas_360')
      .select('*')
      .eq('entidad_id', targetUuid)
      .order('orden', { ascending: true })
      .limit(8);

    if (escError || !escenasData || escenasData.length === 0) {
      return defaultScenes;
    }

    const escenaIds = (escenasData as DbEscena360[]).map((e) => e.id);
    const { data: hotspotsData } = await supabase
      .from('hotspots')
      .select('*')
      .in('escena_id', escenaIds);

    const dbHotspots = (hotspotsData || []) as DbHotspot[];

    return (escenasData as DbEscena360[]).map((esc) => {
      const hsForScene: Hotspot360[] = dbHotspots
        .filter((h) => h.escena_id === esc.id)
        .map((h) => ({
          id: h.id,
          type: h.tipo === 'navegacion' ? 'nav' : 'info',
          label: h.titulo,
          adminLabel: h.titulo,
          description: h.descripcion || undefined,
          targetSceneId: h.escena_destino_id || undefined,
          imagenDetalleUrl: h.imagen_detalle_url || undefined,
          precioAdicional: h.precio_adicional ?? undefined,
          x: 50,
          y: 50,
          pitch: Number(h.pitch) || 0,
          yaw: Number(h.yaw) || 0,
        }));

      return {
        id: esc.id,
        title: esc.titulo,
        adminTitle: esc.titulo,
        isPrimary: esc.es_principal,
        isEquirectangular: true,
        initialPitch: typeof esc.pitch_inicial === 'number' ? esc.pitch_inicial : Number(esc.pitch_inicial) || 0,
        initialYaw: typeof esc.yaw_inicial === 'number' ? esc.yaw_inicial : Number(esc.yaw_inicial) || 0,
        fileSizeWebP: 'WebP R2',
        panoramaUrl: resolveMediaUrl(esc.imagen_360_webp_url),
        thumbUrl: resolveMediaUrl(esc.miniatura_webp_url || esc.imagen_360_webp_url),
        hotspots: hsForScene,
      };
    });
  } catch {
    return defaultScenes;
  }
}

import React, { useEffect, useState } from 'react';
import { Map, Navigation, ExternalLink } from 'lucide-react';
import Navbar from './Navbar';
import TourViewer360 from './TourViewer360';
import LocationBookingCard from './LocationBookingCard';
import RoomsCatalogGrid from './RoomsCatalogGrid';
import {
  ROOMS,
  SERVICES,
  SEDES,
  PROMOTIONS,
  type Scene360,
} from '../data/hotelData';
import {
  supabase,
  fetchEscenas360ForEntity,
  resolveMediaUrl,
  type DbSede,
  type DbHabitacion,
  type DbServicio,
  type DbPromocion,
} from '../lib/supabase';

export type PublicEntityCategory = 'habitaciones' | 'servicios' | 'sedes' | 'promociones';

interface ResolvedEntity {
  category: PublicEntityCategory;
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  priceLabel: string;
  oldPriceLabel?: string;
  backHref: string;
  backLabel: string;
  sedeName: string;
  sedeSlug: string;
  address: string;
  googleMapsUrl: string;
  wazeUrl: string;
  scheduleInfo?: string;
  ambientImage: string;
  bulletsTitle: string;
  bullets: string[];
  secondarySubtitle?: string;
  scenes: Scene360[];
}

function parseBullets(text?: string | null, fallback: string[] = []): string[] {
  if (!text) return fallback;
  const parts = text
    .split(/\n|•|·/)
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : fallback;
}

function resolveRouteFromLocation(): { category: PublicEntityCategory; slug: string } | null {
  if (typeof window === 'undefined') return null;
  const path = window.location.pathname.replace(/\/+$/, '');
  const match = path.match(/^\/(habitaciones|servicios|sedes|promociones)\/([^/]+)$/);
  if (match) {
    const category = match[1] as PublicEntityCategory;
    const rawSlug = decodeURIComponent(match[2]);
    if (rawSlug !== 'ver') {
      return { category, slug: rawSlug };
    }
    const qsSlug = new URLSearchParams(window.location.search).get('slug');
    if (qsSlug) return { category, slug: qsSlug };
  }
  return null;
}

function resolveBackNav(defaultHref: string, defaultLabel: string): { backHref: string; backLabel: string } {
  if (typeof window === 'undefined') return { backHref: defaultHref, backLabel: defaultLabel };
  const fromParam = new URLSearchParams(window.location.search).get('from');
  let originPath = fromParam && fromParam.startsWith('/') ? fromParam : '';

  if (!originPath && document.referrer) {
    try {
      const refUrl = new URL(document.referrer);
      if (refUrl.origin === window.location.origin) {
        originPath = refUrl.pathname;
      }
    } catch {
      // ignore invalid referrer
    }
  }

  if (originPath.startsWith('/sedes/')) {
    return { backHref: originPath, backLabel: 'Volver a la sede' };
  }
  if (originPath === '/habitaciones') {
    return { backHref: '/habitaciones', backLabel: 'Volver a habitaciones' };
  }
  if (originPath === '/servicios') {
    return { backHref: '/servicios', backLabel: 'Volver a servicios' };
  }
  if (originPath === '/promociones') {
    return { backHref: '/promociones', backLabel: 'Volver a promociones' };
  }
  if (originPath === '/sedes') {
    return { backHref: '/sedes', backLabel: 'Volver a sedes' };
  }
  return { backHref: defaultHref, backLabel: defaultLabel };
}

async function loadSedeById(sedeId?: string | null): Promise<DbSede | null> {
  if (!supabase || !sedeId) return null;
  const { data } = await supabase.from('sedes').select('*').eq('id', sedeId).maybeSingle();
  return (data as DbSede | null) || null;
}

export default function PublicEntityDetail({
  initialCategory,
  initialSlug,
}: {
  initialCategory?: PublicEntityCategory;
  initialSlug?: string;
}) {
  const [entity, setEntity] = useState<ResolvedEntity | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const route =
        initialCategory && initialSlug
          ? { category: initialCategory, slug: initialSlug }
          : resolveRouteFromLocation();

      if (!route) {
        if (active) {
          setNotFound(true);
          setLoading(false);
        }
        return;
      }

      const { category, slug } = route;

      try {
        if (category === 'habitaciones') {
          const staticRoom = ROOMS.find((r) => r.slug === slug);
          let dbRoom: DbHabitacion | null = null;
          if (supabase) {
            const { data } = await supabase
              .from('habitaciones')
              .select('*')
              .eq('slug', slug)
              .maybeSingle();
            dbRoom = (data as DbHabitacion | null) || null;
          }

          if (dbRoom) {
            const dbSede = await loadSedeById(dbRoom.sede_id);
            const scenes = await fetchEscenas360ForEntity(
              'habitacion',
              dbRoom.id,
              staticRoom?.scenes || []
            );
            const cover =
              resolveMediaUrl(dbRoom.portada_webp_url) ||
              scenes[0]?.thumbUrl ||
              scenes[0]?.panoramaUrl ||
              staticRoom?.ambientImage ||
              '';
            const priceLabel = `${dbRoom.moneda || 'S/'} ${dbRoom.tarifa}`;
            const sedeName = dbSede?.nombre || staticRoom?.sedeName || 'Sede Surco';

            if (active) {
              const navBack = resolveBackNav('/habitaciones', 'Volver a habitaciones');
              document.title = `${dbRoom.nombre} — ${sedeName} | Tour 360° Hotel Xnox`;
              setEntity({
                category,
                id: dbRoom.id,
                slug: dbRoom.slug,
                title: dbRoom.nombre,
                subtitle: sedeName,
                priceLabel,
                backHref: navBack.backHref,
                backLabel: navBack.backLabel,
                sedeName,
                sedeSlug: dbSede?.slug || 'surco',
                address: dbSede?.direccion || 'Av. Benavides 4510, Santiago de Surco',
                googleMapsUrl:
                  dbSede?.google_maps_url ||
                  'https://maps.google.com/?q=Av.+Benavides+4510+Surco+Lima',
                wazeUrl: dbSede?.waze_url || 'https://waze.com/ul?q=Av.%20Benavides%204510%20Surco',
                ambientImage: cover,
                bulletsTitle: 'Detalles y comodidades:',
                bullets: parseBullets(dbRoom.descripcion, staticRoom?.amenities || []),
                scenes,
              });
              setLoading(false);
            }
            return;
          }

          if (staticRoom && active) {
            const navBack = resolveBackNav('/habitaciones', 'Volver a habitaciones');
            const staticSede = SEDES.find((s) => s.slug === staticRoom.sedeSlug);
            const scenes = await fetchEscenas360ForEntity(
              'habitacion',
              staticRoom.slug,
              staticRoom.scenes
            );
            setEntity({
              category,
              id: staticRoom.id,
              slug: staticRoom.slug,
              title: staticRoom.title,
              subtitle: staticRoom.sedeName,
              priceLabel: `${staticRoom.priceText} (${staticRoom.durationText})`,
              backHref: navBack.backHref,
              backLabel: navBack.backLabel,
              sedeName: staticRoom.sedeName,
              sedeSlug: staticRoom.sedeSlug,
              address: staticRoom.address,
              googleMapsUrl:
                staticSede?.googleMapsUrl ||
                'https://maps.google.com/?q=Av.+Benavides+4510+Surco+Lima',
              wazeUrl:
                staticSede?.wazeUrl || 'https://waze.com/ul?q=Av.%20Benavides%204510%20Surco',
              ambientImage: staticRoom.ambientImage,
              bulletsTitle: 'Detalles y comodidades:',
              bullets: staticRoom.amenities,
              scenes,
            });
            setLoading(false);
            return;
          }
        }

        if (category === 'servicios') {
          let dbServ: DbServicio | null = null;
          if (supabase) {
            const { data } = await supabase
              .from('servicios')
              .select('*')
              .eq('slug', slug)
              .maybeSingle();
            dbServ = (data as DbServicio | null) || null;
          }

          if (dbServ) {
            const dbSede = await loadSedeById(dbServ.sede_id);
            const fallbackServ = SERVICES.find((s) => s.slug === slug);
            const scenes = await fetchEscenas360ForEntity(
              'servicio',
              dbServ.id,
              fallbackServ?.scenes || []
            );
            const sedeName = dbSede?.nombre || 'Sede Surco';
            const priceLabel = `Adicional: ${dbServ.moneda || 'S/'} ${dbServ.tarifa}`;

            if (active) {
              document.title = `${dbServ.nombre} — Servicios 360° | Hotel Xnox`;
              setEntity({
                category,
                id: dbServ.id,
                slug: dbServ.slug,
                title: dbServ.nombre,
                subtitle: dbServ.etiqueta_promo || 'Servicio Exclusivo',
                priceLabel,
                backHref: '/servicios',
                backLabel: 'Volver a servicios',
                sedeName,
                sedeSlug: dbSede?.slug || 'surco',
                address: dbSede?.direccion || 'Av. Benavides 4510, Santiago de Surco',
                googleMapsUrl:
                  dbSede?.google_maps_url ||
                  'https://maps.google.com/?q=Av.+Benavides+4510+Surco+Lima',
                wazeUrl: dbSede?.waze_url || 'https://waze.com/ul?q=Av.%20Benavides%204510%20Surco',
                ambientImage: resolveMediaUrl(dbServ.portada_webp_url),
                bulletsTitle: 'Equipamiento incluido:',
                bullets: parseBullets(dbServ.descripcion, fallbackServ?.amenities || []),
                scenes,
              });
              setLoading(false);
            }
            return;
          }

          const staticServ = SERVICES.find((s) => s.slug === slug);
          if (staticServ && active) {
            const scenes = await fetchEscenas360ForEntity(
              'servicio',
              staticServ.slug,
              staticServ.scenes
            );
            setEntity({
              category,
              id: staticServ.id,
              slug: staticServ.slug,
              title: staticServ.title,
              subtitle: staticServ.category,
              priceLabel: staticServ.topBarPriceText,
              backHref: '/servicios',
              backLabel: 'Volver a servicios',
              sedeName: 'Sede Surco',
              sedeSlug: 'surco',
              address: staticServ.address,
              googleMapsUrl: 'https://maps.google.com/?q=Av.+Benavides+4510+Surco+Lima',
              wazeUrl: 'https://waze.com/ul?q=Av.%20Benavides%204510%20Surco',
              ambientImage: '',
              bulletsTitle: staticServ.amenitiesTitle,
              bullets: staticServ.amenities,
              scenes,
            });
            setLoading(false);
            return;
          }
        }

        if (category === 'promociones') {
          let dbPromo: DbPromocion | null = null;
          if (supabase) {
            const { data } = await supabase
              .from('promociones')
              .select('*')
              .eq('slug', slug)
              .maybeSingle();
            dbPromo = (data as DbPromocion | null) || null;
          }

          if (dbPromo) {
            const dbSede = await loadSedeById(dbPromo.sede_id);
            const fallbackPromo = PROMOTIONS.find((p) => p.slug === slug);
            const scenes = await fetchEscenas360ForEntity(
              'servicio',
              dbPromo.id,
              fallbackPromo?.scenes || []
            );
            const sedeName = dbSede?.nombre || 'Sede Surco';

            if (active) {
              document.title = `${dbPromo.titulo} — Promoción Especial 360° | Hotel Xnox`;
              setEntity({
                category,
                id: dbPromo.id,
                slug: dbPromo.slug,
                title: dbPromo.titulo,
                subtitle: sedeName,
                priceLabel: `S/ ${dbPromo.precio_promo}`,
                oldPriceLabel: `Antes S/ ${dbPromo.precio_regular}`,
                backHref: '/promociones',
                backLabel: 'Volver a promociones',
                sedeName,
                sedeSlug: dbSede?.slug || 'surco',
                address: dbSede?.direccion || 'Av. Benavides 4510, Santiago de Surco',
                googleMapsUrl:
                  dbSede?.google_maps_url ||
                  'https://maps.google.com/?q=Av.+Benavides+4510+Surco+Lima',
                wazeUrl: dbSede?.waze_url || 'https://waze.com/ul?q=Av.%20Benavides%204510%20Surco',
                ambientImage: resolveMediaUrl(dbPromo.imagen_webp_url),
                bulletsTitle: 'Que incluye:',
                bullets: parseBullets(dbPromo.descripcion, fallbackPromo?.includesList || []),
                secondarySubtitle: `Válido hasta: ${dbPromo.fecha_fin || '2026-12-31'}`,
                scenes,
              });
              setLoading(false);
            }
            return;
          }

          const staticPromo = PROMOTIONS.find((p) => p.slug === slug);
          if (staticPromo && active) {
            const scenes = await fetchEscenas360ForEntity(
              'servicio',
              staticPromo.id,
              staticPromo.scenes
            );
            setEntity({
              category,
              id: staticPromo.id,
              slug: staticPromo.slug,
              title: staticPromo.title,
              subtitle: 'Sede Surco',
              priceLabel: staticPromo.promoPrice,
              oldPriceLabel: `Antes ${staticPromo.oldPrice}`,
              backHref: '/promociones',
              backLabel: 'Volver a promociones',
              sedeName: 'Sede Surco',
              sedeSlug: 'surco',
              address: staticPromo.availabilityTitle,
              googleMapsUrl: 'https://maps.google.com/?q=Av.+Benavides+4510+Surco+Lima',
              wazeUrl: 'https://waze.com/ul?q=Av.%20Benavides%204510%20Surco',
              ambientImage: '',
              bulletsTitle: 'Que incluye:',
              bullets: staticPromo.includesList,
              secondarySubtitle: `Válido hasta: ${staticPromo.validUntil}`,
              scenes,
            });
            setLoading(false);
            return;
          }
        }

        if (category === 'sedes') {
          let dbSede: DbSede | null = null;
          if (supabase) {
            const { data } = await supabase
              .from('sedes')
              .select('*')
              .eq('slug', slug)
              .maybeSingle();
            dbSede = (data as DbSede | null) || null;
          }

          if (dbSede) {
            const fallbackSede = SEDES.find((s) => s.slug === slug);
            const scenes = await fetchEscenas360ForEntity('habitacion', dbSede.id, []);
            if (active) {
              document.title = `${dbSede.nombre} — Habitaciones y Tour 360° | Hotel Xnox`;
              setEntity({
                category,
                id: dbSede.id,
                slug: dbSede.slug,
                title: dbSede.nombre,
                subtitle: fallbackSede?.tagline || dbSede.direccion,
                priceLabel: 'S/ 180 (4 Horas)',
                backHref: '/sedes',
                backLabel: 'Volver a sedes',
                sedeName: dbSede.nombre,
                sedeSlug: dbSede.slug,
                address: dbSede.direccion,
                googleMapsUrl: dbSede.google_maps_url || 'https://maps.google.com',
                wazeUrl: dbSede.waze_url || 'https://waze.com',
                scheduleInfo: fallbackSede?.scheduleInfo || 'Atención 24/7 • Estacionamiento Privado',
                ambientImage: resolveMediaUrl(dbSede.imagen_portada_url),
                bulletsTitle: '',
                bullets: [],
                scenes,
              });
              setLoading(false);
            }
            return;
          }

          const staticSede = SEDES.find((s) => s.slug === slug);
          if (staticSede && active) {
            const scenes = await fetchEscenas360ForEntity('habitacion', staticSede.id, []);
            setEntity({
              category,
              id: staticSede.id,
              slug: staticSede.slug,
              title: staticSede.name,
              subtitle: staticSede.tagline,
              priceLabel: 'S/ 180 (4 Horas)',
              backHref: '/sedes',
              backLabel: 'Volver a sedes',
              sedeName: staticSede.name,
              sedeSlug: staticSede.slug,
              address: staticSede.address,
              googleMapsUrl: staticSede.googleMapsUrl,
              wazeUrl: staticSede.wazeUrl,
              scheduleInfo: staticSede.scheduleInfo,
              ambientImage: '',
              bulletsTitle: '',
              bullets: [],
              scenes,
            });
            setLoading(false);
            return;
          }
        }

        if (active) {
          setNotFound(true);
          setLoading(false);
        }
      } catch {
        if (active) {
          setNotFound(true);
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [initialCategory, initialSlug]);

  if (loading) {
    const isSedeRoute =
      initialCategory === 'sedes' ||
      (typeof window !== 'undefined' && window.location.pathname.startsWith('/sedes/'));
    return (
      <div className="min-h-screen bg-[#09090B] pb-16 animate-pulse">
        <div className="fixed top-3 inset-x-0 z-50 w-full px-3 md:px-5">
          <div
            className="w-full rounded-2xl px-4 md:px-8 py-3.5 flex items-center justify-between gap-4 border border-white/15"
            style={{ background: 'rgba(24, 24, 30, 0.72)', backdropFilter: 'blur(18px)' }}
          >
            <div className="h-8 w-28 sm:w-36 rounded-full bg-white/10" />
            <div className="hidden md:block h-6 w-56 rounded-full bg-white/10" />
            <div className="flex items-center gap-3">
              <div className="h-6 w-20 rounded-full bg-white/10" />
              <div className="h-9 w-28 sm:w-36 rounded-full bg-white/15" />
            </div>
          </div>
        </div>

        <main className="mx-auto w-full max-w-[1400px] px-4 md:px-6 pt-30 sm:pt-26 md:pt-24">
          {isSedeRoute && (
            <div className="mx-auto max-w-[1260px] flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
              <div className="space-y-3">
                <div className="h-10 sm:h-12 w-64 rounded-2xl bg-white/10" />
                <div className="h-5 w-80 max-w-full rounded-full bg-white/5" />
              </div>
              <div className="h-28 w-full max-w-[390px] rounded-[22px] bg-white/5 border border-white/10" />
            </div>
          )}

          <div
            className={`w-full ${
              isSedeRoute
                ? 'h-[260px] sm:h-[310px] md:h-[340px]'
                : 'h-[300px] sm:h-[420px] md:h-[520px] xl:h-[580px]'
            } rounded-[24px] border border-[#27272A] bg-[#121216] flex flex-col items-center justify-center gap-3`}
          >
            <div className="w-10 h-10 rounded-full border-2 border-pink-500/40 border-t-pink-500 animate-spin" />
            <div className="h-3.5 w-40 rounded-full bg-white/10" />
          </div>

          <div className="mt-4 flex items-center gap-2 sm:gap-3 max-w-[1260px] mx-auto overflow-hidden">
            <div className="shrink-0 w-[calc((100%-16px)/3)] sm:w-[calc((100%-36px)/4)] md:w-[calc((100%-60px)/6)] h-14 sm:h-20 md:h-24 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10" />
            <div className="shrink-0 w-[calc((100%-16px)/3)] sm:w-[calc((100%-36px)/4)] md:w-[calc((100%-60px)/6)] h-14 sm:h-20 md:h-24 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10" />
            <div className="shrink-0 w-[calc((100%-16px)/3)] sm:w-[calc((100%-36px)/4)] md:w-[calc((100%-60px)/6)] h-14 sm:h-20 md:h-24 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10" />
            <div className="hidden sm:block shrink-0 w-[calc((100%-36px)/4)] md:w-[calc((100%-60px)/6)] h-20 md:h-24 rounded-2xl bg-white/5 border border-white/10" />
          </div>

          <div className="mt-8 mx-auto max-w-[1260px] grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 space-y-3">
              <div className="h-8 sm:h-10 w-72 max-w-full rounded-2xl bg-white/10" />
              <div className="h-4 w-44 rounded-full bg-white/5" />
              <div className="pt-2 space-y-2.5">
                <div className="h-4 w-3/4 rounded-full bg-white/5" />
                <div className="h-4 w-2/3 rounded-full bg-white/5" />
                <div className="h-4 w-1/2 rounded-full bg-white/5" />
              </div>
            </div>
            <div className="lg:col-span-5 flex lg:justify-end">
              <div className="w-full max-w-[390px] h-44 rounded-[22px] bg-white/5 border border-white/10" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (notFound || !entity) {
    return (
      <div className="min-h-screen bg-[#09090B] text-white flex flex-col items-center justify-center px-6 text-center">
        <Navbar activeNav="home" />
        <p className="text-xs uppercase tracking-[0.22em] text-[#A1A1AA]">404</p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-normal tracking-tight text-[#FAFAFA]">
          Espacio no encontrado
        </h1>
        <p className="mt-3 text-sm text-[#A1A1AA] max-w-md">
          No encontramos este recorrido en el catálogo actual. Puedes volver al inicio o explorar nuestras habitaciones 360°.
        </p>
        <a
          href="/habitaciones"
          className="mt-6 rounded-full bg-white text-[#09090B] px-6 py-2.5 text-sm font-semibold hover:bg-white/90 transition"
        >
          Ver Habitaciones 360°
        </a>
      </div>
    );
  }

  if (entity.category === 'sedes') {
    return (
      <div className="min-h-screen bg-[#09090B] pb-16">
        <div className="pt-3">
          <Navbar
            variant="sede-detail"
            activeNav="sedes"
            backHref="/sedes"
            backLabel="Volver a sedes"
            whatsappSede={entity.sedeName}
            whatsappItem="Suite Neón Jacuzzi"
            whatsappPrice={entity.priceLabel}
          />
        </div>

        <main className="mx-auto w-full max-w-[1400px] px-4 md:px-6 pt-28 sm:pt-28 md:pt-28">
          <div className="mx-auto max-w-[1260px] flex flex-col lg:flex-row lg:items-center justify-between gap-3 lg:gap-6 mb-5">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-normal tracking-tight text-[#FAFAFA] leading-tight">
                {entity.title}
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-[#A1A1AA] truncate">
                {entity.address || entity.subtitle}
                {entity.scheduleInfo ? ` • ${entity.scheduleInfo}` : ''}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/[0.06] border border-white/12 text-xs text-[#D4D4D8]">
                <Map className="w-3.5 h-3.5 text-[#A1A1AA] shrink-0" />
                <a
                  href={entity.googleMapsUrl || 'https://maps.google.com/?q=Av.+Benavides+4510+Surco+Lima'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white underline underline-offset-3 transition-colors"
                >
                  Google Maps
                </a>
                <span className="text-white/40">•</span>
                <a
                  href={entity.wazeUrl || 'https://waze.com/ul?q=Av.%20Benavides%204510%20Surco'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white underline underline-offset-3 transition-colors"
                >
                  Waze
                </a>
              </div>
            </div>
          </div>

          <TourViewer360
            entityKey={`sedes:${entity.slug}`}
            entidadTipo="habitacion"
            entidadId={entity.id}
            initialScenes={entity.scenes}
            skipInitialFetch={true}
            showThumbnails={true}
            heightClass="h-[260px] sm:h-[340px] md:h-[480px] lg:h-[540px] xl:h-[600px]"
          />

          <section className="mx-auto max-w-[1260px] mt-8">
            <h2 className="text-xl sm:text-2xl md:text-[26px] font-normal text-[#FAFAFA] mb-4">
              Habitaciones en {entity.title}
            </h2>
            <RoomsCatalogGrid
              sedeId={entity.id}
              sedeSlug={entity.slug}
              cardHeightClass="h-[230px] sm:h-[245px]"
            />
          </section>

          <section className="mx-auto max-w-[1260px] mt-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-xl sm:text-2xl md:text-[26px] font-normal text-[#FAFAFA]">
                  Ubicación de {entity.title}
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-[#A1A1AA]">
                  {entity.address || entity.subtitle}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <a
                  href={entity.wazeUrl || `https://waze.com/ul?q=${encodeURIComponent(entity.address || entity.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-full bg-white text-[#09090B] font-semibold text-xs sm:text-sm inline-flex items-center gap-2 hover:bg-neutral-200 transition-all shadow-md"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Abrir en Waze</span>
                </a>
                <a
                  href={entity.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(entity.address || entity.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-full bg-white/[0.08] hover:bg-white/15 border border-white/15 text-xs sm:text-sm text-[#FAFAFA] inline-flex items-center gap-2 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Google Maps</span>
                </a>
              </div>
            </div>

            {(() => {
              let mapQuery = entity.address || entity.subtitle || entity.title;
              if (entity.googleMapsUrl) {
                try {
                  const parsed = new URL(entity.googleMapsUrl);
                  const qParam = parsed.searchParams.get('q') || parsed.searchParams.get('query');
                  if (qParam) mapQuery = qParam;
                } catch {
                  // fallback to address
                }
              }
              const embedSrc = `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=16&output=embed`;
              return (
                <div className="rounded-[24px] overflow-hidden border border-white/12 bg-[#121215]">
                  <iframe
                    title={`Mapa ${entity.title}`}
                    src={embedSrc}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="w-full h-[300px] sm:h-[360px] md:h-[400px] border-0"
                  />
                </div>
              );
            })()}
          </section>
        </main>
      </div>
    );
  }

  const entidadTipo = entity.category === 'habitaciones' ? 'habitacion' : 'servicio';

  return (
    <div className="min-h-screen bg-[#09090B] pb-16">
      <div className="pt-3">
        <Navbar
          variant="entity-detail"
          backHref={entity.backHref}
          backLabel={entity.backLabel}
          detailTitle={
            entity.category === 'habitaciones' ? `${entity.title} — ${entity.sedeName}` : entity.title
          }
          priceLabel={entity.priceLabel}
          oldPriceLabel={entity.oldPriceLabel}
          whatsappSede={entity.sedeName}
          whatsappItem={
            entity.category === 'promociones' ? `Promo: ${entity.title}` : entity.title
          }
          whatsappPrice={entity.priceLabel}
        />
      </div>

      <main className="mx-auto w-full max-w-[1400px] px-4 md:px-6 pt-30 sm:pt-26 md:pt-24">
        <TourViewer360
          entityKey={`${entity.category}:${entity.slug}`}
          entidadTipo={entidadTipo}
          entidadId={entity.id}
          initialScenes={entity.scenes}
          skipInitialFetch={true}
          showThumbnails={true}
          showCarouselArrows={entity.category === 'promociones'}
        />

        <div className="relative mt-8 mx-auto max-w-[1260px] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {entity.ambientImage && entity.category === 'habitaciones' && (
            <div className="pointer-events-none hidden lg:block absolute inset-y-0 left-1/3 right-1/3 overflow-hidden opacity-35">
              <img
                src={entity.ambientImage}
                alt=""
                className="w-full h-full object-cover rounded-3xl"
                style={{
                  maskImage: 'radial-gradient(circle at center, black 25%, transparent 75%)',
                  WebkitMaskImage: 'radial-gradient(circle at center, black 25%, transparent 75%)',
                }}
              />
            </div>
          )}

          <div className="lg:col-span-7 relative z-10">
            <h2 className="text-2xl sm:text-3xl md:text-[38px] font-normal tracking-tight text-[#FAFAFA]">
              {entity.title}
            </h2>
            {entity.bulletsTitle && (
              <p className="mt-2 text-sm md:text-base text-[#A1A1AA]">{entity.bulletsTitle}</p>
            )}
            {entity.bullets.length > 0 && (
              <ul className="mt-3 space-y-2.5 text-sm sm:text-base md:text-[17px] text-[#D4D4D8]">
                {entity.bullets.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="lg:col-span-5 flex lg:justify-end relative z-10">
            <LocationBookingCard
              primaryTitle={
                entity.category === 'habitaciones'
                  ? `Disponible en ${entity.sedeName}`
                  : entity.sedeName
              }
              secondarySubtitle={entity.secondarySubtitle || entity.address}
              googleMapsUrl={entity.googleMapsUrl}
              wazeUrl={entity.wazeUrl}
              whatsappSede={entity.sedeName}
              whatsappItem={
                entity.category === 'promociones' ? `Promo: ${entity.title}` : entity.title
              }
              whatsappPrice={entity.priceLabel}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

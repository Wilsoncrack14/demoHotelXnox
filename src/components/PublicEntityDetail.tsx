import React, { useEffect, useState } from 'react';
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
            const fallbackRoom = ROOMS.find((r) => r.slug === slug);
            const scenes = await fetchEscenas360ForEntity(
              'habitacion',
              dbRoom.id,
              fallbackRoom?.scenes || []
            );
            const cover =
              resolveMediaUrl(dbRoom.portada_webp_url) ||
              scenes[0]?.thumbUrl ||
              scenes[0]?.panoramaUrl ||
              fallbackRoom?.ambientImage ||
              '';
            const priceLabel = `${dbRoom.moneda || 'S/'} ${dbRoom.tarifa}`;
            const sedeName = dbSede?.nombre || fallbackRoom?.sedeName || 'Sede Surco';

            if (active) {
              document.title = `${dbRoom.nombre} — ${sedeName} | Tour 360° Hotel Xnox`;
              setEntity({
                category,
                id: dbRoom.id,
                slug: dbRoom.slug,
                title: dbRoom.nombre,
                subtitle: sedeName,
                priceLabel,
                backHref: dbSede?.slug ? `/sedes/${dbSede.slug}` : '/habitaciones',
                backLabel: 'Volver al catálogo',
                sedeName,
                sedeSlug: dbSede?.slug || 'surco',
                address: dbSede?.direccion || 'Av. Benavides 4510, Santiago de Surco',
                googleMapsUrl:
                  dbSede?.google_maps_url ||
                  'https://maps.google.com/?q=Av.+Benavides+4510+Surco+Lima',
                wazeUrl: dbSede?.waze_url || 'https://waze.com/ul?q=Av.%20Benavides%204510%20Surco',
                ambientImage: cover,
                bulletsTitle: 'Detalles y comodidades:',
                bullets: parseBullets(dbRoom.descripcion, fallbackRoom?.amenities || []),
                scenes,
              });
              setLoading(false);
            }
            return;
          }

          const staticRoom = ROOMS.find((r) => r.slug === slug);
          if (staticRoom && active) {
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
              backHref: `/sedes/${staticRoom.sedeSlug}`,
              backLabel: 'Volver al catálogo',
              sedeName: staticRoom.sedeName,
              sedeSlug: staticRoom.sedeSlug,
              address: staticRoom.address,
              googleMapsUrl: staticRoom.googleMapsUrl,
              wazeUrl: staticRoom.wazeUrl,
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
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center px-6">
        <div className="w-full max-w-[1400px] space-y-6 animate-pulse">
          <div className="h-12 w-64 rounded-full bg-white/10" />
          <div className="h-[460px] w-full rounded-[24px] bg-white/5 border border-white/10" />
        </div>
      </div>
    );
  }

  if (notFound || !entity) {
    return (
      <div className="min-h-screen bg-[#09090B] text-white flex flex-col items-center justify-center px-6 text-center">
        <Navbar activeNav="inicio" />
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

        <main className="mx-auto w-full max-w-[1400px] px-4 md:px-6 pt-24 md:pt-26">
          <div className="mx-auto max-w-[1260px] flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
            <div>
              <h1 className="text-4xl sm:text-5xl md:text-[54px] font-normal tracking-tight text-[#FAFAFA] leading-none">
                {entity.title}
              </h1>
              <p className="mt-3 text-base md:text-[19px] text-[#A1A1AA]">{entity.subtitle}</p>
              {entity.scheduleInfo && (
                <p className="mt-2.5 text-sm md:text-base text-[#E4E4E7]">{entity.scheduleInfo}</p>
              )}
            </div>

            <div className="flex lg:justify-end">
              <LocationBookingCard
                compact={true}
                primaryTitle={entity.address}
                googleMapsUrl={entity.googleMapsUrl}
                wazeUrl={entity.wazeUrl}
                whatsappSede={entity.sedeName}
                whatsappItem="Suite Neón Jacuzzi"
                whatsappPrice={entity.priceLabel}
              />
            </div>
          </div>

          <TourViewer360
            entityKey={`sedes:${entity.slug}`}
            entidadTipo="habitacion"
            entidadId={entity.id}
            initialScenes={entity.scenes}
            showThumbnails={true}
            heightClass="h-[260px] sm:h-[310px] md:h-[340px]"
          />

          <section className="mx-auto max-w-[1260px] mt-8">
            <h2 className="text-xl sm:text-2xl md:text-[26px] font-normal text-[#FAFAFA] mb-4">
              Habitaciones en {entity.title}
            </h2>
            <RoomsCatalogGrid sedeSlug={entity.slug} cardHeightClass="h-[230px] sm:h-[245px]" />
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

      <main className="mx-auto w-full max-w-[1400px] px-4 md:px-6 pt-22 md:pt-24">
        <TourViewer360
          entityKey={`${entity.category}:${entity.slug}`}
          entidadTipo={entidadTipo}
          entidadId={entity.id}
          initialScenes={entity.scenes}
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

import React, { useState, useEffect } from 'react';
import { RotateCw, ArrowRight } from 'lucide-react';
import { ROOMS, SEDES, EMPTY_PLACEHOLDER_IMG, type RoomItem } from '../data/hotelData';
import {
  fetchHabitacionesFromDb,
  fetchSedesFromDb,
  getCachedHabitaciones,
  getCachedSedes,
  prefetchEntityTour,
  resolveMediaUrl,
  type DbHabitacion,
  type DbSede,
} from '../lib/supabase';

function mapDbHabitaciones(
  dbRows: DbHabitacion[],
  sedes: DbSede[] | null,
  filterSedeId?: string,
  filterSedeSlug?: string
): RoomItem[] {
  const targetSede =
    (filterSedeId && sedes?.find((s) => s.id === filterSedeId)) ||
    (filterSedeSlug && sedes?.find((s) => s.slug === filterSedeSlug));

  const filteredRows =
    filterSedeId || filterSedeSlug
      ? targetSede
        ? dbRows.filter((row) => row.sede_id === targetSede.id)
        : dbRows.filter((row) => {
            const existing = ROOMS.find((r) => r.slug === row.slug);
            return existing ? existing.sedeSlug === filterSedeSlug : false;
          })
      : dbRows;

  return filteredRows.map((row) => {
    const existing = ROOMS.find((r) => r.slug === row.slug);
    const rowSede = sedes?.find((s) => s.id === row.sede_id);
    const cover = row.portada_webp_url
      ? resolveMediaUrl(row.portada_webp_url)
      : existing?.cardImage || EMPTY_PLACEHOLDER_IMG;
    if (existing) {
      return {
        ...existing,
        id: row.id,
        title: row.nombre || existing.title,
        sedeSlug: rowSede?.slug || existing.sedeSlug,
        sedeName: rowSede?.nombre || existing.sedeName,
        priceText: `${row.moneda || 'S/'} ${row.tarifa}`,
        priceNumeric: Number(row.tarifa),
        cardImage: cover,
        ambientImage: cover,
      };
    }
    return {
      id: row.id,
      slug: row.slug,
      title: row.nombre,
      sedeSlug: rowSede?.slug || filterSedeSlug || 'surco',
      sedeName: rowSede?.nombre || 'Sede Surco',
      address: rowSede?.direccion || 'Av. Benavides 4510, Surco',
      priceText: `${row.moneda || 'S/'} ${row.tarifa}`,
      priceNumeric: Number(row.tarifa),
      durationText: '4 Horas',
      cardImage: cover,
      ambientImage: cover,
      amenities: (row.descripcion || '').split('•').map((s) => s.trim()).filter(Boolean),
      scenes: [],
    };
  });
}

export default function RoomsCatalogGrid({
  sedeSlug,
  sedeId,
  showSedeFilter = false,
  cardHeightClass = 'h-[215px] sm:h-[250px] md:h-[290px] xl:h-[330px]',
}: {
  sedeSlug?: string;
  sedeId?: string;
  showSedeFilter?: boolean;
  cardHeightClass?: string;
}) {
  const [selectedSedeSlug, setSelectedSedeSlug] = useState<string>('todas');
  const [sedesList, setSedesList] = useState<Array<{ id: string; slug: string; nombre: string }>>(() => {
    const cachedSedes = getCachedSedes();
    if (cachedSedes && cachedSedes.length > 0) {
      return cachedSedes.map((s) => ({ id: s.id, slug: s.slug, nombre: s.nombre }));
    }
    return SEDES.map((s) => ({ id: s.id, slug: s.slug, nombre: s.name }));
  });
  const [rooms, setRooms] = useState<RoomItem[]>(() => {
    const cachedRooms = getCachedHabitaciones();
    const cachedSedes = getCachedSedes();
    if (cachedRooms && cachedRooms.length > 0) {
      return mapDbHabitaciones(cachedRooms, cachedSedes, sedeId, sedeSlug);
    }
    return sedeSlug ? ROOMS.filter((r) => r.sedeSlug === sedeSlug) : ROOMS;
  });

  useEffect(() => {
    Promise.all([fetchHabitacionesFromDb(), fetchSedesFromDb()]).then(([dbRows, dbSedes]) => {
      if (dbSedes && dbSedes.length > 0) {
        setSedesList(dbSedes.map((s) => ({ id: s.id, slug: s.slug, nombre: s.nombre })));
      }
      if (!dbRows || dbRows.length === 0) return;
      setRooms(mapDbHabitaciones(dbRows, dbSedes, sedeId, sedeSlug));
    });
  }, [sedeSlug, sedeId]);

  const visibleRooms =
    showSedeFilter && selectedSedeSlug !== 'todas'
      ? rooms.filter((r) => r.sedeSlug === selectedSedeSlug)
      : rooms;

  return (
    <div>
      {showSedeFilter && sedesList.length > 0 && (
        <div className="mb-6 sm:mb-8 flex flex-nowrap sm:flex-wrap items-center gap-2 overflow-x-auto pb-1 sm:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setSelectedSedeSlug('todas')}
            className={`shrink-0 whitespace-nowrap px-4 py-1.5 rounded-full text-xs md:text-sm transition-all cursor-pointer ${
              selectedSedeSlug === 'todas'
                ? 'bg-white text-[#09090B] font-semibold'
                : 'bg-[#16161B] border border-white/15 text-[#D4D4D8] hover:text-white hover:bg-white/10'
            }`}
          >
            Todas
          </button>
          {sedesList.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedSedeSlug(s.slug)}
              className={`shrink-0 whitespace-nowrap px-4 py-1.5 rounded-full text-xs md:text-sm transition-all cursor-pointer ${
                selectedSedeSlug === s.slug
                  ? 'bg-white text-[#09090B] font-semibold'
                  : 'bg-[#16161B] border border-white/15 text-[#D4D4D8] hover:text-white hover:bg-white/10 hover:border-white/35'
              }`}
            >
              {s.nombre}
            </button>
          ))}
        </div>
      )}

      {visibleRooms.length === 0 ? (
        <div className="rounded-[20px] border border-white/10 bg-[#121215] p-6 text-center text-sm text-[#A1A1AA]">
          Próximamente habitaciones disponibles en esta sede.
        </div>
      ) : (
        <div className="space-y-5">
          {(() => {
            const blocks: RoomItem[][] = [];
            for (let i = 0; i < visibleRooms.length; i += 5) {
              blocks.push(visibleRooms.slice(i, i + 5));
            }
            return blocks.map((chunk, blockIdx) => {
              if (chunk.length < 3) {
                return (
                  <div key={blockIdx} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {chunk.map((room) => (
                      <RoomGridCard key={room.slug} room={room} sedeSlug={sedeSlug} />
                    ))}
                  </div>
                );
              }
              const tallOnRight = blockIdx % 2 === 1;
              const featured = chunk[0];
              const gridItems = chunk.slice(1);
              return (
                <div key={blockIdx} className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  <FeaturedTallRoomCard
                    room={featured}
                    sedeSlug={sedeSlug}
                    className={tallOnRight ? 'lg:order-2' : 'lg:order-1'}
                  />
                  <div
                    className={`lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-5 ${
                      tallOnRight ? 'lg:order-1' : 'lg:order-2'
                    }`}
                  >
                    {gridItems.map((room) => (
                      <RoomGridCard key={room.slug} room={room} sedeSlug={sedeSlug} />
                    ))}
                  </div>
                </div>
              );
            });
          })()}
        </div>
      )}
    </div>
  );
}

function FeaturedTallRoomCard({
  room,
  sedeSlug,
  className = '',
}: {
  room: RoomItem;
  sedeSlug?: string;
  className?: string;
}) {
  return (
    <a
      href={
        sedeSlug
          ? `/habitaciones/${room.slug}?from=${encodeURIComponent(`/sedes/${sedeSlug}`)}`
          : `/habitaciones/${room.slug}`
      }
      onMouseEnter={() => prefetchEntityTour('habitacion', room.id)}
      onTouchStart={() => prefetchEntityTour('habitacion', room.id)}
      className={`lg:col-span-4 group relative rounded-[24px] overflow-hidden bento-card min-h-[420px] lg:min-h-[540px] flex flex-col justify-between p-6 ${className}`}
    >
      <img
        src={room.cardImage || EMPTY_PLACEHOLDER_IMG}
        alt={room.title}
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-104 transition-transform duration-500"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(9,9,11,0.2) 0%, rgba(9,9,11,0.15) 45%, rgba(9,9,11,0.92) 85%, #09090B 100%)',
        }}
      />

      <div className="relative z-10 flex items-center justify-between gap-2">
        <span className="glass-hotspot inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs md:text-sm text-[#FAFAFA] font-medium">
          <span>{room.sedeName}</span>
        </span>
        <span className="glass-hotspot px-3 py-1.5 rounded-xl text-xs text-[#FAFAFA] inline-flex items-center gap-1.5">
          <span>Tour 360°</span>
          <RotateCw className="w-3.5 h-3.5" />
        </span>
      </div>

      <div className="relative z-10 mt-auto pt-36">
        <h2 className="text-2xl md:text-[28px] font-medium text-[#FAFAFA] leading-[1.18]">
          {room.title}
        </h2>
        <p className="mt-2 text-sm text-[#A1A1AA] line-clamp-2">
          {room.amenities.slice(0, 3).join(' • ') || 'Suite temática con visor 360°'}
        </p>

        <div className="mt-6 flex items-baseline justify-between gap-2">
          <div className="text-lg md:text-xl font-medium text-[#FAFAFA]">
            {room.priceText}{' '}
            <span className="text-sm text-[#A1A1AA] font-normal">({room.durationText})</span>
          </div>
          <span className="inline-flex items-center gap-1.5 text-sm md:text-[15px] font-medium text-[#FAFAFA] group-hover:translate-x-1 transition-transform">
            <span>Ver Detalles 360°</span>
            <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </a>
  );
}

function RoomGridCard({ room, sedeSlug }: { room: RoomItem; sedeSlug?: string }) {
  return (
    <a
      href={
        sedeSlug
          ? `/habitaciones/${room.slug}?from=${encodeURIComponent(`/sedes/${sedeSlug}`)}`
          : `/habitaciones/${room.slug}`
      }
      onMouseEnter={() => prefetchEntityTour('habitacion', room.id)}
      onTouchStart={() => prefetchEntityTour('habitacion', room.id)}
      className="group relative rounded-[24px] overflow-hidden bento-card h-[250px] md:h-[260px] flex flex-col justify-between p-5"
    >
      <img
        src={room.cardImage || EMPTY_PLACEHOLDER_IMG}
        alt={room.title}
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(9,9,11,0.12) 0%, rgba(9,9,11,0.22) 48%, rgba(9,9,11,0.9) 100%)',
        }}
      />

      <div className="relative z-10 flex items-center justify-between gap-2">
        {!sedeSlug && room.sedeName ? (
          <span className="glass-hotspot px-3 py-1 rounded-xl text-[11px] text-[#E4E4E7] truncate max-w-[140px]">
            {room.sedeName}
          </span>
        ) : (
          <span />
        )}
        <span className="glass-hotspot px-3.5 py-1.5 rounded-xl text-xs md:text-sm text-[#FAFAFA] inline-flex items-center gap-1.5 shrink-0">
          <span>Tour 360°</span>
          <RotateCw className="w-3.5 h-3.5" />
        </span>
      </div>

      <div className="relative z-10 mt-auto">
        <h3 className="text-xl md:text-[22px] font-medium text-[#FAFAFA] leading-snug truncate">
          {room.title}
        </h3>
        <div className="mt-0.5 text-base md:text-lg font-normal text-[#E4E4E7]">
          {room.priceText}{' '}
          <span className="text-xs md:text-sm text-[#A1A1AA]">({room.durationText})</span>
        </div>
      </div>
    </a>
  );
}

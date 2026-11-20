import React, { useState, useEffect } from 'react';
import { ROOMS, EMPTY_PLACEHOLDER_IMG, type RoomItem } from '../data/hotelData';
import { fetchHabitacionesFromDb, resolveMediaUrl } from '../lib/supabase';

export default function RoomsCatalogGrid({
  sedeSlug,
  cardHeightClass = 'h-[270px]',
}: {
  sedeSlug?: string;
  cardHeightClass?: string;
}) {
  const [rooms, setRooms] = useState<RoomItem[]>(ROOMS);

  useEffect(() => {
    fetchHabitacionesFromDb().then((dbRows) => {
      if (!dbRows || dbRows.length === 0) return;
      const mapped: RoomItem[] = dbRows.map((row) => {
        const existing = ROOMS.find((r) => r.slug === row.slug);
        const cover = row.portada_webp_url
          ? resolveMediaUrl(row.portada_webp_url)
          : existing?.cardImage || EMPTY_PLACEHOLDER_IMG;
        if (existing) {
          return {
            ...existing,
            id: row.id,
            title: row.nombre || existing.title,
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
          sedeSlug: sedeSlug || 'surco',
          sedeName: 'Sede Surco',
          address: 'Av. Benavides 4510, Surco',
          priceText: `${row.moneda || 'S/'} ${row.tarifa}`,
          priceNumeric: Number(row.tarifa),
          durationText: '4 Horas',
          cardImage: cover,
          ambientImage: cover,
          amenities: (row.descripcion || '').split('•').map((s) => s.trim()).filter(Boolean),
          scenes: [],
        };
      });
      if (mapped.length > 0) setRooms(mapped);
    });
  }, [sedeSlug]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {rooms.map((room) => (
        <a
          key={room.slug}
          href={`/habitaciones/${room.slug}`}
          className={`group relative ${cardHeightClass} rounded-[24px] overflow-hidden bento-card flex flex-col justify-end p-5 md:p-6`}
        >
          <img
            src={room.cardImage || EMPTY_PLACEHOLDER_IMG}
            alt={room.title}
            className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(9,9,11,0.05) 0%, rgba(9,9,11,0.25) 50%, rgba(9,9,11,0.92) 100%)',
            }}
          />

          <div className="relative z-10 flex items-end justify-between gap-3">
            <div>
              <h3 className="text-xl md:text-[22px] font-medium text-[#FAFAFA] leading-snug">
                {room.title}
              </h3>
              <p className="mt-0.5 text-xs md:text-sm text-[#D4D4D8]">
                {room.priceText} ({room.durationText}) • Visor 360°
              </p>
            </div>

            <span className="w-8 h-8 rounded-full bg-white text-[#09090B] flex items-center justify-center shrink-0 group-hover:translate-x-1 transition-transform font-bold text-sm shadow-md">
              →
            </span>
          </div>
        </a>
      ))}
    </div>
  );
}

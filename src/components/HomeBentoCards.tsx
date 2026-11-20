import React, { useState, useEffect } from 'react';
import { EMPTY_PLACEHOLDER_IMG } from '../data/hotelData';
import {
  fetchHabitacionesFromDb,
  fetchServiciosFromDb,
  fetchSedesFromDb,
  getCachedHabitaciones,
  getCachedServicios,
  getCachedSedes,
  resolveMediaUrl,
} from '../lib/supabase';

export default function HomeBentoCards() {
  const [suitesImg, setSuitesImg] = useState(EMPTY_PLACEHOLDER_IMG);
  const [serviciosImg, setServiciosImg] = useState(EMPTY_PLACEHOLDER_IMG);
  const [sedesImg, setSedesImg] = useState(EMPTY_PLACEHOLDER_IMG);
  const [sedesCount, setSedesCount] = useState(5);
  const [firstRoomSlug, setFirstRoomSlug] = useState('suite-neon-jacuzzi');
  const [firstSedeSlug, setFirstSedeSlug] = useState('surco');

  useEffect(() => {
    const cachedRooms = getCachedHabitaciones();
    const cachedRoomCover = cachedRooms?.find((r) => r.portada_webp_url);
    if (cachedRoomCover) {
      setSuitesImg(resolveMediaUrl(cachedRoomCover.portada_webp_url));
      setFirstRoomSlug(cachedRoomCover.slug);
    }

    const cachedServices = getCachedServicios();
    const cachedServiceCover = cachedServices?.find((r) => r.portada_webp_url);
    if (cachedServiceCover) {
      setServiciosImg(resolveMediaUrl(cachedServiceCover.portada_webp_url));
    }

    const cachedSedes = getCachedSedes();
    if (cachedSedes && cachedSedes.length > 0) {
      setSedesCount(cachedSedes.length);
      setFirstSedeSlug(cachedSedes[0].slug);
      const cachedSedeCover = cachedSedes.find((r) => r.imagen_portada_url);
      if (cachedSedeCover) setSedesImg(resolveMediaUrl(cachedSedeCover.imagen_portada_url));
    }

    fetchHabitacionesFromDb().then((rows) => {
      const withCover = rows.find((r) => r.portada_webp_url);
      if (withCover) {
        setSuitesImg(resolveMediaUrl(withCover.portada_webp_url));
        setFirstRoomSlug(withCover.slug);
      } else if (rows[0]) {
        setFirstRoomSlug(rows[0].slug);
      }
    });

    fetchServiciosFromDb().then((rows) => {
      const withCover = rows.find((r) => r.portada_webp_url);
      if (withCover) setServiciosImg(resolveMediaUrl(withCover.portada_webp_url));
    });

    fetchSedesFromDb().then((rows) => {
      if (rows.length > 0) {
        setSedesCount(rows.length);
        setFirstSedeSlug(rows[0].slug);
      }
      const withCover = rows.find((r) => r.imagen_portada_url);
      if (withCover) setSedesImg(resolveMediaUrl(withCover.imagen_portada_url));
    });
  }, []);

  const cards = [
    {
      title: 'Suites Temáticas',
      href: `/habitaciones/${firstRoomSlug}`,
      image: suitesImg,
    },
    {
      title: 'Servicios & Juegos',
      href: '/servicios',
      image: serviciosImg,
    },
    {
      title: `${sedesCount} Sedes Exclusivas`,
      href: `/sedes/${firstSedeSlug}`,
      image: sedesImg,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 xl:gap-8">
      {cards.map((card) => (
        <a
          key={card.title}
          href={card.href}
          className="group relative h-[250px] sm:h-[280px] xl:h-[320px] rounded-[26px] overflow-hidden bento-card block"
        >
          <img
            src={card.image}
            alt={card.title}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(9,9,11,0.05) 0%, rgba(9,9,11,0.2) 55%, rgba(9,9,11,0.9) 100%)',
            }}
          />
          <div className="absolute bottom-6 left-7 right-7 flex items-center justify-between">
            <span className="text-xl md:text-[22px] xl:text-[25px] font-medium text-[#FAFAFA] tracking-tight inline-flex items-center gap-2.5 group-hover:translate-x-1 transition-transform">
              <span>{card.title}</span>
              <span className="text-white/90">→</span>
            </span>
          </div>
        </a>
      ))}
    </div>
  );
}

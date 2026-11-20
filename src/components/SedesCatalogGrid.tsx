import React, { useState, useEffect } from 'react';
import { SEDES, EMPTY_PLACEHOLDER_IMG } from '../data/hotelData';
import {
  fetchSedesFromDb,
  getCachedSedes,
  resolveMediaUrl,
  type DbSede,
} from '../lib/supabase';

interface SedeCardData {
  slug: string;
  name: string;
  address: string;
  coverUrl: string;
}

function mapDbSedes(dbRows: DbSede[]): SedeCardData[] {
  return dbRows.map((row) => ({
    slug: row.slug,
    name: row.nombre,
    address: row.direccion,
    coverUrl: row.imagen_portada_url
      ? resolveMediaUrl(row.imagen_portada_url)
      : EMPTY_PLACEHOLDER_IMG,
  }));
}

export default function SedesCatalogGrid() {
  const [sedesList, setSedesList] = useState<SedeCardData[]>(() => {
    const cached = getCachedSedes();
    if (cached && cached.length > 0) return mapDbSedes(cached);
    return SEDES.map((s) => ({
      slug: s.slug,
      name: s.name,
      address: s.address,
      coverUrl: EMPTY_PLACEHOLDER_IMG,
    }));
  });

  useEffect(() => {
    fetchSedesFromDb().then((dbRows) => {
      if (!dbRows || dbRows.length === 0) return;
      setSedesList(mapDbSedes(dbRows));
    });
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sedesList.map((sede) => (
        <a
          key={sede.slug}
          href={`/sedes/${sede.slug}`}
          className="group relative h-[280px] rounded-[24px] overflow-hidden bento-card flex flex-col justify-between p-6"
        >
          <img
            src={sede.coverUrl || EMPTY_PLACEHOLDER_IMG}
            alt={sede.name}
            className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(9,9,11,0.2) 0%, rgba(9,9,11,0.35) 45%, rgba(9,9,11,0.94) 100%)',
            }}
          />

          <div className="relative z-10 flex justify-between items-center">
            <span className="glass-hotspot px-3.5 py-1 rounded-full text-xs text-white font-medium">
              Abierto 24 Horas
            </span>
            <span className="glass-hotspot px-3 py-1 rounded-full text-xs text-pink-400 font-medium">
              Tour 360°
            </span>
          </div>

          <div className="relative z-10">
            <h2 className="text-2xl font-medium text-[#FAFAFA]">{sede.name}</h2>
            <p className="mt-1 text-xs md:text-sm text-[#D4D4D8]">{sede.address}</p>
            <div className="mt-3 flex items-center justify-between text-xs text-[#A1A1AA]">
              <span>Cochera Privada • Suites Jacuzzi</span>
              <span className="text-white font-medium group-hover:translate-x-1 transition-transform">
                Explorar Sede →
              </span>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}

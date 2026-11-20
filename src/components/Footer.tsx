import React, { useEffect, useState } from 'react';
import { ArrowUpRight, Clock, ShieldCheck } from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon';
import { triggerWhatsAppModal } from '../data/store';
import {
  type DbHabitacion,
  type DbSede,
  fetchHabitacionesFromDb,
  fetchSedesFromDb,
  getCachedHabitaciones,
  getCachedSedes,
  getFallbackDbHabitaciones,
  getFallbackDbSedes,
} from '../lib/supabase';

export default function Footer() {
  const [sedesList, setSedesList] = useState<DbSede[]>(() => getFallbackDbSedes());
  const [roomsList, setRoomsList] = useState<DbHabitacion[]>(() => getFallbackDbHabitaciones());

  useEffect(() => {
    const cachedSedes = getCachedSedes();
    if (cachedSedes && cachedSedes.length > 0) setSedesList(cachedSedes);

    const cachedRooms = getCachedHabitaciones();
    if (cachedRooms && cachedRooms.length > 0) setRoomsList(cachedRooms);

    fetchSedesFromDb().then((rows) => {
      if (rows && rows.length > 0) setSedesList(rows);
    });
    fetchHabitacionesFromDb().then((rows) => {
      if (rows && rows.length > 0) setRoomsList(rows);
    });
  }, []);

  const featuredRooms = roomsList.slice(0, 4);
  const defaultSedeName = sedesList[0]?.nombre || 'Sede Surco';

  return (
    <footer className="relative mt-20 border-t border-white/[0.08] bg-[#09090B] text-[#FAFAFA]">
      <div className="mx-auto w-full max-w-[1260px] px-6 md:px-8 pt-14 pb-10">
        {/* Minimal Apple-Style Editorial CTA Strip */}
        <div className="rounded-[28px] bg-white/[0.025] border border-white/[0.08] p-7 sm:p-9 mb-14 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-xl">
            <span className="inline-block text-[11px] uppercase tracking-[0.22em] text-[#71717A] mb-2">
              Atención 24/7 • Reserva Confidencial
            </span>
            <h3 className="text-2xl sm:text-3xl font-light tracking-tight text-[#FAFAFA] leading-snug">
              Vive la experiencia Xnox en 360°.
            </h3>
            <p className="mt-2 text-sm text-[#A1A1AA] leading-relaxed">
              Recorre cada suite antes de llegar y confirma tu ingreso directo en nuestras {sedesList.length} sedes de Lima.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <a
              href="/habitaciones"
              className="px-5 py-2.5 rounded-full text-xs sm:text-sm font-medium text-[#E4E4E7] bg-white/[0.05] hover:bg-white/[0.1] border border-white/12 transition-colors"
            >
              Explorar Suites 360°
            </a>
            <button
              type="button"
              onClick={() =>
                triggerWhatsAppModal({
                  sede: defaultSedeName,
                  itemTitle: featuredRooms[0]?.nombre || 'Suite Neón Jacuzzi',
                  priceText: featuredRooms[0] ? `S/ ${featuredRooms[0].tarifa}` : 'S/ 180 (4 Horas)',
                })
              }
              className="px-5 py-2.5 rounded-full bg-white text-[#09090B] font-semibold text-xs sm:text-sm inline-flex items-center gap-2 hover:bg-neutral-200 transition-colors cursor-pointer"
            >
              <span>Reservar por WhatsApp</span>
              <WhatsAppIcon className="w-4 h-4 text-[#09090B]" />
            </button>
          </div>
        </div>

        {/* Clean Apple-Inspired Directory */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-white/[0.08]">
          {/* Brand */}
          <div className="lg:col-span-4 space-y-4">
            <a
              href="/"
              className="inline-block text-lg font-medium tracking-[0.22em] text-[#FAFAFA]"
            >
              HOTEL XNOX
            </a>
            <p className="text-xs sm:text-sm text-[#71717A] leading-relaxed max-w-xs">
              Hoteles boutique en Lima diseñados para privacidad absoluta, descanso sensorial y recorridos virtuales 360°.
            </p>
            <div className="pt-1 space-y-2 text-xs text-[#A1A1AA]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[#71717A] shrink-0" />
                <span>Ingreso vehicular privado</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#71717A] shrink-0" />
                <span>Abierto 24 horas, todos los días</span>
              </div>
            </div>
          </div>

          {/* Sedes */}
          <div className="lg:col-span-3">
            <h4 className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#71717A] mb-4">
              Sedes ({sedesList.length})
            </h4>
            <ul className="space-y-3 text-xs sm:text-sm">
              {sedesList.map((sede) => (
                <li key={sede.slug}>
                  <a
                    href={`/sedes/${sede.slug}`}
                    className="group block text-[#D4D4D8] hover:text-white transition-colors"
                  >
                    <span className="inline-flex items-center gap-1 font-medium">
                      <span>{sede.nombre}</span>
                      <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-0.5 group-hover:opacity-70 transition-all" />
                    </span>
                    {sede.direccion && (
                      <span className="block text-[11px] text-[#71717A] mt-0.5 truncate">
                        {sede.direccion}
                      </span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Suites 360° */}
          <div className="lg:col-span-3">
            <h4 className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#71717A] mb-4">
              Suites Destacadas
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-[#A1A1AA]">
              {featuredRooms.map((room) => (
                <li key={room.slug}>
                  <a
                    href={`/habitaciones/${room.slug}`}
                    className="hover:text-white transition-colors flex items-baseline justify-between gap-2"
                  >
                    <span className="truncate">{room.nombre}</span>
                    <span className="text-[11px] text-[#71717A] shrink-0">S/ {room.tarifa}</span>
                  </a>
                </li>
              ))}
              <li className="pt-2 border-t border-white/[0.06]">
                <a href="/servicios" className="hover:text-white transition-colors">
                  Servicios & Experiencias
                </a>
              </li>
              <li>
                <a href="/promociones" className="hover:text-white transition-colors">
                  Promociones Vigentes
                </a>
              </li>
            </ul>
          </div>

          {/* Navegación */}
          <div className="lg:col-span-2">
            <h4 className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#71717A] mb-4">
              Explorar
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-[#A1A1AA]">
              <li>
                <a href="/" className="hover:text-white transition-colors">
                  Inicio
                </a>
              </li>
              <li>
                <a href="/sedes" className="hover:text-white transition-colors">
                  Sedes
                </a>
              </li>
              <li>
                <a href="/habitaciones" className="hover:text-white transition-colors">
                  Habitaciones 360°
                </a>
              </li>
              <li>
                <a href="/servicios" className="hover:text-white transition-colors">
                  Servicios
                </a>
              </li>
              <li>
                <a href="/promociones" className="hover:text-white transition-colors">
                  Promociones
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Legal Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#71717A]">
          <div>
            © {new Date().getFullYear()} HOTEL XNOX Lima, Perú. Todos los derechos reservados. Solo mayores de 18 años (+18).
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <a href="/promociones" className="hover:text-[#D4D4D8] transition-colors">
              Términos y Condiciones
            </a>
            <a href="/servicios" className="hover:text-[#D4D4D8] transition-colors">
              Privacidad
            </a>
            <button
              type="button"
              onClick={() =>
                triggerWhatsAppModal({
                  sede: defaultSedeName,
                  itemTitle: 'Consulta General / Libro de Reclamaciones',
                  priceText: 'Atención 24/7',
                })
              }
              className="hover:text-[#D4D4D8] transition-colors cursor-pointer"
            >
              Libro de Reclamaciones
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

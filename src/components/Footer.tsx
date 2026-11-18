import React from 'react';
import { MapPin, Clock, ShieldCheck, Sparkles, ArrowUpRight, Sliders } from 'lucide-react';
import { SEDES, ROOMS } from '../data/hotelData';
import { WhatsAppIcon } from './WhatsAppIcon';
import { triggerWhatsAppModal } from '../data/store';

export default function Footer() {
  return (
    <footer className="relative mt-16 border-t border-[#27272A] bg-[#09090B] text-[#FAFAFA] overflow-hidden">
      {/* Subtle Ambient Neon Top Glow */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[680px] h-44 rounded-full opacity-20 blur-3xl"
        style={{
          background: 'linear-gradient(90deg, #E11D48 0%, #9333EA 50%, #2563EB 100%)',
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-[1260px] px-4 md:px-6 pt-14 pb-12">
        {/* Top Glassmorphism Conversion Banner */}
        <div
          className="rounded-[24px] p-6 md:p-8 mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6"
          style={{
            background: 'rgba(22, 22, 27, 0.78)',
            backdropFilter: 'blur(18px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 20px 45px -15px rgba(0, 0, 0, 0.8)',
          }}
        >
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/15 text-xs text-[#E4E4E7] mb-3">
              <Sparkles className="w-3.5 h-3.5 text-pink-500" />
              <span>Atención 24 Horas • Reserva Confidencial Inmediata</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-light uppercase tracking-tight text-[#FAFAFA]">
              ¿LISTO PARA VIVIR LA EXPERIENCIA XNOX?
            </h3>
            <p className="mt-1.5 text-sm md:text-base text-[#A1A1AA]">
              Explora nuestras suites en 360° y confirma tu ingreso sin esperas en cualquiera de nuestras 5 sedes en Lima.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <a
              href="/habitaciones/suite-neon-jacuzzi"
              className="px-5 py-2.5 rounded-full text-xs md:text-sm font-medium text-[#FAFAFA] bg-white/[0.06] hover:bg-white/[0.12] border border-white/20 transition-all"
            >
              Explorar Tour 360°
            </a>
            <button
              type="button"
              onClick={() =>
                triggerWhatsAppModal({
                  sede: 'Sede Surco',
                  itemTitle: 'Suite Neón Jacuzzi',
                  priceText: 'S/ 180 (4 Horas)',
                })
              }
              className="px-6 py-2.5 rounded-full bg-white text-[#09090B] font-semibold text-xs md:text-sm inline-flex items-center gap-2 hover:bg-neutral-200 transition-all shadow-md cursor-pointer"
            >
              <span>Reservar por WhatsApp</span>
              <WhatsAppIcon className="w-4 h-4 text-[#09090B]" />
            </button>
          </div>
        </div>

        {/* Main 4-Column Footer Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-[#27272A]">
          {/* Col 1: Brand & Trust Badges (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <a
              href="/"
              className="inline-block text-2xl font-light tracking-[0.14em] text-[#FAFAFA]"
            >
              HOTEL XNOX
            </a>
            <p className="text-sm text-[#A1A1AA] leading-relaxed max-w-sm">
              Cadena de hoteles boutique en Lima diseñada para experiencias sensoriales, noches románticas y absoluta privacidad con recorridos virtuales en 360°.
            </p>

            <div className="pt-2 space-y-2 text-xs text-[#D4D4D8]">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Ingreso vehicular privado sin contacto visual</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-pink-400 shrink-0" />
                <span>Abierto 24/7 los 365 días del año</span>
              </div>
            </div>
          </div>

          {/* Col 2: 5 Sedes en Lima (3 cols) */}
          <div className="lg:col-span-3">
            <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#FAFAFA] mb-4">
              Nuestras 5 Sedes
            </h4>
            <ul className="space-y-2.5 text-sm">
              {SEDES.map((sede) => (
                <li key={sede.slug}>
                  <a
                    href={`/sedes/${sede.slug}`}
                    className="group flex items-start gap-2 text-[#A1A1AA] hover:text-white transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5 mt-1 text-pink-500/80 group-hover:text-pink-400 shrink-0" />
                    <div>
                      <span className="font-medium text-[#E4E4E7] group-hover:text-white">
                        {sede.name}
                      </span>
                      <span className="block text-xs text-[#71717A]">{sede.address}</span>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Suites 360° & Experiencias (3 cols) */}
          <div className="lg:col-span-3">
            <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#FAFAFA] mb-4">
              Suites & Experiencias 360°
            </h4>
            <ul className="space-y-2.5 text-sm text-[#A1A1AA]">
              {ROOMS.map((room) => (
                <li key={room.slug}>
                  <a
                    href={`/habitaciones/${room.slug}`}
                    className="hover:text-white transition-colors inline-flex items-center gap-1"
                  >
                    <span>{room.title}</span>
                    <span className="text-xs text-[#71717A]">({room.priceText})</span>
                  </a>
                </li>
              ))}
              <li className="pt-1 border-t border-white/5">
                <a
                  href="/servicios/packs-decoracion-celebraciones"
                  className="hover:text-white transition-colors"
                >
                  Packs de Decoración & Celebraciones
                </a>
              </li>
              <li>
                <a
                  href="/promociones/pack-celebracion-rosas"
                  className="hover:text-white transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Pack Celebración & Rosas</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#E11D48] text-[10px] font-semibold text-white">
                    PROMO
                  </span>
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Navegación Rápida & Admin (2 cols) */}
          <div className="lg:col-span-2">
            <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#FAFAFA] mb-4">
              Explorar
            </h4>
            <ul className="space-y-2.5 text-sm text-[#A1A1AA]">
              <li>
                <a href="/" className="hover:text-white transition-colors">
                  Inicio
                </a>
              </li>
              <li>
                <a href="/sedes" className="hover:text-white transition-colors">
                  Catálogo de Sedes
                </a>
              </li>
              <li>
                <a href="/habitaciones" className="hover:text-white transition-colors">
                  Habitaciones 360°
                </a>
              </li>
              <li>
                <a href="/servicios" className="hover:text-white transition-colors">
                  Servicios & Juegos
                </a>
              </li>
              <li>
                <a href="/promociones" className="hover:text-white transition-colors">
                  Promociones
                </a>
              </li>
              <li className="pt-2">
                <a
                  href="/admin"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs text-[#E4E4E7] hover:text-white transition-all"
                >
                  <Sliders className="w-3.5 h-3.5 text-pink-500" />
                  <span>Panel Admin 360°</span>
                  <ArrowUpRight className="w-3 h-3 opacity-70" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright & Legal Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#71717A]">
          <div>
            © {new Date().getFullYear()} HOTEL XNOX Lima, Perú. Todos los derechos reservados. Exclusivo para mayores de 18 años (+18).
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <a href="/promociones" className="hover:text-[#A1A1AA] transition-colors">
              Términos y Condiciones
            </a>
            <a href="/servicios" className="hover:text-[#A1A1AA] transition-colors">
              Política de Privacidad
            </a>
            <button
              type="button"
              onClick={() =>
                triggerWhatsAppModal({
                  sede: 'Sede Surco',
                  itemTitle: 'Consulta General / Libro de Reclamaciones',
                  priceText: 'Atención 24/7',
                })
              }
              className="hover:text-[#A1A1AA] transition-colors cursor-pointer"
            >
              Libro de Reclamaciones
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

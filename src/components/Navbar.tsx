import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ArrowLeft, Sliders } from 'lucide-react';
import { SEDES, ROOMS } from '../data/hotelData';
import { WhatsAppIcon } from './WhatsAppIcon';
import { triggerWhatsAppModal } from '../data/store';

interface NavbarProps {
  activeNav?: 'home' | 'sedes' | 'habitaciones' | 'servicios' | 'promociones' | 'admin';
  variant?: 'main' | 'sede-detail' | 'entity-detail';
  backHref?: string;
  backLabel?: string;
  detailTitle?: string;
  priceLabel?: string;
  oldPriceLabel?: string;
  whatsappSede?: string;
  whatsappItem?: string;
  whatsappPrice?: string;
}

export default function Navbar({
  activeNav = 'home',
  variant = 'main',
  backHref = '/',
  backLabel = 'Volver al catálogo',
  detailTitle = '',
  priceLabel = '',
  oldPriceLabel = '',
  whatsappSede = 'Sede Surco',
  whatsappItem = 'Suite Neón Jacuzzi',
  whatsappPrice = 'S/ 180 (4 Horas)',
}: NavbarProps) {
  const [sedesOpen, setSedesOpen] = useState(false);
  const [roomsOpen, setRoomsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSedesOpen(false);
        setRoomsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (variant === 'entity-detail') {
    return (
      <header className="fixed top-3 inset-x-0 z-50 w-full px-3 md:px-5">
        <nav className="glass-navbar w-full rounded-2xl px-4 md:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
          {/* Left: Back Pill */}
          <a
            href={backHref}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs md:text-sm text-[#E4E4E7] hover:text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{backLabel}</span>
          </a>

          {/* Center: Entity Title */}
          <h1 className="text-base md:text-[22px] font-medium tracking-tight text-[#FAFAFA] text-center flex-1 truncate px-2">
            {detailTitle}
          </h1>

          {/* Right: Rate & WhatsApp CTA */}
          <div className="flex items-center gap-4">
            {priceLabel && (
              <div className="flex items-baseline gap-2 text-sm md:text-base">
                <span className="font-medium text-[#FAFAFA]">{priceLabel}</span>
                {oldPriceLabel && (
                  <span className="text-xs md:text-sm text-[#A1A1AA] line-through">
                    {oldPriceLabel}
                  </span>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() =>
                triggerWhatsAppModal({
                  sede: whatsappSede,
                  itemTitle: whatsappItem,
                  priceText: whatsappPrice || priceLabel,
                })
              }
              className="px-4 md:px-5 py-2 rounded-full bg-white text-[#09090B] font-semibold text-xs md:text-sm inline-flex items-center gap-2 hover:bg-neutral-200 transition-all shadow-md cursor-pointer"
            >
              <span>Reservar WhatsApp</span>
              <WhatsAppIcon className="w-4 h-4 text-[#09090B]" />
            </button>
          </div>
        </nav>
      </header>
    );
  }

  return (
    <header className="fixed top-4 inset-x-0 z-50 w-full px-4 md:px-6 xl:px-8" ref={dropdownRef}>
      <nav className="glass-navbar w-full rounded-2xl px-5 md:px-8 xl:px-12 py-3.5 xl:py-4 flex items-center justify-between gap-4">
        {/* Left: Brand or Back to Sedes */}
        {variant === 'sede-detail' ? (
          <div className="flex items-center gap-3">
            <a
              href={backHref}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs md:text-sm xl:text-[15px] text-white hover:bg-white/20 bg-white/10 border border-white/25 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{backLabel}</span>
            </a>
            <a
              href="/"
              className="hidden sm:inline-block text-sm xl:text-base font-light tracking-[0.14em] text-white/90 hover:text-white transition-colors"
            >
              HOTEL XNOX
            </a>
          </div>
        ) : (
          <a
            href="/"
            className="text-xl md:text-2xl xl:text-[28px] font-light tracking-[0.12em] text-white hover:opacity-90 transition-opacity whitespace-nowrap drop-shadow-sm"
          >
            HOTEL XNOX
          </a>
        )}

        {/* Center Navigation */}
        <div className="hidden md:flex items-center gap-3 lg:gap-7 xl:gap-9 text-sm xl:text-[16px] text-white/95 font-normal">
          {/* Sedes Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setSedesOpen(!sedesOpen);
                setRoomsOpen(false);
              }}
              className={`px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                activeNav === 'sedes'
                  ? 'bg-white/10 text-white border border-white/20 font-medium'
                  : 'hover:text-white'
              }`}
            >
              <span>Sedes</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${sedesOpen ? 'rotate-180' : ''}`} />
            </button>

            {sedesOpen && (
              <div
                className="absolute left-0 mt-2.5 w-60 rounded-2xl p-2 shadow-2xl z-50"
                style={{
                  background: 'rgba(20, 20, 24, 0.94)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                }}
              >
                <div className="px-3 py-1.5 text-[11px] uppercase tracking-wider text-[#A1A1AA] font-medium">
                  5 Sedes en Lima
                </div>
                {SEDES.map((s) => (
                  <a
                    key={s.slug}
                    href={`/sedes/${s.slug}`}
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-[#E4E4E7] hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <span className="font-medium">{s.name}</span>
                    <span className="text-[11px] text-[#A1A1AA]">24h • 360°</span>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Habitaciones 360° Dropdown / Link */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setRoomsOpen(!roomsOpen);
                setSedesOpen(false);
              }}
              className={`px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                activeNav === 'habitaciones'
                  ? 'bg-white/10 text-white border border-white/20 font-medium'
                  : 'hover:text-white'
              }`}
            >
              <span>Habitaciones 360°</span>
              <ChevronDown className={`w-3.5 h-3.5 opacity-70 transition-transform ${roomsOpen ? 'rotate-180' : ''}`} />
            </button>

            {roomsOpen && (
              <div
                className="absolute left-0 mt-2.5 w-64 rounded-2xl p-2 shadow-2xl z-50"
                style={{
                  background: 'rgba(20, 20, 24, 0.94)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                }}
              >
                <div className="px-3 py-1.5 text-[11px] uppercase tracking-wider text-[#A1A1AA] font-medium">
                  Tours Interactivos 360°
                </div>
                {ROOMS.map((r) => (
                  <a
                    key={r.slug}
                    href={`/habitaciones/${r.slug}`}
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-[#E4E4E7] hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <span className="font-medium">{r.title}</span>
                    <span className="text-[11px] text-pink-400 font-medium">{r.priceText}</span>
                  </a>
                ))}
                <div className="mt-1 pt-1 border-t border-white/10">
                  <a
                    href="/habitaciones"
                    className="block px-3 py-2 rounded-xl text-xs text-[#A1A1AA] hover:text-white hover:bg-white/5 transition-colors"
                  >
                    Ver todo el catálogo →
                  </a>
                </div>
              </div>
            )}
          </div>

          <a
            href="/servicios"
            className={`px-4 py-1.5 rounded-full transition-all ${
              activeNav === 'servicios'
                ? 'bg-white/[0.08] text-white border border-white/20 font-medium'
                : 'hover:text-white'
            }`}
          >
            Servicios
          </a>

          <a
            href="/promociones"
            className={`px-4 py-1.5 rounded-full transition-all ${
              activeNav === 'promociones'
                ? 'bg-white/[0.08] text-white border border-white/20 font-medium'
                : 'hover:text-white'
            }`}
          >
            Promociones
          </a>

          <a
            href="/admin"
            className="px-3 py-1.5 rounded-full text-xs text-[#A1A1AA] hover:text-white hover:bg-white/5 inline-flex items-center gap-1.5 border border-transparent hover:border-white/10 transition-all"
            title="Panel Admin 360°"
          >
            <Sliders className="w-3.5 h-3.5 text-pink-500" />
            <span>Admin</span>
          </a>
        </div>

        {/* Right: White Pill CTA Reservar WhatsApp */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              triggerWhatsAppModal({
                sede: whatsappSede,
                itemTitle: whatsappItem,
                priceText: whatsappPrice,
              })
            }
            className="px-5 md:px-6 xl:px-7 py-2.5 xl:py-3 rounded-full bg-white text-[#09090B] font-semibold text-xs md:text-sm xl:text-[15px] inline-flex items-center gap-2.5 hover:bg-neutral-100 hover:scale-[1.02] transition-all shadow-lg cursor-pointer"
          >
            <span>Reservar WhatsApp</span>
            <WhatsAppIcon className="w-4 h-4 xl:w-5 xl:h-5 text-[#09090B]" />
          </button>
        </div>
      </nav>

      {/* Mobile secondary bar */}
      <div className="flex md:hidden items-center justify-center gap-2 mt-2 px-3 py-1.5 rounded-xl glass-surface text-xs overflow-x-auto">
        <a href="/sedes/surco" className="px-2.5 py-1 rounded-full hover:bg-white/10 whitespace-nowrap">
          Sedes
        </a>
        <a href="/habitaciones/suite-neon-jacuzzi" className="px-2.5 py-1 rounded-full hover:bg-white/10 whitespace-nowrap">
          Habitaciones 360°
        </a>
        <a href="/servicios" className="px-2.5 py-1 rounded-full hover:bg-white/10 whitespace-nowrap">
          Servicios
        </a>
        <a href="/promociones" className="px-2.5 py-1 rounded-full hover:bg-white/10 whitespace-nowrap">
          Promociones
        </a>
        <a href="/admin" className="px-2.5 py-1 rounded-full text-pink-400 hover:bg-white/10 whitespace-nowrap">
          Admin
        </a>
      </div>
    </header>
  );
}

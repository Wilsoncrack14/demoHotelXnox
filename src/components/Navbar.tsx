import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ArrowLeft, Menu, X } from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon';
import { triggerWhatsAppModal } from '../data/store';
import {
  type DbSede,
  fetchSedesFromDb,
  getCachedSedes,
  getFallbackDbSedes,
} from '../lib/supabase';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSedesOpen, setMobileSedesOpen] = useState(false);
  const [sedesList, setSedesList] = useState<DbSede[]>(() => getFallbackDbSedes());
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cached = getCachedSedes();
    if (cached && cached.length > 0) {
      setSedesList(cached);
    }
    fetchSedesFromDb().then((rows) => {
      if (rows && rows.length > 0) setSedesList(rows);
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSedesOpen(false);
        setRoomsOpen(false);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (variant === 'entity-detail') {
    return (
      <header className="fixed top-3 inset-x-0 z-50 w-full px-3 md:px-5">
        <nav className="glass-navbar w-full rounded-2xl px-3.5 sm:px-5 md:px-8 py-2.5 md:py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4">
          {/* Row 1 (mobile) / Left+Right (desktop) */}
          <div className="flex items-center justify-between gap-2 md:contents">
            {/* Back Pill */}
            <a
              href={backHref}
              className="md:order-1 inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs md:text-sm text-[#E4E4E7] hover:text-white bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 transition-all shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{backLabel}</span>
              <span className="sm:hidden">Volver</span>
            </a>

            {/* Mobile-only CTA */}
            <button
              type="button"
              onClick={() =>
                triggerWhatsAppModal({
                  sede: whatsappSede,
                  itemTitle: whatsappItem,
                  priceText: whatsappPrice || priceLabel,
                })
              }
              className="md:hidden px-3.5 py-1.5 rounded-full bg-white text-[#09090B] font-semibold text-xs inline-flex items-center gap-1.5 hover:bg-neutral-200 transition-all shadow-md cursor-pointer shrink-0"
            >
              <span>Reservar</span>
              <WhatsAppIcon className="w-3.5 h-3.5 text-[#09090B]" />
            </button>
          </div>

          {/* Row 2 (mobile: Title left + Price right) / Center+Right (desktop) */}
          <div className="flex items-center justify-between gap-3 pt-1.5 border-t border-white/15 md:pt-0 md:border-t-0 md:contents">
            <h1 className="md:order-2 md:flex-1 text-sm sm:text-base md:text-[20px] font-medium tracking-tight text-[#FAFAFA] text-left md:text-center truncate">
              {detailTitle}
            </h1>

            <div className="md:order-3 flex items-center gap-3 md:gap-4 shrink-0">
              {priceLabel && (
                <div className="flex items-baseline gap-1.5 px-2.5 py-0.5 md:px-0 md:py-0 rounded-full bg-black/30 md:bg-transparent text-xs sm:text-sm md:text-base">
                  <span className="font-semibold md:font-medium text-[#FAFAFA]">{priceLabel}</span>
                  {oldPriceLabel && (
                    <span className="hidden sm:inline text-xs md:text-sm text-[#A1A1AA] line-through">
                      {oldPriceLabel}
                    </span>
                  )}
                </div>
              )}

              {/* Desktop-only CTA */}
              <button
                type="button"
                onClick={() =>
                  triggerWhatsAppModal({
                    sede: whatsappSede,
                    itemTitle: whatsappItem,
                    priceText: whatsappPrice || priceLabel,
                  })
                }
                className="hidden md:inline-flex px-5 py-2 rounded-full bg-white text-[#09090B] font-semibold text-sm items-center gap-2 hover:bg-neutral-200 transition-all shadow-md cursor-pointer"
              >
                <span>Reservar WhatsApp</span>
                <WhatsAppIcon className="w-4 h-4 text-[#09090B]" />
              </button>
            </div>
          </div>
        </nav>
      </header>
    );
  }

  return (
    <>
      {mobileMenuOpen && (
        <div
          aria-hidden="true"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md md:hidden animate-xnox-fade"
        />
      )}

      <header className="fixed top-3 sm:top-4 inset-x-0 z-50 w-full px-3 sm:px-4 md:px-6 xl:px-8" ref={dropdownRef}>
      <nav className="glass-navbar w-full rounded-2xl px-3.5 sm:px-5 md:px-8 xl:px-12 py-2.5 sm:py-3.5 xl:py-4 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Brand or Back to Sedes */}
        {variant === 'sede-detail' ? (
          <div className="flex items-center gap-3">
            <a
              href={backHref}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs md:text-sm xl:text-[15px] text-white hover:bg-white/20 bg-white/10 border border-white/25 transition-all"
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
            className="text-base sm:text-xl md:text-2xl xl:text-[28px] font-light tracking-[0.12em] text-white hover:opacity-90 transition-opacity whitespace-nowrap drop-shadow-sm"
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
                  {sedesList.length} Sedes en Lima
                </div>
                {sedesList.map((s) => (
                  <a
                    key={s.slug}
                    href={`/sedes/${s.slug}`}
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-[#E4E4E7] hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <span className="font-medium">{s.nombre}</span>
                    <span className="text-[11px] text-[#A1A1AA]">24h • 360°</span>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Habitaciones 360° Direct Link */}
          <a
            href="/habitaciones"
            className={`px-4 py-1.5 rounded-full transition-all ${
              activeNav === 'habitaciones'
                ? 'bg-white/[0.08] text-white border border-white/20 font-medium'
                : 'hover:text-white'
            }`}
          >
            Habitaciones 360°
          </a>

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
            className="px-3.5 sm:px-5 md:px-6 xl:px-7 py-2 sm:py-2.5 xl:py-3 rounded-full bg-white text-[#09090B] font-semibold text-xs md:text-sm xl:text-[15px] inline-flex items-center gap-1.5 sm:gap-2.5 hover:bg-neutral-100 hover:scale-[1.02] transition-all shadow-lg cursor-pointer whitespace-nowrap"
          >
            <span className="hidden sm:inline">Reservar WhatsApp</span>
            <span className="sm:hidden">Reservar</span>
            <WhatsAppIcon className="w-4 h-4 xl:w-5 xl:h-5 text-[#09090B]" />
          </button>

          <button
            type="button"
            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </nav>

      {/* Apple Dark Mode Glassmorphism Mobile Hamburger Menu */}
      {mobileMenuOpen && (
        <div
          className="md:hidden mt-2 rounded-2xl p-3 shadow-2xl space-y-1.5 animate-xnox-menu"
          style={{
            background: 'rgba(18, 18, 22, 0.94)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.16)',
          }}
        >
          <div>
            <button
              type="button"
              onClick={() => setMobileSedesOpen((prev) => !prev)}
              aria-expanded={mobileSedesOpen}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-colors cursor-pointer ${
                activeNav === 'sedes'
                  ? 'bg-white/12 text-white font-medium'
                  : 'text-[#E4E4E7] hover:bg-white/10 hover:text-white'
              }`}
            >
              <span>Sedes</span>
              <span className="inline-flex items-center gap-1.5 text-[11px] text-[#A1A1AA]">
                <span>{sedesList.length} en Lima</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    mobileSedesOpen ? 'rotate-180' : ''
                  }`}
                />
              </span>
            </button>

            {mobileSedesOpen && (
              <div className="mt-1 ml-2 pl-2.5 border-l border-white/12 space-y-1 animate-xnox-fade">
                <a
                  href="/sedes"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-[#A1A1AA] hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  <span>Ver todas las sedes</span>
                  <span>→</span>
                </a>
                {sedesList.map((s) => (
                  <a
                    key={s.slug}
                    href={`/sedes/${s.slug}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-[#D4D4D8] hover:text-white hover:bg-white/[0.08] transition-colors"
                  >
                    <span>{s.nombre}</span>
                    <span className="text-[10px] text-[#71717A]">360°</span>
                  </a>
                ))}
              </div>
            )}
          </div>

          <a
            href="/habitaciones"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-colors ${
              activeNav === 'habitaciones'
                ? 'bg-white/12 text-white font-medium'
                : 'text-[#E4E4E7] hover:bg-white/10 hover:text-white'
            }`}
          >
            <span>Habitaciones 360°</span>
            <span className="text-[11px] text-pink-400">Tours</span>
          </a>

          <a
            href="/servicios"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-colors ${
              activeNav === 'servicios'
                ? 'bg-white/12 text-white font-medium'
                : 'text-[#E4E4E7] hover:bg-white/10 hover:text-white'
            }`}
          >
            <span>Servicios</span>
            <span className="text-[11px] text-[#A1A1AA]">Adicionales</span>
          </a>

          <a
            href="/promociones"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-colors ${
              activeNav === 'promociones'
                ? 'bg-white/12 text-white font-medium'
                : 'text-[#E4E4E7] hover:bg-white/10 hover:text-white'
            }`}
          >
            <span>Promociones</span>
            <span className="text-[11px] text-pink-400">Ofertas</span>
          </a>
        </div>
      )}
    </header>
    </>
  );
}

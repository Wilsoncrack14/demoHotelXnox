import React, { useState, useEffect } from 'react';
import { X, MapPin, Clock, Sparkles, CheckCircle2, ExternalLink, MessageSquare } from 'lucide-react';
import { ROOMS, SERVICES, PROMOTIONS } from '../data/hotelData';
import { WhatsAppIcon } from './WhatsAppIcon';
import type { WhatsAppModalPayload } from '../data/store';
import { buildWhatsAppBookingUrl } from '../lib/whatsapp';
import {
  fetchSedesFromDb,
  getCachedSedes,
  getFallbackDbSedes,
  type DbSede,
} from '../lib/supabase';

export default function WhatsAppBookingModal({
  defaultSede = 'Sede Surco',
  defaultItem = 'Suite Neón Jacuzzi',
  defaultPrice = 'S/ 180 (4 Horas)',
  hideFloatingButton = false,
}: {
  defaultSede?: string;
  defaultItem?: string;
  defaultPrice?: string;
  hideFloatingButton?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSede, setSelectedSede] = useState(defaultSede);
  const [selectedItem, setSelectedItem] = useState(defaultItem);
  const [selectedPrice, setSelectedPrice] = useState(defaultPrice);
  const [arrivalTime, setArrivalTime] = useState('En 30 minutos (Ingreso inmediato)');
  const [addOn, setAddOn] = useState('Sin adicionales');
  const [guestNotes, setGuestNotes] = useState('');
  const [dbSedes, setDbSedes] = useState<DbSede[]>(() => getFallbackDbSedes());

  useEffect(() => {
    const cached = getCachedSedes();
    if (cached && cached.length > 0) setDbSedes(cached);
    fetchSedesFromDb().then((rows) => {
      if (rows && rows.length > 0) setDbSedes(rows);
    });
  }, []);

  useEffect(() => {
    const handleOpen = (e: Event) => {
      const custom = e as CustomEvent<WhatsAppModalPayload>;
      const detail = custom.detail || {};
      if (detail.sede) setSelectedSede(detail.sede);
      if (detail.itemTitle) setSelectedItem(detail.itemTitle);
      if (detail.priceText) setSelectedPrice(detail.priceText);
      setIsOpen(true);
    };

    const handleDocumentClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('[data-whatsapp-trigger]') as HTMLElement | null;
      if (target) {
        e.preventDefault();
        const sede = target.getAttribute('data-sede') || defaultSede;
        const item = target.getAttribute('data-item') || defaultItem;
        const price = target.getAttribute('data-price') || defaultPrice;
        setSelectedSede(sede);
        setSelectedItem(item);
        setSelectedPrice(price);
        setIsOpen(true);
      }
    };

    window.addEventListener('xnox:open-whatsapp', handleOpen);
    document.addEventListener('click', handleDocumentClick);
    return () => {
      window.removeEventListener('xnox:open-whatsapp', handleOpen);
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [defaultSede, defaultItem, defaultPrice]);

  const allBookableOptions = [
    ...ROOMS.map((r) => ({
      label: `${r.title} (${r.priceText} - ${r.durationText})`,
      title: r.title,
      price: `${r.priceText} (${r.durationText})`,
    })),
    ...PROMOTIONS.map((p) => ({
      label: `Promo: ${p.title} (${p.promoPrice})`,
      title: `Promo: ${p.title}`,
      price: p.promoPrice,
    })),
    ...SERVICES.map((s) => ({
      label: `Servicio: ${s.title} (${s.priceText})`,
      title: s.title,
      price: s.priceText,
    })),
  ];

  const handleOptionChange = (title: string) => {
    setSelectedItem(title);
    const match = allBookableOptions.find((o) => o.title === title);
    if (match) setSelectedPrice(match.price);
  };

  const buildWhatsAppUrl = () => {
    const matchedDbSede = dbSedes.find(
      (s) =>
        s.nombre.toLowerCase() === selectedSede.toLowerCase() ||
        selectedSede.toLowerCase().includes(s.slug.replace('-', ' '))
    );

    const entidadTipo = selectedItem.toLowerCase().startsWith('promo')
      ? 'promocion'
      : selectedItem.toLowerCase().startsWith('servicio')
      ? 'servicio'
      : 'habitacion';

    return buildWhatsAppBookingUrl({
      whatsappNumero: matchedDbSede?.whatsapp_numero,
      sedeNombre: selectedSede,
      sedeSlug: matchedDbSede?.slug,
      entidadNombre: selectedItem,
      entidadTipo,
      tarifaTexto: selectedPrice,
      horaLlegada: arrivalTime,
      adicionalTexto: addOn,
      notaCliente: guestNotes,
    });
  };

  return (
    <>
      {/* Floating bottom-right WhatsApp bubble button */}
      {!hideFloatingButton && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Reservar por WhatsApp"
          className="fixed bottom-6 right-6 z-40 w-13 h-13 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-108 active:scale-95 cursor-pointer group"
          style={{
            background: 'rgba(28, 28, 34, 0.88)',
            backdropFilter: 'blur(18px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.75), 0 0 22px rgba(37, 211, 102, 0.2)',
          }}
        >
          <span className="absolute inset-0 rounded-full bg-[#25D366]/15 opacity-0 group-hover:opacity-100 transition-opacity" />
          <WhatsAppIcon className="w-6 h-6 text-[#FAFAFA] group-hover:text-[#25D366] transition-colors" />
        </button>
      )}

      {/* Apple Dark Minimal Chat Bubble Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end p-3 sm:p-6 bg-black/65 backdrop-blur-md animate-xnox-fade"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative w-full max-w-[420px] rounded-[28px] p-5 sm:p-6 text-[#FAFAFA] shadow-2xl overflow-hidden animate-xnox-bubble"
            style={{
              background: 'rgba(18, 18, 22, 0.94)',
              backdropFilter: 'blur(28px) saturate(180%)',
              WebkitBackdropFilter: 'blur(28px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              boxShadow: '0 28px 70px -15px rgba(0, 0, 0, 0.9)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full bg-[#25D366]/15 border border-[#25D366]/40 flex items-center justify-center text-[#25D366] shrink-0">
                  <WhatsAppIcon className="w-5 h-5" />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#25D366] ring-2 ring-[#121216]" />
                </div>
                <div>
                  <h3 className="text-[15px] font-medium tracking-tight text-white">
                    Reserva Confidencial
                  </h3>
                  <p className="text-[11px] text-[#A1A1AA]">
                    En línea 24/7 • Respuesta inmediata
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Cerrar chat"
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/15 flex items-center justify-center text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-sm">
              {/* Sede selector */}
              <div>
                <label className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-medium text-[#71717A] mb-2">
                  <MapPin className="w-3.5 h-3.5 text-[#A1A1AA]" />
                  Sede
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {dbSedes.map((s) => {
                    const shortLabel = s.nombre.replace(/^Sede\s+/i, '');
                    const active =
                      selectedSede.toLowerCase() === s.nombre.toLowerCase() ||
                      selectedSede.toLowerCase().includes(shortLabel.toLowerCase());
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelectedSede(s.nombre)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                          active
                            ? 'bg-white text-[#09090B] border-white font-semibold'
                            : 'bg-white/[0.04] text-[#D4D4D8] border-white/10 hover:border-white/30 hover:text-white'
                        }`}
                      >
                        {shortLabel}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Suite / Promo / Servicio selector */}
              <div>
                <label className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-medium text-[#71717A] mb-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#A1A1AA]" />
                  Suite o Experiencia
                </label>
                <select
                  value={selectedItem}
                  onChange={(e) => handleOptionChange(e.target.value)}
                  className="w-full rounded-2xl bg-[#09090B]/90 border border-white/12 px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-white/35"
                >
                  {!allBookableOptions.some((o) => o.title === selectedItem) && (
                    <option value={selectedItem}>
                      {selectedItem} ({selectedPrice})
                    </option>
                  )}
                  {allBookableOptions.map((opt, idx) => (
                    <option key={idx} value={opt.title}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Hora & Adicional */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-medium text-[#71717A] mb-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#A1A1AA]" />
                    Ingreso
                  </label>
                  <select
                    value={arrivalTime}
                    onChange={(e) => setArrivalTime(e.target.value)}
                    className="w-full rounded-2xl bg-[#09090B]/90 border border-white/12 px-3 py-2 text-xs text-white focus:outline-none focus:border-white/35"
                  >
                    <option value="En 30 minutos (Ingreso inmediato)">En 30 min</option>
                    <option value="Hoy por la noche (20:00 - 23:00)">Hoy noche</option>
                    <option value="Fin de semana (Viernes / Sábado)">Fin de semana</option>
                    <option value="Fecha especial programada">Fecha especial</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-medium text-[#71717A] mb-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#25D366]" />
                    Adicional
                  </label>
                  <select
                    value={addOn}
                    onChange={(e) => setAddOn(e.target.value)}
                    className="w-full rounded-2xl bg-[#09090B]/90 border border-white/12 px-3 py-2 text-xs text-white focus:outline-none focus:border-white/35"
                  >
                    <option value="Sin adicionales">Ninguno</option>
                    <option value="Pack Decoración & Pétalos (+S/ 90)">Pétalos (+S/ 90)</option>
                    <option value="Botella de Espumante (+S/ 55)">Espumante (+S/ 55)</option>
                    <option value="Kit Juegos Temáticos (+S/ 30)">Juegos (+S/ 30)</option>
                  </select>
                </div>
              </div>

              {/* Optional note */}
              <div>
                <label className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-medium text-[#71717A] mb-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[#A1A1AA]" />
                  Nota rápida (opcional)
                </label>
                <input
                  type="text"
                  value={guestNotes}
                  onChange={(e) => setGuestNotes(e.target.value)}
                  placeholder="Ej: Ingreso discreto, consulta disponibilidad..."
                  className="w-full rounded-2xl bg-[#09090B]/90 border border-white/12 px-3.5 py-2 text-xs text-white placeholder-[#71717A] focus:outline-none focus:border-white/35"
                />
              </div>

              {/* Minimal summary */}
              <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] px-3.5 py-2.5 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[11px] text-[#A1A1AA] truncate">{selectedSede}</div>
                  <div className="text-xs sm:text-sm font-medium text-white truncate">{selectedItem}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[10px] text-[#71717A]">Tarifa</div>
                  <div className="text-sm font-semibold text-white">{selectedPrice}</div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2.5 rounded-full text-xs font-medium text-[#A1A1AA] hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-colors cursor-pointer"
              >
                Cerrar
              </button>
              <a
                href={buildWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsOpen(false)}
                className="flex-1 py-2.5 px-5 rounded-full bg-white text-[#09090B] font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 hover:bg-neutral-200 transition-all shadow-lg cursor-pointer"
              >
                <WhatsAppIcon className="w-4 h-4 text-[#09090B]" />
                <span>Iniciar Chat</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-60" />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

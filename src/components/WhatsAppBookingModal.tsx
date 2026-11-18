import React, { useState, useEffect } from 'react';
import { X, MapPin, Clock, Sparkles, CheckCircle2, ExternalLink } from 'lucide-react';
import { SEDES, ROOMS, SERVICES, PROMOTIONS, WHATSAPP_PHONE } from '../data/hotelData';
import { WhatsAppIcon } from './WhatsAppIcon';
import type { WhatsAppModalPayload } from '../data/store';

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
    ...ROOMS.map((r) => ({ label: `${r.title} (${r.priceText} - ${r.durationText})`, title: r.title, price: `${r.priceText} (${r.durationText})` })),
    ...PROMOTIONS.map((p) => ({ label: `Promo: ${p.title} (${p.promoPrice})`, title: `Promo: ${p.title}`, price: p.promoPrice })),
    ...SERVICES.map((s) => ({ label: `Servicio: ${s.title} (${s.priceText})`, title: s.title, price: s.priceText })),
  ];

  const handleOptionChange = (title: string) => {
    setSelectedItem(title);
    const match = allBookableOptions.find((o) => o.title === title);
    if (match) setSelectedPrice(match.price);
  };

  const buildWhatsAppUrl = () => {
    const lines = [
      `✨ *RESERVA DIRECTA — HOTEL XNOX* ✨`,
      `• *Sede:* ${selectedSede}`,
      `• *Experiencia:* ${selectedItem}`,
      `• *Tarifa Ref.:* ${selectedPrice}`,
      `• *Llegada:* ${arrivalTime}`,
      addOn !== 'Sin adicionales' ? `• *Adicional:* ${addOn}` : '',
      guestNotes.trim() ? `• *Nota:* ${guestNotes.trim()}` : '',
      ``,
      `Hola Hotel Xnox, deseo confirmar disponibilidad con reserva confidencial.`,
    ].filter(Boolean);

    return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(lines.join('\n'))}`;
  };

  return (
    <>
      {/* Floating bottom-right WhatsApp quick-action button matching references */}
      {!hideFloatingButton && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Reservar por WhatsApp"
          className="fixed bottom-6 right-6 z-40 w-13 h-13 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-108 active:scale-95 cursor-pointer group"
          style={{
            background: 'rgba(36, 36, 42, 0.82)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.7), 0 0 20px rgba(37, 211, 102, 0.22)',
          }}
        >
          <span className="absolute inset-0 rounded-full bg-[#25D366]/15 opacity-0 group-hover:opacity-100 transition-opacity" />
          <WhatsAppIcon className="w-6 h-6 text-[#FAFAFA] group-hover:text-[#25D366] transition-colors" />
        </button>
      )}

      {/* Glassmorphism Mini-Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative w-full max-w-md rounded-3xl p-6 text-[#FAFAFA] shadow-2xl overflow-hidden"
            style={{
              background: 'rgba(20, 20, 25, 0.88)',
              backdropFilter: 'blur(24px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.85), 0 0 40px -10px rgba(225, 29, 72, 0.22)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient top glow */}
            <div className="pointer-events-none absolute -top-20 -right-20 w-44 h-44 rounded-full bg-pink-600/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 w-44 h-44 rounded-full bg-[#25D366]/15 blur-3xl" />

            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#25D366]/15 border border-[#25D366]/40 flex items-center justify-center text-[#25D366]">
                  <WhatsAppIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold tracking-tight text-white">
                    Reserva Confidencial WhatsApp
                  </h3>
                  <p className="text-xs text-[#A1A1AA]">
                    Atención inmediata 24/7 • Sin registro previo
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-sm">
              {/* Sede selector */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-[#A1A1AA] mb-1.5">
                  <MapPin className="w-3.5 h-3.5 text-pink-500" />
                  Selecciona la Sede
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {SEDES.map((s) => {
                    const active = selectedSede.toLowerCase().includes(s.shortName.toLowerCase());
                    return (
                      <button
                        key={s.slug}
                        type="button"
                        onClick={() => setSelectedSede(s.name)}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                          active
                            ? 'bg-white text-[#09090B] border-white font-semibold shadow-sm'
                            : 'bg-[#121215]/90 text-[#A1A1AA] border-[#27272A] hover:border-white/30 hover:text-white'
                        }`}
                      >
                        {s.shortName}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Suite / Promo / Servicio selector */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-[#A1A1AA] mb-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  Suite, Pack o Experiencia
                </label>
                <select
                  value={selectedItem}
                  onChange={(e) => handleOptionChange(e.target.value)}
                  className="w-full rounded-xl bg-[#121215] border border-[#27272A] px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/40"
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

              {/* Hora / Turno de llegada */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-[#A1A1AA] mb-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    Hora de ingreso
                  </label>
                  <select
                    value={arrivalTime}
                    onChange={(e) => setArrivalTime(e.target.value)}
                    className="w-full rounded-xl bg-[#121215] border border-[#27272A] px-2.5 py-2 text-xs text-white focus:outline-none focus:border-white/40"
                  >
                    <option value="En 30 minutos (Ingreso inmediato)">En 30 min (Inmediato)</option>
                    <option value="Hoy por la noche (20:00 - 23:00)">Hoy por la noche</option>
                    <option value="Fin de semana (Viernes / Sábado)">Este fin de semana</option>
                    <option value="Fecha especial programada">Fecha especial</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-[#A1A1AA] mb-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#25D366]" />
                    Adicional (Ad-on)
                  </label>
                  <select
                    value={addOn}
                    onChange={(e) => setAddOn(e.target.value)}
                    className="w-full rounded-xl bg-[#121215] border border-[#27272A] px-2.5 py-2 text-xs text-white focus:outline-none focus:border-white/40"
                  >
                    <option value="Sin adicionales">Sin adicionales</option>
                    <option value="Pack Decoración & Pétalos (+S/ 90)">Decoración & Pétalos (+S/ 90)</option>
                    <option value="Botella de Espumante (+S/ 55)">Espumante Helado (+S/ 55)</option>
                    <option value="Kit Juegos Temáticos (+S/ 30)">Juegos Temáticos (+S/ 30)</option>
                  </select>
                </div>
              </div>

              {/* Summary box */}
              <div className="rounded-2xl bg-[#09090B]/80 border border-[#27272A] p-3 flex items-center justify-between">
                <div>
                  <div className="text-xs text-[#A1A1AA]">{selectedSede}</div>
                  <div className="text-sm font-semibold text-white">{selectedItem}</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-[#A1A1AA]">Tarifa estimada</div>
                  <div className="text-base font-bold text-white">{selectedPrice}</div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2.5 rounded-full text-xs font-medium text-[#A1A1AA] hover:text-white border border-[#27272A] hover:border-white/20 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <a
                href={buildWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsOpen(false)}
                className="flex-1 py-2.5 px-5 rounded-full bg-white text-[#09090B] font-semibold text-sm flex items-center justify-center gap-2 hover:bg-neutral-200 transition-all shadow-lg cursor-pointer"
              >
                <span>Confirmar en WhatsApp</span>
                <WhatsAppIcon className="w-4 h-4 text-[#09090B]" />
                <ExternalLink className="w-3.5 h-3.5 opacity-60" />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

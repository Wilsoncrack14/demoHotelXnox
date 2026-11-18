import React, { useState } from 'react';
import { PROMOTIONS } from '../data/hotelData';
import { triggerWhatsAppModal } from '../data/store';

const SEDE_FILTERS = ['Todas', 'Lince', 'Miraflores', 'San Borja', 'Surco', 'Los Olivos'] as const;

export default function PromotionsCatalog() {
  const [selectedSede, setSelectedSede] = useState<string>('Todas');

  const filteredPromos =
    selectedSede === 'Todas'
      ? PROMOTIONS
      : PROMOTIONS.filter((p) => p.sedesFilter.includes(selectedSede));

  return (
    <section className="mx-auto w-full max-w-[1260px] px-4 md:px-6 pt-24 md:pt-28 pb-20">
      {/* Editorial Header & Sede Filter Pill Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-9">
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-[44px] font-light uppercase tracking-[-0.01em] text-[#FAFAFA] leading-[1.08]">
            PROMOCIONES &
            <br />
            PAQUETES
          </h1>
          <p className="mt-2 text-sm md:text-base text-[#A1A1AA]">
            Ofertas especiales y experiencias exclusivas por sede.
          </p>
        </div>

        {/* Location Filter Pill Bar matching promociones.jpg */}
        <div
          className="inline-flex flex-wrap items-center gap-1 p-1.5 rounded-full self-start lg:self-auto"
          style={{
            background: 'rgba(28, 28, 34, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.16)',
          }}
        >
          {SEDE_FILTERS.map((sede, idx) => {
            const isActive = selectedSede === sede;
            return (
              <React.Fragment key={sede}>
                {idx > 1 && !isActive && selectedSede !== SEDE_FILTERS[idx - 1] && (
                  <span className="text-[#71717A] text-xs select-none px-0.5">•</span>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedSede(sede)}
                  className={`px-4 py-1.5 rounded-full text-xs md:text-sm transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-[#09090B] font-semibold shadow-sm'
                      : 'text-[#D4D4D8] hover:text-white'
                  }`}
                >
                  {sede}
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* 3-Column Bento Promotions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPromos.map((promo) => (
          <div
            key={promo.slug}
            className="group rounded-[24px] overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1"
            style={{
              background: '#222227',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              boxShadow: '0 20px 45px -15px rgba(0, 0, 0, 0.8)',
            }}
          >
            {/* Top Image Section (clickable to 360° promo detail) */}
            <a
              href={`/promociones/${promo.slug}`}
              className="relative h-[240px] w-full overflow-hidden block"
            >
              <img
                src={promo.cardImage}
                alt={promo.title}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              {/* Top-left Crimson Badge */}
              <span className="absolute top-3.5 left-3.5 px-3.5 py-1 rounded-full bg-[#D9232E] text-white text-xs font-semibold tracking-wide uppercase shadow-md">
                {promo.badgeText}
              </span>
            </a>

            {/* Card Body */}
            <div className="relative px-5 pt-4 pb-5 flex-1 flex flex-col justify-between bg-gradient-to-b from-[#232328] to-[#1D1D22]">
              {/* Overlapping Secondary Crimson Badge matching promociones.jpg */}
              <div className="-mt-8 mb-2.5 relative z-10">
                <span className="inline-block px-3.5 py-1 rounded-full bg-[#D9232E] text-white text-xs font-semibold tracking-wide uppercase shadow-md">
                  {promo.badgeText}
                </span>
              </div>

              <div>
                <a
                  href={`/promociones/${promo.slug}`}
                  className="block text-xl md:text-[23px] font-medium text-[#FAFAFA] hover:text-pink-400 transition-colors leading-snug"
                >
                  {promo.title}
                </a>

                {/* Sede Pill & Expiration Date */}
                <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-[#A1A1AA]">
                  <span className="px-3 py-1 rounded-full bg-white/[0.06] border border-white/15 text-[#E4E4E7] font-medium">
                    {promo.sedesLabel}
                  </span>
                  <span>Vence: {promo.validUntil}</span>
                </div>
              </div>

              {/* Strikethrough Old Price + Promo Price */}
              <div className="mt-5 mb-4 flex items-baseline justify-end gap-2.5">
                <span className="text-base md:text-lg text-[#A1A1AA] line-through">
                  {promo.oldPrice}
                </span>
                <span className="text-2xl md:text-[28px] font-medium text-[#FAFAFA]">
                  {promo.promoPrice}
                </span>
              </div>

              {/* White Pill CTA Button */}
              <button
                type="button"
                onClick={() =>
                  triggerWhatsAppModal({
                    sede: promo.sedesFilter[0] ? `Sede ${promo.sedesFilter[0]}` : 'Sede Surco',
                    itemTitle: `Promo: ${promo.title} (${promo.badgeText})`,
                    priceText: promo.promoPrice,
                  })
                }
                className="w-full py-2.5 px-5 rounded-full bg-white text-[#09090B] font-semibold text-sm md:text-[15px] text-center hover:bg-neutral-200 transition-all shadow-md cursor-pointer"
              >
                Reservar WhatsApp
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

import React from 'react';
import { Map } from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon';
import { triggerWhatsAppModal } from '../data/store';

interface LocationBookingCardProps {
  primaryTitle: string;
  secondarySubtitle?: string;
  googleMapsUrl?: string;
  wazeUrl?: string;
  whatsappSede?: string;
  whatsappItem?: string;
  whatsappPrice?: string;
  compact?: boolean;
}

export default function LocationBookingCard({
  primaryTitle,
  secondarySubtitle,
  googleMapsUrl = 'https://maps.google.com/?q=Av.+Benavides+4510+Surco+Lima',
  wazeUrl = 'https://waze.com/ul?q=Av.%20Benavides%204510%20Surco',
  whatsappSede = 'Sede Surco',
  whatsappItem = 'Suite Neón Jacuzzi',
  whatsappPrice = 'S/ 180 (4 Horas)',
  compact = false,
}: LocationBookingCardProps) {
  return (
    <div
      className={`rounded-[22px] ${
        compact ? 'p-4 md:p-5' : 'p-5 md:p-6'
      } w-full max-w-[390px] transition-all`}
      style={{
        background: 'rgba(34, 34, 40, 0.72)',
        backdropFilter: 'blur(18px)',
        border: '1px solid rgba(255, 255, 255, 0.14)',
        boxShadow: '0 20px 45px -15px rgba(0, 0, 0, 0.8)',
      }}
    >
      <div className="flex items-start gap-3.5">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-[#D4D4D8]"
          style={{
            background: 'rgba(255, 255, 255, 0.07)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
          }}
        >
          <Map className="w-5 h-5 stroke-[1.75]" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-sm md:text-[15px] font-semibold text-[#FAFAFA] leading-snug">
            {primaryTitle}
          </div>
          {secondarySubtitle && (
            <div className="text-xs md:text-sm text-[#A1A1AA] mt-0.5 leading-snug">
              {secondarySubtitle}
            </div>
          )}
          <div className="mt-1 flex items-center gap-1.5 text-xs md:text-sm text-[#A1A1AA]">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-3 hover:text-white transition-colors"
            >
              Google Maps
            </a>
            <span>•</span>
            <a
              href={wazeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-3 hover:text-white transition-colors"
            >
              Waze
            </a>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() =>
          triggerWhatsAppModal({
            sede: whatsappSede,
            itemTitle: whatsappItem,
            priceText: whatsappPrice,
          })
        }
        className={`mt-4 w-full ${
          compact ? 'py-2.5' : 'py-3'
        } px-5 rounded-full bg-white text-[#09090B] font-semibold text-sm md:text-[15px] flex items-center justify-center gap-2 hover:bg-neutral-200 transition-all shadow-md cursor-pointer`}
      >
        <span>Reservar por WhatsApp</span>
        <WhatsAppIcon className="w-4 h-4 text-[#09090B]" />
      </button>
    </div>
  );
}

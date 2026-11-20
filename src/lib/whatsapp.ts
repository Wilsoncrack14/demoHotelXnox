import { SEDES, WHATSAPP_PHONE } from '../data/hotelData';

export const SEDE_WHATSAPP_MAP: Record<string, string> = {
  surco: '51987654321',
  lince: '51987654322',
  miraflores: '51987654323',
  'san-borja': '51987654324',
  'los-olivos': '51987654325',
};

export interface WhatsAppBookingParams {
  whatsappNumero?: string;
  sedeNombre: string;
  sedeSlug?: string;
  entidadNombre: string;
  entidadTipo?: 'habitacion' | 'servicio' | 'promocion' | 'sede';
  tarifaTexto: string;
  moneda?: string;
  horaLlegada?: string;
  adicionalTexto?: string;
  notaCliente?: string;
}

export function resolveSedeWhatsAppNumber(sedeNombreOrSlug?: string, explicitNumber?: string): string {
  if (explicitNumber && explicitNumber.replace(/\D/g, '').length >= 9) {
    return explicitNumber.replace(/\D/g, '');
  }
  if (!sedeNombreOrSlug) return WHATSAPP_PHONE;

  const clean = sedeNombreOrSlug.toLowerCase().trim();
  for (const [slug, phone] of Object.entries(SEDE_WHATSAPP_MAP)) {
    if (clean.includes(slug.replace('-', ' ')) || clean === slug) {
      return phone;
    }
  }
  const found = SEDES.find(
    (s) =>
      s.slug === clean ||
      clean.includes(s.shortName.toLowerCase()) ||
      s.name.toLowerCase() === clean
  );
  if (found && SEDE_WHATSAPP_MAP[found.slug]) {
    return SEDE_WHATSAPP_MAP[found.slug];
  }
  return WHATSAPP_PHONE;
}

export function buildWhatsAppBookingUrl(params: WhatsAppBookingParams): string {
  const phone = resolveSedeWhatsAppNumber(
    params.sedeSlug || params.sedeNombre,
    params.whatsappNumero
  );

  const tipoLabel =
    params.entidadTipo === 'promocion'
      ? 'Promoción'
      : params.entidadTipo === 'servicio'
      ? 'Servicio / Experiencia'
      : 'Suite / Habitación';

  const lines = [
    `✨ *RESERVA DIRECTA — HOTEL XNOX* ✨`,
    `• *Sede:* ${params.sedeNombre}`,
    `• *${tipoLabel}:* ${params.entidadNombre}`,
    `• *Tarifa Vigente:* ${params.tarifaTexto}`,
    params.horaLlegada ? `• *Llegada:* ${params.horaLlegada}` : '',
    params.adicionalTexto && params.adicionalTexto !== 'Sin adicionales'
      ? `• *Adicional:* ${params.adicionalTexto}`
      : '',
    params.notaCliente?.trim() ? `• *Nota:* ${params.notaCliente.trim()}` : '',
    ``,
    `Hola Hotel Xnox (${params.sedeNombre}), deseo confirmar disponibilidad con reserva confidencial.`,
  ].filter(Boolean);

  return `https://wa.me/${phone}?text=${encodeURIComponent(lines.join('\n'))}`;
}

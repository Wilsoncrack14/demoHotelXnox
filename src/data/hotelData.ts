export interface Hotspot360 {
  id: string;
  type: 'info' | 'nav';
  label: string;
  adminLabel?: string;
  description?: string;
  targetSceneId?: string;
  targetUrl?: string;
  x: number; // percentage 0-100 on panoramic canvas
  y: number; // percentage 0-100 on panoramic canvas
  pitch: number; // e.g. -23.66
  yaw: number;   // e.g. +8.50
}

export interface Scene360 {
  id: string;
  title: string;
  adminTitle?: string;
  isPrimary?: boolean;
  isEquirectangular?: boolean;
  initialYaw?: number;
  initialPitch?: number;
  fileSizeWebP: string;
  panoramaUrl: string;
  thumbUrl: string;
  hotspots: Hotspot360[];
}

export interface SedeItem {
  slug: string;
  name: string;
  shortName: string;
  tagline: string;
  scheduleInfo: string;
  address: string;
  googleMapsUrl: string;
  wazeUrl: string;
  panoramaUrl: string;
  hotspots: Hotspot360[];
  roomSlugs: string[];
}

export interface RoomItem {
  slug: string;
  title: string;
  sedeSlug: string;
  sedeName: string;
  address: string;
  priceText: string;
  priceNumeric: number;
  durationText: string;
  cardImage: string;
  ambientImage: string;
  amenities: string[];
  scenes: Scene360[];
}

export interface ServiceItem {
  slug: string;
  title: string;
  category: 'Jacuzzi' | 'Sillón Tántrico' | 'Decoraciones' | 'Packs';
  priceText: string;
  priceSubtext?: string;
  topBarPriceText: string;
  description: string;
  sedesBadges: string[];
  sedesFilter: string[];
  availabilityTitle: string;
  address: string;
  featuredTall?: boolean;
  has360Badge?: boolean;
  cardImage: string;
  amenitiesTitle: string;
  amenities: string[];
  scenes: Scene360[];
}

export interface PromoItem {
  slug: string;
  title: string;
  detailHeaderTitle: string;
  badgeText: string;
  sedesLabel: string;
  sedesFilter: string[];
  validUntil: string;
  oldPrice: string;
  promoPrice: string;
  cardImage: string;
  availabilityTitle: string;
  includesList: string[];
  scenes: Scene360[];
}

export const WHATSAPP_PHONE = '51987654321';

export const HERO_SLIDES = [
  {
    id: 1,
    headline: 'SENSACIONES\nY PRIVACIDAD',
    subtitle: 'Explora 5 sedes, habitaciones y servicios en 360°.',
    videoUrl: '/videos/Video Project 3.mp4',
    poster: '/images/hero-main.webp',
    ctaPrimaryText: 'Explorar 360°',
    ctaPrimaryHref: '/habitaciones/suite-neon-jacuzzi',
    ctaSecondaryText: 'Ver Habitaciones',
    ctaSecondaryHref: '/sedes/surco',
  },
  {
    id: 2,
    headline: 'SUITES NEÓN\n& JACUZZI',
    subtitle: 'Hidromasaje climatizado, cromoterapia LED y sonido Bluetooth.',
    videoUrl: '/videos/gemini_generated_video_2fc00e02.mp4',
    poster: '/images/pano-suite-neon.webp',
    ctaPrimaryText: 'Explorar 360°',
    ctaPrimaryHref: '/habitaciones/suite-neon-jacuzzi',
    ctaSecondaryText: 'Ver Promociones',
    ctaSecondaryHref: '/promociones',
  },
];

export const SEDES: SedeItem[] = [
  {
    slug: 'surco',
    name: 'Sede Surco',
    shortName: 'Surco',
    tagline: 'Privacidad y exclusividad en el corazón del distrito',
    scheduleInfo: 'Abierto 24 horas • Estacionamiento privado',
    address: 'Av. Benavides 4510, Surco',
    googleMapsUrl: 'https://maps.google.com/?q=Av.+Benavides+4510+Surco+Lima',
    wazeUrl: 'https://waze.com/ul?q=Av.%20Benavides%204510%20Surco',
    panoramaUrl: '/images/pano-sede-surco.webp',
    hotspots: [
      {
        id: 'sede-surco-hs-1',
        type: 'info',
        label: 'Ingreso Vehicular Privado',
        description: 'Cochera individual automatizada con túnel de iluminación LED azul y acceso directo sin contacto visual.',
        x: 29,
        y: 50,
        pitch: -12.40,
        yaw: -22.10,
      },
      {
        id: 'sede-surco-hs-2',
        type: 'nav',
        label: 'Explorar Suites Temáticas',
        description: 'Recorre nuestras suites con jacuzzi y cromoterapia en 360°.',
        targetUrl: '/habitaciones/suite-neon-jacuzzi',
        x: 78,
        y: 50,
        pitch: -10.80,
        yaw: 24.50,
      },
    ],
    roomSlugs: ['suite-neon-jacuzzi', 'suite-luxury', 'suite-ejecutiva'],
  },
  {
    slug: 'lince',
    name: 'Sede Lince',
    shortName: 'Lince',
    tagline: 'Ubicación céntrica y suites temáticas con iluminación neón envolvente',
    scheduleInfo: 'Abierto 24 horas • Estacionamiento privado',
    address: 'Av. Arequipa 2180, Lince',
    googleMapsUrl: 'https://maps.google.com/?q=Av.+Arequipa+2180+Lince+Lima',
    wazeUrl: 'https://waze.com/ul?q=Av.%20Arequipa%202180%20Lince',
    panoramaUrl: '/images/pano-sede-surco.webp',
    hotspots: [
      {
        id: 'sede-lince-hs-1',
        type: 'info',
        label: 'Ingreso Vehicular Privado',
        description: 'Acceso vehicular discreto 24/7 con portón eléctrico individual.',
        x: 29,
        y: 50,
        pitch: -12.40,
        yaw: -22.10,
      },
      {
        id: 'sede-lince-hs-2',
        type: 'nav',
        label: 'Explorar Suites Temáticas',
        targetUrl: '/habitaciones/suite-neon-jacuzzi',
        x: 78,
        y: 50,
        pitch: -10.80,
        yaw: 24.50,
      },
    ],
    roomSlugs: ['suite-neon-jacuzzi', 'suite-luxury', 'suite-ejecutiva'],
  },
  {
    slug: 'miraflores',
    name: 'Sede Miraflores',
    shortName: 'Miraflores',
    tagline: 'Diseño boutique vanguardista y máxima sofisticación cerca al malecón',
    scheduleInfo: 'Abierto 24 horas • Estacionamiento privado',
    address: 'Av. Angamos Oeste 640, Miraflores',
    googleMapsUrl: 'https://maps.google.com/?q=Av.+Angamos+Oeste+640+Miraflores+Lima',
    wazeUrl: 'https://waze.com/ul?q=Av.%20Angamos%20Oeste%20640%20Miraflores',
    panoramaUrl: '/images/pano-sede-surco.webp',
    hotspots: [
      {
        id: 'sede-miraflores-hs-1',
        type: 'info',
        label: 'Ingreso Vehicular Privado',
        description: 'Valet y cochera privada subterránea con ascensor directo al piso de suites.',
        x: 29,
        y: 50,
        pitch: -12.40,
        yaw: -22.10,
      },
      {
        id: 'sede-miraflores-hs-2',
        type: 'nav',
        label: 'Explorar Suites Temáticas',
        targetUrl: '/habitaciones/suite-luxury',
        x: 78,
        y: 50,
        pitch: -10.80,
        yaw: 24.50,
      },
    ],
    roomSlugs: ['suite-neon-jacuzzi', 'suite-luxury', 'suite-ejecutiva'],
  },
  {
    slug: 'san-borja',
    name: 'Sede San Borja',
    shortName: 'San Borja',
    tagline: 'Amplitud arquitectónica, acústica aislada y confort de primer nivel',
    scheduleInfo: 'Abierto 24 horas • Estacionamiento privado',
    address: 'Av. Aviación 2850, San Borja',
    googleMapsUrl: 'https://maps.google.com/?q=Av.+Aviacion+2850+San+Borja+Lima',
    wazeUrl: 'https://waze.com/ul?q=Av.%20Aviacion%202850%20San%20Borja',
    panoramaUrl: '/images/pano-sede-surco.webp',
    hotspots: [
      {
        id: 'sede-sanborja-hs-1',
        type: 'info',
        label: 'Ingreso Vehicular Privado',
        description: 'Estacionamiento privado cubierto con check-in exprés desde tu vehículo.',
        x: 29,
        y: 50,
        pitch: -12.40,
        yaw: -22.10,
      },
      {
        id: 'sede-sanborja-hs-2',
        type: 'nav',
        label: 'Explorar Suites Temáticas',
        targetUrl: '/habitaciones/suite-neon-jacuzzi',
        x: 78,
        y: 50,
        pitch: -10.80,
        yaw: 24.50,
      },
    ],
    roomSlugs: ['suite-neon-jacuzzi', 'suite-luxury', 'suite-ejecutiva'],
  },
  {
    slug: 'los-olivos',
    name: 'Sede Los Olivos',
    shortName: 'Los Olivos',
    tagline: 'El oasis boutique más moderno y exclusivo de Lima Norte',
    scheduleInfo: 'Abierto 24 horas • Estacionamiento privado',
    address: 'Av. Carlos Izaguirre 940, Los Olivos',
    googleMapsUrl: 'https://maps.google.com/?q=Av.+Carlos+Izaguirre+940+Los+Olivos+Lima',
    wazeUrl: 'https://waze.com/ul?q=Av.%20Carlos%20Izaguirre%20940%20Los%20Olivos',
    panoramaUrl: '/images/pano-sede-surco.webp',
    hotspots: [
      {
        id: 'sede-losolivos-hs-1',
        type: 'info',
        label: 'Ingreso Vehicular Privado',
        description: 'Doble carril de ingreso privado y cocheras individuales con cierre automático.',
        x: 29,
        y: 50,
        pitch: -12.40,
        yaw: -22.10,
      },
      {
        id: 'sede-losolivos-hs-2',
        type: 'nav',
        label: 'Explorar Suites Temáticas',
        targetUrl: '/habitaciones/suite-ejecutiva',
        x: 78,
        y: 50,
        pitch: -10.80,
        yaw: 24.50,
      },
    ],
    roomSlugs: ['suite-neon-jacuzzi', 'suite-luxury', 'suite-ejecutiva'],
  },
];

export const ROOMS: RoomItem[] = [
  {
    slug: 'suite-neon-jacuzzi',
    title: 'Suite Neón Jacuzzi',
    sedeSlug: 'surco',
    sedeName: 'Sede Surco',
    address: 'Av. Benavides 4510, Surco',
    priceText: 'S/ 180',
    priceNumeric: 180,
    durationText: '4 Horas',
    cardImage: '/images/real360-thumb-jacuzzi.webp',
    ambientImage: '/images/real360-thumb-cama.webp',
    amenities: [
      'Jacuzzi con hidromasaje y juego de luces',
      'Sillón tántrico y ruleta lúdica en suite',
      'Cama King Size con espejo panorámico en techo',
      'Sistema de sonido Bluetooth y Smart TV 55"',
    ],
    scenes: [
      {
        id: 'scene-1',
        title: 'Jacuzzi (Principal)',
        adminTitle: 'Principal',
        isPrimary: true,
        isEquirectangular: true,
        initialYaw: 28,
        initialPitch: -12,
        fileSizeWebP: '1.2 MB WebP',
        panoramaUrl: '/images/web 3.webp',
        thumbUrl: '/images/real360-thumb-jacuzzi.webp',
        hotspots: [
          {
            id: 'hs-jacuzzi',
            type: 'info',
            label: 'Jacuzzi con Hidromasaje',
            adminLabel: 'Jacuzzi',
            description: 'Tina circular de hidromasaje para 2 personas con agua temperada, acabados en madera y jets regulables.',
            x: 64,
            y: 64,
            pitch: -23.66,
            yaw: 50.50,
          },
          {
            id: 'hs-descanso',
            type: 'nav',
            label: 'Ir a Zona de Descanso',
            adminLabel: 'Ir a Zona de Descanso',
            description: 'Cambiar al ángulo de Cama King Size y Espejos.',
            targetSceneId: 'scene-2',
            x: 34,
            y: 55,
            pitch: -14.80,
            yaw: -42.38,
          },
          {
            id: 'hs-ruleta',
            type: 'info',
            label: 'Ruleta & Juegos Temáticos',
            adminLabel: 'Ruleta Lúdica',
            description: 'Ruleta de retos para parejas y guía de posiciones junto al sillón tántrico.',
            x: 81,
            y: 45,
            pitch: 6.20,
            yaw: 110.00,
          },
        ],
      },
      {
        id: 'scene-2',
        title: 'Cama Temática',
        adminTitle: 'Cama King',
        isEquirectangular: true,
        initialYaw: -85,
        initialPitch: -10,
        fileSizeWebP: '1.1 MB WebP',
        panoramaUrl: '/images/web 1.webp',
        thumbUrl: '/images/real360-thumb-cama.webp',
        hotspots: [
          {
            id: 'hs-cama-king',
            type: 'info',
            label: 'Cama King Size & Espejo Cenital',
            adminLabel: 'Cama King Size',
            description: 'Cama King con espejo panorámico en techo, iluminación LED circular y teléfono de Room Service.',
            x: 21,
            y: 62,
            pitch: -18.20,
            yaw: -102.00,
          },
          {
            id: 'hs-ir-bano-2',
            type: 'nav',
            label: 'Entrar a Baño Privado',
            adminLabel: 'Hacia Baño Privado',
            targetSceneId: 'scene-4',
            x: 63,
            y: 54,
            pitch: -8.00,
            yaw: 46.00,
          },
          {
            id: 'hs-volver-jacuzzi',
            type: 'nav',
            label: 'Ir a Vista Jacuzzi',
            adminLabel: 'Hacia Escena 1',
            targetSceneId: 'scene-1',
            x: 6,
            y: 58,
            pitch: -15.00,
            yaw: -158.00,
          },
        ],
      },
      {
        id: 'scene-3',
        title: 'Sillón Tántrico',
        adminTitle: 'Sillón & Juegos',
        isEquirectangular: true,
        initialYaw: 122,
        initialPitch: -18,
        fileSizeWebP: '1.1 MB WebP',
        panoramaUrl: '/images/web 3.webp',
        thumbUrl: '/images/real360-thumb-sillon.webp',
        hotspots: [
          {
            id: 'hs-sillon-info',
            type: 'info',
            label: 'Sillón Tántrico Ergonómico',
            adminLabel: 'Sillón Tántrico',
            description: 'Diseño anatómico en eco-cuero rojo sanitizado con ozono antes de cada ingreso.',
            x: 88,
            y: 78,
            pitch: -36.10,
            yaw: 135.20,
          },
          {
            id: 'hs-ir-lounge',
            type: 'nav',
            label: 'Ver Zona Lounge & TV',
            adminLabel: 'Hacia Escena 5',
            targetSceneId: 'scene-5',
            x: 48,
            y: 56,
            pitch: -12.00,
            yaw: 10.50,
          },
        ],
      },
      {
        id: 'scene-4',
        title: 'Baño Privado',
        adminTitle: 'Baño',
        isEquirectangular: true,
        initialYaw: 35,
        initialPitch: -8,
        fileSizeWebP: '0.9 MB WebP',
        panoramaUrl: '/images/wep 2.webp',
        thumbUrl: '/images/real360-thumb-bano.webp',
        hotspots: [
          {
            id: 'hs-ducha-esp',
            type: 'info',
            label: 'Baño en Mármol & Ducha Española',
            adminLabel: 'Ducha Española',
            description: 'Acabados en mármol veteado, secadora de cabello, espejo facial y cabina de ducha templada.',
            x: 26,
            y: 64,
            pitch: -22.40,
            yaw: -84.80,
          },
          {
            id: 'hs-volver-principal',
            type: 'nav',
            label: 'Volver a Suite & Jacuzzi',
            adminLabel: 'Hacia Escena 1',
            targetSceneId: 'scene-1',
            x: 73,
            y: 56,
            pitch: -12.10,
            yaw: 82.20,
          },
        ],
      },
      {
        id: 'scene-5',
        title: 'Ingreso & Lounge',
        adminTitle: 'Ingreso',
        isEquirectangular: true,
        initialYaw: -45,
        initialPitch: -10,
        fileSizeWebP: '1.0 MB WebP',
        panoramaUrl: '/images/wep.webp',
        thumbUrl: '/images/real360-thumb-lounge.webp',
        hotspots: [
          {
            id: 'hs-ingreso-priv',
            type: 'info',
            label: 'Sala Lounge & Room Service',
            adminLabel: 'Sala Lounge',
            description: 'Butacas de descanso con mesa para cenas, bebidas y carta confidencial a la habitación.',
            x: 42,
            y: 70,
            pitch: -28.00,
            yaw: -26.30,
          },
          {
            id: 'hs-smart-tv',
            type: 'info',
            label: 'Smart TV 55" & Climatización',
            adminLabel: 'Smart TV 55"',
            description: 'Pantalla 4K orientada hacia la cama y el jacuzzi con aire acondicionado Split.',
            x: 54,
            y: 34,
            pitch: 22.00,
            yaw: 14.00,
          },
          {
            id: 'hs-lounge-to-jacuzzi',
            type: 'nav',
            label: 'Ir a Jacuzzi Climatizado',
            adminLabel: 'Hacia Escena 1',
            targetSceneId: 'scene-1',
            x: 8,
            y: 65,
            pitch: -20.00,
            yaw: -155.00,
          },
        ],
      },
      {
        id: 'scene-6',
        title: 'Vista 360°',
        adminTitle: 'Vista General 360°',
        isEquirectangular: true,
        initialYaw: -15,
        initialPitch: -8,
        fileSizeWebP: '1.3 MB WebP',
        panoramaUrl: '/images/web 1.webp',
        thumbUrl: '/images/real360-thumb-vista360.webp',
        hotspots: [
          {
            id: 'hs-sonido-bt',
            type: 'info',
            label: 'Climatización & Audio Bluetooth',
            adminLabel: 'Sistema Bluetooth',
            description: 'Aire acondicionado silencioso y audio envolvente en toda la suite.',
            x: 62,
            y: 22,
            pitch: 32.50,
            yaw: 42.00,
          },
          {
            id: 'hs-ir-escena-1',
            type: 'nav',
            label: 'Ir a Jacuzzi Principal',
            adminLabel: 'Hacia Escena 1',
            targetSceneId: 'scene-1',
            x: 6,
            y: 58,
            pitch: -16.30,
            yaw: -158.10,
          },
        ],
      },
    ],
  },
  {
    slug: 'suite-luxury',
    title: 'Suite Luxury',
    sedeSlug: 'surco',
    sedeName: 'Sede Surco',
    address: 'Av. Benavides 4510, Surco',
    priceText: 'S/ 150',
    priceNumeric: 150,
    durationText: '4 Horas',
    cardImage: '/images/real360-thumb-cama.webp',
    ambientImage: '/images/real360-thumb-lounge.webp',
    amenities: [
      'Cama King Size Deluxe con espejo cenital e iluminación cálida',
      'Zona Lounge con butacas rojas de diseño y Smart TV 55"',
      'Baño privado en mármol con ducha española de alta presión',
      'Climatización inteligente, jacuzzi y cochera privada',
    ],
    scenes: [
      {
        id: 'lux-scene-1',
        title: 'Suite & Cama King (Principal)',
        adminTitle: 'Principal',
        isPrimary: true,
        isEquirectangular: true,
        initialYaw: -75,
        initialPitch: -10,
        fileSizeWebP: '1.1 MB WebP',
        panoramaUrl: '/images/web 1.webp',
        thumbUrl: '/images/real360-thumb-cama.webp',
        hotspots: [
          {
            id: 'lux-hs-1',
            type: 'info',
            label: 'Cama King Deluxe & Espejos',
            description: 'Iluminación cálida circular y espejo panorámico superior.',
            x: 22,
            y: 62,
            pitch: -18.20,
            yaw: -102.40,
          },
          {
            id: 'lux-hs-2',
            type: 'nav',
            label: 'Ir a Zona de Jacuzzi',
            targetSceneId: 'lux-scene-2',
            x: 64,
            y: 54,
            pitch: -10.80,
            yaw: 46.20,
          },
        ],
      },
      {
        id: 'lux-scene-2',
        title: 'Zona de Hidromasaje',
        adminTitle: 'Jacuzzi',
        isEquirectangular: true,
        initialYaw: 42,
        initialPitch: -14,
        fileSizeWebP: '1.2 MB WebP',
        panoramaUrl: '/images/web 3.webp',
        thumbUrl: '/images/real360-thumb-jacuzzi.webp',
        hotspots: [
          {
            id: 'lux-hs-3',
            type: 'info',
            label: 'Jacuzzi Circular Climatizado',
            description: 'Hidromasaje para 2 personas con acabado en madera.',
            x: 64,
            y: 64,
            pitch: -23.00,
            yaw: 50.10,
          },
          {
            id: 'lux-hs-4',
            type: 'nav',
            label: 'Ver Baño en Mármol',
            targetSceneId: 'lux-scene-3',
            x: 41,
            y: 52,
            pitch: -8.00,
            yaw: -32.00,
          },
        ],
      },
      {
        id: 'lux-scene-3',
        title: 'Baño en Mármol',
        adminTitle: 'Baño',
        isEquirectangular: true,
        initialYaw: -65,
        initialPitch: -10,
        fileSizeWebP: '0.9 MB WebP',
        panoramaUrl: '/images/wep 2.webp',
        thumbUrl: '/images/real360-thumb-bano.webp',
        hotspots: [
          {
            id: 'lux-hs-5',
            type: 'nav',
            label: 'Volver a la Suite',
            targetSceneId: 'lux-scene-1',
            x: 73,
            y: 56,
            pitch: -12.00,
            yaw: 82.00,
          },
        ],
      },
    ],
  },
  {
    slug: 'suite-ejecutiva',
    title: 'Suite Ejecutiva',
    sedeSlug: 'surco',
    sedeName: 'Sede Surco',
    address: 'Av. Benavides 4510, Surco',
    priceText: 'S/ 120',
    priceNumeric: 120,
    durationText: '4 Horas',
    cardImage: '/images/real360-thumb-lounge.webp',
    ambientImage: '/images/real360-thumb-bano.webp',
    amenities: [
      'Sala Lounge privada para parejas y Room Service 24h',
      'Cama King ortopédica y sillón tántrico',
      'Ducha española en mármol de alta presión',
      'Smart TV 55", aire acondicionado y sonido Bluetooth',
    ],
    scenes: [
      {
        id: 'eje-scene-1',
        title: 'Suite Ejecutiva & Lounge (Principal)',
        adminTitle: 'Principal',
        isPrimary: true,
        isEquirectangular: true,
        initialYaw: -42,
        initialPitch: -10,
        fileSizeWebP: '1.0 MB WebP',
        panoramaUrl: '/images/wep.webp',
        thumbUrl: '/images/real360-thumb-lounge.webp',
        hotspots: [
          {
            id: 'eje-hs-1',
            type: 'info',
            label: 'Zona Lounge & Descanso',
            description: 'Butacas confortables, Smart TV 55" y mesa de servicio.',
            x: 42,
            y: 70,
            pitch: -28.50,
            yaw: -26.20,
          },
          {
            id: 'eje-hs-2',
            type: 'nav',
            label: 'Ver Baño Privado 360°',
            targetSceneId: 'eje-scene-2',
            x: 38,
            y: 52,
            pitch: -8.00,
            yaw: -40.00,
          },
        ],
      },
      {
        id: 'eje-scene-2',
        title: 'Baño Privado 360°',
        adminTitle: 'Baño',
        isEquirectangular: true,
        initialYaw: 25,
        initialPitch: -10,
        fileSizeWebP: '0.9 MB WebP',
        panoramaUrl: '/images/wep 2.webp',
        thumbUrl: '/images/real360-thumb-bano.webp',
        hotspots: [
          {
            id: 'eje-hs-3',
            type: 'nav',
            label: 'Volver a Suite Ejecutiva',
            targetSceneId: 'eje-scene-1',
            x: 73,
            y: 56,
            pitch: -12.00,
            yaw: 82.00,
          },
        ],
      },
    ],
  },
];

export const SERVICES: ServiceItem[] = [
  {
    slug: 'packs-decoracion-celebraciones',
    title: 'Packs de Decoración & Celebraciones',
    category: 'Decoraciones',
    priceText: 'S/ 90',
    priceSubtext: '(Ad-on)',
    topBarPriceText: 'Desde S/ 90',
    description: 'Decoraciones especiales para noches de festejo.',
    sedesBadges: ['Sede Lince', 'Sede Surco'],
    sedesFilter: ['Lince', 'Surco', 'San Borja'],
    availabilityTitle: 'Disponible en Sede Surco, Lince y San Borja',
    address: 'Av. Benavides 4510, Surco',
    featuredTall: true,
    cardImage: '/images/service-decoracion.webp',
    amenitiesTitle: 'Equipamiento:',
    amenities: [
      'Pétalos de rosas naturales en cama y camino',
      'Decoración con globos y velas aromáticas',
      'Botella de espumante o vino de cortesía',
      'Iluminación temática personalizada',
    ],
    scenes: [
      {
        id: 'serv-scene-1',
        title: 'Vista Cama (Principal)',
        isPrimary: true,
        fileSizeWebP: '1.2 MB WebP',
        panoramaUrl: '/images/pano-servicio-decoracion.webp',
        thumbUrl: '/images/thumb-cama-decorada.webp',
        hotspots: [
          {
            id: 'serv-hs-1',
            type: 'info',
            label: 'Pétalos de Rosas & Arreglos',
            description: 'Arreglo artesanal sobre cama King con pétalos frescos, cisnes de toalla y velas LED cálidas.',
            x: 23,
            y: 60,
            pitch: -21.40,
            yaw: -14.20,
          },
          {
            id: 'serv-hs-2',
            type: 'info',
            label: 'Iluminación de Celebración',
            description: 'Escena lumínica romántica en tonos carmesí y violeta con dimmer regulable.',
            x: 65,
            y: 52,
            pitch: -16.80,
            yaw: 18.50,
          },
        ],
      },
      {
        id: 'serv-scene-2',
        title: 'Vista Jacuzzi Decorado',
        fileSizeWebP: '1.1 MB WebP',
        panoramaUrl: '/images/service-jacuzzi.webp',
        thumbUrl: '/images/thumb-jacuzzi-decorado.webp',
        hotspots: [
          {
            id: 'serv-hs-3',
            type: 'info',
            label: 'Sales Aromáticas & Espuma',
            description: 'Preparación especial del jacuzzi con espuma floral y cromoterapia.',
            x: 48,
            y: 58,
            pitch: -20.00,
            yaw: 4.00,
          },
        ],
      },
      {
        id: 'serv-scene-3',
        title: 'Mesa de Bienvenida',
        fileSizeWebP: '0.9 MB WebP',
        panoramaUrl: '/images/pano-promo-celebracion.webp',
        thumbUrl: '/images/thumb-mesa-bienvenida.webp',
        hotspots: [
          {
            id: 'serv-hs-4',
            type: 'info',
            label: 'Espumante Helado & Copas',
            description: 'Frapera de acero inoxidable con botella de espumante y fresas con chocolate.',
            x: 70,
            y: 55,
            pitch: -18.50,
            yaw: 21.00,
          },
        ],
      },
      {
        id: 'serv-scene-4',
        title: 'Detalle de Velas',
        fileSizeWebP: '0.8 MB WebP',
        panoramaUrl: '/images/pano-servicio-decoracion.webp',
        thumbUrl: '/images/thumb-detalle-velas.webp',
        hotspots: [],
      },
      {
        id: 'serv-scene-5',
        title: 'Iluminación Neón',
        fileSizeWebP: '1.0 MB WebP',
        panoramaUrl: '/images/pano-suite-neon.webp',
        thumbUrl: '/images/thumb-iluminacion-neon.webp',
        hotspots: [],
      },
      {
        id: 'serv-scene-6',
        title: 'Ingreso Suite',
        fileSizeWebP: '0.9 MB WebP',
        panoramaUrl: '/images/bento-servicios.webp',
        thumbUrl: '/images/thumb-ingreso-suite.webp',
        hotspots: [],
      },
    ],
  },
  {
    slug: 'sillon-tantrico',
    title: 'Sillón Tántrico',
    category: 'Sillón Tántrico',
    priceText: 'S/ 40',
    topBarPriceText: 'Desde S/ 40',
    description: 'Mobiliario ergonómico de diseño para experiencias en pareja.',
    sedesBadges: ['Todas las sedes'],
    sedesFilter: ['Surco', 'Lince', 'Miraflores', 'San Borja', 'Los Olivos'],
    availabilityTitle: 'Disponible en Todas las Sedes',
    address: 'Av. Benavides 4510, Surco',
    has360Badge: true,
    cardImage: '/images/service-sillon-1.webp',
    amenitiesTitle: 'Equipamiento:',
    amenities: [
      'Curvas ergonómicas de doble soporte anatómico',
      'Tapizado en eco-cuero hipoalergénico de alta resistencia',
      'Desinfección certificada con luz UV y ozono antes de cada ingreso',
      'Ubicación frente a espejo panorámico e iluminación neón',
    ],
    scenes: [
      {
        id: 'sillon-scene-1',
        title: 'Vista Sillón & Cama (Principal)',
        isPrimary: true,
        fileSizeWebP: '1.1 MB WebP',
        panoramaUrl: '/images/service-sillon-1.webp',
        thumbUrl: '/images/thumb-sillon-tantrico.webp',
        hotspots: [
          {
            id: 'sillon-hs-1',
            type: 'info',
            label: 'Sillón Tántrico Curvo',
            description: 'Incluido en Suites Neón Jacuzzi o disponible como ad-on en cualquier suite.',
            x: 58,
            y: 62,
            pitch: -24.00,
            yaw: 10.50,
          },
        ],
      },
    ],
  },
  {
    slug: 'sillon-tantrico-lounge',
    title: 'Sillón Tántrico',
    category: 'Packs',
    priceText: 'S/ 40',
    topBarPriceText: 'Desde S/ 40',
    description: 'Zona lounge privada con sillón tántrico e iluminación púrpura.',
    sedesBadges: ['Sede Miraflores', 'Sede Surco'],
    sedesFilter: ['Miraflores', 'Surco'],
    availabilityTitle: 'Disponible en Sede Surco y Miraflores',
    address: 'Av. Benavides 4510, Surco',
    has360Badge: true,
    cardImage: '/images/service-sillon-2.webp',
    amenitiesTitle: 'Equipamiento:',
    amenities: [
      'Amplitud lateral para mayor comodidad',
      'Iluminación perimetral violeta/magenta sincronizada',
      'Sistema de audio Bluetooth conectado en sala',
    ],
    scenes: [
      {
        id: 'sillon2-scene-1',
        title: 'Zona Lounge Tántrica',
        isPrimary: true,
        fileSizeWebP: '1.0 MB WebP',
        panoramaUrl: '/images/service-sillon-2.webp',
        thumbUrl: '/images/thumb-sillon-tantrico.webp',
        hotspots: [
          {
            id: 'sillon2-hs-1',
            type: 'info',
            label: 'Zona Lounge & Espejos',
            description: 'Distribución amplia con privacidad acústica total.',
            x: 64,
            y: 60,
            pitch: -22.10,
            yaw: 12.80,
          },
        ],
      },
    ],
  },
  {
    slug: 'jacuzzi-con-hidromasaje',
    title: 'Jacuzzi con Hidromasaje',
    category: 'Jacuzzi',
    priceText: 'S/ 60',
    topBarPriceText: 'Desde S/ 60',
    description: 'Upgrade a suite con jacuzzi climatizado, jets de masaje y luces LED.',
    sedesBadges: ['Todas las sedes'],
    sedesFilter: ['Surco', 'Lince', 'Miraflores', 'San Borja', 'Los Olivos'],
    availabilityTitle: 'Disponible en Todas las Sedes',
    address: 'Av. Benavides 4510, Surco',
    cardImage: '/images/service-jacuzzi.webp',
    amenitiesTitle: 'Equipamiento:',
    amenities: [
      'Hidromasaje de 8 jets direccionales de alta potencia',
      'Agua caliente instantánea con llenado ultrarrápido',
      'Cromoterapia subacuática LED y sales de baño',
      'Cabeceras acolchadas para 2 personas',
    ],
    scenes: [
      {
        id: 'jac-scene-1',
        title: 'Jacuzzi Climatizado 360°',
        isPrimary: true,
        fileSizeWebP: '1.2 MB WebP',
        panoramaUrl: '/images/pano-suite-neon.webp',
        thumbUrl: '/images/thumb-jacuzzi-principal.webp',
        hotspots: [
          {
            id: 'jac-hs-1',
            type: 'info',
            label: 'Jacuzzi con Hidromasaje',
            description: 'Control digital de temperatura y burbujas.',
            x: 24,
            y: 60,
            pitch: -23.66,
            yaw: 8.50,
          },
        ],
      },
    ],
  },
  {
    slug: 'juegos-y-juguetes-tematicos',
    title: 'Juegos y Juguetes Temáticos',
    category: 'Packs',
    priceText: 'S/ 30',
    topBarPriceText: 'Desde S/ 30',
    description: 'Catálogo confidencial de juegos de parejas y accesorios sensoriales.',
    sedesBadges: ['Todas las sedes'],
    sedesFilter: ['Surco', 'Lince', 'Miraflores', 'San Borja', 'Los Olivos'],
    availabilityTitle: 'Disponible en Todas las Sedes',
    address: 'Av. Benavides 4510, Surco',
    cardImage: '/images/service-juegos.webp',
    amenitiesTitle: 'Equipamiento:',
    amenities: [
      'Juegos de cartas y dados eróticos para parejas',
      'Kits sensoriales con antifaz de satén, plumas y aceites de masaje',
      'Entrega sellada y 100% confidencial por esclusa privada',
    ],
    scenes: [
      {
        id: 'jue-scene-1',
        title: 'Exhibición Neón en Suite',
        isPrimary: true,
        fileSizeWebP: '0.9 MB WebP',
        panoramaUrl: '/images/service-juegos.webp',
        thumbUrl: '/images/service-juegos.webp',
        hotspots: [
          {
            id: 'jue-hs-1',
            type: 'info',
            label: 'Kits & Juegos Sellados',
            description: 'Solicítalos por WhatsApp o desde el menú QR dentro de tu habitación.',
            x: 50,
            y: 50,
            pitch: -14.20,
            yaw: 3.10,
          },
        ],
      },
    ],
  },
];

export const PROMOTIONS: PromoItem[] = [
  {
    slug: 'suite-neon-jacuzzi-promo',
    title: 'Suite Neón Jacuzzi',
    detailHeaderTitle: 'Suite Neón Jacuzzi — -25% OFF Especial',
    badgeText: '-25% OFF',
    sedesLabel: 'Sede Surco • Sede Lince',
    sedesFilter: ['Surco', 'Lince'],
    validUntil: '30 Nov 2026',
    oldPrice: 'S/ 190',
    promoPrice: 'S/ 140',
    cardImage: '/images/promo-suite-neon.webp',
    availabilityTitle: 'Disponible en Sede Surco y Sede Lince',
    includesList: [
      '4 horas en Suite Neón Jacuzzi para 2 personas',
      'Uso ilimitado de jacuzzi con hidromasaje y cromoterapia LED',
      'Sillón tántrico, Cama King Size y audio Bluetooth',
      '2 bebidas de bienvenida de cortesía',
      'Cochera privada automatizada incluida',
    ],
    scenes: [
      {
        id: 'pr1-scene-1',
        title: 'Jacuzzi (Principal)',
        isPrimary: true,
        fileSizeWebP: '1.2 MB WebP',
        panoramaUrl: '/images/pano-suite-neon.webp',
        thumbUrl: '/images/thumb-jacuzzi-principal.webp',
        hotspots: [
          {
            id: 'pr1-hs-1',
            type: 'info',
            label: 'Jacuzzi con Hidromasaje',
            description: 'Tarifa promocional S/ 140 reservando vía WhatsApp.',
            x: 23,
            y: 59,
            pitch: -23.66,
            yaw: 8.50,
          },
          {
            id: 'pr1-hs-2',
            type: 'nav',
            label: 'Ir a Zona de Descanso',
            targetSceneId: 'pr1-scene-2',
            x: 63,
            y: 51,
            pitch: -27.80,
            yaw: -13.38,
          },
        ],
      },
      {
        id: 'pr1-scene-2',
        title: 'Cama Temática',
        fileSizeWebP: '1.1 MB WebP',
        panoramaUrl: '/images/service-sillon-1.webp',
        thumbUrl: '/images/thumb-cama-tematica.webp',
        hotspots: [],
      },
      {
        id: 'pr1-scene-3',
        title: 'Sillón Tántrico',
        fileSizeWebP: '0.9 MB WebP',
        panoramaUrl: '/images/service-sillon-2.webp',
        thumbUrl: '/images/thumb-sillon-tantrico.webp',
        hotspots: [],
      },
    ],
  },
  {
    slug: 'pack-celebracion-rosas',
    title: 'Pack Celebración & Rosas',
    detailHeaderTitle: 'Pack Celebración & Rosas — Promoción Especial',
    badgeText: 'NOCHE ROMÁNTICA',
    sedesLabel: 'Todas las sedes',
    sedesFilter: ['Lince', 'Miraflores', 'San Borja', 'Surco', 'Los Olivos'],
    validUntil: '31 Dic 2026',
    oldPrice: 'S/ 260',
    promoPrice: 'S/ 210',
    cardImage: '/images/promo-noche-romantica.webp',
    availabilityTitle: 'Disponible en Todas las Sedes',
    includesList: [
      'Decoración con pétalos de rosas naturales en cama y camino',
      'Arreglo especial de globos y velas aromáticas',
      'Botella de espumante o vino de cortesía',
      'Trufas o bombones finos',
      'Acceso libre a jacuzzi y todas las instalaciones de la suite',
    ],
    scenes: [
      {
        id: 'pr2-scene-1',
        title: 'Vista Cama (Principal)',
        isPrimary: true,
        fileSizeWebP: '1.2 MB WebP',
        panoramaUrl: '/images/pano-promo-celebracion.webp',
        thumbUrl: '/images/thumb-cama-decorada.webp',
        hotspots: [
          {
            id: 'pr2-hs-1',
            type: 'info',
            label: 'Pétalos de Rosas & Arreglos',
            description: 'Corazón de pétalos de rosas rojas naturales en piso y cama con velas cálidas.',
            x: 23,
            y: 61,
            pitch: -22.40,
            yaw: -15.10,
          },
          {
            id: 'pr2-hs-2',
            type: 'info',
            label: 'Botella de Espumante & Detalles',
            description: 'Mesa de bienvenida con espumante en frapera, copas de cristal y bombones finos.',
            x: 67,
            y: 52,
            pitch: -17.90,
            yaw: 19.80,
          },
        ],
      },
      {
        id: 'pr2-scene-2',
        title: 'Mesa de Bienvenida',
        fileSizeWebP: '1.0 MB WebP',
        panoramaUrl: '/images/pano-servicio-decoracion.webp',
        thumbUrl: '/images/thumb-mesa-bienvenida.webp',
        hotspots: [],
      },
      {
        id: 'pr2-scene-3',
        title: 'Jacuzzi Decorado',
        fileSizeWebP: '1.1 MB WebP',
        panoramaUrl: '/images/service-jacuzzi.webp',
        thumbUrl: '/images/thumb-jacuzzi-decorado.webp',
        hotspots: [],
      },
      {
        id: 'pr2-scene-4',
        title: 'Detalle de Velas',
        fileSizeWebP: '0.9 MB WebP',
        panoramaUrl: '/images/pano-promo-celebracion.webp',
        thumbUrl: '/images/thumb-detalle-velas.webp',
        hotspots: [],
      },
      {
        id: 'pr2-scene-5',
        title: 'Ingreso de la Suite',
        fileSizeWebP: '0.9 MB WebP',
        panoramaUrl: '/images/bento-servicios.webp',
        thumbUrl: '/images/thumb-ingreso-suite.webp',
        hotspots: [],
      },
      {
        id: 'pr2-scene-6',
        title: 'Ingreso de la Sede',
        fileSizeWebP: '1.1 MB WebP',
        panoramaUrl: '/images/pano-sede-surco.webp',
        thumbUrl: '/images/thumb-ingreso.webp',
        hotspots: [],
      },
    ],
  },
  {
    slug: 'jacuzzi-espumante',
    title: 'Jacuzzi & Espumante',
    detailHeaderTitle: 'Jacuzzi & Espumante — Pack Especial',
    badgeText: 'PACK JACUZZI',
    sedesLabel: 'Sede Miraflores',
    sedesFilter: ['Miraflores'],
    validUntil: '30 Nov 2026',
    oldPrice: 'S/ 210',
    promoPrice: 'S/ 165',
    cardImage: '/images/promo-pack-jacuzzi.webp',
    availabilityTitle: 'Disponible en Sede Miraflores',
    includesList: [
      'Estadía de 4 horas en Suite con Jacuzzi Hidromasaje',
      'Botella de espumante Riccadonna o Tabernero Especial en frapera',
      'Sales efervescentes y espuma aromática para el jacuzzi',
      'Late check-out sujeto a disponibilidad',
    ],
    scenes: [
      {
        id: 'pr3-scene-1',
        title: 'Jacuzzi Climatizado (Principal)',
        isPrimary: true,
        fileSizeWebP: '1.2 MB WebP',
        panoramaUrl: '/images/pano-suite-neon.webp',
        thumbUrl: '/images/thumb-jacuzzi-principal.webp',
        hotspots: [
          {
            id: 'pr3-hs-1',
            type: 'info',
            label: 'Jacuzzi & Cromoterapia',
            description: 'Incluye preparación con sales relajantes y botella de espumante.',
            x: 24,
            y: 59,
            pitch: -23.66,
            yaw: 8.50,
          },
        ],
      },
    ],
  },
];

export interface Hotspot360 {
  id: string;
  type: 'info' | 'nav';
  label: string;
  adminLabel?: string;
  description?: string;
  targetSceneId?: string;
  targetUrl?: string;
  imagenDetalleUrl?: string;
  precioAdicional?: number;
  x: number;
  y: number;
  pitch: number;
  yaw: number;
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
  id: string;
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
  id: string;
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
  id: string;
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
  id: string;
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
export const EMPTY_PLACEHOLDER_IMG = '/images/empty-dark.svg';

export const ENTITY_UUID_MAP: Record<string, string> = {
  'sedes:surco': '11111111-1111-4111-8111-111111111101',
  'sedes:lince': '11111111-1111-4111-8111-111111111102',
  'sedes:miraflores': '11111111-1111-4111-8111-111111111103',
  'sedes:san-borja': '11111111-1111-4111-8111-111111111104',
  'sedes:los-olivos': '11111111-1111-4111-8111-111111111105',
  'habitaciones:suite-neon-jacuzzi': '22222222-2222-4222-8222-222222222201',
  'habitaciones:suite-luxury': '22222222-2222-4222-8222-222222222202',
  'habitaciones:suite-ejecutiva': '22222222-2222-4222-8222-222222222203',
  'servicios:packs-decoracion-celebraciones': '33333333-3333-4333-8333-333333333301',
  'servicios:sillon-tantrico': '33333333-3333-4333-8333-333333333302',
  'servicios:sillon-tantrico-lounge': '33333333-3333-4333-8333-333333333303',
  'servicios:jacuzzi-con-hidromasaje': '33333333-3333-4333-8333-333333333304',
  'servicios:juegos-y-juguetes-tematicos': '33333333-3333-4333-8333-333333333305',
  'promociones:suite-neon-jacuzzi-promo': '44444444-4444-4444-8444-444444444401',
  'promociones:pack-celebracion-rosas': '44444444-4444-4444-8444-444444444402',
  'promociones:jacuzzi-espumante': '44444444-4444-4444-8444-444444444403',
};

export const HERO_SLIDES = [
  {
    id: 1,
    headline: 'SENSACIONES\nY PRIVACIDAD',
    subtitle: 'Explora 5 sedes, habitaciones y servicios en 360°.',
    videoUrl: '/videos/Video Project 3.mp4',
    poster: EMPTY_PLACEHOLDER_IMG,
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
    poster: EMPTY_PLACEHOLDER_IMG,
    ctaPrimaryText: 'Explorar 360°',
    ctaPrimaryHref: '/habitaciones/suite-neon-jacuzzi',
    ctaSecondaryText: 'Ver Promociones',
    ctaSecondaryHref: '/promociones',
  },
];

export const SEDES: SedeItem[] = [
  {
    id: '11111111-1111-4111-8111-111111111101',
    slug: 'surco',
    name: 'Sede Surco',
    shortName: 'Surco',
    tagline: 'Privacidad y exclusividad en el corazón del distrito',
    scheduleInfo: 'Abierto 24 horas • Estacionamiento privado',
    address: 'Av. Benavides 4510, Surco',
    googleMapsUrl: 'https://maps.google.com/?q=Av.+Benavides+4510+Surco+Lima',
    wazeUrl: 'https://waze.com/ul?q=Av.%20Benavides%204510%20Surco',
    panoramaUrl: '',
    hotspots: [],
    roomSlugs: ['suite-neon-jacuzzi', 'suite-luxury', 'suite-ejecutiva'],
  },
  {
    id: '11111111-1111-4111-8111-111111111102',
    slug: 'lince',
    name: 'Sede Lince',
    shortName: 'Lince',
    tagline: 'Ubicación céntrica y suites temáticas con iluminación neón envolvente',
    scheduleInfo: 'Abierto 24 horas • Estacionamiento privado',
    address: 'Av. Arequipa 2180, Lince',
    googleMapsUrl: 'https://maps.google.com/?q=Av.+Arequipa+2180+Lince+Lima',
    wazeUrl: 'https://waze.com/ul?q=Av.%20Arequipa%202180%20Lince',
    panoramaUrl: '',
    hotspots: [],
    roomSlugs: ['suite-neon-jacuzzi', 'suite-luxury', 'suite-ejecutiva'],
  },
  {
    id: '11111111-1111-4111-8111-111111111103',
    slug: 'miraflores',
    name: 'Sede Miraflores',
    shortName: 'Miraflores',
    tagline: 'Diseño boutique vanguardista y máxima sofisticación cerca al malecón',
    scheduleInfo: 'Abierto 24 horas • Estacionamiento privado',
    address: 'Av. Angamos Oeste 640, Miraflores',
    googleMapsUrl: 'https://maps.google.com/?q=Av.+Angamos+Oeste+640+Miraflores+Lima',
    wazeUrl: 'https://waze.com/ul?q=Av.%20Angamos%20Oeste%20640%20Miraflores',
    panoramaUrl: '',
    hotspots: [],
    roomSlugs: ['suite-neon-jacuzzi', 'suite-luxury', 'suite-ejecutiva'],
  },
  {
    id: '11111111-1111-4111-8111-111111111104',
    slug: 'san-borja',
    name: 'Sede San Borja',
    shortName: 'San Borja',
    tagline: 'Amplitud arquitectónica, acústica aislada y confort de primer nivel',
    scheduleInfo: 'Abierto 24 horas • Estacionamiento privado',
    address: 'Av. Aviación 2850, San Borja',
    googleMapsUrl: 'https://maps.google.com/?q=Av.+Aviacion+2850+San+Borja+Lima',
    wazeUrl: 'https://waze.com/ul?q=Av.%20Aviacion%202850%20San%20Borja',
    panoramaUrl: '',
    hotspots: [],
    roomSlugs: ['suite-neon-jacuzzi', 'suite-luxury', 'suite-ejecutiva'],
  },
  {
    id: '11111111-1111-4111-8111-111111111105',
    slug: 'los-olivos',
    name: 'Sede Los Olivos',
    shortName: 'Los Olivos',
    tagline: 'El oasis boutique más moderno y exclusivo de Lima Norte',
    scheduleInfo: 'Abierto 24 horas • Estacionamiento privado',
    address: 'Av. Carlos Izaguirre 940, Los Olivos',
    googleMapsUrl: 'https://maps.google.com/?q=Av.+Carlos+Izaguirre+940+Los+Olivos+Lima',
    wazeUrl: 'https://waze.com/ul?q=Av.%20Carlos%20Izaguirre%20940%20Los%20Olivos',
    panoramaUrl: '',
    hotspots: [],
    roomSlugs: ['suite-neon-jacuzzi', 'suite-luxury', 'suite-ejecutiva'],
  },
];

export const ROOMS: RoomItem[] = [
  {
    id: '22222222-2222-4222-8222-222222222201',
    slug: 'suite-neon-jacuzzi',
    title: 'Suite Neón Jacuzzi',
    sedeSlug: 'surco',
    sedeName: 'Sede Surco',
    address: 'Av. Benavides 4510, Surco',
    priceText: 'S/ 180',
    priceNumeric: 180,
    durationText: '4 Horas',
    cardImage: EMPTY_PLACEHOLDER_IMG,
    ambientImage: EMPTY_PLACEHOLDER_IMG,
    amenities: [
      'Jacuzzi con hidromasaje y juego de luces',
      'Sillón tántrico',
      'Cama King Size',
      'Sistema de sonido Bluetooth',
    ],
    scenes: [],
  },
  {
    id: '22222222-2222-4222-8222-222222222202',
    slug: 'suite-luxury',
    title: 'Suite Luxury',
    sedeSlug: 'surco',
    sedeName: 'Sede Surco',
    address: 'Av. Benavides 4510, Surco',
    priceText: 'S/ 150',
    priceNumeric: 150,
    durationText: '4 Horas',
    cardImage: EMPTY_PLACEHOLDER_IMG,
    ambientImage: EMPTY_PLACEHOLDER_IMG,
    amenities: [
      'Cama King Size Deluxe con espejo cenital e iluminación cálida',
      'Zona Lounge con butacas de diseño y Smart TV 55"',
      'Baño privado en mármol con ducha española de alta presión',
      'Climatización inteligente, jacuzzi y cochera privada',
    ],
    scenes: [],
  },
  {
    id: '22222222-2222-4222-8222-222222222203',
    slug: 'suite-ejecutiva',
    title: 'Suite Ejecutiva',
    sedeSlug: 'surco',
    sedeName: 'Sede Surco',
    address: 'Av. Benavides 4510, Surco',
    priceText: 'S/ 120',
    priceNumeric: 120,
    durationText: '4 Horas',
    cardImage: EMPTY_PLACEHOLDER_IMG,
    ambientImage: EMPTY_PLACEHOLDER_IMG,
    amenities: [
      'Sala Lounge privada para parejas y Room Service 24h',
      'Cama King ortopédica y sillón tántrico',
      'Ducha española en mármol de alta presión',
      'Smart TV 55", aire acondicionado y sonido Bluetooth',
    ],
    scenes: [],
  },
];

export const SERVICES: ServiceItem[] = [
  {
    id: '33333333-3333-4333-8333-333333333301',
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
    cardImage: EMPTY_PLACEHOLDER_IMG,
    amenitiesTitle: 'Equipamiento:',
    amenities: [
      'Pétalos de rosas naturales en cama y camino',
      'Decoración con globos y velas aromáticas',
      'Botella de espumante o vino de cortesía',
      'Iluminación temática personalizada',
    ],
    scenes: [],
  },
  {
    id: '33333333-3333-4333-8333-333333333302',
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
    cardImage: EMPTY_PLACEHOLDER_IMG,
    amenitiesTitle: 'Equipamiento:',
    amenities: [
      'Curvas ergonómicas de doble soporte anatómico',
      'Tapizado en eco-cuero hipoalergénico de alta resistencia',
      'Desinfección certificada con luz UV y ozono antes de cada ingreso',
      'Ubicación frente a espejo panorámico e iluminación neón',
    ],
    scenes: [],
  },
  {
    id: '33333333-3333-4333-8333-333333333303',
    slug: 'sillon-tantrico-lounge',
    title: 'Sillón Tántrico Lounge',
    category: 'Packs',
    priceText: 'S/ 40',
    topBarPriceText: 'Desde S/ 40',
    description: 'Zona lounge privada con sillón tántrico e iluminación púrpura.',
    sedesBadges: ['Sede Miraflores', 'Sede Surco'],
    sedesFilter: ['Miraflores', 'Surco'],
    availabilityTitle: 'Disponible en Sede Surco y Miraflores',
    address: 'Av. Benavides 4510, Surco',
    has360Badge: true,
    cardImage: EMPTY_PLACEHOLDER_IMG,
    amenitiesTitle: 'Equipamiento:',
    amenities: [
      'Amplitud lateral para mayor comodidad',
      'Iluminación perimetral violeta/magenta sincronizada',
      'Sistema de audio Bluetooth conectado en sala',
    ],
    scenes: [],
  },
  {
    id: '33333333-3333-4333-8333-333333333304',
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
    cardImage: EMPTY_PLACEHOLDER_IMG,
    amenitiesTitle: 'Equipamiento:',
    amenities: [
      'Hidromasaje de 8 jets direccionales de alta potencia',
      'Agua caliente instantánea con llenado ultrarrápido',
      'Cromoterapia subacuática LED y sales de baño',
      'Cabeceras acolchadas para 2 personas',
    ],
    scenes: [],
  },
  {
    id: '33333333-3333-4333-8333-333333333305',
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
    cardImage: EMPTY_PLACEHOLDER_IMG,
    amenitiesTitle: 'Equipamiento:',
    amenities: [
      'Juegos de cartas y dados eróticos para parejas',
      'Kits sensoriales con antifaz de satén, plumas y aceites de masaje',
      'Entrega sellada y 100% confidencial por esclusa privada',
    ],
    scenes: [],
  },
];

export const PROMOTIONS: PromoItem[] = [
  {
    id: '44444444-4444-4444-8444-444444444401',
    slug: 'suite-neon-jacuzzi-promo',
    title: 'Suite Neón Jacuzzi',
    detailHeaderTitle: 'Suite Neón Jacuzzi — -25% OFF Especial',
    badgeText: '-25% OFF',
    sedesLabel: 'Sede Surco • Sede Lince',
    sedesFilter: ['Surco', 'Lince'],
    validUntil: '30 Nov 2026',
    oldPrice: 'S/ 190',
    promoPrice: 'S/ 140',
    cardImage: EMPTY_PLACEHOLDER_IMG,
    availabilityTitle: 'Disponible en Sede Surco y Sede Lince',
    includesList: [
      '4 horas en Suite Neón Jacuzzi para 2 personas',
      'Uso ilimitado de jacuzzi con hidromasaje y cromoterapia LED',
      'Sillón tántrico, Cama King Size y audio Bluetooth',
      '2 bebidas de bienvenida de cortesía',
      'Cochera privada automatizada incluida',
    ],
    scenes: [],
  },
  {
    id: '44444444-4444-4444-8444-444444444402',
    slug: 'pack-celebracion-rosas',
    title: 'Pack Celebración & Rosas',
    detailHeaderTitle: 'Pack Celebración & Rosas — Promoción Especial',
    badgeText: 'NOCHE ROMÁNTICA',
    sedesLabel: 'Todas las sedes',
    sedesFilter: ['Lince', 'Miraflores', 'San Borja', 'Surco', 'Los Olivos'],
    validUntil: '31 Dic 2026',
    oldPrice: 'S/ 260',
    promoPrice: 'S/ 210',
    cardImage: EMPTY_PLACEHOLDER_IMG,
    availabilityTitle: 'Disponible en Todas las Sedes',
    includesList: [
      'Decoración con pétalos de rosas naturales en cama y camino',
      'Arreglo especial de globos y velas aromáticas',
      'Botella de espumante o vino de cortesía',
      'Trufas o bombones finos',
      'Acceso libre a jacuzzi y todas las instalaciones de la suite',
    ],
    scenes: [],
  },
  {
    id: '44444444-4444-4444-8444-444444444403',
    slug: 'jacuzzi-espumante',
    title: 'Jacuzzi & Espumante',
    detailHeaderTitle: 'Jacuzzi & Espumante — Pack Especial',
    badgeText: 'PACK JACUZZI',
    sedesLabel: 'Sede Miraflores',
    sedesFilter: ['Miraflores'],
    validUntil: '30 Nov 2026',
    oldPrice: 'S/ 210',
    promoPrice: 'S/ 165',
    cardImage: EMPTY_PLACEHOLDER_IMG,
    availabilityTitle: 'Disponible en Sede Miraflores',
    includesList: [
      'Estadía de 4 horas en Suite con Jacuzzi Hidromasaje',
      'Botella de espumante Riccadonna o Tabernero Especial en frapera',
      'Sales efervescentes y espuma aromática para el jacuzzi',
      'Late check-out sujeto a disponibilidad',
    ],
    scenes: [],
  },
];

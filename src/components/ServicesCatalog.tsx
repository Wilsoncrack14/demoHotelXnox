import React, { useState, useEffect } from 'react';
import { RotateCw, ArrowRight } from 'lucide-react';
import { SERVICES, type ServiceItem } from '../data/hotelData';
import {
  fetchServiciosFromDb,
  getCachedServicios,
  resolveMediaUrl,
  type DbServicio,
} from '../lib/supabase';

const CATEGORIES = ['Todas', 'Jacuzzi', 'Sillón Tántrico', 'Decoraciones', 'Packs'] as const;

function mapDbServicios(dbRows: DbServicio[]): ServiceItem[] {
  return dbRows.map((row, idx) => {
    const existing = SERVICES.find((s) => s.slug === row.slug);
    if (existing) {
      return {
        ...existing,
        title: row.nombre || existing.title,
        description: row.descripcion || existing.description,
        priceText: `S/ ${row.tarifa}`,
        cardImage: row.portada_webp_url ? resolveMediaUrl(row.portada_webp_url) : existing.cardImage,
      };
    }
    return {
      slug: row.slug,
      title: row.nombre,
      category: (row.etiqueta_promo as ServiceItem['category']) || 'Packs',
      priceText: `S/ ${row.tarifa}`,
      topBarPriceText: `Desde S/ ${row.tarifa}`,
      description: row.descripcion,
      sedesBadges: ['Todas las sedes'],
      sedesFilter: ['Surco', 'Lince', 'Miraflores', 'San Borja', 'Los Olivos'],
      availabilityTitle: 'Disponible en Todas las Sedes',
      address: 'Av. Benavides 4510, Surco',
      featuredTall: idx === 0,
      has360Badge: true,
      cardImage: resolveMediaUrl(row.portada_webp_url || '/images/service-jacuzzi.webp'),
      amenitiesTitle: 'Equipamiento:',
      amenities: [row.descripcion],
      scenes: SERVICES[0].scenes,
    };
  });
}

export default function ServicesCatalog() {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [servicesList, setServicesList] = useState<ServiceItem[]>(() => {
    const cached = getCachedServicios();
    return cached && cached.length > 0 ? mapDbServicios(cached) : SERVICES;
  });

  useEffect(() => {
    fetchServiciosFromDb().then((dbRows) => {
      if (!dbRows || dbRows.length === 0) return;
      setServicesList(mapDbServicios(dbRows));
    });
  }, []);

  const featuredService = servicesList[0] || SERVICES[0]; // Packs de Decoración & Celebraciones
  const gridServices = servicesList.slice(1); // The 4 cards on the 2x2 grid

  const filteredServices =
    selectedCategory === 'Todas'
      ? servicesList
      : servicesList.filter((s) => s.category === selectedCategory);

  return (
    <section className="mx-auto w-full max-w-[1440px] px-4 md:px-8 xl:px-10 pt-22 sm:pt-24 md:pt-28 pb-20">
      {/* Editorial Header matching /habitaciones */}
      <div className="mb-5 sm:mb-6 pb-5 border-b border-white/10">
        <span className="inline-block mb-2 text-[11px] uppercase tracking-[0.22em] text-[#A1A1AA]">
          Experiencias Exclusivas • Tours 360°
        </span>
        <h1 className="text-2xl sm:text-4xl md:text-[46px] font-light uppercase tracking-[-0.015em] text-[#FAFAFA] leading-none">
          SERVICIOS & EXPERIENCIAS
        </h1>
        <p className="mt-2 text-xs sm:text-sm md:text-base text-[#A1A1AA] max-w-xl">
          Descubre experiencias de entretenimiento y momentos lúdicos en nuestras sedes.
        </p>
      </div>

      {/* Category Filter Bar matching /habitaciones */}
      <div className="mb-6 sm:mb-8 flex flex-nowrap sm:flex-wrap items-center gap-2 overflow-x-auto pb-1 sm:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 whitespace-nowrap px-4 py-1.5 rounded-full text-xs md:text-sm transition-all cursor-pointer ${
                isActive
                  ? 'bg-white text-[#09090B] font-semibold'
                  : 'bg-[#16161B] border border-white/15 text-[#D4D4D8] hover:text-white hover:bg-white/10 hover:border-white/35'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Default Asymmetric Bento Layout ("Todas") matching servicios.jpg */}
      {selectedCategory === 'Todas' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Tall Featured Card (4 cols) */}
          <a
            href={`/servicios/${featuredService.slug}`}
            className="lg:col-span-4 group relative rounded-[24px] overflow-hidden bento-card min-h-[460px] lg:min-h-[540px] flex flex-col justify-between p-6"
          >
            <img
              src={featuredService.cardImage}
              alt={featuredService.title}
              className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-104 transition-transform duration-500"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, rgba(9,9,11,0.2) 0%, rgba(9,9,11,0.15) 45%, rgba(9,9,11,0.92) 85%, #09090B 100%)',
              }}
            />

            {/* Top-left Sede Badge */}
            <div className="relative z-10">
              <span className="glass-hotspot inline-flex items-center gap-2.5 px-4 py-1.5 rounded-xl text-xs md:text-sm text-[#FAFAFA] font-medium">
                <span>Sede Lince</span>
                <span className="text-white/50">•</span>
                <span>Sede Surco</span>
              </span>
            </div>

            {/* Bottom Content */}
            <div className="relative z-10 mt-auto pt-40">
              <h2 className="text-2xl md:text-[28px] font-medium text-[#FAFAFA] leading-[1.18]">
                {featuredService.title}
              </h2>
              <p className="mt-2.5 text-sm md:text-[15px] text-[#A1A1AA]">
                {featuredService.description}
              </p>

              <div className="mt-6 flex items-baseline justify-between gap-2">
                <div className="text-lg md:text-xl font-medium text-[#FAFAFA]">
                  {featuredService.priceText}{' '}
                  <span className="text-sm md:text-base text-[#A1A1AA] font-normal">
                    {featuredService.priceSubtext}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1.5 text-sm md:text-[15px] font-medium text-[#FAFAFA] group-hover:translate-x-1 transition-transform">
                  <span>Ver Detalles 360°</span>
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </a>

          {/* Right 2x2 Bento Grid (8 cols) */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {gridServices.map((service) => (
              <ServiceGridCard key={service.slug} service={service} />
            ))}
          </div>
        </div>
      ) : (
        /* Filtered Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredServices.map((service) => (
            <ServiceGridCard key={service.slug} service={service} />
          ))}
        </div>
      )}
    </section>
  );
}

function ServiceGridCard({ service }: { service: ServiceItem }) {
  return (
    <a
      href={`/servicios/${service.slug}`}
      className="group relative rounded-[24px] overflow-hidden bento-card h-[250px] md:h-[260px] flex flex-col justify-between p-5"
    >
      <img
        src={service.cardImage}
        alt={service.title}
        className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(9,9,11,0.1) 0%, rgba(9,9,11,0.2) 50%, rgba(9,9,11,0.88) 100%)',
        }}
      />

      {/* Top-right Tour 360° badge if enabled */}
      <div className="relative z-10 flex justify-end">
        {service.has360Badge && (
          <span className="glass-hotspot px-3.5 py-1.5 rounded-xl text-xs md:text-sm text-[#FAFAFA] inline-flex items-center gap-1.5">
            <span>Tour 360°</span>
            <RotateCw className="w-3.5 h-3.5" />
          </span>
        )}
      </div>

      {/* Bottom Title & Price */}
      <div className="relative z-10 mt-auto">
        <h3 className="text-xl md:text-[22px] font-medium text-[#FAFAFA] leading-snug">
          {service.title}
        </h3>
        <div className="mt-0.5 text-lg md:text-xl font-normal text-[#E4E4E7]">
          {service.priceText}
        </div>
      </div>
    </a>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { HERO_SLIDES } from '../data/hotelData';

export default function HomeHeroCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    videoRefs.current.forEach((video, idx) => {
      if (!video) return;
      if (idx === activeIndex) {
        video.currentTime = 0;
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, [activeIndex]);

  const handleVideoEnded = () => {
    setActiveIndex((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  const current = HERO_SLIDES[activeIndex];
  const formattedIndex = String(activeIndex + 1).padStart(2, '0');
  const formattedTotal = String(HERO_SLIDES.length).padStart(2, '0');

  return (
    <section className="relative w-full h-screen min-h-[700px] overflow-hidden select-none bg-[#09090B]">
      {/* Background Video Slides */}
      {HERO_SLIDES.map((slide, idx) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-700 ${
            idx === activeIndex ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
          }`}
        >
          <video
            ref={(el) => {
              videoRefs.current[idx] = el;
            }}
            src={slide.videoUrl}
            poster={slide.poster}
            autoPlay={idx === 0}
            muted
            playsInline
            onEnded={handleVideoEnded}
            className="w-full h-full object-cover object-center"
          />

          {/* Top neon ambient glow behind floating glass navbar + left readability gradient + bottom obsidian blend */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(55% 28% at 62% 0%, rgba(236,72,153,0.30) 0%, transparent 100%), radial-gradient(45% 25% at 32% 0%, rgba(59,130,246,0.26) 0%, transparent 100%), linear-gradient(90deg, rgba(9,9,11,0.68) 0%, rgba(9,9,11,0.38) 42%, rgba(9,9,11,0.05) 75%, transparent 100%), linear-gradient(180deg, transparent 0%, transparent 76%, #09090B 100%)',
            }}
          />
        </div>
      ))}

      {/* Content Overlay — Optimized for 27" Desktop (1080p / 1440p QHD / 4K) */}
      <div className="relative z-20 mx-auto w-full max-w-[1840px] h-full px-6 sm:px-12 md:px-20 lg:px-28 xl:px-36 2xl:px-44 pt-20 pb-20 flex flex-col justify-center">
        <div className="max-w-3xl -mt-4 xl:-mt-8">
          <h1
            className="font-light uppercase text-[#FAFAFA] whitespace-pre-line tracking-[-0.015em] leading-[1.04]"
            style={{
              fontSize: 'clamp(2.6rem, 4.6vw, 5.4rem)',
              textShadow: '0 8px 36px rgba(0, 0, 0, 0.78)',
            }}
          >
            {current.headline}
          </h1>

          <p
            className="mt-4 xl:mt-6 text-[#E4E4E7] font-light tracking-[0.01em] max-w-2xl"
            style={{
              fontSize: 'clamp(1.05rem, 1.35vw, 1.5rem)',
              textShadow: '0 2px 16px rgba(0, 0, 0, 0.8)',
            }}
          >
            {current.subtitle}
          </p>

          {/* Dual Pill CTAs scaled proportionally for 27" Desktop */}
          <div className="mt-8 xl:mt-11 flex flex-wrap items-center gap-4 xl:gap-5">
            <a
              href={current.ctaPrimaryHref}
              className="px-8 xl:px-10 py-3.5 xl:py-4 rounded-full bg-white text-[#09090B] font-semibold text-sm md:text-base xl:text-[18px] hover:bg-neutral-200 hover:scale-[1.02] transition-all shadow-[0_0_32px_rgba(255,255,255,0.32)]"
            >
              {current.ctaPrimaryText}
            </a>

            <a
              href={current.ctaSecondaryHref}
              className="px-8 xl:px-10 py-3.5 xl:py-4 rounded-full text-white font-medium text-sm md:text-base xl:text-[18px] transition-all hover:bg-white/20 hover:scale-[1.02]"
              style={{
                background: 'rgba(59, 82, 165, 0.42)',
                backdropFilter: 'blur(14px)',
                border: '1.5px solid rgba(255, 255, 255, 0.72)',
                boxShadow: '0 8px 28px rgba(0, 0, 0, 0.45)',
              }}
            >
              {current.ctaSecondaryText}
            </a>
          </div>
        </div>
      </div>

      {/* Video Carousel Indicator & Counter (01 / 02) */}
      <div className="absolute bottom-10 xl:bottom-12 inset-x-0 z-20 flex flex-col items-center justify-center gap-3">
        <div className="flex items-center gap-3">
          {HERO_SLIDES.map((slide, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={slide.id}
                type="button"
                aria-label={`Video ${idx + 1}`}
                onClick={() => setActiveIndex(idx)}
                className={`rounded-full transition-all cursor-pointer ${
                  isActive
                    ? 'w-3 h-3 bg-white shadow-[0_0_12px_#fff]'
                    : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/70'
                }`}
              />
            );
          })}
        </div>
        <div className="text-xs xl:text-sm tracking-[0.18em] text-[#D4D4D8] font-medium">
          {formattedIndex} / {formattedTotal}
        </div>
      </div>
    </section>
  );
}

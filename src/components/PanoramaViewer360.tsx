import React, { useState, useEffect, useRef } from 'react';
import { Maximize2, Minimize2, RotateCw, Info, ChevronUp, ChevronLeft, ChevronRight, X, Compass } from 'lucide-react';
import type { Scene360, Hotspot360 } from '../data/hotelData';
import { getEntityScenes } from '../data/store';
import EquirectangularCanvas360, {
  projectSphericalToScreen,
  type Camera360State,
} from './EquirectangularCanvas360';

interface PanoramaViewer360Props {
  entityKey: string;
  initialScenes: Scene360[];
  showThumbnails?: boolean;
  showCarouselArrows?: boolean;
  heightClass?: string;
}

function isReal360Scene(scene?: Scene360): boolean {
  if (!scene) return false;
  if (scene.isEquirectangular) return true;
  const url = scene.panoramaUrl.toLowerCase();
  return (
    url.includes('web 1') ||
    url.includes('wep 2') ||
    url.includes('web 3') ||
    url.includes('wep.webp') ||
    url.includes('cam_2026')
  );
}

export default function PanoramaViewer360({
  entityKey,
  initialScenes,
  showThumbnails = true,
  showCarouselArrows = false,
  heightClass = 'h-[380px] sm:h-[460px] md:h-[520px] xl:h-[580px]',
}: PanoramaViewer360Props) {
  const [scenes, setScenes] = useState<Scene360[]>(initialScenes);
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [activeHotspot, setActiveHotspot] = useState<Hotspot360 | null>(null);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const currentScene = scenes[activeSceneIndex] || scenes[0];
  const isSpherical = isReal360Scene(currentScene);

  // 3D Spherical Camera state (yaw in degrees, pitch in degrees, fov in degrees)
  const [camera, setCamera] = useState<Camera360State>({
    yaw: currentScene?.initialYaw ?? 28,
    pitch: currentScene?.initialPitch ?? -12,
    fov: 75,
  });
  const [aspect, setAspect] = useState<number>(2.2);

  // Fallback 2D pan offsets for non-equirectangular scenes
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{
    x: number;
    y: number;
    startYaw: number;
    startPitch: number;
    startPanX: number;
    startPanY: number;
  }>({
    x: 0,
    y: 0,
    startYaw: 0,
    startPitch: 0,
    startPanX: 0,
    startPanY: 0,
  });
  const autoRotateDirRef = useRef<number>(1);
  const viewportRef = useRef<HTMLDivElement>(null);

  // Hydrate from localStorage so edits in /admin reflect immediately
  useEffect(() => {
    const syncFromStorage = () => {
      const loaded = getEntityScenes(entityKey, initialScenes);
      setScenes(loaded);
      setActiveSceneIndex((prev) => (prev >= loaded.length ? 0 : prev));
    };
    syncFromStorage();
    window.addEventListener('xnox:scenes-updated', syncFromStorage);
    window.addEventListener('storage', syncFromStorage);
    return () => {
      window.removeEventListener('xnox:scenes-updated', syncFromStorage);
      window.removeEventListener('storage', syncFromStorage);
    };
  }, [entityKey, initialScenes]);

  // Reset camera to scene's initialYaw / initialPitch when switching scenes
  useEffect(() => {
    if (!currentScene) return;
    setCamera({
      yaw: currentScene.initialYaw ?? 28,
      pitch: currentScene.initialPitch ?? -12,
      fov: 75,
    });
    setPanX(0);
    setPanY(0);
  }, [activeSceneIndex, currentScene?.id]);

  // Auto-rotation loop (full 360° continuous spin for spherical scenes)
  useEffect(() => {
    if (!isAutoRotating || isDragging) return;
    let animId: number;
    const step = () => {
      if (isSpherical) {
        setCamera((prev) => {
          let nextYaw = prev.yaw + 0.14;
          if (nextYaw > 180) nextYaw -= 360;
          return { ...prev, yaw: nextYaw };
        });
      } else {
        setPanX((prev) => {
          let next = prev + 0.09 * autoRotateDirRef.current;
          if (next > 18) {
            next = 18;
            autoRotateDirRef.current = -1;
          } else if (next < -18) {
            next = -18;
            autoRotateDirRef.current = 1;
          }
          return next;
        });
      }
      animId = requestAnimationFrame(step);
    };
    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [isAutoRotating, isDragging, isSpherical]);

  // Fullscreen change listener
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button, a')) return;
    setIsDragging(true);
    setIsAutoRotating(false);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startYaw: camera.yaw,
      startPitch: camera.pitch,
      startPanX: panX,
      startPanY: panY,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    if (isSpherical) {
      const sensitivity = camera.fov / 420;
      let nextYaw = dragStartRef.current.startYaw - dx * sensitivity;
      while (nextYaw > 180) nextYaw -= 360;
      while (nextYaw < -180) nextYaw += 360;
      const nextPitch = Math.max(
        -72,
        Math.min(72, dragStartRef.current.startPitch + dy * sensitivity)
      );
      setCamera((prev) => ({ ...prev, yaw: nextYaw, pitch: nextPitch }));
    } else {
      const nextX = Math.max(-20, Math.min(20, dragStartRef.current.startPanX + dx * 0.05));
      const nextY = Math.max(-8, Math.min(8, dragStartRef.current.startPanY + dy * 0.04));
      setPanX(nextX);
      setPanY(nextY);
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!isSpherical) return;
    e.preventDefault();
    setCamera((prev) => ({
      ...prev,
      fov: Math.max(45, Math.min(96, prev.fov + e.deltaY * 0.04)),
    }));
  };

  const toggleFullscreen = async () => {
    if (!viewportRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await viewportRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      setIsFullscreen(!isFullscreen);
    }
  };

  const handleHotspotClick = (hs: Hotspot360) => {
    if (hs.type === 'nav') {
      if (hs.targetUrl) {
        window.location.href = hs.targetUrl;
        return;
      }
      if (hs.targetSceneId) {
        const idx = scenes.findIndex((s) => s.id === hs.targetSceneId);
        if (idx !== -1) {
          setActiveSceneIndex(idx);
          setActiveHotspot(null);
          return;
        }
      }
      const nextIdx = (activeSceneIndex + 1) % scenes.length;
      setActiveSceneIndex(nextIdx);
      setActiveHotspot(null);
    } else {
      setActiveHotspot(activeHotspot?.id === hs.id ? null : hs);
      // Smoothly orient camera toward the clicked info hotspot if spherical
      if (isSpherical) {
        setCamera((prev) => ({
          ...prev,
          yaw: hs.yaw,
          pitch: Math.max(-45, Math.min(45, hs.pitch)),
        }));
      }
    }
  };

  const goPrevScene = () => {
    setActiveSceneIndex((prev) => (prev - 1 + scenes.length) % scenes.length);
    setActiveHotspot(null);
  };

  const goNextScene = () => {
    setActiveSceneIndex((prev) => (prev + 1) % scenes.length);
    setActiveHotspot(null);
  };

  if (!currentScene) return null;

  return (
    <div className="w-full">
      {/* Main Widescreen 360° Viewport */}
      <div
        ref={viewportRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        className={`relative w-full ${
          isFullscreen ? 'h-screen rounded-none' : `${heightClass} rounded-[24px]`
        } overflow-hidden border border-[#27272A] bg-[#09090B] select-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        } shadow-[0_20px_50px_rgba(0,0,0,0.85)]`}
      >
        {isSpherical ? (
          /* TRUE 3D SPHERICAL WEBGL EQUIRECTANGULAR 360° RENDERER */
          <div className="relative w-full h-full">
            <EquirectangularCanvas360
              imageUrl={currentScene.panoramaUrl}
              camera={camera}
              onAspectChange={setAspect}
            />

            {/* Subtle top/bottom ambient vignette */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(circle at center, transparent 65%, rgba(9,9,11,0.38) 100%)',
              }}
            />

            {/* 3D Projected Hotspots anchored to (pitch, yaw) on the 360° sphere */}
            {currentScene.hotspots.map((hs) => {
              const proj = projectSphericalToScreen(hs.pitch, hs.yaw, camera, aspect);
              if (!proj.visible) return null;
              const isSelected = activeHotspot?.id === hs.id;

              return (
                <div
                  key={hs.id}
                  style={{
                    left: `${proj.xPct}%`,
                    top: `${proj.yPct}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className="absolute z-20 transition-opacity duration-100"
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleHotspotClick(hs);
                    }}
                    className={`glass-hotspot px-5 py-2.5 rounded-full inline-flex items-center gap-2.5 text-xs sm:text-sm md:text-base font-medium text-[#FAFAFA] transition-transform duration-150 hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap ${
                      isSelected ? 'ring-2 ring-white bg-black/85' : ''
                    }`}
                  >
                    {hs.type === 'info' ? (
                      <span className="w-5 h-5 rounded-full border border-white/80 flex items-center justify-center text-xs font-semibold">
                        i
                      </span>
                    ) : (
                      <ChevronUp className="w-4 h-4 text-white stroke-[2.5]" />
                    )}
                    <span>{hs.label}</span>
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          /* Fallback 2D Pan Layer for flat panoramic banners (e.g. Sede Exterior) */
          <div
            className="absolute inset-0 w-full h-full transition-transform duration-150 ease-out"
            style={{
              transform: `scale(1.22) translate(${panX}%, ${panY}%)`,
            }}
          >
            <img
              src={currentScene.panoramaUrl}
              alt={currentScene.title}
              draggable={false}
              className="w-full h-full object-cover object-center brightness-102 contrast-102"
            />
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(circle at center, transparent 58%, rgba(9,9,11,0.45) 100%)',
              }}
            />

            {currentScene.hotspots.map((hs) => {
              const isSelected = activeHotspot?.id === hs.id;
              return (
                <div
                  key={hs.id}
                  style={{
                    left: `${hs.x}%`,
                    top: `${hs.y}%`,
                    transform: 'translate(-50%, -50%) scale(0.82)',
                  }}
                  className="absolute z-20"
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleHotspotClick(hs);
                    }}
                    className={`glass-hotspot px-5 py-2.5 rounded-full inline-flex items-center gap-2.5 text-sm md:text-base font-medium text-[#FAFAFA] transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap ${
                      isSelected ? 'ring-2 ring-white bg-black/80' : ''
                    }`}
                  >
                    {hs.type === 'info' ? (
                      <span className="w-5 h-5 rounded-full border border-white/80 flex items-center justify-center text-xs font-semibold">
                        i
                      </span>
                    ) : (
                      <ChevronUp className="w-4 h-4 text-white stroke-[2.5]" />
                    )}
                    <span>{hs.label}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Info Hotspot Popover Card */}
        {activeHotspot && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-5 left-5 z-30 max-w-sm rounded-2xl p-4 text-white shadow-2xl animate-fadeIn"
            style={{
              background: 'rgba(18, 18, 23, 0.90)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.24)',
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-pink-500/20 border border-pink-500/50 flex items-center justify-center text-pink-400">
                  <Info className="w-3.5 h-3.5" />
                </span>
                <h4 className="text-sm font-semibold text-white">{activeHotspot.label}</h4>
              </div>
              <button
                type="button"
                onClick={() => setActiveHotspot(null)}
                className="text-[#A1A1AA] hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="mt-2 text-xs text-[#D4D4D8] leading-relaxed">
              {activeHotspot.description ||
                'Equipamiento exclusivo disponible en esta experiencia 360° de Hotel Xnox.'}
            </p>
            <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-[#A1A1AA]">
              <span>
                Coord: pitch {activeHotspot.pitch.toFixed(2)}° • yaw{' '}
                {activeHotspot.yaw > 0 ? `+${activeHotspot.yaw.toFixed(2)}` : activeHotspot.yaw.toFixed(2)}°
              </span>
              <span className="text-pink-400 font-medium">Esfera 360° Real</span>
            </div>
          </div>
        )}

        {/* Top-Left Live 360° Compass Badge */}
        {isSpherical && (
          <div className="pointer-events-none absolute top-3.5 left-4 z-20 hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-black/55 backdrop-blur-md border border-white/15 text-xs text-white/90">
            <Compass
              className="w-4 h-4 text-pink-400 transition-transform duration-100"
              style={{ transform: `rotate(${-camera.yaw}deg)` }}
            />
            <span>
              360° Real • {Math.round(camera.yaw)}°
            </span>
          </div>
        )}

        {/* Top-Right Controls: Pantalla completa & Giro 360° */}
        <div className="absolute top-3.5 right-4 z-20 flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleFullscreen();
            }}
            className="glass-hotspot px-3.5 py-1.5 rounded-xl text-xs md:text-sm text-[#FAFAFA] inline-flex items-center gap-2 hover:bg-white/15 transition-all cursor-pointer"
          >
            <span>{isFullscreen ? 'Salir pantalla completa' : 'Pantalla completa'}</span>
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsAutoRotating(!isAutoRotating);
            }}
            className={`glass-hotspot px-3.5 py-1.5 rounded-xl text-xs md:text-sm inline-flex items-center gap-2 transition-all cursor-pointer ${
              isAutoRotating
                ? 'bg-pink-600/35 border-pink-400 text-white'
                : 'text-[#FAFAFA] hover:bg-white/15'
            }`}
          >
            <span>Giro 360°</span>
            <RotateCw className={`w-3.5 h-3.5 ${isAutoRotating ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Bottom-right drag & zoom hint */}
        <div className="pointer-events-none absolute bottom-3 right-4 z-10 hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/55 backdrop-blur-md border border-white/15 text-[11px] text-[#E4E4E7]">
          <span>
            {isSpherical
              ? 'Arrastra para girar 360° • Rueda del mouse para zoom'
              : 'Arrastra para explorar en 360°'}
          </span>
        </div>
      </div>

      {/* Horizontal Thumbnail Carousel (Up to 8 scenes) */}
      {showThumbnails && scenes.length > 1 && (
        <div className="relative mt-4 flex items-center justify-center">
          {showCarouselArrows && (
            <button
              type="button"
              onClick={goPrevScene}
              aria-label="Escena anterior"
              className="hidden md:flex items-center justify-center w-8 h-8 rounded-full text-[#A1A1AA] hover:text-white hover:bg-white/10 transition-colors mr-2 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 w-full max-w-[1260px]">
            {scenes.slice(0, 8).map((sc, idx) => {
              const isActive = idx === activeSceneIndex;
              return (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => {
                    setActiveSceneIndex(idx);
                    setActiveHotspot(null);
                  }}
                  className={`group relative h-22 sm:h-24 rounded-2xl overflow-hidden text-left transition-all cursor-pointer ${
                    isActive
                      ? 'border-2 border-white shadow-[0_0_20px_rgba(255,255,255,0.22)] scale-[1.01]'
                      : 'border border-[#27272A] opacity-80 hover:opacity-100 hover:border-white/40'
                  }`}
                >
                  <img
                    src={sc.thumbUrl || sc.panoramaUrl}
                    alt={sc.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                  <div className="absolute bottom-2 inset-x-2 text-center">
                    <span
                      className={`text-xs font-medium block truncate ${
                        isActive ? 'text-white font-semibold' : 'text-[#D4D4D8]'
                      }`}
                    >
                      {sc.title}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {showCarouselArrows && (
            <button
              type="button"
              onClick={goNextScene}
              aria-label="Siguiente escena"
              className="hidden md:flex items-center justify-center w-8 h-8 rounded-full text-[#A1A1AA] hover:text-white hover:bg-white/10 transition-colors ml-2 cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

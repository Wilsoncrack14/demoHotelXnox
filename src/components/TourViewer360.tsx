import React, { useState, useEffect, useRef, useTransition } from 'react';
import {
  Maximize2,
  Minimize2,
  RotateCw,
  Info,
  ChevronLeft,
  ChevronRight,
  X,
  Compass,
} from 'lucide-react';
import { Viewer } from '@photo-sphere-viewer/core';
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import { AutorotatePlugin } from '@photo-sphere-viewer/autorotate-plugin';
import '@photo-sphere-viewer/core/index.css';
import '@photo-sphere-viewer/markers-plugin/index.css';
import type { Scene360, Hotspot360 } from '../data/hotelData';
import { getEntityScenes } from '../data/store';
import { fetchEscenas360ForEntity } from '../lib/supabase';

const LOADING_TIMEOUT_MS = 30000;

export interface TourViewer360Props {
  entityKey: string;
  initialScenes: Scene360[];
  entidadTipo?: 'habitacion' | 'servicio';
  entidadId?: string;
  showThumbnails?: boolean;
  showCarouselArrows?: boolean;
  heightClass?: string;
  adminInteractive?: boolean;
  activeSceneIndexOverride?: number;
  onSceneIndexChange?: (idx: number) => void;
  onSphereClickCoords?: (coords: { pitch: number; yaw: number; xPct: number; yPct: number }) => void;
  onHotspotSelect?: (hs: Hotspot360) => void;
  onCameraAngleChange?: (coords: { pitch: number; yaw: number }) => void;
  skipInitialFetch?: boolean;
}

function buildMarkerHtml(hs: Hotspot360, adminInteractive?: boolean): string {
  const safeLabel = hs.label
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const iconHtml =
    hs.type === 'info'
      ? `<span class="w-5 h-5 rounded-full border border-white/80 inline-flex items-center justify-center text-xs font-semibold">i</span>`
      : `<svg class="w-4 h-4 text-white stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m18 15-6-6-6 6"/></svg>`;

  const priceTag =
    hs.precioAdicional && hs.precioAdicional > 0
      ? `<span class="ml-1 px-2 py-0.5 rounded-full bg-pink-500/30 border border-pink-400/40 text-[11px] text-pink-200">+S/ ${hs.precioAdicional}</span>`
      : '';

  const adminBadge = adminInteractive
    ? `<span class="ml-1.5 text-[11px] text-[#D4D4D8] opacity-85">[Editar]</span>`
    : '';

  return `
    <div role="button" aria-label="Ir a ${safeLabel}" class="glass-hotspot px-5 py-2.5 rounded-full inline-flex items-center gap-2.5 text-xs sm:text-sm md:text-base font-medium text-[#FAFAFA] transition-transform duration-150 hover:scale-105 cursor-pointer whitespace-nowrap shadow-xl">
      ${iconHtml}
      <span>${safeLabel}</span>
      ${priceTag}
      ${adminBadge}
    </div>
  `;
}

function getMarkersForScene(scene: Scene360 | undefined, adminInteractive: boolean) {
  if (!scene) return [];
  return scene.hotspots.map((hs) => ({
    id: hs.id,
    position: {
      yaw: `${hs.yaw}deg`,
      pitch: `${hs.pitch}deg`,
    },
    html: buildMarkerHtml(hs, adminInteractive),
    anchor: 'center center' as const,
    data: hs,
  }));
}

export default function TourViewer360({
  entityKey,
  initialScenes,
  entidadTipo,
  entidadId,
  showThumbnails = true,
  showCarouselArrows = false,
  heightClass = 'h-[300px] sm:h-[420px] md:h-[520px] xl:h-[580px]',
  adminInteractive = false,
  activeSceneIndexOverride,
  onSceneIndexChange,
  onSphereClickCoords,
  onHotspotSelect,
  onCameraAngleChange,
  skipInitialFetch = false,
}: TourViewer360Props) {
  const [scenes, setScenes] = useState<Scene360[]>(initialScenes);
  const [internalSceneIndex, setInternalSceneIndex] = useState(0);
  const [activeHotspot, setActiveHotspot] = useState<Hotspot360 | null>(null);
  const [isAutoRotating, setIsAutoRotating] = useState(!adminInteractive);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentYawDeg, setCurrentYawDeg] = useState<number>(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Best-practice lifecycle & UX states
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [, startTransition] = useTransition();

  const activeSceneIndex =
    activeSceneIndexOverride !== undefined ? activeSceneIndexOverride : internalSceneIndex;

  // Live Refs to prevent stale closures and avoid recreating WebGL Viewer
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportWrapperRef = useRef<HTMLDivElement>(null);
  const thumbsStripRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const initOnceRef = useRef(false);
  const loadedOnceRef = useRef(false);
  const switchingRef = useRef(false);
  const pendingSceneIdxRef = useRef<number | null>(null);
  const preloadedUrlsRef = useRef<Set<string>>(new Set());

  const scenesRef = useRef<Scene360[]>(scenes);
  scenesRef.current = scenes;

  const updateThumbsScrollState = () => {
    const el = thumbsStripRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateThumbsScrollState();
    const el = thumbsStripRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(updateThumbsScrollState);
    ro.observe(el);
    return () => ro.disconnect();
  }, [scenes.length, showThumbnails]);
  const activeIdxRef = useRef<number>(activeSceneIndex);
  activeIdxRef.current = activeSceneIndex;
  const adminRef = useRef<boolean>(adminInteractive);
  adminRef.current = adminInteractive;
  const autoRotateRef = useRef<boolean>(isAutoRotating);
  autoRotateRef.current = isAutoRotating;

  const callbacksRef = useRef({
    onSphereClickCoords,
    onHotspotSelect,
    onSceneIndexChange,
    onCameraAngleChange,
  });
  callbacksRef.current = {
    onSphereClickCoords,
    onHotspotSelect,
    onSceneIndexChange,
    onCameraAngleChange,
  };

  // Race-free scene switching queue (`switchingRef` + `pendingSceneIdxRef` + `markers-clean-swap`)
  const gotoSceneRef = useRef<(targetIdx: number) => Promise<void>>(async () => {});
  gotoSceneRef.current = async (targetIdx: number) => {
    const viewer = viewerRef.current;
    const allScenes = scenesRef.current;
    const target = allScenes[targetIdx];
    if (!viewer || !target || !target.panoramaUrl) return;

    // Update UI pill immediately
    setInternalSceneIndex(targetIdx);
    if (callbacksRef.current.onSceneIndexChange) {
      callbacksRef.current.onSceneIndexChange(targetIdx);
    }
    setActiveHotspot(null);

    if (switchingRef.current) {
      pendingSceneIdxRef.current = targetIdx;
      return;
    }

    switchingRef.current = true;
    const markersPlugin = viewer.getPlugin<MarkersPlugin>(MarkersPlugin);

    try {
      if (markersPlugin) {
        markersPlugin.clearMarkers();
      }

      await viewer.setPanorama(target.panoramaUrl, {
        transition: {
          effect: 'fade',
          speed: 300,
          rotation: true,
        },
        position: {
          yaw: `${target.initialYaw ?? 25}deg`,
          pitch: `${target.initialPitch ?? -10}deg`,
        },
        showLoader: false,
      });

      if (pendingSceneIdxRef.current === null && markersPlugin) {
        markersPlugin.setMarkers(getMarkersForScene(target, adminRef.current));
      }
      loadedOnceRef.current = true;
      startTransition(() => {
        setReady(true);
        setFailed(false);
      });
    } catch {
      if (!loadedOnceRef.current) {
        startTransition(() => setFailed(true));
      }
    } finally {
      switchingRef.current = false;
      const queuedIdx = pendingSceneIdxRef.current;
      if (queuedIdx !== null && queuedIdx !== targetIdx) {
        pendingSceneIdxRef.current = null;
        void gotoSceneRef.current(queuedIdx);
      } else {
        pendingSceneIdxRef.current = null;
      }
    }
  };

  // Sync with localStorage & Supabase DB scenes
  useEffect(() => {
    let mounted = true;
    const syncLocal = () => {
      const loaded = getEntityScenes(entityKey, initialScenes);
      if (mounted) {
        setScenes(loaded);
      }
    };
    syncLocal();

    if (!skipInitialFetch) {
      const targetId = entidadId || entityKey;
      const targetTipo = entidadTipo || 'habitacion';
      fetchEscenas360ForEntity(targetTipo, targetId, getEntityScenes(entityKey, initialScenes)).then(
        (dbScenes) => {
          if (mounted && dbScenes) {
            setScenes(dbScenes);
          }
        }
      );
    }

    window.addEventListener('xnox:scenes-updated', syncLocal);
    window.addEventListener('storage', syncLocal);
    return () => {
      mounted = false;
      window.removeEventListener('xnox:scenes-updated', syncLocal);
      window.removeEventListener('storage', syncLocal);
    };
  }, [entityKey, initialScenes, entidadTipo, entidadId]);

  const currentScene = scenes[activeSceneIndex] || scenes[0];
  const hasScene = Boolean(currentScene && currentScene.panoramaUrl);

  // Idle sequential preload of remaining scene URLs with active pause during scene switch
  const scheduleIdlePreload = (allScenes: Scene360[], activeUrl: string) => {
    const urls = Array.from(
      new Set(allScenes.map((s) => s.panoramaUrl).filter((u) => u && u !== activeUrl))
    );
    if (urls.length === 0) return;

    const runPreload = async () => {
      for (const url of urls) {
        if (preloadedUrlsRef.current.has(url)) continue;
        while (switchingRef.current) {
          await new Promise((r) => setTimeout(r, 250));
        }
        try {
          await fetch(url, { mode: 'cors' });
          preloadedUrlsRef.current.add(url);
        } catch {
          // ignore preload failure
        }
      }
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(
        () => void runPreload()
      );
    } else {
      setTimeout(() => void runPreload(), 1500);
    }
  };

  // Decoupled PSV Initialization with StrictMode Guard + Non-Zero Container Check + ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !hasScene || initOnceRef.current) return;

    let resizeInitObserver: ResizeObserver | null = null;
    let resizeAutoSizeObserver: ResizeObserver | null = null;
    let timeoutId: number | null = null;

    const mountViewer = () => {
      if (initOnceRef.current || !containerRef.current) return;
      const el = containerRef.current;
      if (el.clientWidth === 0 || el.clientHeight === 0) return;

      initOnceRef.current = true;
      const firstScene = scenesRef.current[activeIdxRef.current] || scenesRef.current[0];
      if (!firstScene?.panoramaUrl) return;

      const viewer = new Viewer({
        container: el,
        loadingTxt: '',
        loadingImg: '',
        defaultZoomLvl: 0,
        navbar: false,
        touchmoveTwoFingers: false,
        mousewheelCtrlKey: false,
        plugins: [
          [MarkersPlugin, { markers: [] }],
          [
            AutorotatePlugin,
            {
              autostartDelay: adminRef.current ? null : 2000,
              autostartOnIdle: !adminRef.current,
              autorotateSpeed: '1.1rpm',
            },
          ],
        ],
      });

      viewerRef.current = viewer;

      // Persistent ResizeObserver for responsive autoSize()
      resizeAutoSizeObserver = new ResizeObserver(() => {
        viewerRef.current?.autoSize();
      });
      resizeAutoSizeObserver.observe(el);

      // 30s safety loading timeout
      timeoutId = window.setTimeout(() => {
        if (!loadedOnceRef.current) {
          startTransition(() => setFailed(true));
        }
      }, LOADING_TIMEOUT_MS);

      viewer.addEventListener('panorama-error', () => {
        if (!loadedOnceRef.current) {
          startTransition(() => setFailed(true));
        }
      });

      viewer.addEventListener('position-updated', ({ position }) => {
        setHasInteracted(true);
        let yawDeg = Number(((position.yaw * 180) / Math.PI).toFixed(1));
        if (yawDeg > 180) yawDeg -= 360;
        const pitchDeg = Number(((position.pitch * 180) / Math.PI).toFixed(1));
        setCurrentYawDeg(Math.round(yawDeg));
        callbacksRef.current.onCameraAngleChange?.({ pitch: pitchDeg, yaw: yawDeg });
      });

      const markersPlugin = viewer.getPlugin<MarkersPlugin>(MarkersPlugin);
      if (markersPlugin) {
        markersPlugin.addEventListener('select-marker', ({ marker }) => {
          const hs = marker.data as Hotspot360 | undefined;
          if (!hs) return;

          if (callbacksRef.current.onHotspotSelect) {
            callbacksRef.current.onHotspotSelect(hs);
            if (adminRef.current) return;
          }

          if (hs.type === 'nav') {
            if (hs.targetUrl) {
              window.location.href = hs.targetUrl;
              return;
            }
            const allScenes = scenesRef.current;
            if (hs.targetSceneId) {
              const idx = allScenes.findIndex((s) => s.id === hs.targetSceneId);
              if (idx !== -1) {
                void gotoSceneRef.current(idx);
                return;
              }
            }
            const nextIdx = (activeIdxRef.current + 1) % allScenes.length;
            void gotoSceneRef.current(nextIdx);
          } else {
            setActiveHotspot((prev) => (prev?.id === hs.id ? null : hs));
          }
        });
      }

      viewer.addEventListener('click', ({ data }) => {
        if (data.rightclick || !callbacksRef.current.onSphereClickCoords) return;

        let yawDeg = Number(((data.yaw * 180) / Math.PI).toFixed(2));
        if (yawDeg > 180) yawDeg -= 360;
        const pitchDeg = Number(((data.pitch * 180) / Math.PI).toFixed(2));

        const xPct = Math.max(5, Math.min(95, Number((((yawDeg + 180) / 360) * 100).toFixed(1))));
        const yPct = Math.max(10, Math.min(90, Number((((90 - pitchDeg) / 180) * 100).toFixed(1))));

        callbacksRef.current.onSphereClickCoords({ pitch: pitchDeg, yaw: yawDeg, xPct, yPct });
      });

      // Decoupled initial panorama load
      viewer
        .setPanorama(firstScene.panoramaUrl, {
          position: {
            yaw: `${firstScene.initialYaw ?? 25}deg`,
            pitch: `${firstScene.initialPitch ?? -10}deg`,
          },
          showLoader: false,
        })
        .then(() => {
          if (timeoutId) clearTimeout(timeoutId);
          loadedOnceRef.current = true;
          if (markersPlugin) {
            markersPlugin.setMarkers(getMarkersForScene(firstScene, adminRef.current));
          }
          const autorotatePlugin = viewer.getPlugin<AutorotatePlugin>(AutorotatePlugin);
          if (autorotatePlugin && autoRotateRef.current && !adminRef.current) {
            autorotatePlugin.start();
          }
          startTransition(() => {
            setReady(true);
            setFailed(false);
          });
          scheduleIdlePreload(scenesRef.current, firstScene.panoramaUrl);
        })
        .catch(() => {
          if (!loadedOnceRef.current) {
            startTransition(() => setFailed(true));
          }
        });
    };

    if (container.clientWidth > 0 && container.clientHeight > 0) {
      mountViewer();
    } else {
      resizeInitObserver = new ResizeObserver(() => {
        if (container.clientWidth > 0 && container.clientHeight > 0) {
          resizeInitObserver?.disconnect();
          mountViewer();
        }
      });
      resizeInitObserver.observe(container);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      resizeInitObserver?.disconnect();
      resizeAutoSizeObserver?.disconnect();
      viewerRef.current?.destroy();
      viewerRef.current = null;
      initOnceRef.current = false;
    };
  }, [hasScene]);

  // Trigger race-free transition when activeSceneIndexOverride changes externally (e.g. from Admin sidebar)
  const prevOverrideRef = useRef<number | undefined>(activeSceneIndexOverride);
  useEffect(() => {
    if (
      activeSceneIndexOverride !== undefined &&
      activeSceneIndexOverride !== prevOverrideRef.current
    ) {
      prevOverrideRef.current = activeSceneIndexOverride;
      if (viewerRef.current && scenesRef.current[activeSceneIndexOverride]) {
        void gotoSceneRef.current(activeSceneIndexOverride);
      }
    }
  }, [activeSceneIndexOverride]);

  // Sync markers immediately when hotspots in currentScene are edited in Admin
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !currentScene || !loadedOnceRef.current) return;
    const markersPlugin = viewer.getPlugin<MarkersPlugin>(MarkersPlugin);
    if (markersPlugin) {
      try {
        markersPlugin.setMarkers(getMarkersForScene(currentScene, adminInteractive));
      } catch {
        // Ignore if viewer mid-transition
      }
    }
  }, [currentScene?.hotspots, adminInteractive]);

  // Sync autorotate state
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    const autorotatePlugin = viewer.getPlugin<AutorotatePlugin>(AutorotatePlugin);
    if (!autorotatePlugin) return;
    if (isAutoRotating) {
      autorotatePlugin.start();
    } else {
      autorotatePlugin.stop();
    }
  }, [isAutoRotating]);

  // Fullscreen listener
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
      viewerRef.current?.autoSize();
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!viewportWrapperRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await viewportWrapperRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      setIsFullscreen(!isFullscreen);
    }
  };

  if (!currentScene || !currentScene.panoramaUrl) {
    return (
      <div
        className={`relative w-full ${heightClass} rounded-[24px] overflow-hidden border border-dashed border-white/20 bg-[#121215] flex flex-col items-center justify-center p-6 text-center`}
      >
        <Compass className="w-10 h-10 text-pink-500/70 mb-3 animate-pulse" />
        <p className="text-sm md:text-base font-medium text-[#FAFAFA]">
          Sin escenas 360° cargadas en Cloudflare R2 para esta vista
        </p>
        <p className="mt-1 text-xs md:text-sm text-[#A1A1AA] max-w-md">
          Sube fotografías equirectangulares reales desde el panel administrativo para almacenarlas en R2 y visualizarlas en 360°.
        </p>
        {!adminInteractive && (
          <a
            href="/admin"
            className="mt-4 px-5 py-2 rounded-full bg-white text-[#09090B] font-semibold text-xs md:text-sm hover:bg-neutral-200 transition-all"
          >
            Ir a /admin para subir Escena 360°
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Main Widescreen 360° Viewport */}
      <div
        ref={viewportWrapperRef}
        className={`relative w-full ${
          isFullscreen ? 'h-screen rounded-none' : `${heightClass} rounded-[24px]`
        } overflow-hidden border border-[#27272A] bg-[#09090B] select-none shadow-[0_20px_50px_rgba(0,0,0,0.85)]`}
      >
        {/* Photo Sphere Viewer Canvas Container */}
        <div ref={containerRef} className="w-full h-full" />

        {/* Custom Branded Loading / Fallback State */}
        {!ready && !failed && (
          <div className="absolute inset-0 z-20 bg-[#09090B]/90 flex flex-col items-center justify-center gap-3">
            <Compass className="w-9 h-9 text-pink-500 animate-spin" />
            <span className="text-xs md:text-sm text-[#D4D4D8] tracking-wide">
              Cargando recorrido 360°...
            </span>
          </div>
        )}

        {failed && (
          <div className="absolute inset-0 z-20 bg-[#09090B] flex flex-col items-center justify-center gap-2 p-6 text-center">
            <Compass className="w-10 h-10 text-[#A1A1AA]" />
            <p className="text-sm font-medium text-white">Vista 360° no disponible</p>
            <p className="text-xs text-[#A1A1AA]">
              Verifica tu conexión o vuelve a intentar cargar la escena.
            </p>
          </div>
        )}

        {/* Subtle ambient vignette */}
        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            background:
              'radial-gradient(circle at center, transparent 66%, rgba(9,9,11,0.38) 100%)',
          }}
        />

        {/* Onboarding Hint (auto-hides on first camera movement) */}
        {ready && !hasInteracted && !adminInteractive && (
          <div className="pointer-events-none absolute inset-x-0 bottom-14 z-20 flex justify-center">
            <div className="glass-hotspot px-5 py-2 rounded-full text-xs md:text-sm text-white/95 animate-pulse">
              360° · Arrastra para explorar
            </div>
          </div>
        )}

        {/* Admin Mode Bottom Instructional Pill (never overlaps top compass/controls) */}
        {adminInteractive && (
          <div className="pointer-events-none absolute bottom-3 inset-x-3 sm:inset-x-0 flex justify-center sm:justify-start sm:left-4 z-20">
            <div className="glass-hotspot px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs text-[#FAFAFA] text-center shadow-lg">
              Click en la esfera 360° para añadir hotspot (pitch, yaw)
            </div>
          </div>
        )}

        {/* Info Hotspot Popover Card */}
        {activeHotspot && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-x-3 bottom-3 sm:inset-x-auto sm:bottom-5 sm:left-5 z-30 sm:max-w-sm rounded-2xl p-3.5 sm:p-4 text-white shadow-2xl animate-fadeIn"
            style={{
              background: 'rgba(18, 18, 23, 0.92)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.24)',
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-pink-500/20 border border-pink-500/50 flex items-center justify-center text-pink-400">
                  <Info className="w-3.5 h-3.5" />
                </span>
                <div>
                  <h4 className="text-sm font-semibold text-white">{activeHotspot.label}</h4>
                  {activeHotspot.precioAdicional && activeHotspot.precioAdicional > 0 && (
                    <span className="text-xs font-semibold text-pink-400">
                      Adicional: +S/ {activeHotspot.precioAdicional.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveHotspot(null)}
                className="text-[#A1A1AA] hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {activeHotspot.imagenDetalleUrl && (
              <img
                src={activeHotspot.imagenDetalleUrl}
                alt={activeHotspot.label}
                className="mt-2.5 w-full h-28 object-cover rounded-xl border border-white/10"
              />
            )}

            <p className="mt-2 text-xs text-[#D4D4D8] leading-relaxed">
              {activeHotspot.description ||
                'Equipamiento exclusivo disponible en esta experiencia 360° de Hotel Xnox.'}
            </p>
            <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-[#A1A1AA]">
              <span>
                Coord: pitch {activeHotspot.pitch.toFixed(2)}° • yaw{' '}
                {activeHotspot.yaw > 0
                  ? `+${activeHotspot.yaw.toFixed(2)}`
                  : activeHotspot.yaw.toFixed(2)}
                °
              </span>
              <span className="text-pink-400 font-medium">Photo Sphere 360°</span>
            </div>
          </div>
        )}

        {/* Top-Left Live 360° Compass Badge */}
        <div className="pointer-events-none absolute top-3.5 left-4 z-20 hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-black/55 backdrop-blur-md border border-white/15 text-xs text-white/90">
          <Compass
            className="w-4 h-4 text-pink-400 transition-transform duration-100"
            style={{ transform: `rotate(${-currentYawDeg}deg)` }}
          />
          <span>360° Real • {currentYawDeg}°</span>
        </div>

        {/* Top-Right Controls: Pantalla completa & Giro 360° */}
        <div className="absolute top-3 right-3 sm:top-3.5 sm:right-4 z-20 flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleFullscreen();
            }}
            className="glass-hotspot px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs md:text-sm text-[#FAFAFA] inline-flex items-center gap-1.5 sm:gap-2 hover:bg-white/15 transition-all cursor-pointer"
          >
            <span className="hidden sm:inline">
              {isFullscreen ? 'Salir pantalla completa' : 'Pantalla completa'}
            </span>
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
            className={`glass-hotspot px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs md:text-sm inline-flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer ${
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
        <div className="pointer-events-none absolute bottom-3 right-4 z-20 hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/55 backdrop-blur-md border border-white/15 text-[11px] text-[#E4E4E7]">
          <span>Arrastra para girar 360° • Rueda del mouse para zoom</span>
        </div>
      </div>

      {/* Horizontal Single-Row Thumbnail Strip (Up to 8 scenes) edge-to-edge with contextual floating scroll arrows */}
      {showThumbnails && scenes.length > 1 && (
        <div className="relative mt-4 w-full max-w-[1260px] mx-auto">
          {(scenes.length > 3 || showCarouselArrows) && (
            <button
              type="button"
              onClick={() => {
                const el = thumbsStripRef.current;
                if (el) el.scrollBy({ left: -Math.max(200, el.clientWidth * 0.75), behavior: 'smooth' });
              }}
              aria-label="Desplazar escenas a la izquierda"
              className={`absolute left-1.5 sm:left-2 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/70 hover:bg-black/90 backdrop-blur-md border border-white/30 text-white shadow-lg transition-all cursor-pointer ${
                canScrollLeft ? 'opacity-100 scale-100' : 'opacity-0 pointer-events-none scale-90'
              }`}
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}

          <div
            ref={thumbsStripRef}
            onScroll={updateThumbsScrollState}
            role="tablist"
            aria-label="Escenas 360°"
            className={`flex flex-nowrap items-center gap-2 sm:gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth py-1 w-full [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
              scenes.length <= 3 ? 'justify-center' : 'justify-start'
            }`}
          >
            {scenes.slice(0, 8).map((sc, idx) => {
              const isActive = idx === activeSceneIndex;
              return (
                <button
                  key={sc.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={(e) => {
                    e.currentTarget.scrollIntoView({
                      behavior: 'smooth',
                      inline: 'nearest',
                      block: 'nearest',
                    });
                    void gotoSceneRef.current(idx);
                  }}
                  className={`group relative snap-start shrink-0 w-[calc((100%-16px)/3)] sm:w-[calc((100%-36px)/4)] md:w-[calc((100%-60px)/6)] h-14 sm:h-20 md:h-24 rounded-xl sm:rounded-2xl overflow-hidden text-left transition-all cursor-pointer ${
                    isActive
                      ? 'border-2 border-white shadow-[0_0_16px_rgba(255,255,255,0.22)]'
                      : 'border border-[#27272A] opacity-80 hover:opacity-100 hover:border-white/40'
                  }`}
                >
                  <img
                    src={sc.thumbUrl || sc.panoramaUrl}
                    alt={sc.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                  <div className="absolute bottom-1 sm:bottom-2 inset-x-1.5 sm:inset-x-2 text-center">
                    <span
                      className={`text-[10px] sm:text-xs font-medium block truncate ${
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

          {(scenes.length > 3 || showCarouselArrows) && (
            <button
              type="button"
              onClick={() => {
                const el = thumbsStripRef.current;
                if (el) el.scrollBy({ left: Math.max(200, el.clientWidth * 0.75), behavior: 'smooth' });
              }}
              aria-label="Desplazar escenas a la derecha"
              className={`absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/70 hover:bg-black/90 backdrop-blur-md border border-white/30 text-white shadow-lg transition-all cursor-pointer ${
                canScrollRight ? 'opacity-100 scale-100' : 'opacity-0 pointer-events-none scale-90'
              }`}
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

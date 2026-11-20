import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, RotateCw } from 'lucide-react';
import { EMPTY_PLACEHOLDER_IMG, type Scene360 } from '../data/hotelData';
import {
  type DbHabitacion,
  type DbSede,
  fetchEscenas360ForEntity,
  fetchHabitacionesFromDb,
  fetchSedesFromDb,
  getCachedEscenas360,
  getCachedHabitaciones,
  getCachedSedes,
  getFallbackDbHabitaciones,
  getFallbackDbSedes,
  resolveMediaUrl,
} from '../lib/supabase';

function sortByMostRecent<T extends { created_at?: string; orden?: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const tA = a.created_at ? Date.parse(a.created_at) : NaN;
    const tB = b.created_at ? Date.parse(b.created_at) : NaN;
    if (!Number.isNaN(tA) && !Number.isNaN(tB) && tA !== tB) {
      return tB - tA;
    }
    return (b.orden ?? 0) - (a.orden ?? 0);
  });
}

let psvModulesPromise:
  | Promise<[typeof import('@photo-sphere-viewer/core'), typeof import('@photo-sphere-viewer/autorotate-plugin'), unknown]>
  | null = null;

function loadPsvModules() {
  if (!psvModulesPromise) {
    psvModulesPromise = Promise.all([
      import('@photo-sphere-viewer/core'),
      import('@photo-sphere-viewer/autorotate-plugin'),
      import('@photo-sphere-viewer/core/index.css'),
    ]);
  }
  return psvModulesPromise;
}

const warmedPanoramas = new Set<string>();
function warmPanoramaImage(url: string) {
  if (!url || warmedPanoramas.has(url) || typeof window === 'undefined') return;
  warmedPanoramas.add(url);
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.decoding = 'async';
  img.src = url;
}

// Keep up to 4 WebGL viewers warm in an LRU pool so re-hovering is 0ms instant
const MAX_WARM_VIEWERS = 4;
const viewerEvictQueue: Array<{ id: string; evict: () => void }> = [];

function registerWarmViewer(id: string, evict: () => void) {
  const existingIdx = viewerEvictQueue.findIndex((v) => v.id === id);
  if (existingIdx >= 0) viewerEvictQueue.splice(existingIdx, 1);
  viewerEvictQueue.push({ id, evict });
  while (viewerEvictQueue.length > MAX_WARM_VIEWERS) {
    const oldest = viewerEvictQueue.shift();
    oldest?.evict();
  }
}

interface ShowcaseItem {
  room: DbHabitacion;
  sedeName: string;
}

export default function HomeRoomsShowcase() {
  const [sedes, setSedes] = useState<DbSede[]>(() => getFallbackDbSedes());
  const [rooms, setRooms] = useState<DbHabitacion[]>(() => getFallbackDbHabitaciones());
  const [sceneMap, setSceneMap] = useState<Record<string, Scene360>>({});

  useEffect(() => {
    void loadPsvModules();

    const cachedSedes = getCachedSedes();
    if (cachedSedes && cachedSedes.length > 0) setSedes(cachedSedes);

    const cachedRooms = getCachedHabitaciones();
    if (cachedRooms && cachedRooms.length > 0) setRooms(cachedRooms);

    fetchSedesFromDb().then((rows) => {
      if (rows && rows.length > 0) setSedes(rows);
    });
    fetchHabitacionesFromDb().then((rows) => {
      if (rows && rows.length > 0) setRooms(rows);
    });
  }, []);

  const showcaseRooms = useMemo(() => {
    const recentSedes = sortByMostRecent(sedes);
    const selected: ShowcaseItem[] = [];
    for (const sede of recentSedes) {
      const sedeRooms = sortByMostRecent(rooms.filter((r) => r.sede_id === sede.id)).slice(0, 2);
      for (const room of sedeRooms) {
        selected.push({ room, sedeName: sede.nombre });
      }
    }
    return selected;
  }, [sedes, rooms]);

  // Pre-resolve primary 360° scenes + warm image cache for all showcase cards
  useEffect(() => {
    if (showcaseRooms.length === 0) return;
    let cancelled = false;

    const preloadAll = async () => {
      const entries = await Promise.all(
        showcaseRooms.map(async ({ room }) => {
          const cached = getCachedEscenas360(room.id);
          const scenes = cached && cached.length > 0
            ? cached
            : await fetchEscenas360ForEntity('habitacion', room.id, []);
          const primary = scenes.find((s) => s.isPrimary) || scenes[0] || null;
          if (primary?.panoramaUrl) {
            warmPanoramaImage(primary.panoramaUrl);
          }
          return [room.id, primary] as const;
        })
      );

      if (cancelled) return;
      const nextMap: Record<string, Scene360> = {};
      for (const [id, scene] of entries) {
        if (scene) nextMap[id] = scene;
      }
      setSceneMap(nextMap);
    };

    void preloadAll();
    return () => {
      cancelled = true;
    };
  }, [showcaseRooms]);

  if (showcaseRooms.length === 0) return null;

  const blocks: ShowcaseItem[][] = [];
  for (let i = 0; i < showcaseRooms.length; i += 3) {
    blocks.push(showcaseRooms.slice(i, i + 3));
  }

  return (
    <section className="mt-14 sm:mt-16">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <span className="inline-block text-[11px] uppercase tracking-[0.22em] text-[#71717A] mb-2">
            Suites & Tours 360° • Pasa el cursor para explorar
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-light tracking-tight text-[#FAFAFA] leading-none">
            Habitaciones Destacadas
          </h2>
        </div>

        <a
          href="/habitaciones"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-[#D4D4D8] hover:text-white transition-colors"
        >
          <span>Ver catálogo completo</span>
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>

      <div className="mt-8 space-y-5">
        {blocks.map((chunk, blockIdx) => {
          if (chunk.length === 1) {
            return (
              <div key={blockIdx} className="grid grid-cols-1 gap-5">
                <Hover360RoomCard
                  item={chunk[0]}
                  preloadedScene={sceneMap[chunk[0].room.id]}
                  heightClass="h-[340px] sm:h-[420px] lg:h-[520px]"
                  featured
                />
              </div>
            );
          }

          if (chunk.length === 2) {
            return (
              <div key={blockIdx} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Hover360RoomCard
                  item={chunk[0]}
                  preloadedScene={sceneMap[chunk[0].room.id]}
                  heightClass="h-[300px] sm:h-[380px] lg:h-[460px]"
                />
                <Hover360RoomCard
                  item={chunk[1]}
                  preloadedScene={sceneMap[chunk[1].room.id]}
                  heightClass="h-[300px] sm:h-[380px] lg:h-[460px]"
                />
              </div>
            );
          }

          const bigOnRight = blockIdx % 2 === 1;
          return (
            <div key={blockIdx} className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* 1 card grande ocupando mayor ancho (8 cols x 2 filas) */}
              <div className={`lg:col-span-8 ${bigOnRight ? 'lg:order-2' : 'lg:order-1'}`}>
                <Hover360RoomCard
                  item={chunk[0]}
                  preloadedScene={sceneMap[chunk[0].room.id]}
                  heightClass="h-[300px] sm:h-[360px] lg:h-[520px]"
                  featured
                />
              </div>

              {/* 2 cards apilados con ancho más compacto (4 cols x 1 fila c/u) */}
              <div
                className={`lg:col-span-4 grid grid-cols-1 gap-5 ${
                  bigOnRight ? 'lg:order-1' : 'lg:order-2'
                }`}
              >
                <Hover360RoomCard
                  item={chunk[1]}
                  preloadedScene={sceneMap[chunk[1].room.id]}
                  heightClass="h-[240px] sm:h-[250px] lg:h-[250px]"
                />
                <Hover360RoomCard
                  item={chunk[2]}
                  preloadedScene={sceneMap[chunk[2].room.id]}
                  heightClass="h-[240px] sm:h-[250px] lg:h-[250px]"
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Hover360RoomCard({
  item,
  preloadedScene,
  heightClass,
  featured = false,
}: {
  item: ShowcaseItem;
  preloadedScene?: Scene360;
  heightClass: string;
  featured?: boolean;
}) {
  const { room, sedeName } = item;
  const [hovered, setHovered] = useState(false);
  const [viewerMounted, setViewerMounted] = useState(false);
  const [viewerReady, setViewerReady] = useState(false);

  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const viewerInstanceRef = useRef<any>(null);
  const autorotatePluginRef = useRef<any>(null);
  const pointerDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const didDragRef = useRef(false);
  const isPointerDownRef = useRef(false);

  useEffect(() => {
    const handleWindowPointerUp = () => {
      isPointerDownRef.current = false;
      pointerDownPosRef.current = null;
    };
    window.addEventListener('pointerup', handleWindowPointerUp);
    window.addEventListener('pointercancel', handleWindowPointerUp);
    return () => {
      window.removeEventListener('pointerup', handleWindowPointerUp);
      window.removeEventListener('pointercancel', handleWindowPointerUp);
    };
  }, []);

  // Mount viewer lazily on first hover and keep warm in LRU pool
  useEffect(() => {
    if (!hovered) return;
    setViewerMounted(true);
  }, [hovered]);

  useEffect(() => {
    if (!viewerMounted) return;
    let cancelled = false;

    const mountViewer = async () => {
      if (viewerInstanceRef.current) return;

      let targetScene = preloadedScene || null;
      if (!targetScene) {
        const scenes = await fetchEscenas360ForEntity('habitacion', room.id, []);
        if (cancelled) return;
        targetScene = scenes.find((s) => s.isPrimary) || scenes[0] || null;
      }

      const panoramaUrl =
        targetScene?.panoramaUrl ||
        (room.portada_webp_url ? resolveMediaUrl(room.portada_webp_url) : '');
      if (!panoramaUrl || !viewerContainerRef.current || cancelled) return;

      const [{ Viewer }, { AutorotatePlugin }] = await loadPsvModules();
      if (cancelled || !viewerContainerRef.current) return;

      const instance = new Viewer({
        container: viewerContainerRef.current,
        panorama: panoramaUrl,
        navbar: false,
        mousewheel: false,
        defaultPitch: `${targetScene?.initialPitch ?? 0}deg`,
        defaultYaw: `${targetScene?.initialYaw ?? 0}deg`,
        plugins: [
          [
            AutorotatePlugin,
            {
              autorotateSpeed: '1.0rpm',
              autorotateIdle: false,
            },
          ],
        ],
      });

      viewerInstanceRef.current = instance;
      autorotatePluginRef.current = instance.getPlugin(AutorotatePlugin);

      registerWarmViewer(room.id, () => {
        try {
          instance.destroy();
        } catch {
          // ignore
        }
        viewerInstanceRef.current = null;
        autorotatePluginRef.current = null;
        setViewerReady(false);
        setViewerMounted(false);
      });

      instance.addEventListener('ready', () => {
        if (cancelled) return;
        requestAnimationFrame(() => {
          if (!cancelled) setViewerReady(true);
        });
      });
    };

    void mountViewer();

    return () => {
      cancelled = true;
    };
  }, [viewerMounted, preloadedScene, room.id, room.portada_webp_url]);

  // Pause autorotate when mouse leaves, resume instantly when re-hovered
  useEffect(() => {
    const plugin = autorotatePluginRef.current;
    if (!plugin) return;
    try {
      if (hovered) {
        plugin.start?.();
      } else {
        plugin.stop?.();
      }
    } catch {
      // ignore
    }
  }, [hovered, viewerReady]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (viewerInstanceRef.current) {
        try {
          viewerInstanceRef.current.destroy();
        } catch {
          // ignore
        }
        viewerInstanceRef.current = null;
      }
    };
  }, []);

  const imgUrl = room.portada_webp_url
    ? resolveMediaUrl(room.portada_webp_url)
    : EMPTY_PLACEHOLDER_IMG;

  return (
    <div
      role="link"
      tabIndex={0}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        if (!isPointerDownRef.current) setHovered(false);
      }}
      onDragStart={(e) => e.preventDefault()}
      onPointerDown={(e) => {
        isPointerDownRef.current = true;
        pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
        didDragRef.current = false;
      }}
      onPointerMove={(e) => {
        if (!pointerDownPosRef.current) return;
        const dx = e.clientX - pointerDownPosRef.current.x;
        const dy = e.clientY - pointerDownPosRef.current.y;
        if (Math.hypot(dx, dy) > 6) {
          didDragRef.current = true;
        }
      }}
      onPointerUp={() => {
        isPointerDownRef.current = false;
        pointerDownPosRef.current = null;
      }}
      onClick={() => {
        if (didDragRef.current) {
          didDragRef.current = false;
          return;
        }
        window.location.href = `/habitaciones/${room.slug}`;
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          window.location.href = `/habitaciones/${room.slug}`;
        }
      }}
      className={`group relative ${heightClass} rounded-[24px] overflow-hidden bento-card flex flex-col justify-between p-5 sm:p-6 select-none cursor-grab active:cursor-grabbing`}
    >
      {/* Static cover image stays solid underneath so crossfade never flashes dark */}
      <img
        src={imgUrl}
        alt={room.nombre}
        loading="lazy"
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.02]"
      />

      {/* Live 360° viewer crossfades smoothly on top and stays warm in LRU pool */}
      {viewerMounted && (
        <div
          ref={viewerContainerRef}
          className={`absolute inset-0 z-[1] w-full h-full transition-opacity duration-500 ease-out ${
            hovered && viewerReady ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        />
      )}

      <div
        className="pointer-events-none absolute inset-0 z-[2]"
        style={{
          background:
            'linear-gradient(180deg, rgba(9,9,11,0.18) 0%, rgba(9,9,11,0.08) 42%, rgba(9,9,11,0.88) 92%, #09090B 100%)',
        }}
      />

      <div className="pointer-events-none relative z-10 flex items-center justify-between gap-2">
        <span className="glass-hotspot px-3 py-1 rounded-full text-[11px] text-[#FAFAFA] font-medium truncate max-w-[160px]">
          {sedeName}
        </span>
        <span className="glass-hotspot px-3 py-1 rounded-full text-[11px] text-[#FAFAFA] font-medium inline-flex items-center gap-1.5 shrink-0">
          <RotateCw className={`w-3 h-3 ${hovered && viewerReady ? 'animate-spin' : ''}`} />
          <span>{hovered && viewerReady ? '360° Vivo' : '360°'}</span>
        </span>
      </div>

      <div className="pointer-events-none relative z-10 mt-auto flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h3
            className={`${
              featured ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'
            } font-medium text-[#FAFAFA] truncate`}
          >
            {room.nombre}
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-[#A1A1AA] line-clamp-1">
            {room.descripcion}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-base sm:text-lg font-medium text-[#FAFAFA]">
            S/ {room.tarifa}
          </div>
          <span className="inline-flex items-center gap-1 text-xs text-[#D4D4D8] group-hover:translate-x-1 transition-transform">
            <span>Ver 360°</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  Check,
  Plus,
  Star,
  Pencil,
  Trash2,
  ChevronUp,
  ExternalLink,
  RotateCcw,
  Compass,
} from 'lucide-react';
import type { Scene360, Hotspot360 } from '../data/hotelData';
import {
  getAllAdminEntities,
  getEntityScenes,
  saveEntityScenes,
  resetEntityScenes,
  type AdminEditableEntity,
} from '../data/store';
import EquirectangularCanvas360, {
  projectSphericalToScreen,
  unprojectScreenToSpherical,
  type Camera360State,
} from './EquirectangularCanvas360';

const PRESET_NEW_SCENES = [
  {
    title: 'Ingreso & Lounge',
    adminTitle: 'Ingreso & Lounge',
    isEquirectangular: true,
    initialYaw: -45,
    initialPitch: -10,
    fileSizeWebP: '1.0 MB WebP',
    panoramaUrl: '/images/wep.webp',
    thumbUrl: '/images/real360-thumb-lounge.webp',
  },
  {
    title: 'Sillón Tántrico & Juegos',
    adminTitle: 'Zona Tántrica',
    isEquirectangular: true,
    initialYaw: 122,
    initialPitch: -18,
    fileSizeWebP: '1.1 MB WebP',
    panoramaUrl: '/images/web 3.webp',
    thumbUrl: '/images/real360-thumb-sillon.webp',
  },
  {
    title: 'Vista General 360°',
    adminTitle: 'Vista 360°',
    isEquirectangular: true,
    initialYaw: -15,
    initialPitch: -8,
    fileSizeWebP: '1.3 MB WebP',
    panoramaUrl: '/images/web 1.webp',
    thumbUrl: '/images/real360-thumb-vista360.webp',
  },
  {
    title: 'Baño en Mármol 360°',
    adminTitle: 'Baño Privado',
    isEquirectangular: true,
    initialYaw: -65,
    initialPitch: -10,
    fileSizeWebP: '0.9 MB WebP',
    panoramaUrl: '/images/wep 2.webp',
    thumbUrl: '/images/real360-thumb-bano.webp',
  },
];

// Default 3 scenes shown in admin.jpg using the real 360° equirectangular photos
const ADMIN_DEFAULT_SUITE_SCENES: Scene360[] = [
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
        id: 'hs-descanso',
        type: 'nav',
        label: 'Hacia Escena 2',
        adminLabel: 'Ir a Zona de Descanso',
        description: 'Navega hacia la escena 2 de la suite.',
        targetSceneId: 'scene-2',
        x: 34,
        y: 55,
        pitch: -14.80,
        yaw: -42.38,
      },
      {
        id: 'hs-jacuzzi',
        type: 'info',
        label: 'Jacuzzi',
        adminLabel: 'Jacuzzi',
        description: 'Hidromasaje circular climatizado con acabados en madera y jets regulables.',
        x: 64,
        y: 64,
        pitch: -23.66,
        yaw: 50.50,
      },
    ],
  },
  {
    id: 'scene-2',
    title: 'Cama Temática',
    adminTitle: 'Cama & Jacuzzi',
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
        label: 'Cama King & Espejo',
        adminLabel: 'Cama King Size',
        description: 'Cama King con espejo cenital e iluminación LED.',
        x: 21,
        y: 62,
        pitch: -18.20,
        yaw: -102.00,
      },
      {
        id: 'hs-volver-1',
        type: 'nav',
        label: 'Hacia Escena 3',
        adminLabel: 'Entrar a Baño Privado',
        targetSceneId: 'scene-3',
        x: 63,
        y: 54,
        pitch: -8.00,
        yaw: 46.00,
      },
    ],
  },
  {
    id: 'scene-3',
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
        label: 'Ducha Española',
        adminLabel: 'Ducha Española',
        description: 'Baño en mármol veteado con cabina de ducha templada.',
        x: 26,
        y: 64,
        pitch: -22.40,
        yaw: -84.80,
      },
      {
        id: 'hs-bano-to-1',
        type: 'nav',
        label: 'Hacia Escena 1',
        adminLabel: 'Volver a Suite & Jacuzzi',
        targetSceneId: 'scene-1',
        x: 73,
        y: 56,
        pitch: -12.10,
        yaw: 82.20,
      },
    ],
  },
];

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

export default function AdminDashboard() {
  const allEntities = getAllAdminEntities();
  const [selectedEntityKey, setSelectedEntityKey] = useState<string>('habitaciones:suite-neon-jacuzzi');
  const [scenes, setScenes] = useState<Scene360[]>(ADMIN_DEFAULT_SUITE_SCENES);
  const [activeSceneIdx, setActiveSceneIdx] = useState<number>(0);
  const [editingHotspotId, setEditingHotspotId] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState<string>('Cambios guardados');
  const [openMenu, setOpenMenu] = useState<'sedes' | 'habitaciones' | 'servicios' | 'promociones' | null>(null);

  const currentEntity: AdminEditableEntity =
    allEntities.find((e) => e.key === selectedEntityKey) || allEntities[0];

  const activeScene = scenes[activeSceneIdx] || scenes[0];
  const isSpherical = isReal360Scene(activeScene);

  // 3D Spherical Camera state for the Admin interactive canvas
  const [camera, setCamera] = useState<Camera360State>({
    yaw: activeScene?.initialYaw ?? 28,
    pitch: activeScene?.initialPitch ?? -12,
    fov: 78,
  });
  const [aspect, setAspect] = useState<number>(2.1);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const pointerDownRef = useRef<{ x: number; y: number; startYaw: number; startPitch: number; moved: boolean }>({
    x: 0,
    y: 0,
    startYaw: 0,
    startPitch: 0,
    moved: false,
  });

  useEffect(() => {
    const baseScenes =
      selectedEntityKey === 'habitaciones:suite-neon-jacuzzi'
        ? ADMIN_DEFAULT_SUITE_SCENES
        : currentEntity.defaultScenes;
    const loaded = getEntityScenes(selectedEntityKey, baseScenes);
    setScenes(loaded);
    setActiveSceneIdx(0);
    setEditingHotspotId(null);
  }, [selectedEntityKey]);

  useEffect(() => {
    if (!activeScene) return;
    setCamera({
      yaw: activeScene.initialYaw ?? 28,
      pitch: activeScene.initialPitch ?? -12,
      fov: 78,
    });
  }, [activeSceneIdx, activeScene?.id]);

  const persistScenes = (updated: Scene360[], flashText = 'Cambios guardados') => {
    setScenes(updated);
    saveEntityScenes(selectedEntityKey, updated);
    setSavedNotice(flashText);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button, input, select')) return;
    setIsDragging(true);
    pointerDownRef.current = {
      x: e.clientX,
      y: e.clientY,
      startYaw: camera.yaw,
      startPitch: camera.pitch,
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - pointerDownRef.current.x;
    const dy = e.clientY - pointerDownRef.current.y;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      pointerDownRef.current.moved = true;
    }
    if (isSpherical && pointerDownRef.current.moved) {
      const sensitivity = camera.fov / 420;
      let nextYaw = pointerDownRef.current.startYaw - dx * sensitivity;
      while (nextYaw > 180) nextYaw -= 360;
      while (nextYaw < -180) nextYaw += 360;
      const nextPitch = Math.max(
        -72,
        Math.min(72, pointerDownRef.current.startPitch + dy * sensitivity)
      );
      setCamera((prev) => ({ ...prev, yaw: nextYaw, pitch: nextPitch }));
    }
  };

  // Convert canvas click (without drag) to 3D spherical (pitch, yaw)
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);

    if (pointerDownRef.current.moved) return;
    if ((e.target as HTMLElement).closest('button, input, select')) return;
    if (!activeScene) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = Math.max(5, Math.min(95, Number((((e.clientX - rect.left) / rect.width) * 100).toFixed(1))));
    const yPct = Math.max(10, Math.min(90, Number((((e.clientY - rect.top) / rect.height) * 100).toFixed(1))));

    let pitch: number;
    let yaw: number;

    if (isSpherical) {
      const spherical = unprojectScreenToSpherical(xPct, yPct, camera, aspect);
      pitch = spherical.pitch;
      yaw = spherical.yaw;
    } else {
      yaw = Number((((xPct - 50) / 50) * 32).toFixed(2));
      pitch = Number((-5 - (yPct / 100) * 35).toFixed(2));
    }

    const newHotspot: Hotspot360 = {
      id: `hs-${Date.now()}`,
      type: 'info',
      label: `Punto 360° #${activeScene.hotspots.length + 1}`,
      adminLabel: `Punto 360° #${activeScene.hotspots.length + 1}`,
      description: 'Nuevo hotspot 360° añadido desde el lienzo interactivo.',
      x: xPct,
      y: yPct,
      pitch,
      yaw,
    };

    const updated = scenes.map((sc, idx) =>
      idx === activeSceneIdx ? { ...sc, hotspots: [...sc.hotspots, newHotspot] } : sc
    );
    persistScenes(updated, `Hotspot añadido (${pitch.toFixed(1)}°, ${yaw.toFixed(1)}°)`);
    setEditingHotspotId(newHotspot.id);
  };

  const handleUpdateHotspot = (hsId: string, patch: Partial<Hotspot360>) => {
    const updated = scenes.map((sc, idx) => {
      if (idx !== activeSceneIdx) return sc;
      return {
        ...sc,
        hotspots: sc.hotspots.map((h) => {
          if (h.id !== hsId) return h;
          return { ...h, ...patch };
        }),
      };
    });
    persistScenes(updated);
  };

  const handleDeleteHotspot = (hsId: string) => {
    const updated = scenes.map((sc, idx) =>
      idx === activeSceneIdx
        ? { ...sc, hotspots: sc.hotspots.filter((h) => h.id !== hsId) }
        : sc
    );
    persistScenes(updated, 'Hotspot eliminado');
    if (editingHotspotId === hsId) setEditingHotspotId(null);
  };

  const handleAddScene = () => {
    if (scenes.length >= 8) return;
    const nextNum = scenes.length + 1;
    const preset = PRESET_NEW_SCENES[(nextNum - 1) % PRESET_NEW_SCENES.length];
    const newScene: Scene360 = {
      id: `scene-${Date.now()}`,
      title: `${preset.title} (${nextNum})`,
      adminTitle: `${preset.adminTitle} ${nextNum}`,
      isEquirectangular: preset.isEquirectangular,
      initialYaw: preset.initialYaw,
      initialPitch: preset.initialPitch,
      fileSizeWebP: preset.fileSizeWebP,
      panoramaUrl: preset.panoramaUrl,
      thumbUrl: preset.thumbUrl,
      hotspots: [
        {
          id: `hs-init-${Date.now()}`,
          type: 'nav',
          label: 'Hacia Escena 1',
          adminLabel: 'Volver a Principal',
          targetSceneId: scenes[0]?.id || 'scene-1',
          x: 50,
          y: 54,
          pitch: -12.5,
          yaw: preset.initialYaw,
        },
      ],
    };
    const updated = [...scenes, newScene];
    persistScenes(updated, `Escena 360° #${nextNum} subida (WebP)`);
    setActiveSceneIdx(updated.length - 1);
  };

  const handleDeleteScene = (idxToRemove: number) => {
    if (scenes.length <= 1) return;
    const updated = scenes.filter((_, idx) => idx !== idxToRemove);
    persistScenes(updated, 'Escena eliminada');
    setActiveSceneIdx(0);
  };

  const handleResetEntity = () => {
    resetEntityScenes(selectedEntityKey);
    const baseScenes =
      selectedEntityKey === 'habitaciones:suite-neon-jacuzzi'
        ? ADMIN_DEFAULT_SUITE_SCENES
        : currentEntity.defaultScenes;
    setScenes(baseScenes);
    setActiveSceneIdx(0);
    setSavedNotice('Escenas 360° restauradas');
  };

  const getPublicPreviewUrl = () => {
    const [cat, slug] = selectedEntityKey.split(':');
    return `/${cat}/${slug}`;
  };

  const emptySlotsCount = Math.max(0, Math.min(8 - scenes.length, 2));
  const emptySlotNumbers = Array.from({ length: emptySlotsCount }, (_, i) => scenes.length + i + 1);

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] pb-16">
      {/* Top Admin Navbar matching admin.jpg */}
      <header className="sticky top-3 z-40 w-full px-3 md:px-5">
        <nav className="glass-navbar w-full rounded-2xl px-5 md:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-2">
            <a
              href="/"
              className="text-lg md:text-[22px] font-light tracking-[0.1em] text-[#FAFAFA]"
            >
              HOTEL XNOX
            </a>
            <span className="text-lg md:text-[22px] font-normal text-[#E4E4E7]">Admin</span>
          </div>

          <div className="hidden md:flex items-center gap-3 text-sm">
            {(['sedes', 'habitaciones', 'servicios', 'promociones'] as const).map((cat) => {
              const isCurrentCat = currentEntity.category === cat;
              const catItems = allEntities.filter((e) => e.category === cat);
              const labelMap = {
                sedes: 'Sedes',
                habitaciones: 'Habitaciones',
                servicios: 'Servicios',
                promociones: 'Promociones',
              };
              const hasChevron = cat === 'sedes' || cat === 'habitaciones';

              return (
                <div key={cat} className="relative">
                  <button
                    type="button"
                    onClick={() => setOpenMenu(openMenu === cat ? null : cat)}
                    className={`px-4 py-1.5 rounded-full inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                      isCurrentCat
                        ? 'bg-white/[0.15] text-white border border-white/30 font-medium'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    <span>{labelMap[cat]}</span>
                    {hasChevron && <ChevronDown className="w-3.5 h-3.5 opacity-80" />}
                  </button>

                  {openMenu === cat && (
                    <div
                      className="absolute left-0 mt-2 w-68 rounded-2xl p-2 shadow-2xl z-50"
                      style={{
                        background: 'rgba(20, 20, 25, 0.96)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.16)',
                      }}
                    >
                      <div className="px-3 py-1 text-[11px] uppercase tracking-wider text-[#A1A1AA]">
                        Editar Escenas 360° ({labelMap[cat]})
                      </div>
                      {catItems.map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => {
                            setSelectedEntityKey(item.key);
                            setOpenMenu(null);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                            item.key === selectedEntityKey
                              ? 'bg-white text-[#09090B] font-semibold'
                              : 'text-[#E4E4E7] hover:bg-white/10'
                          }`}
                        >
                          <span className="truncate">{item.title}</span>
                          <span
                            className={`text-[10px] ml-2 ${
                              item.key === selectedEntityKey ? 'text-[#09090B]/70' : 'text-[#A1A1AA]'
                            }`}
                          >
                            {item.subtitle}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2.5">
            <a
              href={getPublicPreviewUrl()}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all"
            >
              <span>Ver 360° Público</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="/"
              className="px-5 py-1.5 rounded-full text-xs md:text-sm text-white bg-white/15 hover:bg-white/25 border border-white/30 transition-all"
            >
              Salir
            </a>
          </div>
        </nav>
      </header>

      {/* Main Content Container */}
      <main className="mx-auto w-full max-w-[1360px] px-4 md:px-6 pt-7">
        {/* Sub-header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-3.5">
            <h1 className="text-xl sm:text-2xl md:text-[28px] font-normal tracking-tight text-[#FAFAFA]">
              Editando: {currentEntity.fullLabel}
            </h1>

            <span
              className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs md:text-sm font-medium text-[#4ADE80]"
              style={{
                background: 'rgba(20, 83, 45, 0.45)',
                border: '1px solid rgba(74, 222, 128, 0.35)',
              }}
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{savedNotice}</span>
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleResetEntity}
              title="Restaurar escenas originales"
              className="p-2.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-[#A1A1AA] hover:text-white transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleAddScene}
              disabled={scenes.length >= 8}
              className="px-5 py-2.5 rounded-full bg-white text-[#09090B] font-semibold text-xs md:text-sm inline-flex items-center gap-1.5 hover:bg-neutral-200 disabled:opacity-40 transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Subir Escena 360°</span>
            </button>
          </div>
        </div>

        {/* Split Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT SIDEBAR: Lista de Escenas (Máx. 8) */}
          <aside
            className="lg:col-span-4 xl:col-span-3 rounded-[24px] p-4 md:p-5"
            style={{
              background: '#202025',
              border: '1px solid rgba(255, 255, 255, 0.14)',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base md:text-[17px] font-normal text-[#FAFAFA]">
                Lista de Escenas (Máx. 8)
              </h2>
              <span className="text-xs text-[#A1A1AA]">{scenes.length}/8</span>
            </div>

            <div className="space-y-3">
              {scenes.map((scene, idx) => {
                const isSelected = idx === activeSceneIdx;
                return (
                  <div
                    key={scene.id}
                    onClick={() => {
                      setActiveSceneIdx(idx);
                      setEditingHotspotId(null);
                    }}
                    className={`group relative rounded-2xl p-2.5 flex items-center gap-3.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#2C2C34] border-2 border-white shadow-[0_0_24px_rgba(255,255,255,0.12)]'
                        : 'bg-[#26262D] border border-white/12 hover:border-white/30'
                    }`}
                  >
                    <img
                      src={scene.thumbUrl || scene.panoramaUrl}
                      alt={scene.adminTitle || scene.title}
                      className="w-24 h-16 rounded-xl object-cover shrink-0 border border-white/10"
                    />

                    <div className="min-w-0 flex-1 pr-5">
                      <div className="flex items-center gap-1.5 text-base font-medium text-[#FAFAFA] truncate">
                        <span className="truncate">{scene.adminTitle || scene.title}</span>
                        {(scene.isPrimary || idx === 0) && (
                          <Star className="w-4 h-4 fill-white text-white shrink-0" />
                        )}
                      </div>
                      <div className="mt-0.5 text-xs md:text-sm text-[#A1A1AA]">
                        {scene.fileSizeWebP}
                      </div>
                    </div>

                    <span className="absolute top-2.5 right-3.5 text-xs md:text-sm text-[#A1A1AA] font-medium">
                      {idx + 1}
                    </span>

                    {scenes.length > 1 && idx > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteScene(idx);
                        }}
                        title="Eliminar escena"
                        className="opacity-0 group-hover:opacity-100 absolute bottom-2.5 right-3 text-[#A1A1AA] hover:text-rose-400 transition-opacity cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}

              {emptySlotNumbers.map((slotNum) => (
                <button
                  key={slotNum}
                  type="button"
                  onClick={handleAddScene}
                  className="w-full py-6 rounded-2xl border border-dashed border-white/25 hover:border-white/50 bg-[#1B1B20]/60 hover:bg-white/[0.04] text-sm md:text-base text-[#A1A1AA] hover:text-white transition-all cursor-pointer"
                >
                  Sube Escena {slotNum}
                </button>
              ))}
            </div>
          </aside>

          {/* RIGHT WORKSPACE: Lienzo Interactivo 360° (~75%) + Coordinate Table */}
          <section
            className="lg:col-span-8 xl:col-span-9 rounded-[24px] p-5 md:p-6"
            style={{
              background: '#202025',
              border: '1px solid rgba(255, 255, 255, 0.14)',
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h2 className="text-base md:text-lg font-normal text-[#FAFAFA]">
                Lienzo Interactivo 360° (~75%)
              </h2>
              <span className="text-xs text-[#A1A1AA]">
                Arrastra para girar la esfera 360° • Haz clic en un punto para crear un hotspot
              </span>
            </div>

            {activeScene && (
              <div
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className="relative w-full h-[340px] sm:h-[400px] md:h-[430px] rounded-[20px] overflow-hidden border border-white/15 bg-[#09090B] cursor-crosshair select-none shadow-2xl"
              >
                {isSpherical ? (
                  <EquirectangularCanvas360
                    imageUrl={activeScene.panoramaUrl}
                    camera={camera}
                    onAspectChange={setAspect}
                  />
                ) : (
                  <img
                    src={activeScene.panoramaUrl}
                    alt={activeScene.title}
                    draggable={false}
                    className="w-full h-full object-cover object-center"
                  />
                )}

                {/* Top Center Instructional Pill matching admin.jpg */}
                <div className="pointer-events-none absolute top-4 inset-x-0 flex justify-center z-20 px-4">
                  <div className="glass-hotspot px-5 py-2 rounded-full text-xs md:text-sm text-[#FAFAFA] text-center">
                    Click para añadir hotspot (coordenadas pitch, yaw)
                  </div>
                </div>

                {/* Live 360 Angle Compass in Admin */}
                {isSpherical && (
                  <div className="pointer-events-none absolute bottom-3 left-4 z-20 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-xs text-white/90">
                    <Compass
                      className="w-3.5 h-3.5 text-pink-400"
                      style={{ transform: `rotate(${-camera.yaw}deg)` }}
                    />
                    <span>
                      Vista: yaw {Math.round(camera.yaw)}° • pitch {Math.round(camera.pitch)}°
                    </span>
                  </div>
                )}

                {/* Hotspots rendered on the Admin Canvas */}
                {activeScene.hotspots.map((hs) => {
                  const isEditing = editingHotspotId === hs.id;
                  let leftPct = hs.x;
                  let topPct = hs.y;

                  if (isSpherical) {
                    const proj = projectSphericalToScreen(hs.pitch, hs.yaw, camera, aspect);
                    if (!proj.visible) return null;
                    leftPct = proj.xPct;
                    topPct = proj.yPct;
                  }

                  return (
                    <div
                      key={hs.id}
                      style={{
                        left: `${leftPct}%`,
                        top: `${topPct}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      className="absolute z-20"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {hs.type === 'info' ? (
                        <div
                          className={`glass-hotspot px-4 py-2 rounded-full inline-flex items-center gap-2.5 text-xs md:text-sm text-[#FAFAFA] whitespace-nowrap ${
                            isEditing ? 'ring-2 ring-white bg-black/85' : ''
                          }`}
                        >
                          <span className="w-5 h-5 rounded-full border border-white/80 flex items-center justify-center text-xs font-semibold">
                            i
                          </span>
                          <span className="font-medium">{hs.label}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setEditingHotspotId(isEditing ? null : hs.id)
                            }
                            className="inline-flex items-center gap-1 text-xs text-[#D4D4D8] hover:text-white ml-1 cursor-pointer"
                          >
                            <span>Editar</span>
                            <Pencil className="w-3 h-3" />
                          </button>
                          <span className="text-white/30">|</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteHotspot(hs.id)}
                            className="inline-flex items-center gap-1 text-xs text-[#D4D4D8] hover:text-rose-400 cursor-pointer"
                          >
                            <span>Borrar</span>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() =>
                            setEditingHotspotId(isEditing ? null : hs.id)
                          }
                          className={`glass-hotspot px-5 py-2.5 rounded-full inline-flex items-center gap-2 text-xs md:text-sm text-[#FAFAFA] cursor-pointer whitespace-nowrap ${
                            isEditing ? 'ring-2 ring-white bg-black/85' : ''
                          }`}
                        >
                          <ChevronUp className="w-4 h-4 stroke-[2.5]" />
                          <span className="font-medium">{hs.label}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {editingHotspotId && activeScene && (
              <HotspotInlineEditor
                hotspot={activeScene.hotspots.find((h) => h.id === editingHotspotId)!}
                scenes={scenes}
                onUpdate={(patch) => handleUpdateHotspot(editingHotspotId, patch)}
                onDelete={() => handleDeleteHotspot(editingHotspotId)}
                onClose={() => setEditingHotspotId(null)}
              />
            )}

            {/* Editable Coordinate Table Below matching admin.jpg */}
            <div className="mt-6">
              <h3 className="text-base md:text-[17px] font-normal text-[#FAFAFA] mb-3">
                Lista de Hotspots en escena activa
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/12 text-xs md:text-sm text-[#A1A1AA]">
                      <th className="py-2.5 font-normal">Hotspot</th>
                      <th className="py-2.5 font-normal w-36 md:w-44">coord-pitch</th>
                      <th className="py-2.5 font-normal w-36 md:w-44">coord-yaw</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 text-sm md:text-[15px]">
                    {activeScene?.hotspots.length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-6 text-center text-xs text-[#A1A1AA]">
                          No hay hotspots en esta escena. Gira la cámara 360° y haz clic en cualquier punto del lienzo para añadir uno.
                        </td>
                      </tr>
                    )}
                    {activeScene?.hotspots.map((hs) => {
                      const isRowEditing = editingHotspotId === hs.id;
                      const formattedPitch = hs.pitch.toFixed(2);
                      const formattedYaw =
                        hs.yaw >= 0 ? `+${hs.yaw.toFixed(2)}` : hs.yaw.toFixed(2);

                      return (
                        <tr
                          key={hs.id}
                          onClick={() => {
                            if (isSpherical && !isRowEditing) {
                              setCamera((prev) => ({
                                ...prev,
                                yaw: hs.yaw,
                                pitch: Math.max(-60, Math.min(60, hs.pitch)),
                              }));
                            }
                          }}
                          className={`transition-colors cursor-pointer ${
                            isRowEditing ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
                          }`}
                        >
                          <td className="py-3 pr-4 text-[#FAFAFA]">
                            <span>{hs.adminLabel || hs.label}</span>{' '}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingHotspotId(isRowEditing ? null : hs.id);
                                if (isSpherical) {
                                  setCamera((prev) => ({
                                    ...prev,
                                    yaw: hs.yaw,
                                    pitch: Math.max(-60, Math.min(60, hs.pitch)),
                                  }));
                                }
                              }}
                              className="text-[#D4D4D8] hover:text-white font-normal ml-1 cursor-pointer"
                            >
                              [{isRowEditing ? 'Cerrar' : 'Editar'}]
                            </button>
                          </td>
                          <td className="py-3 pr-4 text-[#E4E4E7] font-mono text-sm">
                            {isRowEditing ? (
                              <input
                                type="number"
                                step="0.5"
                                value={hs.pitch}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) =>
                                  handleUpdateHotspot(hs.id, {
                                    pitch: parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="w-24 rounded-lg bg-[#121215] border border-white/25 px-2 py-1 text-xs text-white"
                              />
                            ) : (
                              formattedPitch
                            )}
                          </td>
                          <td className="py-3 text-[#E4E4E7] font-mono text-sm">
                            {isRowEditing ? (
                              <input
                                type="number"
                                step="0.5"
                                value={hs.yaw}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) =>
                                  handleUpdateHotspot(hs.id, {
                                    yaw: parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="w-24 rounded-lg bg-[#121215] border border-white/25 px-2 py-1 text-xs text-white"
                              />
                            ) : (
                              formattedYaw
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function HotspotInlineEditor({
  hotspot,
  scenes,
  onUpdate,
  onDelete,
  onClose,
}: {
  hotspot: Hotspot360 | undefined;
  scenes: Scene360[];
  onUpdate: (patch: Partial<Hotspot360>) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  if (!hotspot) return null;

  return (
    <div className="mt-4 rounded-2xl bg-[#16161B] border border-white/20 p-4 flex flex-wrap items-end gap-3 animate-fadeIn">
      <div className="flex-1 min-w-[180px]">
        <label className="block text-[11px] text-[#A1A1AA] mb-1">
          Texto en Lienzo / Tabla
        </label>
        <input
          type="text"
          value={hotspot.label}
          onChange={(e) =>
            onUpdate({ label: e.target.value, adminLabel: e.target.value })
          }
          className="w-full rounded-xl bg-[#09090B] border border-[#27272A] px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white/40"
        />
      </div>

      <div className="w-36">
        <label className="block text-[11px] text-[#A1A1AA] mb-1">Tipo de Hotspot</label>
        <select
          value={hotspot.type}
          onChange={(e) => onUpdate({ type: e.target.value as 'info' | 'nav' })}
          className="w-full rounded-xl bg-[#09090B] border border-[#27272A] px-2.5 py-1.5 text-xs text-white"
        >
          <option value="info">(i) Info Card</option>
          <option value="nav">(^) Navegación</option>
        </select>
      </div>

      {hotspot.type === 'nav' ? (
        <div className="w-44">
          <label className="block text-[11px] text-[#A1A1AA] mb-1">Escena Destino</label>
          <select
            value={hotspot.targetSceneId || scenes[0]?.id}
            onChange={(e) => onUpdate({ targetSceneId: e.target.value })}
            className="w-full rounded-xl bg-[#09090B] border border-[#27272A] px-2.5 py-1.5 text-xs text-white"
          >
            {scenes.map((sc, i) => (
              <option key={sc.id} value={sc.id}>
                Escena {i + 1}: {sc.adminTitle || sc.title}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[11px] text-[#A1A1AA] mb-1">
            Descripción al hacer clic
          </label>
          <input
            type="text"
            value={hotspot.description || ''}
            onChange={(e) => onUpdate({ description: e.target.value })}
            className="w-full rounded-xl bg-[#09090B] border border-[#27272A] px-3 py-1.5 text-xs text-white"
          />
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onDelete}
          className="px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500/25 text-xs cursor-pointer"
        >
          Eliminar
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-1.5 rounded-xl bg-white text-[#09090B] font-semibold text-xs cursor-pointer"
        >
          Listo
        </button>
      </div>
    </div>
  );
}

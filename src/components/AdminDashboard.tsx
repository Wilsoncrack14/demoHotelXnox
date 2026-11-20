import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  Check,
  Plus,
  Star,
  Trash2,
  ExternalLink,
  LogOut,
  Upload,
  Database,
  ArrowUp,
  ArrowDown,
  X,
  Pencil,
  Compass,
} from 'lucide-react';
import type { Scene360, Hotspot360 } from '../data/hotelData';
import {
  getAllAdminEntities,
  saveEntityScenes,
  type AdminEditableEntity,
} from '../data/store';
import TourViewer360 from './TourViewer360';
import LiquidUploadFill from './LiquidUploadFill';
import {
  compressAndUpload360Scene,
  uploadHeroMediaToR2,
  renameR2Media,
  getFileNameFromUrl,
} from '../lib/r2Upload';
import {
  supabase,
  fetchSedesFromDb,
  fetchHabitacionesFromDb,
  fetchServiciosFromDb,
  fetchPromocionesFromDb,
  fetchHeroSlidesFromDb,
  fetchEscenas360ForEntity,
  updateParentEntityCover,
  isValidUuid,
  type DbSede,
  type DbHabitacion,
  type DbServicio,
  type DbPromocion,
  type DbHeroSlide,
} from '../lib/supabase';

export default function AdminDashboard() {
  const [allEntities, setAllEntities] = useState<AdminEditableEntity[]>(getAllAdminEntities());
  const [selectedEntityKey, setSelectedEntityKey] = useState<string>('habitaciones:suite-neon-jacuzzi');

  const refreshAdminEntities = async () => {
    const [dbSedes, dbHabs, dbServs, dbPromos] = await Promise.all([
      fetchSedesFromDb(),
      fetchHabitacionesFromDb(),
      fetchServiciosFromDb(),
      fetchPromocionesFromDb(),
    ]);

    const dynamicList: AdminEditableEntity[] = [
      ...dbHabs.map((r) => ({
        key: `habitaciones:${r.slug}`,
        entityUuid: r.id,
        dbEntidadTipo: 'habitacion' as const,
        category: 'habitaciones' as const,
        slug: r.slug,
        title: r.nombre,
        subtitle: `${r.moneda} ${r.tarifa}`,
        fullLabel: `${r.nombre} — Habitación`,
        defaultScenes: [],
      })),
      ...dbSedes.map((s) => ({
        key: `sedes:${s.slug}`,
        entityUuid: s.id,
        dbEntidadTipo: 'habitacion' as const,
        category: 'sedes' as const,
        slug: s.slug,
        title: s.nombre,
        subtitle: s.direccion,
        fullLabel: `${s.nombre} — Exterior & Recepción`,
        defaultScenes: [],
      })),
      ...dbServs.map((sv) => ({
        key: `servicios:${sv.slug}`,
        entityUuid: sv.id,
        dbEntidadTipo: 'servicio' as const,
        category: 'servicios' as const,
        slug: sv.slug,
        title: sv.nombre,
        subtitle: `${sv.moneda} ${sv.tarifa}`,
        fullLabel: `${sv.nombre} — Servicios`,
        defaultScenes: [],
      })),
      ...dbPromos.map((pr) => ({
        key: `promociones:${pr.slug}`,
        entityUuid: pr.id,
        dbEntidadTipo: 'servicio' as const,
        category: 'promociones' as const,
        slug: pr.slug,
        title: pr.titulo,
        subtitle: `S/ ${pr.precio_promo}`,
        fullLabel: `${pr.titulo} — Promoción`,
        defaultScenes: [],
      })),
    ];

    if (dynamicList.length > 0) {
      setAllEntities(dynamicList);
    }
  };

  useEffect(() => {
    void refreshAdminEntities();
  }, []);
  const [scenes, setScenes] = useState<Scene360[]>([]);
  const [activeSceneIdx, setActiveSceneIdx] = useState<number>(0);
  const [editingHotspotId, setEditingHotspotId] = useState<string | null>(null);
  const [relocatingHotspotId, setRelocatingHotspotId] = useState<string | null>(null);
  const [customSceneFileName, setCustomSceneFileName] = useState<string>('');
  const [editingSceneR2Name, setEditingSceneR2Name] = useState<boolean>(false);
  const [sceneR2NameDraft, setSceneR2NameDraft] = useState<string>('');
  const [isRenamingSceneR2, setIsRenamingSceneR2] = useState<boolean>(false);
  const [cameraAngleDisplay, setCameraAngleDisplay] = useState<{ pitch: number; yaw: number }>({
    pitch: 0,
    yaw: 0,
  });
  const currentCameraAngleRef = useRef<{ pitch: number; yaw: number }>({ pitch: 0, yaw: 0 });
  const [savedNotice, setSavedNotice] = useState<string>('Conectado a Supabase + R2');
  const [openMenu, setOpenMenu] = useState<'sedes' | 'habitaciones' | 'servicios' | 'promociones' | null>(null);
  const [crudModalTab, setCrudModalTab] = useState<'hero_slides' | 'sedes' | 'habitaciones' | 'servicios' | 'promociones' | null>(null);
  const [isUploadingWebP, setIsUploadingWebP] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStage, setUploadStage] = useState<string>('');
  const [loadingScenes, setLoadingScenes] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentEntity: AdminEditableEntity =
    allEntities.find((e) => e.key === selectedEntityKey) || allEntities[0];

  const activeScene = scenes[activeSceneIdx] || scenes[0];

  // Load real scenes & hotspots from Supabase for the selected entity
  useEffect(() => {
    let mounted = true;
    setLoadingScenes(true);
    fetchEscenas360ForEntity(
      currentEntity.dbEntidadTipo,
      currentEntity.entityUuid,
      []
    ).then((dbScenes) => {
      if (!mounted) return;
      setScenes(dbScenes);
      saveEntityScenes(selectedEntityKey, dbScenes);
      setActiveSceneIdx(0);
      setEditingHotspotId(null);
      setLoadingScenes(false);
    });
    return () => {
      mounted = false;
    };
  }, [selectedEntityKey]);

  const persistScenes = (updated: Scene360[], flashText = 'Cambios guardados en Supabase') => {
    setScenes(updated);
    saveEntityScenes(selectedEntityKey, updated);
    setSavedNotice(flashText);
  };

  // Triggered when clicking directly on Photo Sphere Viewer 360° sphere in Admin
  const handleSphereClickCoords = async ({
    pitch,
    yaw,
    xPct,
    yPct,
  }: {
    pitch: number;
    yaw: number;
    xPct: number;
    yPct: number;
  }) => {
    if (!activeScene) return;

    // If relocating an existing hotspot, move it to the clicked coordinates
    if (relocatingHotspotId) {
      const targetId = relocatingHotspotId;
      setRelocatingHotspotId(null);
      await handleUpdateHotspot(targetId, { pitch, yaw, x: xPct, y: yPct });
      setSavedNotice(`Hotspot reubicado (${pitch.toFixed(1)}°, ${yaw.toFixed(1)}°)`);
      return;
    }

    const defaultLabel = `Punto 360° #${activeScene.hotspots.length + 1}`;
    const defaultDesc = 'Equipamiento destacado en vista 360°.';
    let realHotspotId = `hs-${Date.now()}`;

    if (supabase && isValidUuid(activeScene.id)) {
      const { data, error } = await supabase
        .from('hotspots')
        .insert({
          escena_id: activeScene.id,
          tipo: 'informativo',
          pitch,
          yaw,
          titulo: defaultLabel,
          descripcion: defaultDesc,
        })
        .select()
        .single();
      if (error) {
        setSavedNotice(`Error guardando hotspot: ${error.message}`);
        return;
      }
      if (data?.id) realHotspotId = data.id;
    }

    const newHotspot: Hotspot360 = {
      id: realHotspotId,
      type: 'info',
      label: defaultLabel,
      adminLabel: defaultLabel,
      description: defaultDesc,
      x: xPct,
      y: yPct,
      pitch,
      yaw,
    };

    const updated = scenes.map((sc, idx) =>
      idx === activeSceneIdx ? { ...sc, hotspots: [...sc.hotspots, newHotspot] } : sc
    );
    persistScenes(updated, `Hotspot guardado (${pitch.toFixed(1)}°, ${yaw.toFixed(1)}°)`);
    setEditingHotspotId(newHotspot.id);
  };

  const handleRenameActiveScene = async (newTitle: string) => {
    if (!activeScene) return;
    const updated = scenes.map((sc, idx) =>
      idx === activeSceneIdx ? { ...sc, title: newTitle, adminTitle: newTitle } : sc
    );
    persistScenes(updated, 'Nombre de escena actualizado');
    if (supabase && isValidUuid(activeScene.id)) {
      const { error } = await supabase
        .from('escenas_360')
        .update({ titulo: newTitle })
        .eq('id', activeScene.id);
      if (error) setSavedNotice(`Error renombrando: ${error.message}`);
    }
  };

  const handleRenameSceneR2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeScene || !sceneR2NameDraft.trim() || isRenamingSceneR2) return;
    try {
      setIsRenamingSceneR2(true);
      setSavedNotice('Renombrando archivo en Cloudflare R2...');
      const renamed = await renameR2Media(
        activeScene.panoramaUrl,
        sceneR2NameDraft.trim(),
        activeScene.thumbUrl
      );
      if (supabase && isValidUuid(activeScene.id)) {
        const { error } = await supabase
          .from('escenas_360')
          .update({
            imagen_360_webp_url: renamed.newUrl,
            ...(renamed.newThumbUrl ? { miniatura_webp_url: renamed.newThumbUrl } : {}),
          })
          .eq('id', activeScene.id);
        if (error) throw new Error(error.message);

        if (activeScene.isPrimary) {
          await updateParentEntityCover(
            currentEntity.category,
            currentEntity.entityUuid,
            renamed.newThumbUrl || renamed.newUrl
          );
        }
      }
      const updated = scenes.map((sc, idx) =>
        idx === activeSceneIdx
          ? {
              ...sc,
              panoramaUrl: renamed.newUrl,
              ...(renamed.newThumbUrl ? { thumbUrl: renamed.newThumbUrl } : {}),
            }
          : sc
      );
      persistScenes(updated, `Archivo R2 renombrado: ${getFileNameFromUrl(renamed.newUrl)}`);
      setEditingSceneR2Name(false);
      setSceneR2NameDraft('');
    } catch (err) {
      setSavedNotice(err instanceof Error ? err.message : 'Error renombrando en R2');
    } finally {
      setIsRenamingSceneR2(false);
    }
  };

  const handleSaveInitialAngle = async () => {
    if (!activeScene) return;
    const { pitch, yaw } = currentCameraAngleRef.current;
    const updated = scenes.map((sc, idx) =>
      idx === activeSceneIdx ? { ...sc, initialPitch: pitch, initialYaw: yaw } : sc
    );
    persistScenes(updated, `Ángulo inicial guardado (${yaw.toFixed(1)}°, ${pitch.toFixed(1)}°)`);
    if (supabase && isValidUuid(activeScene.id)) {
      const { error } = await supabase
        .from('escenas_360')
        .update({ pitch_inicial: pitch, yaw_inicial: yaw })
        .eq('id', activeScene.id);
      if (error) {
        setSavedNotice(`Error guardando ángulo: ${error.message}`);
      }
    }
  };

  const handleUpdateHotspot = async (hsId: string, patch: Partial<Hotspot360>) => {
    const updated = scenes.map((sc, idx) => {
      if (idx !== activeSceneIdx) return sc;
      return {
        ...sc,
        hotspots: sc.hotspots.map((h) => (h.id === hsId ? { ...h, ...patch } : h)),
      };
    });
    persistScenes(updated);

    if (supabase && isValidUuid(hsId)) {
      const target = updated[activeSceneIdx]?.hotspots.find((h) => h.id === hsId);
      if (target) {
        const { error } = await supabase
          .from('hotspots')
          .update({
            titulo: target.label,
            tipo: target.type === 'nav' ? 'navegacion' : 'informativo',
            pitch: target.pitch,
            yaw: target.yaw,
            escena_destino_id:
              target.type === 'nav' && target.targetSceneId && isValidUuid(target.targetSceneId)
                ? target.targetSceneId
                : null,
            descripcion: target.description || null,
            precio_adicional: target.precioAdicional ?? null,
          })
          .eq('id', hsId);
        if (error) {
          setSavedNotice(`Error actualizando hotspot: ${error.message}`);
        }
      }
    }
  };

  const handleDeleteHotspot = async (hsId: string) => {
    const updated = scenes.map((sc, idx) =>
      idx === activeSceneIdx
        ? { ...sc, hotspots: sc.hotspots.filter((h) => h.id !== hsId) }
        : sc
    );
    persistScenes(updated, 'Hotspot eliminado');
    if (editingHotspotId === hsId) setEditingHotspotId(null);

    if (supabase && isValidUuid(hsId)) {
      try {
        await supabase.from('hotspots').delete().eq('id', hsId);
      } catch {
        // Removed
      }
    }
  };

  // Compress file via <canvas> to WebP (max 4096x2048, <= 2MB) + upload to Cloudflare R2 + save in Supabase escenas_360
  const handleFileUploadChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (scenes.length >= 8) {
      setSavedNotice('Máximo 8 escenas alcanzado');
      return;
    }

    try {
      setIsUploadingWebP(true);
      setUploadProgress(5);
      setUploadStage('Preparando...');
      setSavedNotice('Comprimiendo a WebP y subiendo a Cloudflare R2...');
      const result = await compressAndUpload360Scene(
        file,
        {
          section: currentEntity.category,
          slug: currentEntity.slug,
          kind: '360',
          customName: customSceneFileName.trim() || undefined,
        },
        (pct, stage) => {
          setUploadProgress(pct);
          setUploadStage(stage);
        }
      );
      setCustomSceneFileName('');

      const nextNum = scenes.length + 1;
      const isPrimary = scenes.length === 0;
      const cleanTitle =
        file.name.replace(/\.[^.]+$/, '').slice(0, 32) || `Escena ${nextNum}`;

      let realSceneUuid = `scene-${Date.now()}`;

      if (supabase && isValidUuid(currentEntity.entityUuid)) {
        // Query current max orden in DB to avoid UNIQUE(entidad_tipo, entidad_id, orden) collision
        const { data: existingRows } = await supabase
          .from('escenas_360')
          .select('id, orden')
          .eq('entidad_tipo', currentEntity.dbEntidadTipo)
          .eq('entidad_id', currentEntity.entityUuid)
          .order('orden', { ascending: true });

        const usedOrders = new Set((existingRows || []).map((r: { orden: number }) => r.orden));
        let freeOrder = 1;
        while (usedOrders.has(freeOrder) && freeOrder <= 8) {
          freeOrder++;
        }
        if (freeOrder > 8) {
          throw new Error('Ya existen 8 escenas en Supabase para esta entidad.');
        }

        const { data: inserted, error: insErr } = await supabase
          .from('escenas_360')
          .insert({
            entidad_tipo: currentEntity.dbEntidadTipo,
            entidad_id: currentEntity.entityUuid,
            titulo: cleanTitle,
            imagen_360_webp_url: result.panoramaUrl,
            miniatura_webp_url: result.thumbUrl,
            orden: freeOrder,
            es_principal: isPrimary,
          })
          .select()
          .single();

        if (insErr) {
          throw new Error(`Error guardando en Supabase: ${insErr.message}`);
        }
        if (inserted?.id) {
          realSceneUuid = inserted.id;
        }

        if (isPrimary) {
          const coverErr = await updateParentEntityCover(
            currentEntity.category,
            currentEntity.entityUuid,
            result.thumbUrl || result.panoramaUrl
          );
          if (coverErr) {
            throw new Error(`Escena guardada, pero error en portada: ${coverErr}`);
          }
        }
      }

      const newScene: Scene360 = {
        id: realSceneUuid,
        title: cleanTitle,
        adminTitle: cleanTitle,
        isPrimary,
        isEquirectangular: true,
        initialYaw: 0,
        initialPitch: -8,
        fileSizeWebP: result.fileSizeWebP,
        panoramaUrl: result.panoramaUrl,
        thumbUrl: result.thumbUrl,
        hotspots: [],
      };

      const updated = [...scenes, newScene];
      persistScenes(
        updated,
        result.uploadedToR2
          ? `Guardado en R2 + Supabase (${result.fileSizeWebP})`
          : `Comprimido (${result.fileSizeWebP})`
      );
      setUploadProgress(100);
      setUploadStage('¡Completado!');
      setActiveSceneIdx(updated.length - 1);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al subir imagen WebP a R2';
      setSavedNotice(msg);
      setUploadProgress(0);
    } finally {
      setTimeout(() => {
        setIsUploadingWebP(false);
        setUploadProgress(0);
        setUploadStage('');
      }, 650);
    }
  };

  const handleSetPrimaryScene = async (idxToPrimary: number) => {
    const targetScene = scenes[idxToPrimary];
    if (!targetScene) return;

    const updated = scenes.map((sc, i) => ({
      ...sc,
      isPrimary: i === idxToPrimary,
    }));
    persistScenes(updated, `Escena ${idxToPrimary + 1} marcada como Principal ★`);

    if (supabase && isValidUuid(currentEntity.entityUuid)) {
      await supabase
        .from('escenas_360')
        .update({ es_principal: false })
        .eq('entidad_id', currentEntity.entityUuid);
      if (isValidUuid(targetScene.id)) {
        await supabase
          .from('escenas_360')
          .update({ es_principal: true })
          .eq('id', targetScene.id);
      }
      await updateParentEntityCover(
        currentEntity.category,
        currentEntity.entityUuid,
        targetScene.thumbUrl || targetScene.panoramaUrl
      );
    }
  };

  const handleMoveSceneOrder = async (idx: number, direction: -1 | 1) => {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= scenes.length) return;
    const copy = [...scenes];
    const temp = copy[idx];
    copy[idx] = copy[targetIdx];
    copy[targetIdx] = temp;
    persistScenes(copy, 'Orden actualizado en Supabase');
    setActiveSceneIdx(targetIdx);

    if (supabase) {
      await Promise.all(
        copy.map((sc, i) =>
          isValidUuid(sc.id)
            ? supabase
                .from('escenas_360')
                .update({ orden: i + 1 })
                .eq('id', sc.id)
            : Promise.resolve()
        )
      );
    }
  };

  const handleDeleteScene = async (idxToRemove: number) => {
    const sceneToRemove = scenes[idxToRemove];
    if (!sceneToRemove) return;

    const updated = scenes.filter((_, idx) => idx !== idxToRemove);
    persistScenes(updated, 'Escena eliminada de Supabase');
    setActiveSceneIdx(0);

    if (supabase && isValidUuid(sceneToRemove.id)) {
      await supabase.from('escenas_360').delete().eq('id', sceneToRemove.id);
    }
  };

  const getPublicPreviewUrl = () => {
    const [cat, slug] = selectedEntityKey.split(':');
    return `/${cat}/${slug}`;
  };

  const emptySlotsCount = Math.max(0, Math.min(8 - scenes.length, 3));
  const emptySlotNumbers = Array.from({ length: emptySlotsCount }, (_, i) => scenes.length + i + 1);

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] pb-16">
      {/* Hidden File Input for WebP Compressor + Cloudflare R2 Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUploadChange}
        className="hidden"
      />

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
                      className="absolute left-0 mt-2 w-72 rounded-2xl p-2 shadow-2xl z-50"
                      style={{
                        background: 'rgba(20, 20, 25, 0.96)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.16)',
                      }}
                    >
                      <div className="px-3 py-1.5 flex items-center justify-between border-b border-white/10 mb-1">
                        <span className="text-[11px] uppercase tracking-wider text-[#A1A1AA]">
                          Escenas 360° ({labelMap[cat]})
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setCrudModalTab(cat);
                            setOpenMenu(null);
                          }}
                          className="text-[11px] text-pink-400 hover:text-pink-300 font-medium inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Database className="w-3 h-3" />
                          <span>CRUD Tabla</span>
                        </button>
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

            <button
              type="button"
              onClick={() => setCrudModalTab('hero_slides')}
              className="px-3.5 py-1.5 rounded-full text-xs text-white/90 hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 inline-flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Hero Banner</span>
            </button>

            <button
              type="button"
              onClick={() => setCrudModalTab('habitaciones')}
              className="px-3.5 py-1.5 rounded-full text-xs text-white/90 hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 inline-flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-pink-400" />
              <span>Gestor BD</span>
            </button>
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
              className="px-5 py-1.5 rounded-full text-xs md:text-sm text-white bg-white/15 hover:bg-white/25 border border-white/30 inline-flex items-center gap-1.5 transition-all"
            >
              <span>Salir</span>
              <LogOut className="w-3.5 h-3.5" />
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
              <span>{loadingScenes ? 'Cargando de Supabase...' : savedNotice}</span>
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={scenes.length >= 8 || isUploadingWebP}
              className="relative overflow-hidden px-5 py-2.5 rounded-full bg-white text-[#09090B] font-semibold text-xs md:text-sm inline-flex items-center gap-1.5 hover:bg-neutral-200 disabled:opacity-90 transition-all shadow-md cursor-pointer"
            >
              {isUploadingWebP && (
                <LiquidUploadFill progress={uploadProgress} isComplete={uploadProgress === 100} />
              )}
              <span className="relative z-10 inline-flex items-center gap-1.5">
                {uploadProgress === 100 ? (
                  <Check className="w-4 h-4 stroke-[2.5] text-emerald-700" />
                ) : (
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                )}
                <span>
                  {isUploadingWebP
                    ? `${uploadStage || 'Subiendo...'} ${uploadProgress}%`
                    : 'Subir Escena 360°'}
                </span>
              </span>
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

                    <div className="min-w-0 flex-1 pr-6">
                      <div className="flex items-center gap-1.5 text-base font-medium text-[#FAFAFA] truncate">
                        <span className="truncate">{scene.adminTitle || scene.title}</span>
                        <button
                          type="button"
                          title="Marcar como escena principal"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetPrimaryScene(idx);
                          }}
                          className="shrink-0 cursor-pointer"
                        >
                          <Star
                            className={`w-4 h-4 ${
                              scene.isPrimary
                                ? 'fill-white text-white'
                                : 'text-white/30 hover:text-white/70'
                            }`}
                          />
                        </button>
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-xs md:text-sm text-[#A1A1AA]">
                        <span className="inline-flex items-center gap-1 text-[#4ADE80] font-medium">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>{scene.fileSizeWebP}</span>
                        </span>
                      </div>
                    </div>

                    <span className="absolute top-2.5 right-3.5 text-xs md:text-sm text-[#A1A1AA] font-medium">
                      {idx + 1}
                    </span>

                    <div className="opacity-0 group-hover:opacity-100 absolute bottom-2 right-2.5 flex items-center gap-1 transition-opacity">
                      {idx > 0 && (
                        <button
                          type="button"
                          title="Subir orden"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveSceneOrder(idx, -1);
                          }}
                          className="p-1 text-[#A1A1AA] hover:text-white cursor-pointer"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {idx < scenes.length - 1 && (
                        <button
                          type="button"
                          title="Bajar orden"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveSceneOrder(idx, 1);
                          }}
                          className="p-1 text-[#A1A1AA] hover:text-white cursor-pointer"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteScene(idx);
                        }}
                        title="Eliminar escena de Supabase"
                        className="p-1 text-[#A1A1AA] hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {emptySlotNumbers.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <input
                    type="text"
                    value={customSceneFileName}
                    onChange={(e) => setCustomSceneFileName(e.target.value)}
                    placeholder="Nombre archivo R2 (opcional, ej: vista-jacuzzi)"
                    className="w-full rounded-xl bg-[#121215] border border-white/15 px-3 py-2 text-xs text-white placeholder-[#71717A] focus:outline-none focus:border-white/40"
                  />
                </div>
              )}

              {emptySlotNumbers.map((slotNum, idxSlot) => {
                const showFlood = isUploadingWebP && idxSlot === 0;
                return (
                  <button
                    key={slotNum}
                    type="button"
                    disabled={isUploadingWebP}
                    onClick={() => fileInputRef.current?.click()}
                    className="relative overflow-hidden w-full py-6 rounded-2xl border border-dashed border-white/25 hover:border-white/50 bg-[#1B1B20]/60 hover:bg-white/[0.04] text-sm text-[#A1A1AA] hover:text-white inline-flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    {showFlood && (
                      <LiquidUploadFill progress={uploadProgress} isComplete={uploadProgress === 100} />
                    )}
                    <span className="relative z-10 inline-flex items-center gap-2">
                      {showFlood && uploadProgress === 100 ? (
                        <Check className="w-4 h-4 text-[#4ADE80] stroke-[2.5]" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      <span>
                        {showFlood
                          ? `${uploadStage || 'Inundando R2...'} ${uploadProgress}%`
                          : `Sube Escena ${slotNum} (Guardar en R2)`}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* RIGHT WORKSPACE: Lienzo Interactivo 360° (~75%) powered by TourViewer360 */}
          <section
            className="lg:col-span-8 xl:col-span-9 rounded-[24px] p-5 md:p-6"
            style={{
              background: '#202025',
              border: '1px solid rgba(255, 255, 255, 0.14)',
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-base md:text-lg font-normal text-[#FAFAFA]">
                  Lienzo Interactivo 360°
                </h2>
                {activeScene && (
                  <>
                    <input
                      type="text"
                      value={activeScene.title}
                      onChange={(e) => void handleRenameActiveScene(e.target.value)}
                      placeholder="Nombre de escena..."
                      className="rounded-xl bg-[#121215] border border-white/15 px-3 py-1 text-xs text-white focus:outline-none focus:border-white/40"
                    />
                    {!editingSceneR2Name ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSceneR2NameDraft(
                            getFileNameFromUrl(activeScene.panoramaUrl).replace(/\.[^.]+$/, '')
                          );
                          setEditingSceneR2Name(true);
                        }}
                        title="Renombrar archivo en Cloudflare R2"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 px-2.5 py-1 text-[11px] text-[#E4E4E7] cursor-pointer"
                      >
                        <Pencil className="w-3 h-3" />
                        <span className="max-w-[140px] truncate">
                          {getFileNameFromUrl(activeScene.panoramaUrl) || 'Renombrar R2'}
                        </span>
                      </button>
                    ) : (
                      <form onSubmit={handleRenameSceneR2} className="inline-flex items-center gap-1.5">
                        <input
                          type="text"
                          value={sceneR2NameDraft}
                          onChange={(e) => setSceneR2NameDraft(e.target.value)}
                          placeholder="nuevo-nombre-r2"
                          className="rounded-lg bg-[#121215] border border-white/25 px-2.5 py-1 text-[11px] text-white focus:outline-none"
                        />
                        <button
                          type="submit"
                          disabled={isRenamingSceneR2}
                          className="rounded-lg bg-white text-[#09090B] px-2.5 py-1 text-[11px] font-semibold cursor-pointer disabled:opacity-50"
                        >
                          {isRenamingSceneR2 ? '...' : 'Guardar R2'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingSceneR2Name(false)}
                          className="rounded-lg bg-white/10 text-[#A1A1AA] px-2 py-1 text-[11px] cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </form>
                    )}
                    <button
                      type="button"
                      onClick={() => void handleSaveInitialAngle()}
                      title="Guarda el ángulo actual de la cámara como vista inicial de esta escena"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/40 px-2.5 py-1 text-[11px] text-pink-200 font-medium cursor-pointer"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>
                        Fijar Ángulo ({cameraAngleDisplay.yaw}°, {cameraAngleDisplay.pitch}°)
                      </span>
                    </button>
                  </>
                )}
              </div>
              <span className="text-xs text-[#A1A1AA]">
                {relocatingHotspotId ? (
                  <span className="text-amber-300 font-medium">
                    Haz clic sobre la esfera 360° para reubicar el hotspot seleccionado
                  </span>
                ) : (
                  <>
                    Bucket R2: <strong className="text-white">hotel-xnox-media</strong> • Click en visor 360° guarda hotspot en Supabase
                  </>
                )}
              </span>
            </div>

            {activeScene ? (
              <TourViewer360
                key={selectedEntityKey}
                entityKey={selectedEntityKey}
                initialScenes={scenes}
                showThumbnails={false}
                heightClass="h-[340px] sm:h-[400px] md:h-[430px]"
                adminInteractive={true}
                activeSceneIndexOverride={activeSceneIdx}
                onSceneIndexChange={setActiveSceneIdx}
                onSphereClickCoords={handleSphereClickCoords}
                onCameraAngleChange={(coords) => {
                  currentCameraAngleRef.current = coords;
                  setCameraAngleDisplay(coords);
                }}
                onHotspotSelect={(hs) =>
                  setEditingHotspotId(editingHotspotId === hs.id ? null : hs.id)
                }
              />
            ) : (
              <div
                onClick={() => !isUploadingWebP && fileInputRef.current?.click()}
                className="relative overflow-hidden w-full h-[340px] sm:h-[400px] md:h-[430px] rounded-[20px] border-2 border-dashed border-white/25 hover:border-white/50 bg-[#121215] flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all group"
              >
                {isUploadingWebP && (
                  <LiquidUploadFill progress={uploadProgress} isComplete={uploadProgress === 100} />
                )}
                <div className="relative z-10 w-14 h-14 rounded-full bg-white/10 group-hover:bg-white/20 flex items-center justify-center mb-4 transition-colors">
                  {isUploadingWebP && uploadProgress === 100 ? (
                    <Check className="w-6 h-6 text-[#4ADE80] stroke-[2.5]" />
                  ) : (
                    <Upload className="w-6 h-6 text-white" />
                  )}
                </div>
                <p className="relative z-10 text-base md:text-lg font-medium text-white">
                  {isUploadingWebP
                    ? `${uploadStage || 'Subiendo a Cloudflare R2...'} ${uploadProgress}%`
                    : `Subir primera fotografía 360° para ${currentEntity.title}`}
                </p>
                <p className="relative z-10 mt-1.5 text-xs md:text-sm text-[#A1A1AA] max-w-md">
                  Se comprimirá automáticamente en el navegador a formato WebP (máx. 4096×2048 px) + miniatura y se guardará en tu bucket <strong className="text-white">hotel-xnox-media</strong> de Cloudflare R2 y en Supabase.
                </p>
              </div>
            )}

            {editingHotspotId && activeScene && (
              <HotspotInlineEditor
                hotspot={activeScene.hotspots.find((h) => h.id === editingHotspotId)}
                scenes={scenes}
                activeSceneId={activeScene.id}
                isRelocating={relocatingHotspotId === editingHotspotId}
                onToggleRelocate={() =>
                  setRelocatingHotspotId(
                    relocatingHotspotId === editingHotspotId ? null : editingHotspotId
                  )
                }
                onJumpToScene={(sceneId) => {
                  const targetIdx = scenes.findIndex((s) => s.id === sceneId);
                  if (targetIdx !== -1) {
                    setActiveSceneIdx(targetIdx);
                    setEditingHotspotId(null);
                    setRelocatingHotspotId(null);
                  }
                }}
                onUpdate={(patch) => handleUpdateHotspot(editingHotspotId, patch)}
                onDelete={() => handleDeleteHotspot(editingHotspotId)}
                onClose={() => {
                  setEditingHotspotId(null);
                  setRelocatingHotspotId(null);
                }}
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
                      <th className="py-2.5 font-normal w-48">Tipo / Destino</th>
                      <th className="py-2.5 font-normal w-28 md:w-32">coord-pitch</th>
                      <th className="py-2.5 font-normal w-28 md:w-32">coord-yaw</th>
                      <th className="py-2.5 font-normal w-28 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 text-sm md:text-[15px]">
                    {(!activeScene || activeScene.hotspots.length === 0) && (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-xs text-[#A1A1AA]">
                          {activeScene
                            ? 'No hay hotspots en esta escena. Gira la cámara 360° y haz clic en cualquier punto del visor para añadir uno.'
                            : 'Sube una escena 360° primero para colocar hotspots interactivos.'}
                        </td>
                      </tr>
                    )}
                    {activeScene?.hotspots.map((hs) => {
                      const isRowEditing = editingHotspotId === hs.id;
                      const formattedPitch = hs.pitch.toFixed(2);
                      const formattedYaw =
                        hs.yaw >= 0 ? `+${hs.yaw.toFixed(2)}` : hs.yaw.toFixed(2);
                      const destIdx = hs.targetSceneId
                        ? scenes.findIndex((s) => s.id === hs.targetSceneId)
                        : -1;
                      const destScene = destIdx !== -1 ? scenes[destIdx] : null;

                      return (
                        <tr
                          key={hs.id}
                          className={`transition-colors ${
                            isRowEditing ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
                          }`}
                        >
                          <td className="py-3 pr-4 text-[#FAFAFA]">
                            <span>{hs.adminLabel || hs.label}</span>{' '}
                            <button
                              type="button"
                              onClick={() =>
                                setEditingHotspotId(isRowEditing ? null : hs.id)
                              }
                              className="text-[#D4D4D8] hover:text-white font-normal ml-1 cursor-pointer"
                            >
                              [{isRowEditing ? 'Cerrar' : 'Editar'}]
                            </button>
                          </td>
                          <td className="py-3 pr-4 text-xs">
                            {hs.type === 'nav' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-pink-500/15 border border-pink-500/35 text-pink-200">
                                <span>(^) → {destScene ? `Escena ${destIdx + 1}: ${destScene.title}` : 'Sin destino'}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 text-[#D4D4D8]">
                                (i) Informativo
                              </span>
                            )}
                          </td>
                          <td className="py-3 pr-4 text-[#E4E4E7] font-mono text-sm">
                            {isRowEditing ? (
                              <input
                                type="number"
                                step="0.5"
                                value={hs.pitch}
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
                          <td className="py-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteHotspot(hs.id)}
                              className="text-xs text-[#A1A1AA] hover:text-rose-400 inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Borrar</span>
                            </button>
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

      {/* Complete Relational CRUD Modal for Sedes, Habitaciones, Servicios, Promociones */}
      {crudModalTab && (
        <RelationalCrudModal
          activeTab={crudModalTab}
          onTabChange={setCrudModalTab}
          onClose={() => {
            setCrudModalTab(null);
            void refreshAdminEntities();
          }}
          onNotify={(msg) => setSavedNotice(msg)}
          onOpen360Scenes={(entity) => {
            setAllEntities((prev) =>
              prev.some((e) => e.key === entity.key) ? prev : [...prev, entity]
            );
            setSelectedEntityKey(entity.key);
            setCrudModalTab(null);
          }}
        />
      )}
    </div>
  );
}

function HotspotInlineEditor({
  hotspot,
  scenes,
  activeSceneId,
  isRelocating,
  onToggleRelocate,
  onJumpToScene,
  onUpdate,
  onDelete,
  onClose,
}: {
  hotspot: Hotspot360 | undefined;
  scenes: Scene360[];
  activeSceneId: string;
  isRelocating: boolean;
  onToggleRelocate: () => void;
  onJumpToScene: (sceneId: string) => void;
  onUpdate: (patch: Partial<Hotspot360>) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  if (!hotspot) return null;

  const fallbackTargetSceneId =
    scenes.find((s) => s.id !== activeSceneId)?.id || scenes[0]?.id;

  return (
    <div className="mt-4 rounded-2xl bg-[#16161B] border border-white/20 p-4 flex flex-wrap items-end gap-3 animate-fadeIn">
      <div className="flex-1 min-w-[160px]">
        <label className="block text-[11px] text-[#A1A1AA] mb-1">
          Título del Hotspot
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
        <label className="block text-[11px] text-[#A1A1AA] mb-1">Tipo</label>
        <select
          value={hotspot.type}
          onChange={(e) => {
            const nextType = e.target.value as 'info' | 'nav';
            if (nextType === 'nav') {
              onUpdate({
                type: 'nav',
                targetSceneId: hotspot.targetSceneId || fallbackTargetSceneId,
              });
            } else {
              onUpdate({ type: 'info' });
            }
          }}
          className="w-full rounded-xl bg-[#09090B] border border-[#27272A] px-2.5 py-1.5 text-xs text-white"
        >
          <option value="info">(i) Informativo</option>
          <option value="nav">(^) Navegación</option>
        </select>
      </div>

      {hotspot.type === 'nav' ? (
        <div className="flex items-end gap-2">
          <div className="w-48">
            <label className="block text-[11px] text-[#A1A1AA] mb-1">Escena Destino</label>
            <select
              value={hotspot.targetSceneId || fallbackTargetSceneId || ''}
              onChange={(e) => onUpdate({ targetSceneId: e.target.value })}
              className="w-full rounded-xl bg-[#09090B] border border-[#27272A] px-2.5 py-1.5 text-xs text-white"
            >
              {scenes.map((sc, i) => (
                <option key={sc.id} value={sc.id}>
                  Escena {i + 1}: {sc.adminTitle || sc.title}
                  {sc.id === activeSceneId ? ' (Actual)' : ''}
                </option>
              ))}
            </select>
          </div>
          {(hotspot.targetSceneId || fallbackTargetSceneId) && (
            <button
              type="button"
              onClick={() =>
                onJumpToScene((hotspot.targetSceneId || fallbackTargetSceneId)!)
              }
              className="px-3 py-1.5 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/40 text-pink-200 text-xs font-medium cursor-pointer"
            >
              Probar Salto →
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="flex-1 min-w-[180px]">
            <label className="block text-[11px] text-[#A1A1AA] mb-1">
              Descripción
            </label>
            <input
              type="text"
              value={hotspot.description || ''}
              onChange={(e) => onUpdate({ description: e.target.value })}
              className="w-full rounded-xl bg-[#09090B] border border-[#27272A] px-3 py-1.5 text-xs text-white"
            />
          </div>
          <div className="w-28">
            <label className="block text-[11px] text-[#A1A1AA] mb-1">
              Precio Adic. (S/)
            </label>
            <input
              type="number"
              step="1"
              value={hotspot.precioAdicional ?? ''}
              onChange={(e) =>
                onUpdate({
                  precioAdicional: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              placeholder="0"
              className="w-full rounded-xl bg-[#09090B] border border-[#27272A] px-2.5 py-1.5 text-xs text-white"
            />
          </div>
        </>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleRelocate}
          className={`px-3 py-1.5 rounded-xl text-xs cursor-pointer border ${
            isRelocating
              ? 'bg-amber-500/25 border-amber-400 text-amber-200 font-medium'
              : 'bg-white/10 border-white/15 text-white hover:bg-white/20'
          }`}
        >
          {isRelocating ? 'Click en 360°...' : 'Reubicar'}
        </button>
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

function RelationalCrudModal({
  activeTab,
  onTabChange,
  onClose,
  onNotify,
  onOpen360Scenes,
}: {
  activeTab: 'hero_slides' | 'sedes' | 'habitaciones' | 'servicios' | 'promociones';
  onTabChange: (t: 'hero_slides' | 'sedes' | 'habitaciones' | 'servicios' | 'promociones') => void;
  onClose: () => void;
  onNotify: (msg: string) => void;
  onOpen360Scenes: (entity: AdminEditableEntity) => void;
}) {
  const [heroSlides, setHeroSlides] = useState<DbHeroSlide[]>([]);
  const [sedes, setSedes] = useState<DbSede[]>([]);
  const [habitaciones, setHabitaciones] = useState<DbHabitacion[]>([]);
  const [servicios, setServicios] = useState<DbServicio[]>([]);
  const [promociones, setPromociones] = useState<DbPromocion[]>([]);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('180');
  const [newDesc, setNewDesc] = useState('');
  const [newSedeId, setNewSedeId] = useState('11111111-1111-4111-8111-111111111101');
  const [uploadingRowId, setUploadingRowId] = useState<string | null>(null);
  const [rowUploadProgress, setRowUploadProgress] = useState<number>(0);
  const [creatingHeroMedia, setCreatingHeroMedia] = useState(false);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Record<string, any>>({});
  const [customUploadName, setCustomUploadName] = useState<string>('');
  const [renamingRowId, setRenamingRowId] = useState<string | null>(null);
  const [renameRowDraft, setRenameRowDraft] = useState<string>('');
  const [isRenamingRow, setIsRenamingRow] = useState<boolean>(false);
  const rowFileRef = useRef<HTMLInputElement>(null);
  const heroCreateFileRef = useRef<HTMLInputElement>(null);
  const targetRowIdRef = useRef<string | null>(null);

  const startEditingRow = (row: Record<string, any>) => {
    if (editingRowId === row.id) {
      setEditingRowId(null);
      setEditDraft({});
      return;
    }
    setEditingRowId(row.id);
    setEditDraft({ ...row });
  };

  const handleSaveEditRow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRowId || !supabase) return;

    const id = editingRowId;
    const { id: _ignoreId, created_at: _ignoreCreated, ...payload } = editDraft;
    const { data, error } = await supabase
      .from(activeTab)
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      onNotify(`Error al guardar: ${error.message}`);
      return;
    }

    if (data) {
      if (activeTab === 'hero_slides') {
        setHeroSlides(heroSlides.map((r) => (r.id === id ? (data as DbHeroSlide) : r)));
      } else if (activeTab === 'sedes') {
        setSedes(sedes.map((r) => (r.id === id ? (data as DbSede) : r)));
      } else if (activeTab === 'habitaciones') {
        setHabitaciones(habitaciones.map((r) => (r.id === id ? (data as DbHabitacion) : r)));
      } else if (activeTab === 'servicios') {
        setServicios(servicios.map((r) => (r.id === id ? (data as DbServicio) : r)));
      } else if (activeTab === 'promociones') {
        setPromociones(promociones.map((r) => (r.id === id ? (data as DbPromocion) : r)));
      }
    }
    setEditingRowId(null);
    setEditDraft({});
    onNotify(`Cambios guardados en ${TAB_LABELS[activeTab]}`);
  };

  useEffect(() => {
    fetchHeroSlidesFromDb().then(setHeroSlides);
    fetchSedesFromDb().then(setSedes);
    fetchHabitacionesFromDb().then(setHabitaciones);
    fetchServiciosFromDb().then(setServicios);
    fetchPromocionesFromDb().then(setPromociones);
  }, []);

  const handleRowCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const rowId = targetRowIdRef.current;
    if (!file || !rowId) return;
    e.target.value = '';

    try {
      setUploadingRowId(rowId);
      setRowUploadProgress(8);
      if (activeTab === 'hero_slides') {
        const res = await uploadHeroMediaToR2(
          file,
          (pct) => setRowUploadProgress(pct),
          customUploadName.trim() || undefined
        );
        setCustomUploadName('');
        if (supabase) {
          const { error } = await supabase
            .from('hero_slides')
            .update({ media_url: res.mediaUrl, media_tipo: res.mediaTipo })
            .eq('id', rowId);
          if (error) throw new Error(error.message);
        }
        setRowUploadProgress(100);
        setHeroSlides(
          heroSlides.map((h) =>
            h.id === rowId ? { ...h, media_url: res.mediaUrl, media_tipo: res.mediaTipo } : h
          )
        );
        onNotify(`Hero media actualizado en R2 (${res.sizeText})`);
        return;
      }

      const slugForRow =
        (activeTab === 'sedes' && sedes.find((s) => s.id === rowId)?.slug) ||
        (activeTab === 'habitaciones' && habitaciones.find((h) => h.id === rowId)?.slug) ||
        (activeTab === 'servicios' && servicios.find((sv) => sv.id === rowId)?.slug) ||
        (activeTab === 'promociones' && promociones.find((pr) => pr.id === rowId)?.slug) ||
        rowId;

      const res = await compressAndUpload360Scene(
        file,
        {
          section: activeTab,
          slug: slugForRow,
          kind: 'portada',
          customName: customUploadName.trim() || undefined,
        },
        (pct) => setRowUploadProgress(pct)
      );
      setCustomUploadName('');
      const coverErr = await updateParentEntityCover(activeTab, rowId, res.panoramaUrl);
      if (coverErr) throw new Error(coverErr);
      setRowUploadProgress(100);

      if (activeTab === 'sedes') {
        setSedes(sedes.map((s) => (s.id === rowId ? { ...s, imagen_portada_url: res.panoramaUrl } : s)));
      } else if (activeTab === 'habitaciones') {
        setHabitaciones(
          habitaciones.map((h) => (h.id === rowId ? { ...h, portada_webp_url: res.panoramaUrl } : h))
        );
      } else if (activeTab === 'servicios') {
        setServicios(
          servicios.map((sv) => (sv.id === rowId ? { ...sv, portada_webp_url: res.panoramaUrl } : sv))
        );
      } else if (activeTab === 'promociones') {
        setPromociones(
          promociones.map((pr) => (pr.id === rowId ? { ...pr, imagen_webp_url: res.panoramaUrl } : pr))
        );
      }
      onNotify(`Portada subida a R2 + Supabase (${res.fileSizeWebP})`);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Error subiendo portada a R2');
      setRowUploadProgress(0);
    } finally {
      setTimeout(() => {
        setUploadingRowId(null);
        setRowUploadProgress(0);
      }, 650);
    }
  };

  const handleCreateHeroWithFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !supabase) return;
    e.target.value = '';
    try {
      setCreatingHeroMedia(true);
      setRowUploadProgress(8);
      const res = await uploadHeroMediaToR2(
        file,
        (pct) => setRowUploadProgress(pct),
        customUploadName.trim() || undefined
      );
      setCustomUploadName('');
      const { data, error } = await supabase
        .from('hero_slides')
        .insert({
          titulo: newName.trim() || 'SENSACIONES Y PRIVACIDAD',
          subtitulo: newDesc.trim() || 'Explora 5 sedes, habitaciones y servicios en 360°.',
          media_url: res.mediaUrl,
          media_tipo: res.mediaTipo,
          boton_texto: 'Explorar 360°',
          boton_url: newPrice.startsWith('/') ? newPrice : '/habitaciones',
          orden: heroSlides.length + 1,
          activo: true,
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      if (data) setHeroSlides([...heroSlides, data as DbHeroSlide]);
      setNewName('');
      setNewDesc('');
      onNotify(`Slide Hero creado en R2 + Supabase (${res.sizeText})`);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Error creando Hero Slide');
    } finally {
      setCreatingHeroMedia(false);
    }
  };

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'hero_slides') {
      heroCreateFileRef.current?.click();
      return;
    }
    if (!newName.trim() || !supabase) return;
    const slug = newName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    if (activeTab === 'sedes') {
      const { data, error } = await supabase
        .from('sedes')
        .insert({
          nombre: newName,
          slug,
          direccion: newDesc || 'Lima, Perú',
          google_maps_url: 'https://maps.google.com',
          waze_url: 'https://waze.com',
          whatsapp_numero: newPrice || '51987654321',
          imagen_portada_url: '',
          orden: sedes.length + 1,
          activo: true,
        })
        .select()
        .single();
      if (error) return onNotify(`Error: ${error.message}`);
      if (data) setSedes([...sedes, data as DbSede]);
    } else if (activeTab === 'habitaciones') {
      const { data, error } = await supabase
        .from('habitaciones')
        .insert({
          sede_id: newSedeId || sedes[0]?.id || '11111111-1111-4111-8111-111111111101',
          nombre: newName,
          slug,
          descripcion: newDesc || 'Suite temática con visor 360°',
          tarifa: Number(newPrice) || 180,
          moneda: 'S/',
          portada_webp_url: '',
          etiqueta_promo: null,
          orden: habitaciones.length + 1,
          activo: true,
        })
        .select()
        .single();
      if (error) return onNotify(`Error: ${error.message}`);
      if (data) setHabitaciones([...habitaciones, data as DbHabitacion]);
    } else if (activeTab === 'servicios') {
      const { data, error } = await supabase
        .from('servicios')
        .insert({
          sede_id: newSedeId || sedes[0]?.id || '11111111-1111-4111-8111-111111111101',
          nombre: newName,
          slug,
          descripcion: newDesc || 'Experiencia especial en suite',
          tarifa: Number(newPrice) || 60,
          moneda: 'S/',
          portada_webp_url: '',
          etiqueta_promo: 'Packs',
          orden: servicios.length + 1,
          activo: true,
        })
        .select()
        .single();
      if (error) return onNotify(`Error: ${error.message}`);
      if (data) setServicios([...servicios, data as DbServicio]);
    } else {
      const { data, error } = await supabase
        .from('promociones')
        .insert({
          sede_id: newSedeId || sedes[0]?.id || '11111111-1111-4111-8111-111111111101',
          titulo: newName,
          slug,
          descripcion: newDesc || 'Paquete promocional',
          precio_promo: Number(newPrice) || 140,
          precio_regular: Math.round((Number(newPrice) || 140) * 1.25),
          imagen_webp_url: '',
          fecha_fin: '2026-12-31',
          activo: true,
        })
        .select()
        .single();
      if (error) return onNotify(`Error: ${error.message}`);
      if (data) setPromociones([...promociones, data as DbPromocion]);
    }

    setNewName('');
    setNewDesc('');
    onNotify(`Registro creado en Supabase (${activeTab})`);
  };

  const handleDeleteRecord = async (id: string) => {
    if (supabase) {
      const { error } = await supabase.from(activeTab).delete().eq('id', id);
      if (error) return onNotify(`Error eliminando: ${error.message}`);
    }
    if (activeTab === 'hero_slides') setHeroSlides(heroSlides.filter((r) => r.id !== id));
    if (activeTab === 'sedes') setSedes(sedes.filter((r) => r.id !== id));
    if (activeTab === 'habitaciones') setHabitaciones(habitaciones.filter((r) => r.id !== id));
    if (activeTab === 'servicios') setServicios(servicios.filter((r) => r.id !== id));
    if (activeTab === 'promociones') setPromociones(promociones.filter((r) => r.id !== id));
    onNotify(`Eliminado de Supabase (${activeTab})`);
  };

  const handleRenameRowMedia = async (e: React.FormEvent, rowId: string, currentUrl: string) => {
    e.preventDefault();
    if (!renameRowDraft.trim() || isRenamingRow) return;
    try {
      setIsRenamingRow(true);
      const renamed = await renameR2Media(currentUrl, renameRowDraft.trim());
      if (activeTab === 'hero_slides') {
        if (supabase) {
          const { error } = await supabase
            .from('hero_slides')
            .update({ media_url: renamed.newUrl })
            .eq('id', rowId);
          if (error) throw new Error(error.message);
        }
        setHeroSlides(
          heroSlides.map((h) => (h.id === rowId ? { ...h, media_url: renamed.newUrl } : h))
        );
      } else {
        const coverErr = await updateParentEntityCover(activeTab, rowId, renamed.newUrl);
        if (coverErr) throw new Error(coverErr);
        if (activeTab === 'sedes') {
          setSedes(sedes.map((s) => (s.id === rowId ? { ...s, imagen_portada_url: renamed.newUrl } : s)));
        } else if (activeTab === 'habitaciones') {
          setHabitaciones(
            habitaciones.map((h) => (h.id === rowId ? { ...h, portada_webp_url: renamed.newUrl } : h))
          );
        } else if (activeTab === 'servicios') {
          setServicios(
            servicios.map((sv) => (sv.id === rowId ? { ...sv, portada_webp_url: renamed.newUrl } : sv))
          );
        } else if (activeTab === 'promociones') {
          setPromociones(
            promociones.map((pr) => (pr.id === rowId ? { ...pr, imagen_webp_url: renamed.newUrl } : pr))
          );
        }
      }
      onNotify(`Archivo R2 renombrado a: ${getFileNameFromUrl(renamed.newUrl)}`);
      setRenamingRowId(null);
      setRenameRowDraft('');
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Error renombrando archivo en R2');
    } finally {
      setIsRenamingRow(false);
    }
  };

  const renderRenameMediaButton = (rowId: string, currentUrl?: string | null) => {
    if (!currentUrl) return null;
    const isOpen = renamingRowId === rowId;
    return (
      <button
        type="button"
        onClick={() => {
          if (isOpen) {
            setRenamingRowId(null);
            setRenameRowDraft('');
          } else {
            setRenamingRowId(rowId);
            setRenameRowDraft(getFileNameFromUrl(currentUrl).replace(/\.[^.]+$/, ''));
          }
        }}
        title={`Renombrar archivo R2 (${getFileNameFromUrl(currentUrl)})`}
        className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[#E4E4E7] inline-flex items-center gap-1 cursor-pointer"
      >
        <Pencil className="w-3 h-3" />
        <span>{isOpen ? 'Cerrar' : 'Renombrar R2'}</span>
      </button>
    );
  };

  const renderRenameMediaForm = (rowId: string, currentUrl?: string | null) => {
    if (renamingRowId !== rowId || !currentUrl) return null;
    return (
      <form
        onSubmit={(e) => void handleRenameRowMedia(e, rowId, currentUrl)}
        className="flex flex-wrap items-center gap-2 bg-[#16161B] p-2.5 rounded-xl border border-white/15"
      >
        <span className="text-[11px] text-[#A1A1AA]">
          Actual: <strong className="text-white">{getFileNameFromUrl(currentUrl)}</strong>
        </span>
        <input
          type="text"
          value={renameRowDraft}
          onChange={(e) => setRenameRowDraft(e.target.value)}
          placeholder="nuevo-nombre-archivo"
          className="flex-1 min-w-[160px] rounded-lg bg-[#09090B] border border-[#27272A] px-2.5 py-1 text-xs text-white focus:outline-none"
        />
        <button
          type="submit"
          disabled={isRenamingRow}
          className="rounded-lg bg-white text-[#09090B] font-semibold text-xs py-1 px-3 cursor-pointer disabled:opacity-50"
        >
          {isRenamingRow ? 'Renombrando...' : 'Guardar en R2'}
        </button>
      </form>
    );
  };

  const TAB_LABELS: Record<typeof activeTab, string> = {
    hero_slides: 'Hero Banner',
    sedes: 'Sedes',
    habitaciones: 'Habitaciones',
    servicios: 'Servicios',
    promociones: 'Promociones',
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <input
        ref={rowFileRef}
        type="file"
        accept={activeTab === 'hero_slides' ? 'image/*,video/mp4,video/webm' : 'image/*'}
        onChange={handleRowCoverUpload}
        className="hidden"
      />
      <input
        ref={heroCreateFileRef}
        type="file"
        accept="image/*,video/mp4,video/webm"
        onChange={handleCreateHeroWithFile}
        className="hidden"
      />
      <div
        className="w-full max-w-3xl rounded-3xl p-6 text-white shadow-2xl max-h-[88vh] flex flex-col"
        style={{
          background: 'rgba(22, 22, 28, 0.96)',
          border: '1px solid rgba(255, 255, 255, 0.16)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex flex-wrap items-center gap-2">
            {(['hero_slides', 'sedes', 'habitaciones', 'servicios', 'promociones'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onTabChange(t)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  activeTab === t
                    ? 'bg-white text-[#09090B] font-semibold'
                    : 'bg-white/5 text-[#A1A1AA] hover:text-white'
                }`}
              >
                {TAB_LABELS[t]}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/15 text-[#A1A1AA] hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-3">
          <input
            type="text"
            value={customUploadName}
            onChange={(e) => setCustomUploadName(e.target.value)}
            placeholder="Nombre archivo R2 al subir (opcional, sin extensión, ej: suite-imperial-portada)"
            className="w-full rounded-xl bg-[#09090B] border border-[#27272A] px-3 py-1.5 text-xs text-white placeholder-[#71717A] focus:outline-none focus:border-white/30"
          />
        </div>

        {/* Create Form */}
        <form onSubmit={handleCreateRecord} className="mt-4 grid grid-cols-1 sm:grid-cols-5 gap-2.5">
          {(activeTab === 'habitaciones' || activeTab === 'servicios' || activeTab === 'promociones') && (
            <select
              value={newSedeId}
              onChange={(e) => setNewSedeId(e.target.value)}
              className="rounded-xl bg-[#121215] border border-[#27272A] px-3 py-2 text-xs text-white"
            >
              {sedes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          )}
          <input
            type="text"
            required={activeTab !== 'hero_slides'}
            placeholder={
              activeTab === 'hero_slides'
                ? 'Titular Hero (ej. SENSACIONES)'
                : activeTab === 'sedes'
                ? 'Nombre de Sede'
                : 'Nombre / Título'
            }
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="rounded-xl bg-[#121215] border border-[#27272A] px-3 py-2 text-xs text-white"
          />
          <input
            type="text"
            placeholder={
              activeTab === 'hero_slides'
                ? 'Ruta CTA (ej. /habitaciones)'
                : activeTab === 'sedes'
                ? 'WhatsApp (519...)'
                : 'Tarifa S/ (ej. 180)'
            }
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
            className="rounded-xl bg-[#121215] border border-[#27272A] px-3 py-2 text-xs text-white"
          />
          <input
            type="text"
            placeholder={
              activeTab === 'hero_slides'
                ? 'Subtítulo Hero'
                : activeTab === 'sedes'
                ? 'Dirección'
                : 'Descripción breve'
            }
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            className={`rounded-xl bg-[#121215] border border-[#27272A] px-3 py-2 text-xs text-white ${
              activeTab === 'hero_slides' || activeTab === 'sedes' ? 'sm:col-span-2' : ''
            }`}
          />
          <button
            type="submit"
            disabled={creatingHeroMedia}
            className="relative overflow-hidden rounded-xl bg-white text-[#09090B] font-semibold text-xs py-2 px-4 hover:bg-neutral-200 cursor-pointer"
          >
            {creatingHeroMedia && (
              <LiquidUploadFill progress={rowUploadProgress} isComplete={rowUploadProgress === 100} />
            )}
            <span className="relative z-10">
              {activeTab === 'hero_slides'
                ? creatingHeroMedia
                  ? `Subiendo ${rowUploadProgress}%`
                  : '+ Subir Foto/Video Hero'
                : `+ Crear`}
            </span>
          </button>
        </form>

        {/* Records Table */}
        <div className="mt-4 overflow-y-auto flex-1 divide-y divide-white/10 text-xs">
          {activeTab === 'hero_slides' && heroSlides.length === 0 && (
            <div className="py-8 text-center text-[#A1A1AA]">
              Aún no hay slides en la tabla <code>hero_slides</code>. Usa el formulario superior para subir una foto o video MP4 a R2.
            </div>
          )}
          {activeTab === 'hero_slides' &&
            heroSlides.map((hs) => (
              <div key={hs.id} className="py-3 space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {hs.media_tipo === 'video' ? (
                      <video src={hs.media_url} className="w-14 h-9 rounded-lg object-cover bg-black shrink-0" muted />
                    ) : (
                      <img src={hs.media_url} alt="" className="w-14 h-9 rounded-lg object-cover shrink-0" />
                    )}
                    <div className="truncate">
                      <span className="font-semibold text-white">{hs.titulo}</span>
                      <span className="ml-2 px-2 py-0.5 rounded-full bg-white/10 text-[10px] uppercase">
                        {hs.media_tipo}
                      </span>
                      <span className="text-[#A1A1AA] ml-2">{hs.subtitulo}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {hs.media_url && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-[#4ADE80] text-[11px] font-medium">
                        <Check className="w-3 h-3 stroke-[2.5]" />
                        <span>Subido</span>
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => startEditingRow(hs)}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                    >
                      {editingRowId === hs.id ? 'Cerrar' : 'Editar Textos'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        targetRowIdRef.current = hs.id;
                        rowFileRef.current?.click();
                      }}
                      className={`relative overflow-hidden px-2.5 py-1 rounded-lg inline-flex items-center gap-1 cursor-pointer ${
                        hs.media_url
                          ? 'bg-emerald-500/15 border border-emerald-500/35 text-[#4ADE80] hover:bg-emerald-500/25'
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                    >
                      {uploadingRowId === hs.id && (
                        <LiquidUploadFill progress={rowUploadProgress} isComplete={rowUploadProgress === 100} />
                      )}
                      <span className="relative z-10 inline-flex items-center gap-1">
                        {hs.media_url && <Check className="w-3 h-3 stroke-[2.5]" />}
                        <span>{uploadingRowId === hs.id ? `${rowUploadProgress}%` : hs.media_url ? 'Media R2' : 'Subir Media R2'}</span>
                      </span>
                    </button>
                    {renderRenameMediaButton(hs.id, hs.media_url)}
                    <button
                      type="button"
                      onClick={() => handleDeleteRecord(hs.id)}
                      className="text-rose-400 hover:underline cursor-pointer"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
                {renderRenameMediaForm(hs.id, hs.media_url)}
                {editingRowId === hs.id && (
                  <form onSubmit={handleSaveEditRow} className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-[#16161B] p-3 rounded-2xl border border-white/15">
                    <input type="text" placeholder="Título" value={editDraft.titulo || ''} onChange={(e) => setEditDraft({ ...editDraft, titulo: e.target.value })} className="rounded-lg bg-[#09090B] border border-[#27272A] px-2.5 py-1.5 text-xs text-white" />
                    <input type="text" placeholder="Etiqueta superior" value={editDraft.etiqueta_superior || ''} onChange={(e) => setEditDraft({ ...editDraft, etiqueta_superior: e.target.value })} className="rounded-lg bg-[#09090B] border border-[#27272A] px-2.5 py-1.5 text-xs text-white" />
                    <input type="text" placeholder="Subtítulo" value={editDraft.subtitulo || ''} onChange={(e) => setEditDraft({ ...editDraft, subtitulo: e.target.value })} className="rounded-lg bg-[#09090B] border border-[#27272A] px-2.5 py-1.5 text-xs text-white" />
                    <input type="text" placeholder="Texto botón" value={editDraft.boton_texto || ''} onChange={(e) => setEditDraft({ ...editDraft, boton_texto: e.target.value })} className="rounded-lg bg-[#09090B] border border-[#27272A] px-2.5 py-1.5 text-xs text-white" />
                    <input type="text" placeholder="URL botón" value={editDraft.boton_url || ''} onChange={(e) => setEditDraft({ ...editDraft, boton_url: e.target.value })} className="rounded-lg bg-[#09090B] border border-[#27272A] px-2.5 py-1.5 text-xs text-white" />
                    <button type="submit" className="rounded-lg bg-white text-[#09090B] font-semibold text-xs py-1.5 px-3 cursor-pointer">Guardar Cambios</button>
                  </form>
                )}
              </div>
            ))}

          {activeTab === 'sedes' &&
            sedes.map((s) => (
              <div key={s.id} className="py-3 space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {s.imagen_portada_url && (
                      <img src={s.imagen_portada_url} alt="" className="w-12 h-8 rounded-lg object-cover" />
                    )}
                    <div>
                      <span className="font-semibold text-white">{s.nombre}</span>
                      <span className="text-[#A1A1AA] ml-2">({s.direccion})</span>
                      <span className="text-emerald-400 ml-2">WA: {s.whatsapp_numero}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        onOpen360Scenes({
                          key: `sedes:${s.slug}`,
                          entityUuid: s.id,
                          dbEntidadTipo: 'habitacion',
                          category: 'sedes',
                          slug: s.slug,
                          title: s.nombre,
                          subtitle: s.direccion,
                          fullLabel: `${s.nombre} — Exterior & Recepción`,
                          defaultScenes: [],
                        })
                      }
                      className="px-2.5 py-1 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/40 text-pink-200 font-medium cursor-pointer"
                    >
                      Escenas 360°
                    </button>
                    <button
                      type="button"
                      onClick={() => startEditingRow(s)}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                    >
                      {editingRowId === s.id ? 'Cerrar' : 'Editar Textos'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        targetRowIdRef.current = s.id;
                        rowFileRef.current?.click();
                      }}
                      className={`relative overflow-hidden px-2.5 py-1 rounded-lg inline-flex items-center gap-1 cursor-pointer ${
                        s.imagen_portada_url
                          ? 'bg-emerald-500/15 border border-emerald-500/35 text-[#4ADE80] hover:bg-emerald-500/25'
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                    >
                      {uploadingRowId === s.id && (
                        <LiquidUploadFill progress={rowUploadProgress} isComplete={rowUploadProgress === 100} />
                      )}
                      <span className="relative z-10 inline-flex items-center gap-1">
                        {s.imagen_portada_url && <Check className="w-3 h-3 stroke-[2.5]" />}
                        <span>{uploadingRowId === s.id ? `${rowUploadProgress}%` : s.imagen_portada_url ? 'Portada R2' : 'Subir Portada R2'}</span>
                      </span>
                    </button>
                    {renderRenameMediaButton(s.id, s.imagen_portada_url)}
                    <button
                      type="button"
                      onClick={() => handleDeleteRecord(s.id)}
                      className="text-rose-400 hover:underline cursor-pointer"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
                {renderRenameMediaForm(s.id, s.imagen_portada_url)}
                {editingRowId === s.id && (
                  <form onSubmit={handleSaveEditRow} className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-[#16161B] p-3 rounded-2xl border border-white/15">
                    <input type="text" placeholder="Nombre" value={editDraft.nombre || ''} onChange={(e) => setEditDraft({ ...editDraft, nombre: e.target.value })} className="rounded-lg bg-[#09090B] border border-[#27272A] px-2.5 py-1.5 text-xs text-white" />
                    <input type="text" placeholder="Dirección" value={editDraft.direccion || ''} onChange={(e) => setEditDraft({ ...editDraft, direccion: e.target.value })} className="rounded-lg bg-[#09090B] border border-[#27272A] px-2.5 py-1.5 text-xs text-white" />
                    <input type="text" placeholder="WhatsApp" value={editDraft.whatsapp_numero || ''} onChange={(e) => setEditDraft({ ...editDraft, whatsapp_numero: e.target.value })} className="rounded-lg bg-[#09090B] border border-[#27272A] px-2.5 py-1.5 text-xs text-white" />
                    <input type="text" placeholder="Google Maps URL" value={editDraft.google_maps_url || ''} onChange={(e) => setEditDraft({ ...editDraft, google_maps_url: e.target.value })} className="rounded-lg bg-[#09090B] border border-[#27272A] px-2.5 py-1.5 text-xs text-white" />
                    <input type="text" placeholder="Waze URL" value={editDraft.waze_url || ''} onChange={(e) => setEditDraft({ ...editDraft, waze_url: e.target.value })} className="rounded-lg bg-[#09090B] border border-[#27272A] px-2.5 py-1.5 text-xs text-white" />
                    <button type="submit" className="rounded-lg bg-white text-[#09090B] font-semibold text-xs py-1.5 px-3 cursor-pointer">Guardar Cambios</button>
                  </form>
                )}
              </div>
            ))}

          {activeTab === 'habitaciones' &&
            habitaciones.map((h) => (
              <div key={h.id} className="py-3 space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {h.portada_webp_url && (
                      <img src={h.portada_webp_url} alt="" className="w-12 h-8 rounded-lg object-cover shrink-0" />
                    )}
                    <div className="truncate">
                      <span className="font-semibold text-white">{h.nombre}</span>
                      <span className="text-pink-400 ml-2">
                        {h.moneda} {h.tarifa}
                      </span>
                      <span className="text-[#A1A1AA] ml-2">{h.descripcion}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        onOpen360Scenes({
                          key: `habitaciones:${h.slug}`,
                          entityUuid: h.id,
                          dbEntidadTipo: 'habitacion',
                          category: 'habitaciones',
                          slug: h.slug,
                          title: h.nombre,
                          subtitle: `${h.moneda} ${h.tarifa}`,
                          fullLabel: `${h.nombre} — Habitación`,
                          defaultScenes: [],
                        })
                      }
                      className="px-2.5 py-1 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/40 text-pink-200 font-medium cursor-pointer"
                    >
                      Escenas 360°
                    </button>
                    <button
                      type="button"
                      onClick={() => startEditingRow(h)}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                    >
                      {editingRowId === h.id ? 'Cerrar' : 'Editar Textos'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        targetRowIdRef.current = h.id;
                        rowFileRef.current?.click();
                      }}
                      className={`relative overflow-hidden px-2.5 py-1 rounded-lg inline-flex items-center gap-1 cursor-pointer ${
                        h.portada_webp_url
                          ? 'bg-emerald-500/15 border border-emerald-500/35 text-[#4ADE80] hover:bg-emerald-500/25'
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                    >
                      {uploadingRowId === h.id && (
                        <LiquidUploadFill progress={rowUploadProgress} isComplete={rowUploadProgress === 100} />
                      )}
                      <span className="relative z-10 inline-flex items-center gap-1">
                        {h.portada_webp_url && <Check className="w-3 h-3 stroke-[2.5]" />}
                        <span>{uploadingRowId === h.id ? `${rowUploadProgress}%` : h.portada_webp_url ? 'Portada R2' : 'Subir Portada R2'}</span>
                      </span>
                    </button>
                    {renderRenameMediaButton(h.id, h.portada_webp_url)}
                    <button
                      type="button"
                      onClick={() => handleDeleteRecord(h.id)}
                      className="text-rose-400 hover:underline cursor-pointer"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
                {renderRenameMediaForm(h.id, h.portada_webp_url)}
                {editingRowId === h.id && (
                  <form onSubmit={handleSaveEditRow} className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-[#16161B] p-3 rounded-2xl border border-white/15">
                    <select value={editDraft.sede_id || ''} onChange={(e) => setEditDraft({ ...editDraft, sede_id: e.target.value })} className="rounded-lg bg-[#09090B] border border-[#27272A] px-2.5 py-1.5 text-xs text-white">
                      {sedes.map((s) => (
                        <option key={s.id} value={s.id}>{s.nombre}</option>
                      ))}
                    </select>
                    <input type="text" placeholder="Nombre" value={editDraft.nombre || ''} onChange={(e) => setEditDraft({ ...editDraft, nombre: e.target.value })} className="rounded-lg bg-[#09090B] border border-[#27272A] px-2.5 py-1.5 text-xs text-white" />
                    <input type="number" placeholder="Tarifa" value={editDraft.tarifa ?? 0} onChange={(e) => setEditDraft({ ...editDraft, tarifa: Number(e.target.value) })} className="rounded-lg bg-[#09090B] border border-[#27272A] px-2.5 py-1.5 text-xs text-white" />
                    <input type="text" placeholder="Etiqueta promo" value={editDraft.etiqueta_promo || ''} onChange={(e) => setEditDraft({ ...editDraft, etiqueta_promo: e.target.value })} className="rounded-lg bg-[#09090B] border border-[#27272A] px-2.5 py-1.5 text-xs text-white" />
                    <input type="text" placeholder="Descripción (separada por •)" value={editDraft.descripcion || ''} onChange={(e) => setEditDraft({ ...editDraft, descripcion: e.target.value })} className="sm:col-span-3 rounded-lg bg-[#09090B] border border-[#27272A] px-2.5 py-1.5 text-xs text-white" />
                    <button type="submit" className="rounded-lg bg-white text-[#09090B] font-semibold text-xs py-1.5 px-3 cursor-pointer">Guardar Cambios</button>
                  </form>
                )}
              </div>
            ))}

          {activeTab === 'servicios' &&
            servicios.map((sv) => (
              <div key={sv.id} className="py-3 space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {sv.portada_webp_url && (
                      <img src={sv.portada_webp_url} alt="" className="w-12 h-8 rounded-lg object-cover" />
                    )}
                    <div>
                      <span className="font-semibold text-white">{sv.nombre}</span>
                      <span className="text-pink-400 ml-2">
                        {sv.moneda} {sv.tarifa}
                      </span>
                      <span className="text-[#A1A1AA] ml-2">{sv.descripcion}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        onOpen360Scenes({
                          key: `servicios:${sv.slug}`,
                          entityUuid: sv.id,
                          dbEntidadTipo: 'servicio',
                          category: 'servicios',
                          slug: sv.slug,
                          title: sv.nombre,
                          subtitle: `${sv.moneda} ${sv.tarifa}`,
                          fullLabel: `${sv.nombre} — Servicios`,
                          defaultScenes: [],
                        })
                      }
                      className="px-2.5 py-1 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/40 text-pink-200 font-medium cursor-pointer"
                    >
                      Escenas 360°
                    </button>
                    <button
                      type="button"
                      onClick={() => startEditingRow(sv)}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                    >
                      {editingRowId === sv.id ? 'Cerrar' : 'Editar Textos'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        targetRowIdRef.current = sv.id;
                        rowFileRef.current?.click();
                      }}
                      className={`relative overflow-hidden px-2.5 py-1 rounded-lg inline-flex items-center gap-1 cursor-pointer ${
                        sv.portada_webp_url
                          ? 'bg-emerald-500/15 border border-emerald-500/35 text-[#4ADE80] hover:bg-emerald-500/25'
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                    >
                      {uploadingRowId === sv.id && (
                        <LiquidUploadFill progress={rowUploadProgress} isComplete={rowUploadProgress === 100} />
                      )}
                      <span className="relative z-10 inline-flex items-center gap-1">
                        {sv.portada_webp_url && <Check className="w-3 h-3 stroke-[2.5]" />}
                        <span>{uploadingRowId === sv.id ? `${rowUploadProgress}%` : sv.portada_webp_url ? 'Portada R2' : 'Subir Portada R2'}</span>
                      </span>
                    </button>
                    {renderRenameMediaButton(sv.id, sv.portada_webp_url)}
                    <button
                      type="button"
                      onClick={() => handleDeleteRecord(sv.id)}
                      className="text-rose-400 hover:underline cursor-pointer"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
                {renderRenameMediaForm(sv.id, sv.portada_webp_url)}
                {editingRowId === sv.id && (
                  <form onSubmit={handleSaveEditRow} className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-[#16161B] p-3 rounded-2xl border border-white/15">
                    <select value={editDraft.sede_id || ''} onChange={(e) => setEditDraft({ ...editDraft, sede_id: e.target.value })} className="rounded-lg bg-[#09090B] border border-[#27272A] px-2.5 py-1.5 text-xs text-white">
                      {sedes.map((s) => (
                        <option key={s.id} value={s.id}>{s.nombre}</option>
                      ))}
                    </select>
                    <input type="text" placeholder="Nombre" value={editDraft.nombre || ''} onChange={(e) => setEditDraft({ ...editDraft, nombre: e.target.value })} className="rounded-lg bg-[#09090B] border border-[#27272A] px-2.5 py-1.5 text-xs text-white" />
                    <input type="number" placeholder="Tarifa" value={editDraft.tarifa ?? 0} onChange={(e) => setEditDraft({ ...editDraft, tarifa: Number(e.target.value) })} className="rounded-lg bg-[#09090B] border border-[#27272A] px-2.5 py-1.5 text-xs text-white" />
                    <input type="text" placeholder="Categoría" value={editDraft.etiqueta_promo || ''} onChange={(e) => setEditDraft({ ...editDraft, etiqueta_promo: e.target.value })} className="rounded-lg bg-[#09090B] border border-[#27272A] px-2.5 py-1.5 text-xs text-white" />
                    <input type="text" placeholder="Descripción" value={editDraft.descripcion || ''} onChange={(e) => setEditDraft({ ...editDraft, descripcion: e.target.value })} className="sm:col-span-3 rounded-lg bg-[#09090B] border border-[#27272A] px-2.5 py-1.5 text-xs text-white" />
                    <button type="submit" className="rounded-lg bg-white text-[#09090B] font-semibold text-xs py-1.5 px-3 cursor-pointer">Guardar Cambios</button>
                  </form>
                )}
              </div>
            ))}

          {activeTab === 'promociones' &&
            promociones.map((pr) => (
              <div key={pr.id} className="py-3 space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {pr.imagen_webp_url && (
                      <img src={pr.imagen_webp_url} alt="" className="w-12 h-8 rounded-lg object-cover" />
                    )}
                    <div>
                      <span className="font-semibold text-white">{pr.titulo}</span>
                      <span className="text-pink-400 ml-2">S/ {pr.precio_promo}</span>
                      <span className="text-[#A1A1AA] line-through ml-1.5">
                        S/ {pr.precio_regular}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        onOpen360Scenes({
                          key: `promociones:${pr.slug}`,
                          entityUuid: pr.id,
                          dbEntidadTipo: 'servicio',
                          category: 'promociones',
                          slug: pr.slug,
                          title: pr.titulo,
                          subtitle: `S/ ${pr.precio_promo}`,
                          fullLabel: `${pr.titulo} — Promoción`,
                          defaultScenes: [],
                        })
                      }
                      className="px-2.5 py-1 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/40 text-pink-200 font-medium cursor-pointer"
                    >
                      Escenas 360°
                    </button>
                    <button
                      type="button"
                      onClick={() => startEditingRow(pr)}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                    >
                      {editingRowId === pr.id ? 'Cerrar' : 'Editar Textos'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        targetRowIdRef.current = pr.id;
                        rowFileRef.current?.click();
                      }}
                      className={`relative overflow-hidden px-2.5 py-1 rounded-lg inline-flex items-center gap-1 cursor-pointer ${
                        pr.imagen_webp_url
                          ? 'bg-emerald-500/15 border border-emerald-500/35 text-[#4ADE80] hover:bg-emerald-500/25'
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                    >
                      {uploadingRowId === pr.id && (
                        <LiquidUploadFill progress={rowUploadProgress} isComplete={rowUploadProgress === 100} />
                      )}
                      <span className="relative z-10 inline-flex items-center gap-1">
                        {pr.imagen_webp_url && <Check className="w-3 h-3 stroke-[2.5]" />}
                        <span>{uploadingRowId === pr.id ? `${rowUploadProgress}%` : pr.imagen_webp_url ? 'Portada R2' : 'Subir Portada R2'}</span>
                      </span>
                    </button>
                    {renderRenameMediaButton(pr.id, pr.imagen_webp_url)}
                    <button
                      type="button"
                      onClick={() => handleDeleteRecord(pr.id)}
                      className="text-rose-400 hover:underline cursor-pointer"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
                {renderRenameMediaForm(pr.id, pr.imagen_webp_url)}
                {editingRowId === pr.id && (
                  <form onSubmit={handleSaveEditRow} className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-[#16161B] p-3 rounded-2xl border border-white/15">
                    <select value={editDraft.sede_id || ''} onChange={(e) => setEditDraft({ ...editDraft, sede_id: e.target.value })} className="rounded-lg bg-[#09090B] border border-[#27272A] px-2.5 py-1.5 text-xs text-white">
                      {sedes.map((s) => (
                        <option key={s.id} value={s.id}>{s.nombre}</option>
                      ))}
                    </select>
                    <input type="text" placeholder="Título" value={editDraft.titulo || ''} onChange={(e) => setEditDraft({ ...editDraft, titulo: e.target.value })} className="rounded-lg bg-[#09090B] border border-[#27272A] px-2.5 py-1.5 text-xs text-white" />
                    <input type="number" placeholder="Precio Promo" value={editDraft.precio_promo ?? 0} onChange={(e) => setEditDraft({ ...editDraft, precio_promo: Number(e.target.value) })} className="rounded-lg bg-[#09090B] border border-[#27272A] px-2.5 py-1.5 text-xs text-white" />
                    <input type="number" placeholder="Precio Regular" value={editDraft.precio_regular ?? 0} onChange={(e) => setEditDraft({ ...editDraft, precio_regular: Number(e.target.value) })} className="rounded-lg bg-[#09090B] border border-[#27272A] px-2.5 py-1.5 text-xs text-white" />
                    <input type="text" placeholder="Fecha fin (YYYY-MM-DD)" value={editDraft.fecha_fin || ''} onChange={(e) => setEditDraft({ ...editDraft, fecha_fin: e.target.value })} className="rounded-lg bg-[#09090B] border border-[#27272A] px-2.5 py-1.5 text-xs text-white" />
                    <input type="text" placeholder="Descripción" value={editDraft.descripcion || ''} onChange={(e) => setEditDraft({ ...editDraft, descripcion: e.target.value })} className="sm:col-span-2 rounded-lg bg-[#09090B] border border-[#27272A] px-2.5 py-1.5 text-xs text-white" />
                    <button type="submit" className="rounded-lg bg-white text-[#09090B] font-semibold text-xs py-1.5 px-3 cursor-pointer">Guardar Cambios</button>
                  </form>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

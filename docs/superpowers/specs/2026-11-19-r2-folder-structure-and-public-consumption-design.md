# Especificación: Estructura de Carpetas en Cloudflare R2 y Consumo Dinámico en Vistas Públicas

**Fecha:** 2026-11-19
**Bucket Cloudflare R2:** `hotel-xnox-media`
**Proyecto Supabase:** `tjmetsamjalxttldhduu`

## 1. Estructura de Carpetas en Cloudflare R2
Todas las imágenes comprimidas a `image/webp` en el navegador desde `/admin` se organizan en el bucket `hotel-xnox-media` por sección (`sedes`, `habitaciones`, `servicios`, `promociones`), slug de la entidad y tipo de recurso (`360` o `portada`):

- **Sedes:**
  - Escenas 360°: `sedes/{slug}/360/{timestamp}-{nombre}.webp`
  - Miniaturas 360°: `sedes/{slug}/360/{timestamp}-{nombre}-thumb.webp`
  - Portada 2D: `sedes/{slug}/portada/{timestamp}-{nombre}.webp`
- **Habitaciones:**
  - Escenas 360°: `habitaciones/{slug}/360/{timestamp}-{nombre}.webp`
  - Miniaturas 360°: `habitaciones/{slug}/360/{timestamp}-{nombre}-thumb.webp`
  - Portada 2D: `habitaciones/{slug}/portada/{timestamp}-{nombre}.webp`
- **Servicios:**
  - Escenas 360°: `servicios/{slug}/360/{timestamp}-{nombre}.webp`
  - Miniaturas 360°: `servicios/{slug}/360/{timestamp}-{nombre}-thumb.webp`
  - Portada 2D: `servicios/{slug}/portada/{timestamp}-{nombre}.webp`
- **Promociones:**
  - Escenas 360°: `promociones/{slug}/360/{timestamp}-{nombre}.webp`
  - Miniaturas 360°: `promociones/{slug}/360/{timestamp}-{nombre}-thumb.webp`
  - Portada 2D: `promociones/{slug}/portada/{timestamp}-{nombre}.webp`

## 2. Sincronización con Supabase y Consumo en Vistas Públicas
1. Al subir la Escena 1 (`es_principal = true`) o marcar otra escena con estrella `★` en `/admin`, se registra en `public.escenas_360` y se actualiza automáticamente la columna de portada de la tabla padre (`sedes.imagen_portada_url`, `habitaciones.portada_webp_url`, `servicios.portada_webp_url`, `promociones.imagen_webp_url`).
2. Las funciones de lectura pública (`fetchSedesFromDb`, `fetchHabitacionesFromDb`, `fetchServiciosFromDb`, `fetchPromocionesFromDb`) hacen fallback automático a la escena principal de `public.escenas_360` de cada entidad si la columna de portada estuviera vacía.
3. Todas las vistas públicas consumen las imágenes reales de su sección correspondiente:
   - **Home (`/`)**: `HomeBentoCards.tsx` muestra las portadas reales de `habitaciones`, `servicios` y `sedes`.
   - **Sedes (`/sedes` y `/sedes/[slug]`)**: `SedesCatalogGrid.tsx` muestra la portada de cada sede desde `sedes/{slug}/...` y `TourViewer360.tsx` carga sus escenas 360°.
   - **Habitaciones (`/habitaciones` y `/habitaciones/[slug]`)**: `RoomsCatalogGrid.tsx` muestra las portadas desde `habitaciones/{slug}/...` y `TourViewer360.tsx` renderiza hasta 8 escenas 360° con sus hotspots.
   - **Servicios (`/servicios` y `/servicios/[slug]`)**: `ServicesCatalog.tsx` y `TourViewer360.tsx` muestran las imágenes desde `servicios/{slug}/...`.
   - **Promociones (`/promociones` y `/promociones/[slug]`)**: `PromotionsCatalog.tsx` y `TourViewer360.tsx` muestran las imágenes desde `promociones/{slug}/...`.

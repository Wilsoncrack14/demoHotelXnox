# Especificación de Diseño UI/UX y Arquitectura: Hotel Xnox (Demo Web 360°)

**Fecha:** 2026-11-18
**Stack:** Astro + React + Tailwind CSS
**Estilo Visual:** Apple Dark Mode + Neon Ambient Luxury

---

## 1. Visión General
Aplicación web de alta fidelidad y diseño responsivo para **Hotel Xnox**, cadena de hoteles boutique de lujo en Lima, Perú (5 sedes: Surco, Lince, Miraflores, San Borja y Los Olivos), centrada en recorridos inmersivos 360° y conversión directa por WhatsApp mediante un mini-modal Glassmorphism.

## 2. Design System (Apple Dark Mode)
- **Colores Base:**
  - Canvas Principal: `#09090B`
  - Superficie Bento / Cards: `#121215` y degradados oscuros `#18181B`
  - Bordes: `1px solid #27272A` (normal) y `#3F3F46` / `#FFFFFF` (activo/hover)
  - Glassmorphism: `rgba(24, 24, 27, 0.72)` con `backdrop-filter: blur(16px)`
- **Acentos y Semántica:**
  - CTA Primario: Fondo `#FFFFFF`, texto `#09090B` en negrita, forma píldora (`rounded-full`)
  - Badges Promocionales: Carmesí `#E11D48` con texto `#FAFAFA` (`-25% OFF`, `NOCHE ROMÁNTICA`, `PACK JACUZZI`)
  - WhatsApp Quick Action: Verde `#25D366` / Botón flotante circular Glassmorphism en esquina inferior derecha
  - Estado Guardado (Admin): Verde `#16A34A` con fondo translúcido `rgba(22, 163, 74, 0.18)`
  - Resplandor Ambiental: Luces neón magenta (`#EC4899`), púrpura (`#8B5CF6`) y azul (`#3B82F6`)
- **Tipografía:**
  - Fuente: `Plus Jakarta Sans` e `Inter`
  - Titulares Hero y Secciones: Mayúsculas con tracking cerrado (`-0.02em`), color `#FAFAFA`
  - Cuerpo y Descripciones: Gris de alta legibilidad `#A1A1AA`

## 3. Estructura de Rutas y Pantallas
1. **Home (`/`)**:
   - Navbar flotante Glassmorphism (`HOTEL XNOX`, dropdown `Sedes ∨`, `Habitaciones 360°`, `Servicios`, `Promociones`, botón `Reservar WhatsApp` e ícono de acceso rápido a `Admin`).
   - Hero banner panorámico con carrusel de 5 slides (`01 / 05`), titular `"SENSACIONES Y PRIVACIDAD"`, subtítulo `"Explora 5 sedes, habitaciones y servicios en 360°"`, doble botón píldora (`Explorar 360°` y `Ver Habitaciones`).
   - Grilla Bento de 3 columnas: `Suites Temáticas →`, `Servicios & Juegos →`, `5 Sedes Exclusivas →`.
2. **Catálogo de Habitaciones (`/habitaciones`) y Detalle de Sede (`/sedes/[slug]`)**:
   - En `/sedes/[slug]` (`detalle sede.jpg`): Top bar con `← Volver a sedes`, navegación central y `Reservar WhatsApp`. Encabezado editorial (`Sede Surco`, subtítulo, horario y estacionamiento) + tarjeta Glassmorphism de dirección (`Av. Benavides 4510, Surco`, enlaces a Google Maps • Waze y CTA `Reservar por WhatsApp`).
   - Visor 360° panorámico de la sede con hotspots (`(i) Ingreso Vehicular Privado`, `(^) Explorar Suites Temáticas`).
   - Grilla inferior de 3 columnas con las habitaciones de la sede (`Suite Neón Jacuzzi`, `Suite Luxury`, `Suite Ejecutiva`).
3. **Detalle 360° de Habitación (`/habitaciones/[slug]`)**:
   - Top bar contextual: `← Volver al catálogo`, título centrado (`Suite Neón Jacuzzi — Sede Surco`), tarifa (`S/ 180 (4 Horas)`) y CTA `Reservar WhatsApp`.
   - Visor 360° widescreen con controles `Pantalla completa` y `Giro 360°`, hotspots interactivos (`(i) Jacuzzi con Hidromasaje`, `(^) Ir a Zona de Descanso`).
   - Carrusel horizontal de hasta 8 escenas (`Jacuzzi (Principal)`, `Cama Temática`, `Sillón Tántrico`, `Baño Privado`, `Ingreso`, `Vista 360°`).
   - Split inferior de 2 columnas: lista de equipamiento a la izquierda, imagen ambiental al centro y tarjeta Glassmorphism de ubicación/reserva a la derecha.
4. **Catálogo de Servicios (`/servicios`) y Detalle (`/servicios/[slug]`)**:
   - Encabezado `SERVICIOS & EXPERIENCIAS` con barra de filtros píldora (`Todas • Jacuzzi • Sillón Tántrico • Decoraciones • Packs`).
   - Grilla Bento asimétrica: tarjeta destacada vertical izquierda (`Packs de Decoración & Celebraciones`, badges `Sede Lince • Sede Surco`, `S/ 90 (Ad-on)`, `Ver Detalles 360° →`) + grilla 2x2 derecha (`Sillón Tántrico`, `Jacuzzi con Hidromasaje`, `Juegos y Juguetes Temáticos` con badges `Tour 360° ↻`).
   - Vista de detalle `/servicios/[slug]` con visor 360°, miniaturas, lista de equipamiento y tarjeta de disponibilidad multi-sede.
5. **Catálogo de Promociones (`/promociones`) y Detalle (`/promociones/[slug]`)**:
   - Encabezado `PROMOCIONES & PAQUETES` con filtro por sede (`Todas • Lince • Miraflores • San Borja • Surco • Los Olivos`).
   - Grilla de 3 tarjetas verticales con doble badge rojo carmesí (`-25% OFF`, `NOCHE ROMÁNTICA`, `PACK JACUZZI`), sedes válidas, fecha de vencimiento, precio regular tachado (`S/ 190`) junto a precio promocional (`S/ 140`) y botón blanco `Reservar WhatsApp`.
   - Vista de detalle `/promociones/[slug]` con barra superior mostrando precio promo y precio anterior tachado, visor 360°, carrusel con flechas laterales y lista `"Que incluye:"`.
6. **Panel de Administración (`/admin`)**:
   - Navbar `HOTEL XNOX Admin` con selectores y botón `Salir`.
   - Barra de estado: `Editando: Suite Neón Jacuzzi — Sede Surco`, badge verde `✓ Cambios guardados` y botón `+ Subir Escena 360°`.
   - Columna izquierda (`Lista de Escenas (Máx. 8)`): tarjetas de escenas cargadas con estrella de principal, tamaño en `WebP` (`1.2 MB WebP`) y slots punteados para nuevas escenas (`Sube Escena 4`, `Sube Escena 5`).
   - Columna derecha (`Lienzo Interactivo 360° (~75%)`): visor interactivo donde hacer clic agrega un hotspot en las coordenadas `(coord-pitch, coord-yaw)` clicadas, permite editar o borrar hotspots existentes (`Editar ✎ | Borrar 🗑`) y sincroniza la tabla inferior (`Lista de Hotspots en escena activa`) con `localStorage`.

## 4. Componentes Interactivos Clave
- **`PanoramaViewer360.tsx`**: Visor panorámico con soporte de drag horizontal/vertical, paneo continuo 360°, modo auto-giro (`Giro 360°`), API Fullscreen nativa, renderizado de hotspots posicionados por `(pitch, yaw)` y sincronización en vivo con los datos editados en `/admin` mediante `localStorage`.
- **`WhatsAppBookingModal.tsx`**: Mini-modal Glassmorphism invocado desde cualquier CTA de WhatsApp. Permite confirmar/ajustar Sede, Habitación/Servicio/Promoción, Fecha/Hora estimada de ingreso y Duración/Adicionales antes de redirigir a `https://wa.me/` con el mensaje estructurado.

import os
from PIL import Image, ImageDraw, ImageFilter

os.makedirs("public/images", exist_ok=True)

def feathered_inpaint(img, box, pad=18, blur_radius=12):
    """
    Replaces a region (x1, y1, x2, y2) with smooth bilinear interpolation from outside
    the box and blends it using a feathered rounded alpha mask so no rectangle edge is visible.
    """
    width, height = img.size
    x1 = max(2, box[0] - pad)
    y1 = max(2, box[1] - pad)
    x2 = min(width - 3, box[2] + pad)
    y2 = min(height - 3, box[3] + pad)
    w = x2 - x1
    h = y2 - y1
    px = img.load()

    patch = Image.new("RGB", (w, h))
    p_px = patch.load()

    for y in range(h):
        ty = y / max(1, h - 1)
        for x in range(w):
            tx = x / max(1, w - 1)
            c_top = px[x1 + x, max(0, y1 - 2)]
            c_bot = px[x1 + x, min(height - 1, y2 + 2)]
            c_left = px[max(0, x1 - 2), y1 + y]
            c_right = px[min(width - 1, x2 + 2), y1 + y]

            # Inverse distance weights to the 4 edges
            wt = 1.0 / (ty + 0.03)
            wb = 1.0 / ((1.0 - ty) + 0.03)
            wl = 0.45 / (tx + 0.05)
            wr = 0.45 / ((1.0 - tx) + 0.05)
            wsum = wt + wb + wl + wr

            r = int((wt * c_top[0] + wb * c_bot[0] + wl * c_left[0] + wr * c_right[0]) / wsum)
            g = int((wt * c_top[1] + wb * c_bot[1] + wl * c_left[1] + wr * c_right[1]) / wsum)
            b = int((wt * c_top[2] + wb * c_bot[2] + wl * c_left[2] + wr * c_right[2]) / wsum)
            p_px[x, y] = (r, g, b)

    patch = patch.filter(ImageFilter.GaussianBlur(radius=8))

    # Create feathered alpha mask
    mask = Image.new("L", (w, h), 0)
    draw = ImageDraw.Draw(mask)
    inset = max(4, pad // 2)
    draw.rounded_rectangle((inset, inset, w - inset, h - inset), radius=24, fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(radius=blur_radius))

    region = img.crop((x1, y1, x2, y2))
    blended = Image.composite(patch, region, mask)
    img.paste(blended, (x1, y1))
    return img

# 1. HOME HERO & BENTO CARDS
home = Image.open("home.jpg").convert("RGB")
serv = Image.open("servicios.jpg").convert("RGB")

hero_bg = home.crop((0, 152, 2752, 945)).copy()
# Clean headline + subtitle on dark blue wall
feathered_inpaint(hero_bg, (315, 115, 1145, 455), pad=22, blur_radius=14)
# Notice the clean jacuzzi in servicios.jpg bottom-middle card (x: 1020..1776, y: 1004..1340)
# Paste and blend the clean jacuzzi water over the buttons region in hero_bg!
feathered_inpaint(hero_bg, (325, 465, 995, 595), pad=22, blur_radius=14)
# Clean 01/05 dots at bottom center
feathered_inpaint(hero_bg, (1250, 650, 1500, 775), pad=18, blur_radius=10)
hero_bg.save("public/images/hero-main.webp", "WEBP", quality=92)

home.crop((254, 1047, 966, 1410)).save("public/images/bento-suites.webp", "WEBP", quality=92)
home.crop((1020, 1047, 1732, 1410)).save("public/images/bento-servicios.webp", "WEBP", quality=92)
home.crop((1786, 1047, 2498, 1410)).save("public/images/bento-sedes.webp", "WEBP", quality=92)

# 2. DETALLE HABITACION 360 PANORAMA
det_hab = Image.open("detallle habitacion.jpg").convert("RGB")
pano_hab = det_hab.crop((116, 200, 2636, 776)).copy()
# Hotspot 1: (i) Jacuzzi con Hidromasaje
feathered_inpaint(pano_hab, (310, 295, 795, 415), pad=20, blur_radius=12)
# Hotspot 2: (^) Ir a Zona de Descanso
feathered_inpaint(pano_hab, (1385, 245, 1835, 365), pad=20, blur_radius=12)
# Top-right badges: Pantalla completa & Giro 360
feathered_inpaint(pano_hab, (1955, 15, 2505, 115), pad=16, blur_radius=10)
pano_hab.save("public/images/pano-suite-neon.webp", "WEBP", quality=92)

thumb_x = [
    (254, 596, "thumb-jacuzzi-principal.webp"),
    (636, 978, "thumb-cama-tematica.webp"),
    (1016, 1358, "thumb-sillon-tantrico.webp"),
    (1396, 1738, "thumb-bano-privado.webp"),
    (1776, 2118, "thumb-ingreso.webp"),
    (2156, 2498, "thumb-vista-360.webp"),
]
for x1, x2, fname in thumb_x:
    det_hab.crop((x1, 822, x2, 965)).save(f"public/images/{fname}", "WEBP", quality=90)

# 3. DETALLE SEDE 360 PANORAMA & ROOM CARDS
det_sede = Image.open("detalle sede.jpg").convert("RGB")
pano_sede = det_sede.crop((116, 520, 2636, 892)).copy()
# Hotspot 1: (i) Ingreso Vehicular Privado
feathered_inpaint(pano_sede, (500, 140, 1025, 262), pad=18, blur_radius=12)
# Hotspot 2: (^) Explorar Suites Tematicas
feathered_inpaint(pano_sede, (1740, 140, 2275, 262), pad=18, blur_radius=12)
# Top-right buttons
feathered_inpaint(pano_sede, (1955, 12, 2505, 115), pad=16, blur_radius=10)
pano_sede.save("public/images/pano-sede-surco.webp", "WEBP", quality=92)

det_sede.crop((254, 1048, 966, 1345)).save("public/images/room-suite-neon.webp", "WEBP", quality=92)
det_sede.crop((1020, 1048, 1732, 1345)).save("public/images/room-suite-luxury.webp", "WEBP", quality=92)
det_sede.crop((1786, 1048, 2498, 1345)).save("public/images/room-suite-ejecutiva.webp", "WEBP", quality=92)

# 4. SERVICIOS CARDS
serv_decor = serv.crop((114, 462, 966, 1110)).copy()
feathered_inpaint(serv_decor, (20, 18, 455, 112), pad=16, blur_radius=10)
serv_decor.save("public/images/service-decoracion.webp", "WEBP", quality=92)

serv_sillon1 = serv.crop((1020, 462, 1776, 825)).copy()
feathered_inpaint(serv_sillon1, (505, 15, 745, 108), pad=14, blur_radius=10)
serv_sillon1.save("public/images/service-sillon-1.webp", "WEBP", quality=92)

serv_sillon2 = serv.crop((1830, 462, 2636, 825)).copy()
feathered_inpaint(serv_sillon2, (550, 15, 795, 108), pad=14, blur_radius=10)
serv_sillon2.save("public/images/service-sillon-2.webp", "WEBP", quality=92)

serv.crop((1020, 1004, 1776, 1340)).save("public/images/service-jacuzzi.webp", "WEBP", quality=92)
serv.crop((1830, 1004, 2636, 1340)).save("public/images/service-juegos.webp", "WEBP", quality=92)

# 5. DETALLE SERVICIO PANORAMA & THUMBNAILS
det_serv = Image.open("detalle servicio.jpg").convert("RGB")
pano_serv = det_serv.crop((116, 200, 2636, 776)).copy()
feathered_inpaint(pano_serv, (315, 300, 855, 422), pad=20, blur_radius=12)
feathered_inpaint(pano_serv, (1390, 248, 1905, 368), pad=20, blur_radius=12)
feathered_inpaint(pano_serv, (1955, 15, 2505, 115), pad=16, blur_radius=10)
pano_serv.save("public/images/pano-servicio-decoracion.webp", "WEBP", quality=92)

thumb_serv_x = [
    (254, 596, "thumb-cama-decorada.webp"),
    (636, 978, "thumb-jacuzzi-decorado.webp"),
    (1016, 1358, "thumb-mesa-bienvenida.webp"),
    (1396, 1738, "thumb-detalle-velas.webp"),
    (1776, 2118, "thumb-iluminacion-neon.webp"),
    (2156, 2498, "thumb-ingreso-suite.webp"),
]
for x1, x2, fname in thumb_serv_x:
    det_serv.crop((x1, 822, x2, 965)).save(f"public/images/{fname}", "WEBP", quality=90)

# 6. PROMOCIONES CARDS
promo = Image.open("promociones.jpg").convert("RGB")
promo_c1 = promo.crop((254, 530, 966, 985)).copy()
feathered_inpaint(promo_c1, (20, 18, 232, 105), pad=14, blur_radius=10)
feathered_inpaint(promo_c1, (30, 418, 240, 455), pad=10, blur_radius=8)
promo_c1.save("public/images/promo-suite-neon.webp", "WEBP", quality=92)

promo_c2 = promo.crop((1020, 530, 1732, 985)).copy()
feathered_inpaint(promo_c2, (20, 18, 395, 105), pad=14, blur_radius=10)
feathered_inpaint(promo_c2, (30, 418, 405, 455), pad=10, blur_radius=8)
promo_c2.save("public/images/promo-noche-romantica.webp", "WEBP", quality=92)

promo_c3 = promo.crop((1786, 530, 2498, 985)).copy()
feathered_inpaint(promo_c3, (20, 18, 306, 105), pad=14, blur_radius=10)
feathered_inpaint(promo_c3, (30, 418, 315, 455), pad=10, blur_radius=8)
promo_c3.save("public/images/promo-pack-jacuzzi.webp", "WEBP", quality=92)

# 7. DETALLE PROMOCIONES PANORAMA
det_promo = Image.open("detalle promociones.jpg").convert("RGB")
pano_promo = det_promo.crop((116, 200, 2636, 776)).copy()
feathered_inpaint(pano_promo, (315, 300, 855, 422), pad=20, blur_radius=12)
feathered_inpaint(pano_promo, (1400, 248, 2015, 368), pad=20, blur_radius=12)
feathered_inpaint(pano_promo, (1955, 15, 2505, 115), pad=16, blur_radius=10)
pano_promo.save("public/images/pano-promo-celebracion.webp", "WEBP", quality=92)

print("Feathered clean panoramas generated!")

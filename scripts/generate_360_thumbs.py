import math
from PIL import Image

def equirect_to_rectilinear(src_img, yaw_deg, pitch_deg, fov_deg=85, out_w=800, out_h=500):
    """
    Projects a 2:1 equirectangular 360 image into a distortion-free rectilinear perspective image
    for thumbnails and room cards.
    """
    src_w, src_h = src_img.size
    src_px = src_img.load()
    dst = Image.new("RGB", (out_w, out_h))
    dst_px = dst.load()

    yaw = math.radians(yaw_deg)
    pitch = math.radians(pitch_deg)
    fov = math.radians(fov_deg)
    aspect = out_w / out_h
    tan_half_fov = math.tan(fov / 2.0)

    cos_p = math.cos(pitch)
    sin_p = math.sin(pitch)
    cos_y = math.cos(yaw)
    sin_y = math.sin(yaw)

    for y in range(out_h):
        ndc_y = 1.0 - 2.0 * (y / (out_h - 1))
        vy = ndc_y * tan_half_fov
        for x in range(out_w):
            ndc_x = 2.0 * (x / (out_w - 1)) - 1.0
            vx = ndc_x * tan_half_fov * aspect
            vz = -1.0

            # Rotate by pitch (around X)
            ry = vy * cos_p - vz * sin_p
            rz = vy * sin_p + vz * cos_p
            rx = vx

            # Rotate by yaw (around Y)
            wx = rx * cos_y - rz * sin_y
            wz = rx * sin_y + rz * cos_y
            wy = ry

            norm = math.sqrt(wx * wx + wy * wy + wz * wz)
            wx /= norm
            wy /= norm
            wz /= norm

            lon = math.atan2(wx, -wz)
            lat = math.asin(max(-1.0, min(1.0, wy)))

            u = (0.5 + lon / (2.0 * math.pi)) % 1.0
            v = max(0.0, min(1.0, 0.5 - lat / math.pi))

            sx = int(u * (src_w - 1))
            sy = int(v * (src_h - 1))
            dst_px[x, y] = src_px[sx, sy]

    return dst

img_web3 = Image.open("public/images/web 3.webp").convert("RGB")
img_web1 = Image.open("public/images/web 1.webp").convert("RGB")
img_wep2 = Image.open("public/images/wep 2.webp").convert("RGB")
img_wep  = Image.open("public/images/wep.webp").convert("RGB")

# Generate distortion-free perspective thumbnails from the real 360 photos
equirect_to_rectilinear(img_web3, yaw_deg=48, pitch_deg=-15, fov_deg=85, out_w=640, out_h=400).save(
    "public/images/real360-thumb-jacuzzi.webp", "WEBP", quality=90
)
equirect_to_rectilinear(img_web3, yaw_deg=-55, pitch_deg=-12, fov_deg=85, out_w=640, out_h=400).save(
    "public/images/real360-thumb-cama.webp", "WEBP", quality=90
)
equirect_to_rectilinear(img_web3, yaw_deg=118, pitch_deg=-18, fov_deg=85, out_w=640, out_h=400).save(
    "public/images/real360-thumb-sillon.webp", "WEBP", quality=90
)
equirect_to_rectilinear(img_wep2, yaw_deg=-70, pitch_deg=-12, fov_deg=88, out_w=640, out_h=400).save(
    "public/images/real360-thumb-bano.webp", "WEBP", quality=90
)
equirect_to_rectilinear(img_wep, yaw_deg=-35, pitch_deg=-12, fov_deg=88, out_w=640, out_h=400).save(
    "public/images/real360-thumb-lounge.webp", "WEBP", quality=90
)
equirect_to_rectilinear(img_web1, yaw_deg=-80, pitch_deg=-10, fov_deg=92, out_w=640, out_h=400).save(
    "public/images/real360-thumb-vista360.webp", "WEBP", quality=90
)

print("Generated 6 rectilinear perspective thumbnails from the real 360 photos!")

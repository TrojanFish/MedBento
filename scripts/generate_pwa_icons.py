#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
generate_pwa_icons.py - Render high-res PWA PNG icons from design
"""

import os
from pathlib import Path
from PIL import Image, ImageDraw

ICONS_DIR = Path(__file__).resolve().parent.parent / "icons"
ICONS_DIR.mkdir(exist_ok=True)

def draw_icon(size: int, is_maskable: bool = False) -> Image.Image:
    # 512 base canvas
    canvas_size = 512
    img = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 1. Background
    bg_color = (5, 11, 20, 255)
    border_color = (0, 229, 255, 180)
    
    if is_maskable:
        # Full square bleed for maskable icons
        draw.rectangle([0, 0, canvas_size, canvas_size], fill=bg_color)
    else:
        # Rounded rectangle
        corner_radius = int(canvas_size * 0.22)
        draw.rounded_rectangle([0, 0, canvas_size, canvas_size], radius=corner_radius, fill=bg_color)
        draw.rounded_rectangle([4, 4, canvas_size - 4, canvas_size - 4], radius=corner_radius - 4, outline=border_color, width=5)

    # 2. Bento Grid Graphic
    # Top-Left Box (Heartbeat)
    draw.rounded_rectangle([116, 116, 281, 251], radius=20, fill=(0, 229, 255, 30), outline=(0, 229, 255, 255), width=4)
    # Heartbeat Pulse
    pulse_points = [
        (135, 183), (165, 183), (180, 145), (198, 220), (215, 160), (230, 183), (260, 183)
    ]
    draw.line(pulse_points, fill=(0, 229, 255, 255), width=6, joint="round")

    # Top-Right Box (Trend)
    draw.rounded_rectangle([296, 116, 396, 251], radius=20, fill=(16, 185, 129, 30), outline=(16, 185, 129, 255), width=4)
    # Arrow
    draw.line([(320, 210), (365, 155)], fill=(16, 185, 129, 255), width=6)
    draw.line([(340, 155), (365, 155), (365, 180)], fill=(16, 185, 129, 255), width=6)

    # Bottom-Left Box (Stat)
    draw.rounded_rectangle([116, 266, 216, 396], radius=20, fill=(245, 158, 11, 30), outline=(245, 158, 11, 255), width=4)
    draw.ellipse([146, 311, 186, 351], outline=(245, 158, 11, 255), width=4)
    draw.line([(166, 321), (166, 331), (176, 331)], fill=(245, 158, 11, 255), width=4)

    # Bottom-Right Box (KM Step Curve)
    draw.rounded_rectangle([231, 266, 396, 396], radius=20, fill=(0, 229, 255, 25), outline=(0, 229, 255, 255), width=4)
    km_steps = [
        (250, 296), (280, 296), (280, 320), (320, 320), (320, 345), (350, 345), (350, 370), (375, 370)
    ]
    draw.line(km_steps, fill=(0, 229, 255, 255), width=5, joint="curve")
    draw.ellipse([246, 292, 254, 300], fill=(0, 229, 255, 255))
    draw.ellipse([371, 366, 379, 374], fill=(0, 229, 255, 255))

    # Center sparkle
    draw.ellipse([228, 248, 234, 254], fill=(255, 255, 255, 255))

    # Resize to target size
    if size != canvas_size:
        img = img.resize((size, size), Image.Resampling.LANCZOS)
    return img

def main():
    print("Generating PWA Icon Assets...")
    
    # 1. 512x512
    img_512 = draw_icon(512, is_maskable=False)
    img_512.save(ICONS_DIR / "icon-512.png", "PNG")
    print(" - Saved icons/icon-512.png")

    # 2. 512x512 maskable
    img_maskable = draw_icon(512, is_maskable=True)
    img_maskable.save(ICONS_DIR / "icon-maskable-512.png", "PNG")
    print(" - Saved icons/icon-maskable-512.png")

    # 3. 192x192
    img_192 = draw_icon(192, is_maskable=False)
    img_192.save(ICONS_DIR / "icon-192.png", "PNG")
    print(" - Saved icons/icon-192.png")

    # 4. Apple Touch Icon
    img_apple = draw_icon(180, is_maskable=False)
    img_apple.save(ICONS_DIR / "apple-touch-icon.png", "PNG")
    print(" - Saved icons/apple-touch-icon.png")

    # 5. Favicon
    img_32 = draw_icon(32, is_maskable=False)
    img_32.save(Path(__file__).resolve().parent.parent / "favicon.ico", format="ICO")
    print(" - Saved favicon.ico")

    print("All PWA icons generated successfully!")

if __name__ == "__main__":
    main()

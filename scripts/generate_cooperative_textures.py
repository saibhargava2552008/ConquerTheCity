import os
import math
from PIL import Image, ImageDraw, ImageFont

TEXTURE_DIR = os.path.abspath('public/models/textures')
os.makedirs(TEXTURE_DIR, exist_ok=True)

FONT_TELUGU = 'C:/Windows/Fonts/Nirmala.ttc'
FONT_ARIAL_BD = 'C:/Windows/Fonts/arialbd.ttf'
FONT_ARIAL = 'C:/Windows/Fonts/arial.ttf'

def get_font(path, size, index=0):
    try:
        if path.endswith('.ttc'):
            return ImageFont.truetype(path, size, index=index)
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()

def create_signboard():
    w, h = 1024, 256
    img = Image.new('RGBA', (w, h), (18, 48, 86, 255)) # Deep coastal navy
    draw = ImageDraw.Draw(img)

    # Gradient / weathering
    for y in range(h):
        alpha = int(255 - 40 * (y / h))
        draw.line([(0, y), (w, y)], fill=(15 + int(y * 0.05), 45 + int(y * 0.05), 80 + int(y * 0.05), alpha))

    # Gold decorative double border
    draw.rectangle([8, 8, w - 9, h - 9], outline=(218, 165, 32, 255), width=4)
    draw.rectangle([16, 16, w - 17, h - 17], outline=(245, 215, 110, 220), width=2)

    # Corner rosettes / accents
    for cx, cy in [(24, 24), (w - 25, 24), (24, h - 25), (w - 25, h - 25)]:
        draw.ellipse([cx - 5, cy - 5, cx + 5, cy + 5], fill=(245, 215, 110, 255))

    # Text
    f_telugu = get_font(FONT_TELUGU, 58, index=0)
    f_eng = get_font(FONT_ARIAL_BD, 42)
    f_sub = get_font(FONT_ARIAL, 22)

    t_telugu = "మత్స్యకారుల సహకార సంఘం"
    t_eng = "SEAVIEW FISHERMEN'S COOPERATIVE"
    t_sub = "REGD. NO. F-408/ESTD. 1982  •  ANDHRA PRADESH FISHERIES DEPT."

    # Center text
    bbox_tel = draw.textbbox((0, 0), t_telugu, font=f_telugu)
    tw_tel = bbox_tel[2] - bbox_tel[0]
    draw.text(((w - tw_tel) // 2 + 2, 28 + 2), t_telugu, font=f_telugu, fill=(10, 20, 40, 200)) # shadow
    draw.text(((w - tw_tel) // 2, 28), t_telugu, font=f_telugu, fill=(255, 235, 150, 255)) # gold-cream

    bbox_eng = draw.textbbox((0, 0), t_eng, font=f_eng)
    tw_eng = bbox_eng[2] - bbox_eng[0]
    draw.text(((w - tw_eng) // 2 + 1, 112 + 1), t_eng, font=f_eng, fill=(0, 0, 0, 180))
    draw.text(((w - tw_eng) // 2, 112), t_eng, font=f_eng, fill=(255, 255, 255, 255))

    bbox_sub = draw.textbbox((0, 0), t_sub, font=f_sub)
    tw_sub = bbox_sub[2] - bbox_sub[0]
    draw.text(((w - tw_sub) // 2, 185), t_sub, font=f_sub, fill=(180, 215, 245, 240))

    out_path = os.path.join(TEXTURE_DIR, 'coop_signboard.png')
    img.save(out_path)
    print(f"Created: {out_path} ({w}x{h})")

def create_notice_board():
    w, h = 512, 512
    img = Image.new('RGBA', (w, h), (40, 75, 55, 255)) # Green baize pinboard
    draw = ImageDraw.Draw(img)

    # Timber frame
    draw.rectangle([0, 0, w, h], fill=(110, 65, 35, 255))
    draw.rectangle([18, 18, w - 19, h - 19], fill=(42, 80, 60, 255))
    draw.rectangle([18, 18, w - 19, h - 19], outline=(20, 40, 30, 255), width=3)

    f_head_tel = get_font(FONT_TELUGU, 26, index=0)
    f_head_eng = get_font(FONT_ARIAL_BD, 20)
    f_body = get_font(FONT_ARIAL, 13)

    # Header banner
    draw.rectangle([24, 24, w - 25, 78], fill=(22, 45, 34, 255))
    draw.text((36, 28), "సముద్ర సమాచార బోర్డు", font=f_head_tel, fill=(255, 220, 120, 255))
    draw.text((36, 54), "COOPERATIVE NOTICE BOARD", font=f_head_eng, fill=(240, 240, 240, 255))

    # Pinned notices (paper sheets)
    # Notice 1: Tide Schedule
    draw.rectangle([34, 95, 235, 280], fill=(250, 248, 235, 255), outline=(180, 170, 150, 255))
    draw.rectangle([125, 91, 145, 99], fill=(200, 30, 30, 255)) # Red pushpin
    draw.text((42, 105), "DAILY TIDE BULLETIN", font=get_font(FONT_ARIAL_BD, 12), fill=(30, 30, 30, 255))
    draw.text((42, 125), "High Tide:  06:42 AM (1.8m)\nLow Tide:   12:55 PM (0.3m)\nHigh Tide:  19:10 PM (1.9m)\nLow Tide:   01:20 AM (0.4m)\n\nWind: NE 12-15 knots\nSea: Slight to Moderate", font=f_body, fill=(40, 40, 40, 255))

    # Notice 2: Cyclone / Weather warning
    draw.rectangle([265, 95, 478, 260], fill=(255, 240, 220, 255), outline=(210, 150, 100, 255))
    draw.rectangle([360, 91, 380, 99], fill=(240, 180, 20, 255)) # Yellow pushpin
    draw.text((275, 105), "SAFETY ADVISORY", font=get_font(FONT_ARIAL_BD, 12), fill=(160, 40, 20, 255))
    draw.text((275, 125), "CAUTION: MONSOON SWELL\n\nAll deep-sea dhonis must\ncarry VHF Channel 16.\nVerify life jackets before\nclearing harbour mouth.", font=f_body, fill=(50, 30, 20, 255))

    # Notice 3: Diesel Subsidy & Member Roster
    draw.rectangle([34, 300, 478, 485], fill=(245, 250, 255, 255), outline=(160, 180, 210, 255))
    draw.rectangle([250, 296, 270, 304], fill=(30, 120, 220, 255)) # Blue pushpin
    draw.text((42, 310), "FISHERMEN COOPERATIVE SOCIETY - MEMBER WELFARE", font=get_font(FONT_ARIAL_BD, 12), fill=(20, 50, 90, 255))
    draw.text((42, 330), "1. Subsidized marine diesel quota distribution on 1st & 15th of each month.\n2. Ice plant coupon redemption at Counter 2 (08:00 - 14:00 hrs).\n3. Cooperative General Body Meeting scheduled for Sunday 10:00 AM.\n4. Net mending gear & twine subsidy claims submit at Registration Desk.", font=f_body, fill=(30, 40, 50, 255))

    out_path = os.path.join(TEXTURE_DIR, 'coop_notice_board.png')
    img.save(out_path)
    print(f"Created: {out_path} ({w}x{h})")

def create_mangalore_tiles():
    w, h = 512, 512
    # Terracotta clay base
    img = Image.new('RGB', (w, h), (175, 78, 48))
    draw = ImageDraw.Draw(img)

    tile_h = 32
    tile_w = 48
    for row, y in enumerate(range(0, h, tile_h)):
        offset = (row % 2) * (tile_w // 2)
        # Shadow row line
        draw.line([(0, y), (w, y)], fill=(90, 35, 20), width=3)
        # Highlight top of tile
        draw.line([(0, y + 3), (w, y + 3)], fill=(205, 105, 65), width=2)

        for x in range(-tile_w, w + tile_w, tile_w):
            tx = x + offset
            # Vertical tile interlock joint
            draw.line([(tx, y), (tx, y + tile_h)], fill=(110, 45, 25), width=2)
            # Fluted central ridge
            cx = tx + tile_w // 2
            draw.line([(cx - 2, y + 4), (cx - 2, y + tile_h - 2)], fill=(215, 115, 75), width=3)
            draw.line([(cx + 2, y + 4), (cx + 2, y + tile_h - 2)], fill=(130, 55, 30), width=3)

    out_path = os.path.join(TEXTURE_DIR, 'coop_mangalore_tiles.png')
    img.save(out_path)
    print(f"Created: {out_path} ({w}x{h})")

def create_terrazzo_floor():
    w, h = 512, 512
    # Muted sea-green terrazzo
    img = Image.new('RGB', (w, h), (180, 195, 188))
    draw = ImageDraw.Draw(img)

    # Grid tile joints (128x128 grid)
    step = 128
    for i in range(0, w, step):
        # Brass divider strip
        draw.line([(i, 0), (i, h)], fill=(185, 150, 75), width=3)
        draw.line([(i+1, 0), (i+1, h)], fill=(225, 190, 100), width=1)
        draw.line([(0, i), (w, i)], fill=(185, 150, 75), width=3)
        draw.line([(0, i+1), (w, i+1)], fill=(225, 190, 100), width=1)

    # Marble chips
    import random
    random.seed(42)
    chip_colors = [
        (235, 240, 240), (210, 220, 215), (140, 160, 150),
        (220, 190, 160), (90, 110, 105), (250, 250, 245)
    ]
    for _ in range(1200):
        cx = random.randint(0, w - 1)
        cy = random.randint(0, h - 1)
        cs = random.randint(2, 6)
        col = random.choice(chip_colors)
        draw.rectangle([cx, cy, cx + cs, cy + cs], fill=col)

    out_path = os.path.join(TEXTURE_DIR, 'coop_terrazzo_floor.png')
    img.save(out_path)
    print(f"Created: {out_path} ({w}x{h})")

def create_ledger():
    w, h = 256, 256
    img = Image.new('RGBA', (w, h), (160, 30, 25, 255)) # Red khata cloth
    draw = ImageDraw.Draw(img)

    # Gold corner tooling
    draw.rectangle([8, 8, w - 9, h - 9], outline=(225, 180, 60, 255), width=2)
    draw.rectangle([14, 14, w - 15, h - 15], outline=(225, 180, 60, 200), width=1)

    # Spine binding
    draw.rectangle([0, 0, 36, h], fill=(120, 20, 15, 255))
    draw.line([(36, 0), (36, h)], fill=(225, 180, 60, 255), width=2)

    # Label
    draw.rectangle([60, 70, w - 30, 150], fill=(245, 240, 220, 255), outline=(100, 20, 15, 255), width=2)
    draw.text((70, 80), "సహకార లెక్కల పుస్తకం", font=get_font(FONT_TELUGU, 16, index=0), fill=(20, 20, 20, 255))
    draw.text((70, 110), "MEMBERS REGISTER", font=get_font(FONT_ARIAL_BD, 13), fill=(140, 20, 15, 255))

    out_path = os.path.join(TEXTURE_DIR, 'coop_ledger.png')
    img.save(out_path)
    print(f"Created: {out_path} ({w}x{h})")

if __name__ == '__main__':
    create_signboard()
    create_notice_board()
    create_mangalore_tiles()
    create_terrazzo_floor()
    create_ledger()
    print("All textures created successfully!")

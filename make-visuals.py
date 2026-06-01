from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

BG, CARD, WHITE, RED, MUTED = (10,10,10), (20,20,20), (255,255,255), (206,17,65), (156,163,175)
STATUS_COLORS = [(16,185,129),(14,165,233),(245,158,11),(249,115,22),(181,55,30)]
SECTIONS = [("01","DISTRIBUTION PAR ÉTAT"),("02","TOP 10 PORTÉES"),
            ("03","RÉCEMMENT PORTÉES"),("04","DS STILL STANDING")]

BOLD = [r"C:\Windows\Fonts\Outfit-Bold.ttf", r"C:\Windows\Fonts\segoeuib.ttf", r"C:\Windows\Fonts\arialbd.ttf"]
REG  = [r"C:\Windows\Fonts\Outfit-Regular.ttf", r"C:\Windows\Fonts\segoeui.ttf", r"C:\Windows\Fonts\arial.ttf"]

def _f(paths, sz):
    for p in paths:
        if Path(p).exists():
            return ImageFont.truetype(p, sz)
    return ImageFont.load_default()
def fb(s): return _f(BOLD, s)
def fr(s): return _f(REG, s)
def measure(d, t, f):
    b = d.textbbox((0,0), t, font=f); return b[2]-b[0], b[3]-b[1]

def status_strip(img, y, h):
    d = ImageDraw.Draw(img); seg = img.width / 5
    for i,c in enumerate(STATUS_COLORS):
        d.rectangle([i*seg, y, (i+1)*seg, y+h], fill=c)

def fit_title(img, y, target_sz, max_w):
    """Auto-fit: reduit la taille jusqu'a ce que ROCK OR STOCK rentre dans max_w."""
    d = ImageDraw.Draw(img)
    parts = [("ROCK ",WHITE),("OR",RED),(" STOCK",WHITE)]
    sz = target_sz
    while sz > 30:
        f = fb(sz)
        ws = [measure(d, t, f)[0] for t,_ in parts]
        if sum(ws) <= max_w:
            break
        sz -= 4
    x = (img.width - sum(ws)) // 2
    for (t,c), w in zip(parts, ws):
        d.text((x, y), t, font=f, fill=c)
        x += w
    return sz

def center(img, t, y, sz, c=WHITE, bold=False):
    d = ImageDraw.Draw(img); f = fb(sz) if bold else fr(sz)
    w,_ = measure(d,t,f)
    d.text(((img.width-w)//2, y), t, font=f, fill=c)

def card(img, x, y, w, h, num, lbl, nsz, lsz):
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([x,y,x+w,y+h], radius=12, fill=CARD)
    d.rounded_rectangle([x,y,x+8,y+h], radius=4, fill=RED)
    nf = fb(nsz); nw, nh = measure(d, num, nf)
    d.text((x+32, y+(h-nh)//2-4), num, font=nf, fill=RED)
    lf = fb(lsz); _, lh = measure(d, lbl, lf)
    d.text((x+32+nw+28, y+(h-lh)//2-4), lbl, font=lf, fill=WHITE)
    af = fb(lsz); aw, ah = measure(d, "→", af)
    d.text((x+w-40-aw, y+(h-ah)//2-4), "→", font=af, fill=MUTED)

def square():
    img = Image.new("RGB", (1080,1080), BG)
    status_strip(img, 0, 40)
    actual_sz = fit_title(img, 220, 130, 960)  # max_w=960 (60px padding chaque cote)
    print(f"  Square title size: {actual_sz}px")
    center(img, "Ton leaderboard perso est en ligne.", 380, 30, MUTED)
    cw, ch, gap, top = 880, 90, 20, 500
    cx = (1080-cw)//2
    for i,(n,l) in enumerate(SECTIONS):
        card(img, cx, top+i*(ch+gap), cw, ch, n, l, 38, 26)
    d = ImageDraw.Draw(img)
    d.text((60,1010), "DROP.06  •  31.05.26", font=fr(22), fill=MUTED)
    f = fb(22); w,_ = measure(d, "shooserie.tech", f)
    d.text((1080-60-w, 1010), "shooserie.tech", font=f, fill=WHITE)
    return img

def story():
    img = Image.new("RGB", (1080,1920), BG)
    status_strip(img, 0, 60)
    actual_sz = fit_title(img, 420, 160, 980)  # max_w=980 (50px padding chaque cote)
    print(f"  Story title size: {actual_sz}px")
    center(img, "Ton leaderboard perso", 640, 42, WHITE)
    center(img, "est en ligne.", 700, 42, MUTED)
    cw, ch, gap, top = 900, 115, 32, 900
    cx = (1080-cw)//2
    for i,(n,l) in enumerate(SECTIONS):
        card(img, cx, top+i*(ch+gap), cw, ch, n, l, 46, 30)
    center(img, "DROP.06  •  31.05.26", 1690, 26, MUTED)
    center(img, "shooserie.tech", 1750, 48, WHITE, bold=True)
    return img

print("Generating square 1080x1080...")
square().save("shooserie-rankings-square.png", "PNG", optimize=True)
print("  -> shooserie-rankings-square.png")
print("Generating story 1080x1920...")
story().save("shooserie-rankings-story.png", "PNG", optimize=True)
print("  -> shooserie-rankings-story.png")
print("Done.")

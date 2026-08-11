"""Resize/compress brand images. Run: python scripts/optimize-images.py"""
from PIL import Image
from pathlib import Path

pub = Path(__file__).resolve().parents[1] / "public"
# Prefer existing high-res webp/png logo as source
src_path = pub / "quotwellix-logo.webp"
if not src_path.exists():
    src_path = pub / "quotwellix-logo.png"
src = Image.open(src_path).convert("RGBA")


def save_png_quantized(img, path, size):
    out = img.resize(size, Image.Resampling.LANCZOS)
    out.quantize(method=Image.Quantize.FASTOCTREE).save(path, optimize=True)
    print(f"{path.name}: {size} -> {path.stat().st_size / 1024:.1f} KB")


save_png_quantized(src, pub / "quotwellix-mark.png", (96, 96))
src.resize((96, 96), Image.Resampling.LANCZOS).save(
    pub / "quotwellix-mark.webp", "WEBP", quality=85, method=6
)

save_png_quantized(src, pub / "quotwellix-logo.png", (512, 512))
src.resize((512, 512), Image.Resampling.LANCZOS).save(
    pub / "quotwellix-logo.webp", "WEBP", quality=82, method=6
)

save_png_quantized(src, pub / "favicon.png", (48, 48))
save_png_quantized(src, pub / "apple-touch-icon.png", (180, 180))

og_src = pub / "og-cover.jpg"
if og_src.exists():
    og = Image.open(og_src).convert("RGB")
    w, h = og.size
    if w > 1200:
        og = og.resize((1200, int(h * 1200 / w)), Image.Resampling.LANCZOS)
    og.save(pub / "og-cover.jpg", "JPEG", quality=82, optimize=True, progressive=True)
    og.save(pub / "og-cover.webp", "WEBP", quality=80, method=6)
    print(f"og-cover.jpg -> {(pub / 'og-cover.jpg').stat().st_size / 1024:.1f} KB")

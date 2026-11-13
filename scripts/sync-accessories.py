#!/usr/bin/env python3
"""
Sync WooCommerce Accessories category into src/data/accessories.json
and download/optimize product images into public/images/products/.

Re-run any time inventory changes on WooCommerce:
    python3 scripts/sync-accessories.py
"""
import html
import json
import re
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
STORE = "https://cybexprecisiongunworx.com"
CATEGORY_SLUG = "accessories"
OUT_JSON = ROOT / "src" / "data" / "accessories.json"
IMG_DIR = ROOT / "public" / "images" / "products"


def curl(url, dest=None):
    cmd = ["curl", "-fsSL", "--max-time", "120", "-A", "Mozilla/5.0 CPG-sync", url]
    if dest:
        subprocess.run(cmd + ["-o", str(dest)], check=True)
        return None
    return subprocess.run(cmd, check=True, capture_output=True).stdout


def fetch_json(url):
    sep = "&" if "?" in url else "?"
    return json.loads(curl(f"{url}{sep}_t={int(time.time())}"))


def clean_text(s):
    s = re.sub(r"<[^>]+>", " ", s or "")
    s = html.unescape(s).replace("\xa0", " ")
    return re.sub(r"\s+", " ", s).strip()


def extract_bullets(desc_html):
    bullets = []
    for li in re.findall(r"<li[^>]*>(.*?)</li>", desc_html or "", re.S | re.I):
        t = clean_text(li)
        if t:
            bullets.append(t)
    return bullets


def extract_paragraphs(desc_html, product_name=""):
    paras = []
    norm_name = re.sub(r"[^a-z0-9]+", "", (product_name or "").lower())
    for idx, p in enumerate(re.findall(r"<p[^>]*>(.*?)</p>", desc_html or "", re.S | re.I)):
        t = clean_text(p)
        if not t or t.lower() == "description:":
            continue
        norm_t = re.sub(r"[^a-z0-9]+", "", t.lower())
        if idx == 0 and len(t) < 45 and "." not in t and "(" not in t and ":" not in t:
            if norm_t == norm_name or norm_t in norm_name or norm_name in norm_t or len(t) < 35:
                continue
        paras.append(t)
    return paras


def download_webp(url, dest: Path):
    tmp = dest.with_suffix(".src")
    curl(url, tmp)
    subprocess.run(["cwebp", "-quiet", "-q", "85", str(tmp), "-o", str(dest)], check=True)
    tmp.unlink(missing_ok=True)


def main():
    cats = fetch_json(f"{STORE}/api/wc/store/products/categories?per_page=100")
    cat = next(c for c in cats if c["slug"] == CATEGORY_SLUG)
    items = fetch_json(f"{STORE}/api/wc/store/products?category={cat['id']}&per_page=100")
    IMG_DIR.mkdir(parents=True, exist_ok=True)

    manifest_path = IMG_DIR / ".manifest.json"
    manifest = {}
    if manifest_path.exists():
        try:
            manifest = json.loads(manifest_path.read_text())
        except Exception:
            manifest = {}
    new_manifest = {}

    accessories = []
    for p in items:
        slug = p["slug"]
        mu = p["prices"]["currency_minor_unit"]
        price = int(p["prices"]["price"]) / (10 ** mu) if p["prices"]["price"] else 0.0

        seen_imgs = []
        seen_urls = set()
        for img in p.get("images", []):
            u = img.get("src")
            img_id = img.get("id", "")
            if u and u not in seen_urls:
                seen_urls.add(u)
                seen_imgs.append((img_id, u))

        local_images = []
        for idx, (img_id, u) in enumerate(seen_imgs, 1):
            fname = f"{slug}.webp" if idx == 1 else f"{slug}-{idx}.webp"
            dest = IMG_DIR / fname
            cache_key = f"{img_id}:{u}" if img_id else u
            fetch_url = f"{u}?v={img_id}" if img_id and "?" not in u else u
            if not dest.exists() or manifest.get(fname) != cache_key:
                download_webp(fetch_url, dest)
            new_manifest[fname] = cache_key
            local_images.append(f"/images/products/{fname}")

        bullets = extract_bullets(p.get("description", ""))
        paras = extract_paragraphs(p.get("description", ""), p["name"])
        if paras:
            if len(paras[0]) < 40 and bullets:
                lead = paras[0].rstrip(":")
                summary = f"{lead} — {', '.join(bullets[:4])}" if paras[0].endswith(":") else f"{lead} · {' · '.join(bullets[:3])}"
            else:
                summary = paras[0]
        else:
            summary = " · ".join(bullets[:3]) if bullets else clean_text(p["name"])

        name_lower = p["name"].lower()
        if any(k in name_lower for k in ("arken", "nightforce", "scope", "optic", "case")):
            subcat = "optics-cases"
        elif "rest" in name_lower or "top" in name_lower or "superfeet" in name_lower:
            subcat = "rests-tops"
        else:
            subcat = "tools-parts"

        specs = {}
        for i, b in enumerate(bullets, 1):
            if ": " in b:
                k, v = b.split(": ", 1)
                specs[k.strip()] = v.strip()
            elif " – " in b:
                k, v = b.split(" – ", 1)
                specs[k.strip()] = v.strip()
            else:
                specs[f"Feature {i}"] = b

        accessories.append({
            "id": f"wc-{p['id']}",
            "wooId": p["id"],
            "name": clean_text(p["name"]),
            "slug": slug,
            "sku": p.get("sku") or f"CPG-{p['id']}",
            "price": price,
            "image": local_images[0] if local_images else "",
            "images": local_images,
            "category": subcat,
            "wooCategory": "accessories",
            "description": summary,
            "fullDescription": paras,
            "highlights": bullets,
            "inStock": bool(p.get("is_in_stock", True)),
            "featured": price >= 60,
            "specs": specs,
        })
        print(f"✓ {accessories[-1]['name']}  ${price:,.2f}  {len(local_images)} img", file=sys.stderr)

    for old_img in IMG_DIR.glob("*.webp"):
        if old_img.name not in new_manifest:
            old_img.unlink()

    manifest_path.write_text(json.dumps(new_manifest, indent=2) + "\n")
    OUT_JSON.write_text(json.dumps(accessories, indent=2, ensure_ascii=False) + "\n")
    print(f"Wrote {len(accessories)} accessories → {OUT_JSON.relative_to(ROOT)}", file=sys.stderr)


if __name__ == "__main__":
    main()

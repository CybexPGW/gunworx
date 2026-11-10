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
    return json.loads(curl(url))


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


def extract_paragraphs(desc_html):
    paras = []
    for p in re.findall(r"<p[^>]*>(.*?)</p>", desc_html or "", re.S | re.I):
        t = clean_text(p)
        if not t or t.lower() == "description:":
            continue
        if not paras and len(t) < 45 and "." not in t:
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

        seen_urls = []
        for img in p.get("images", []):
            u = img.get("src")
            if u and u not in seen_urls:
                seen_urls.append(u)

        local_images = []
        for idx, u in enumerate(seen_urls, 1):
            fname = f"{slug}.webp" if idx == 1 else f"{slug}-{idx}.webp"
            dest = IMG_DIR / fname
            if not dest.exists() or manifest.get(fname) != u:
                download_webp(u, dest)
            new_manifest[fname] = u
            local_images.append(f"/images/products/{fname}")

        bullets = extract_bullets(p.get("description", ""))
        paras = extract_paragraphs(p.get("description", ""))
        summary = paras[0] if paras else (" · ".join(bullets[:3]) if bullets else clean_text(p["name"]))

        name_lower = p["name"].lower()
        if "rest" in name_lower or "top" in name_lower or "superfeet" in name_lower:
            subcat = "rests-tops"
        else:
            subcat = "tools-parts"

        specs = {}
        for i, b in enumerate(bullets, 1):
            if " – " in b:
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

#!/usr/bin/env python3
"""
Import "Ready to Ship" rifles from the headless WooCommerce store into
src/data/readyToShip.json and download/optimize their images into
public/images/ready-to-ship/.

Re-run any time inventory changes on the WordPress/WooCommerce backend:
    python3 scripts/import-ready-to-ship.py
"""
import html
import json
import re
import subprocess
import sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
STORE = "https://cybexprecisiongunworx.com"
ACCESSORIES_SLUG = "accessories"
OUT_JSON = ROOT / "src" / "data" / "readyToShip.json"
IMG_DIR = ROOT / "public" / "images" / "ready-to-ship"
IMG_WIDTH = 1600


def curl(url, dest=None):
    """Fetch via curl (uses the system certificate store)."""
    cmd = ["curl", "-fsSL", "--max-time", "120", "-A", "Mozilla/5.0 CPG-import", url]
    if dest:
        subprocess.run(cmd + ["-o", str(dest)], check=True)
        return None
    return subprocess.run(cmd, check=True, capture_output=True).stdout


def fetch_json(url):
    return json.loads(curl(url))


def text(s):
    """Strip tags/entities and normalise whitespace."""
    s = re.sub(r"<sup>\s*0\s*</sup>", "°", s)  # 75<sup>0</sup> -> 75°
    s = re.sub(r"(75|90)\s*</span>\s*<span[^>]*>\s*0\s*</span>", r"\1°</span>", s)
    s = re.sub(r"<[^>]+>", " ", s)
    s = html.unescape(s).replace("\xa0", " ")
    s = re.sub(r"\b(75|90)\s+0\b", r"\1°", s)
    s = re.sub(r"\s+/(RB-[LR]P)", r"/\1", s)
    return re.sub(r"\s+", " ", s).strip()


DASH = re.compile(r"\s+[–—-]\s+|\s*[–—]\s*")


def split_kv(item):
    parts = DASH.split(item, maxsplit=1)
    if len(parts) == 2 and parts[0] and parts[1]:
        return parts[0].strip(), parts[1].strip()
    return None, item.strip()


def package_label(raw):
    """'Case and without Scope' -> 'Rifle + Custom Case (no scope)', etc."""
    s = raw.strip().rstrip(":").lower()
    has_case = "case" in s
    has_scope = "scope" in s and "without scope" not in s
    parts = ["Rifle"]
    if has_scope:
        parts.append("Arken Scope" if "arken" in s else "Scope")
    if has_case:
        parts.append("Custom Case")
    label = " + ".join(parts)
    if label == "Rifle":
        return "Rifle Only"
    if has_case and not has_scope and "scope" in s:
        label += " (no scope)"
    return label


def parse_cost_amount(raw):
    s = re.sub(r"\s+", "", raw)  # e.g. "4,4987.0 0" -> "4,4987.00"
    if s.count(".") == 2:
        first, mid, last = s.split(".")
        s = f"{first}{mid}.{last}"
    m_dup = re.match(r"^(\d),\1(\d{3})(\.\d+)?$", s)
    if m_dup:
        s = f"{m_dup.group(1)}{m_dup.group(2)}{m_dup.group(3) or ''}"
    else:
        s = s.replace(",", "")
    try:
        amount = float(s)
    except ValueError:
        return None
    if amount < 100 and "." in raw:
        try:
            amount = float(s.replace(".", ""))
        except ValueError:
            return None
    return amount


def parse_cost_line(t):
    m = re.match(
        r"^Cost\b[\s:–—-]*(?:with\s+)?(.+?)(?:\s*[:–—-]\s*\$?\s*|\s+\$\s*)([\d.,]+(?:\s+\d+)?)\s*$",
        t,
        re.I,
    )
    if not m:
        return None
    desc = m.group(1).strip()
    amount = parse_cost_amount(m.group(2))
    if amount is None or amount <= 0:
        return None
    return {"label": package_label(desc), "price": amount}


def parse_short(short_html):
    """Turn the WooCommerce short/full description into structured spec data."""
    code = None
    groups = []      # [{title, items:[{label, value}]}]
    packages = []    # [{label, price}]
    current = None
    for m in re.finditer(r"<p[^>]*>(.*?)</p>|<ul[^>]*>(.*?)</ul>", short_html, re.S | re.I):
        p_html, ul_html = m.group(1), m.group(2)
        if p_html is not None:
            t = text(p_html)
            if not t:
                continue
            cm = re.search(r"Specifications(?:\s+for)?:?\s*[\[(]?\s*([A-Z]{2}\s?\d{2}-\d+[A-Za-z]?)", t)
            if cm:
                code = cm.group(1).replace("  ", " ")
                continue
            pkg = parse_cost_line(t)
            if pkg:
                packages.append(pkg)
                current = None
                continue
            if re.match(r"^common to all rifles", t, re.I) or re.match(r"^product images are representative", t, re.I):
                current = None
                continue
            # Section heading, e.g. "Action:" / "Scope – Optional" / "Scope (Optional):"
            if len(t) < 40 and (t.endswith(":") or "Optional" in t):
                title = t.rstrip(":").strip()
                if not title:
                    continue
                if re.match(r"^scope\s*\(optional\)$", title, re.I):
                    title = "Scope – Optional"
                current = {"title": title, "items": []}
                groups.append(current)
            else:
                current = None  # boilerplate notes – rendered once site-wide
        elif ul_html is not None and current is not None:
            for li in re.findall(r"<li[^>]*>(.*?)</li>", ul_html, re.S | re.I):
                label, value = split_kv(text(li))
                if value:
                    current["items"].append({"label": label, "value": value})
    groups = [g for g in groups if g["items"]]
    return code, groups, packages


def paragraphs(desc_html):
    out = []
    for p in re.findall(r"<p[^>]*>(.*?)</p>", desc_html, re.S | re.I):
        t = text(p)
        if not t:
            continue
        if re.match(r"^(Specifications\b|Common to all rifles\b|Product images are representative\b|Cost\b)", t, re.I):
            break
        t = re.sub(r"^Description:\s*", "", t, flags=re.I).strip()
        if not t:
            continue
        # Skip leading paragraph if it is just a standalone product title/code line without sentence punctuation
        if not out and len(t) < 60 and not any(ch in t for ch in (".!", "?",)):
            if "." not in t or re.search(r"\.\d", t):
                continue
        out.append(t)
    if not out and text(desc_html):
        out = [text(desc_html)]
    return out


def download_image(url, dest_webp):
    tmp = dest_webp.with_suffix(".src")
    curl(url, tmp)
    subprocess.run(["cwebp", "-quiet", "-q", "82", "-resize", str(IMG_WIDTH), "0", str(tmp), "-o", str(dest_webp)], check=True)
    tmp.unlink()


def dedupe_and_order_images(raw_images):
    seen = set()
    unique = []
    for img in raw_images:
        src = img.get("src", "")
        if src and src not in seen:
            seen.add(src)
            unique.append(src)
    # Place studio profile shot (*R.png / *L.png) first if present
    studio = [u for u in unique if re.search(r"[RL]\.png$", u, re.I) and "case" not in u.lower()]
    rest = [u for u in unique if u not in studio]
    return studio + rest


def sample_image_bg(dest_webp):
    try:
        im = Image.open(dest_webp).convert("RGB")
        w, h = im.size
        tl = "#{:02x}{:02x}{:02x}".format(*im.getpixel((min(5, w - 1), min(5, h - 1))))
        bl = "#{:02x}{:02x}{:02x}".format(*im.getpixel((min(5, w - 1), max(0, h - 6))))
        return tl if tl == bl else f"linear-gradient(180deg, {tl} 0%, {bl} 100%)"
    except Exception:
        return "#ffffff"


def code_from_images(image_urls):
    for u in image_urls:
        m = re.search(r"/([A-Z]{2})-(\d{2}-\d+)[RL]?\.(?:png|jpg|webp)$", u, re.I)
        if m:
            return f"{m.group(1).upper()} {m.group(2)}"
    return None


def main():
    all_items = fetch_json(f"{STORE}/api/wc/store/products?per_page=100")
    items = [
        p for p in all_items
        if ACCESSORIES_SLUG not in [c["slug"] for c in p.get("categories", [])]
    ]
    IMG_DIR.mkdir(parents=True, exist_ok=True)
    manifest_path = IMG_DIR / ".manifest.json"
    manifest = {}
    if manifest_path.exists():
        try:
            manifest = json.loads(manifest_path.read_text())
        except Exception:
            manifest = {}
    new_manifest = {}

    parsed_rows = []
    text_code_counts = {}
    for p in items:
        code_s, groups_s, packages_s = parse_short(p["short_description"])
        code_d, groups_d, packages_d = parse_short(p["description"])
        text_code = code_d or code_s
        if text_code:
            text_code_counts[text_code] = text_code_counts.get(text_code, 0) + 1
        parsed_rows.append((p, code_s, groups_s, packages_s, code_d, groups_d, packages_d, text_code))

    rifles = []
    for p, code_s, groups_s, packages_s, code_d, groups_d, packages_d, text_code in parsed_rows:
        slug = p["slug"]
        mu = p["prices"]["currency_minor_unit"]
        price = int(p["prices"]["price"]) / 10 ** mu if p["prices"]["price"] else 0.0

        image_urls = dedupe_and_order_images(p.get("images", []))
        id_by_src = {img.get("src", ""): img.get("id", "") for img in p.get("images", []) if img.get("src")}
        img_code = code_from_images(image_urls)

        sku_code = (p.get("sku") or "").strip()
        code = sku_code or text_code
        if not code:
            code = img_code
        elif not sku_code and text_code_counts.get(code, 0) > 1 and img_code and img_code != code:
            # Disambiguate cloned descriptions using the uploaded studio image build code
            code = img_code

        groups = groups_d if groups_d else groups_s
        packages = packages_d

        if packages and price > 0:
            rifle_only = next((pk for pk in packages if pk["label"] == "Rifle Only"), None)
            if rifle_only:
                rifle_only["price"] = price
            elif not any(abs(pk["price"] - price) < 0.01 for pk in packages):
                packages.insert(0, {"label": "Rifle Only", "price": price})

        packages = sorted({pk["price"]: pk for pk in packages}.values(), key=lambda pk: pk["price"])
        if len(packages) < 2:
            packages = []

        images = []
        image_bgs = []
        for i, src_url in enumerate(image_urls, 1):
            dest = IMG_DIR / f"{slug}-{i}.webp"
            img_id = id_by_src.get(src_url, "")
            cache_key = f"{img_id}:{src_url}" if img_id else src_url
            if not dest.exists() or manifest.get(dest.name) != cache_key:
                fetch_url = f"{src_url}?v={img_id}" if img_id else src_url
                download_image(fetch_url, dest)
            new_manifest[dest.name] = cache_key
            images.append(f"/images/ready-to-ship/{dest.name}")
            image_bgs.append(sample_image_bg(dest))

        caliber = next((it["value"] for g in groups if g["title"].lower().startswith("barrel")
                        for it in g["items"] if (it["label"] or "").lower() == "caliber"), "")
        platform = "rimfire" if re.search(r"22\s?LR|\.22(?!\d)|-22\b|rimfire", caliber + " " + p["name"], re.I) else "centerfire"
        usage = next((g["items"][0]["value"] for g in groups if g["title"].lower().startswith("primary usage")), "")

        desc_paras = paragraphs(p["description"])
        rifles.append({
            "id": f"rts-{slug}",
            "wooId": p["id"],
            "sku": p.get("sku") or code or slug,
            "code": code,
            "name": text(p["name"]),
            "slug": slug,
            "price": price,
            "packages": packages,
            "inStock": bool(p["is_in_stock"]),
            "platform": platform,
            "caliber": caliber,
            "usage": usage,
            "images": images,
            "imageBgs": image_bgs,
            "summary": (desc_paras or [""])[0],
            "description": desc_paras,
            "specGroups": groups,
        })
        print(f"✓ {rifles[-1]['name']} ({code})  ${price:,.2f}  {platform}  {len(images)} img  {len(packages)} pkg", file=sys.stderr)

    # Clean up any stale .webp files from removed rifles or old extra images
    for old_img in IMG_DIR.glob("*.webp"):
        if old_img.name not in new_manifest:
            old_img.unlink()

    manifest_path.write_text(json.dumps(new_manifest, indent=2) + "\n")
    OUT_JSON.write_text(json.dumps(rifles, indent=2, ensure_ascii=False) + "\n")
    print(f"Wrote {len(rifles)} rifles → {OUT_JSON.relative_to(ROOT)}", file=sys.stderr)


if __name__ == "__main__":
    main()

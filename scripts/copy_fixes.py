"""Corrections for storefront copy that WooCommerce still has misspelled.

`npm run sync` copies product names, descriptions, and slugs from WooCommerce.
These fixes run during that copy so a later sync does not put the typos back.
"""
import re

# Longer phrases first so a shorter replacement cannot cut across them.
_REPLACEMENTS = (
    ("NIghtForce", "NightForce"),
    ("Trigger Tech", "TriggerTech"),
    ("Muzzle Break", "Muzzle Brake"),
    ("EC Tunner", "EC Tuner"),
    ("Kelbey", "Kelbly"),
    ("Recital", "Reticle"),
    ("Luminated", "Illuminated"),
    ("Harrel Tuners", "Harrell Tuners"),
    ("Holeshot", "HoleShot"),
)

_FF1 = re.compile(r"\bFF1\b")
_TUB = re.compile(r"Precision Tub(?!e)")
_BRONZ = re.compile(r"War-Torn Bronz(?!e)")
_SPACE_BEFORE_COMMA = re.compile(r"\s+,")


def fix_copy(value):
    """Fix known misspellings in a product name, description, or spec string."""
    if not isinstance(value, str) or not value:
        return value
    for old, new in _REPLACEMENTS:
        if old in value:
            value = value.replace(old, new)
    value = _FF1.sub("FFP", value)
    value = _TUB.sub("Precision Tube", value)
    value = _BRONZ.sub("War-Torn Bronze", value)
    value = _SPACE_BEFORE_COMMA.sub(",", value)
    return value


def canonical_slug(slug):
    """Correct the WooCommerce slug typo bronxe-meridian -> bronze-meridian.

    The store still publishes the Bronze Meridian rifle under a slug that
    spells bronze as bronxe. Rewriting it here keeps the storefront URL
    stable after the next `npm run sync`.
    """
    return (slug or "").replace("bronxe", "bronze")

"""
Barcode / 2D DataMatrix Identification Engine (ZXing / ZBar)
------------------------------------------------------------
Decodes the 2D DataMatrix code printed on the corner of the chemical dosimeter badge.
Extracts:
- Worker ID binding (e.g. WRK-1024)
- Badge Batch UID (e.g. BDG-7749-X)
- Production Date & Expiry
"""

import hashlib
import logging
import re
from datetime import date
from typing import Optional, Dict, Any


logger = logging.getLogger(__name__)

WORKER_CODE_RE = re.compile(r"^WRK-\d{1,8}$")
BADGE_UID_RE = re.compile(r"^BDG-[A-Za-z0-9\-]{1,32}$")
# Strict full payload: WRK-<digits>|BDG-<ALNUM/HYPHEN>|LOT-<non-space>
STRICT_PAYLOAD_RE = re.compile(r"^WRK-\d+\|BDG-[A-Z0-9-]+\|LOT-\S+$")
# Expiry stub: LOT-YYYY-MM suffix, e.g. LOT-2026-06 or LOT-2026-06-R2.
LOT_EXPIRY_RE = re.compile(r"^LOT-(\d{4})-(\d{2})(?:-.*)?$")


class BarcodeIdentificationEngine:
    def __init__(self):
        # Check if pyzbar is available
        self.pyzbar_available = False
        try:
            import pyzbar.pyzbar as pyzbar
            self.pyzbar = pyzbar
            self.pyzbar_available = True
        except (ImportError, Exception):
            self.pyzbar_available = False

    def parse_lot_expiry(self, batch_lot: str) -> Dict[str, Any]:
        """Expiry parsing stub for LOT-YYYY-MM (e.g. LOT-2026-06).

        Returns {"lot_expiry": "YYYY-MM" | None, "expired": bool,
        "expiry_warning": str | None}. Warn (expired=True + message) if the
        LOT month is before the current month. Unknown formats yield
        lot_expiry=None with no warning (fail-open on parse, caller decides).
        """
        if not isinstance(batch_lot, str):
            return {"lot_expiry": None, "expired": False, "expiry_warning": None}
        m = LOT_EXPIRY_RE.fullmatch(batch_lot.strip())
        if not m:
            return {"lot_expiry": None, "expired": False, "expiry_warning": None}
        year, month = int(m.group(1)), int(m.group(2))
        if not 1 <= month <= 12:
            return {"lot_expiry": None, "expired": False, "expiry_warning": None}
        today = date.today()
        expired = (year, month) < (today.year, today.month)
        warning = (
            f"Badge LOT {batch_lot.strip()} expired ({year:04d}-{month:02d}); do not use."
            if expired else None
        )
        if expired:
            logger.warning("%s", warning)
        return {
            "lot_expiry": f"{year:04d}-{month:02d}",
            "expired": expired,
            "expiry_warning": warning,
        }

    def decode_badge_matrix(self, image_np) -> Optional[Dict[str, Any]]:
        """
        Scans badge for 2D DataMatrix or QR / Code128 barcode.
        Format payload: 'WRK-1024|BDG-7749-X|LOT-2026'
        Multi-barcode: if >1 symbols found, logs count and uses the
        largest-area symbol (heuristic: closest/most prominent badge code).
        """
        if self.pyzbar_available:
            try:
                decoded_objects = self.pyzbar.decode(image_np)
                if not decoded_objects:
                    return None
                # Multi-barcode handling: log if >1 found, use largest-area symbol.
                if len(decoded_objects) > 1:
                    logger.warning(
                        "Multiple barcodes detected (%d); using largest-area symbol.",
                        len(decoded_objects),
                    )
                    def _area(o) -> int:
                        try:
                            r = o.rect
                            return int(r.width) * int(r.height)
                        except Exception:
                            return 0
                    decoded_objects = sorted(decoded_objects, key=_area, reverse=True)
                data = decoded_objects[0].data.decode("utf-8")
                return self.parse_badge_payload(data)
            except ValueError:
                raise
            except Exception as exc:
                logger.warning("Barcode decode failed: %s", exc)
        return None

    def parse_badge_payload(self, raw_string: str) -> Dict[str, Any]:
        """Parses standardized refinery badge payload strings (strict validation)."""
        if not isinstance(raw_string, str) or not raw_string.strip():
            raise ValueError("badge payload must be a non-empty string")
        cleaned = raw_string.strip()
        if len(cleaned) > 256:
            raise ValueError("badge payload too long (>256 chars)")
        # Strict full-payload validation first; never synthesize silently.
        if STRICT_PAYLOAD_RE.fullmatch(cleaned):
            parts = cleaned.split("|")
            digest = hashlib.sha256(cleaned.encode("utf-8")).hexdigest()
            expiry = self.parse_lot_expiry(parts[2].strip())
            return {
                "worker_code": parts[0].strip(),
                "badge_uid": parts[1].strip(),
                "batch_lot": parts[2].strip(),
                "payload_sha256": digest,
                **expiry,
            }
        # Lenient split path with per-field strict checks (no silent synthesis).
        parts = cleaned.split("|")
        if len(parts) == 3:
            worker_code = parts[0].strip()
            badge_uid = parts[1].strip()
            batch_lot = parts[2].strip()
            if not WORKER_CODE_RE.fullmatch(worker_code):
                raise ValueError(f"invalid worker_code: {worker_code!r}")
            if not BADGE_UID_RE.fullmatch(badge_uid):
                raise ValueError(f"invalid badge_uid: {badge_uid!r}")
            if not batch_lot or not batch_lot.startswith("LOT-"):
                raise ValueError(f"invalid batch_lot: {batch_lot!r}")
            digest = hashlib.sha256(cleaned.encode("utf-8")).hexdigest()
            expiry = self.parse_lot_expiry(batch_lot)
            return {
                "worker_code": worker_code,
                "badge_uid": badge_uid,
                "batch_lot": batch_lot,
                "payload_sha256": digest,
                **expiry,
            }
        # No silent synthesis: unparseable payload raises.
        raise ValueError(
            f"unparseable badge payload (expected ^WRK-\\d+\\|BDG-[A-Z0-9-]+\\|LOT-\\S+$): {cleaned!r}"
        )


barcode_engine = BarcodeIdentificationEngine()

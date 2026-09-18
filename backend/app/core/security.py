"""API-key security dependency (X-API-Key header vs settings.API_KEY)."""
import logging
from typing import Optional

from fastapi import HTTPException, Security, status
from fastapi.security import APIKeyHeader

from app.core.config import settings

logger = logging.getLogger(__name__)

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def require_api_key(api_key: Optional[str] = Security(api_key_header)) -> None:
    """Require a valid X-API-Key header.

    If settings.API_KEY is None/empty (dev default), auth is bypassed
    with a warning log so local development keeps working. In prod
    API_KEY must be set; mismatched/missing keys get 401.
    """
    expected = settings.API_KEY
    if not expected:
        logger.warning("API_KEY is not set; bypassing API-key auth (dev mode).")
        return None
    if not api_key or api_key != expected:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing X-API-Key.",
        )
    return None


# Backwards-compatible alias
verify_api_key = require_api_key

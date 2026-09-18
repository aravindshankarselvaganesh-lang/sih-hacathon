"""
SULFSCAN Backend Server Launcher
--------------------------------
Runs Uvicorn ASGI server. Reload only in dev; port/workers from env.
Usage:
    python run_server.py
"""

import logging
import os
import uvicorn

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("sulfscan.server")

if __name__ == "__main__":
    env = os.getenv("ENV", "dev").lower()
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    workers = int(os.getenv("WORKERS", "1"))
    reload = env == "dev"
    logger.info("Starting SULFSCAN backend env=%s host=%s port=%s workers=%s reload=%s", env, host, port, workers, reload)
    print(f"Starting SULFSCAN Central Refinery Safety Backend on http://{host}:{port} ...")
    print(f"Documentation available at: http://localhost:{port}/docs")
    uvicorn.run("app.main:app", host=host, port=port, reload=reload, workers=workers if not reload else 1)

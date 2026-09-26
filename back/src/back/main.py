from fastapi import FastAPI
from pathlib import Path
import json
import shutil
from datetime import datetime


JSON_DB_NAME = "pamokos.json"

def get_project_root() -> Path:
    if Path("/app").exists() and Path("/app/front").exists():
        return Path("/app")
    return Path(__file__).parent.parent.parent.parent

def get_json_path() -> Path:
    json_path = get_project_root() / "db" / JSON_DB_NAME
    if not json_path.exists():
        json_path.parent.mkdir(parents=True, exist_ok=True)
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump({}, f)
    return json_path


def read_json_file() -> dict:
    json_path = get_json_path()
    with open(json_path, "r", encoding="utf-8") as f:
        return json.load(f)


async def write_json_file(pamokos: dict) -> dict:
    json_path = get_json_path()
    with open(json_path, 'w', encoding="utf-8") as f:
        json.dump(pamokos, f, ensure_ascii=False, indent=2)
    return {"success": True}


async def make_copy() -> bool:
    json_path = get_json_path()
    backup_dir = json_path.parent / "backup"
    backup_dir.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup_path = backup_dir / f"{json_path.stem}_{timestamp}{json_path.suffix}"

    shutil.copy2(json_path, backup_path)

    return True

app = FastAPI()


@app.get("/pamokos")
def read_pamokos():
    pamokos = read_json_file()
    return pamokos

@app.post("/pamokos")
async def write_pamokos(pamokos: dict):
    await make_copy()
    result = await write_json_file(pamokos)
    return result

# Serve the compiled React frontend statically
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

static_dir = get_project_root() / "front" / "dist"

# Only mount if the directory exists (useful for local development where you might just run the backend)
if static_dir.exists():
    @app.get("/")
    def serve_index():
        return FileResponse(static_dir / "index.html")
        
    app.mount("/", StaticFiles(directory=str(static_dir)), name="static")



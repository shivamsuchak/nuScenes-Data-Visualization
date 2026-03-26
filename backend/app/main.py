import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routers import scenes

app = FastAPI(
    title="nuScenes Data Visualization API",
    description="API for browsing and inspecting nuScenes autonomous driving dataset",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

data_path = os.path.join(os.path.dirname(__file__), "../../data")
if os.path.exists(data_path):
    app.mount("/api/files", StaticFiles(directory=data_path), name="files")

app.include_router(scenes.router)

@app.get("/")
async def root():
    return {
        "message": "nuScenes Data Visualization API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

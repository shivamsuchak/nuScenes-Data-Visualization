from fastapi import APIRouter, HTTPException, Path
from typing import List
from app.schemas.models import (
    ScenesResponse, 
    SceneInfo, 
    FramesResponse, 
    FrameInfo,
    FrameDetail,
    SensorData,
    QualityReport
)
from app.services.nuscenes_service import nuscenes_service
from app.services.quality_inspector import QualityInspector

router = APIRouter(prefix="/api", tags=["scenes"])

quality_inspector = QualityInspector(nuscenes_service)

@router.get("/scenes", response_model=ScenesResponse)
async def get_scenes():
    try:
        scenes_data = nuscenes_service.get_scenes()
        scenes = [SceneInfo(**scene) for scene in scenes_data]
        return ScenesResponse(scenes=scenes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching scenes: {str(e)}")

@router.get("/scenes/{scene_id}/frames", response_model=FramesResponse)
async def get_frames(
    scene_id: str = Path(..., description="Scene identifier")
):
    try:
        frames_data = nuscenes_service.get_frames(scene_id)
        
        if not frames_data:
            raise HTTPException(status_code=404, detail=f"Scene '{scene_id}' not found or has no frames")
        
        frames = [FrameInfo(**frame) for frame in frames_data]
        return FramesResponse(frames=frames)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching frames: {str(e)}")

@router.get("/frames/{frame_id}", response_model=FrameDetail)
async def get_frame_detail(
    frame_id: str = Path(..., description="Frame identifier")
):
    try:
        frame_data = nuscenes_service.get_frame_detail(frame_id)
        
        if not frame_data:
            raise HTTPException(status_code=404, detail=f"Frame '{frame_id}' not found")
        
        return FrameDetail(**frame_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching frame detail: {str(e)}")

@router.get("/frames/{frame_id}/sensor/{sensor_type}", response_model=SensorData)
async def get_sensor_data(
    frame_id: str = Path(..., description="Frame identifier"),
    sensor_type: str = Path(..., description="Sensor type (e.g., CAM_FRONT, LIDAR_TOP)")
):
    try:
        sensor_data = nuscenes_service.get_sensor_data(frame_id, sensor_type)
        
        if not sensor_data:
            raise HTTPException(
                status_code=404, 
                detail=f"Sensor '{sensor_type}' not found for frame '{frame_id}'"
            )
        
        return SensorData(**sensor_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching sensor data: {str(e)}")

@router.get("/frames/{frame_id}/quality", response_model=QualityReport)
async def get_quality_report(
    frame_id: str = Path(..., description="Frame identifier")
):
    try:
        quality_report = quality_inspector.inspect_frame(frame_id)
        return quality_report
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error performing quality inspection: {str(e)}")

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum

class QualityStatus(str, Enum):
    PASS = "PASS"
    WARNING = "WARNING"
    FAIL = "FAIL"

class SensorType(str, Enum):
    CAMERA = "camera"
    LIDAR = "lidar"
    RADAR = "radar"

class DataType(str, Enum):
    IMAGE = "image"
    POINTCLOUD = "pointcloud"

class SceneInfo(BaseModel):
    scene_id: str = Field(..., description="Unique scene identifier")
    name: str = Field(..., description="Scene name")
    description: str = Field(..., description="Scene description")
    frame_count: int = Field(..., description="Number of frames in scene")

class ScenesResponse(BaseModel):
    scenes: List[SceneInfo]

class FrameInfo(BaseModel):
    frame_id: str = Field(..., description="Unique frame identifier")
    timestamp: float = Field(..., description="Frame timestamp")
    scene_id: str = Field(..., description="Parent scene ID")

class FramesResponse(BaseModel):
    frames: List[FrameInfo]

class FrameDetail(BaseModel):
    frame_id: str = Field(..., description="Unique frame identifier")
    timestamp: float = Field(..., description="Frame timestamp")
    scene_id: str = Field(..., description="Parent scene ID")
    available_sensors: List[str] = Field(..., description="List of available sensor types")

class SensorData(BaseModel):
    sensor_type: str = Field(..., description="Type of sensor")
    data_type: DataType = Field(..., description="Type of data (image/pointcloud)")
    data_url: Optional[str] = Field(None, description="URL to access the data")
    data: Optional[Any] = Field(None, description="Inline data (for point clouds)")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")

class QualityCheck(BaseModel):
    check_name: str = Field(..., description="Name of the quality check")
    status: QualityStatus = Field(..., description="Check result status")
    message: str = Field(..., description="Detailed message about the check")

class QualityReport(BaseModel):
    frame_id: str = Field(..., description="Frame being inspected")
    status: QualityStatus = Field(..., description="Overall quality status")
    checks: List[QualityCheck] = Field(..., description="Individual check results")
    timestamp: float = Field(..., description="When the inspection was performed")

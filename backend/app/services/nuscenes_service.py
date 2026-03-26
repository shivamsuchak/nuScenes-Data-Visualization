import os
from typing import List, Optional, Dict, Any
from pathlib import Path
import json

class NuScenesService:
    def __init__(self, dataroot: Optional[str] = None, version: str = "v1.0-mini"):
        default_path = os.path.join(os.path.dirname(__file__), "../../../data")
        self.dataroot = dataroot or os.getenv("NUSCENES_DATAROOT", default_path)
        self.version = version
        self.nusc = None
        self._mock_mode = False
        
        try:
            from nuscenes.nuscenes import NuScenes
            if os.path.exists(self.dataroot):
                self.nusc = NuScenes(version=self.version, dataroot=self.dataroot, verbose=False)
            else:
                print(f"Warning: nuScenes data not found at {self.dataroot}. Using mock data.")
                self._mock_mode = True
        except ImportError:
            print("Warning: nuscenes-devkit not installed. Using mock data.")
            self._mock_mode = True
        except Exception as e:
            print(f"Warning: Could not load nuScenes dataset: {e}. Using mock data.")
            self._mock_mode = True
    
    def _get_mock_scenes(self) -> List[Dict[str, Any]]:
        return [
            {
                "scene_id": "scene-0001",
                "name": "scene-0001",
                "description": "Mock scene 1 - Urban driving",
                "frame_count": 10
            },
            {
                "scene_id": "scene-0002",
                "name": "scene-0002",
                "description": "Mock scene 2 - Highway driving",
                "frame_count": 8
            },
            {
                "scene_id": "scene-0003",
                "name": "scene-0003",
                "description": "Mock scene 3 - Parking lot",
                "frame_count": 12
            }
        ]
    
    def _get_mock_frames(self, scene_id: str) -> List[Dict[str, Any]]:
        scene_frame_counts = {
            "scene-0001": 10,
            "scene-0002": 8,
            "scene-0003": 12
        }
        frame_count = scene_frame_counts.get(scene_id, 10)
        
        return [
            {
                "frame_id": f"{scene_id}-frame-{i:04d}",
                "timestamp": 1533151603.0 + i * 0.5,
                "scene_id": scene_id
            }
            for i in range(frame_count)
        ]
    
    def get_scenes(self) -> List[Dict[str, Any]]:
        if self._mock_mode:
            return self._get_mock_scenes()
        
        scenes = []
        for scene in self.nusc.scene:
            frame_count = 0
            sample_token = scene['first_sample_token']
            while sample_token:
                frame_count += 1
                sample = self.nusc.get('sample', sample_token)
                sample_token = sample['next']
            
            scenes.append({
                "scene_id": scene['token'],
                "name": scene['name'],
                "description": scene['description'],
                "frame_count": frame_count
            })
        
        return scenes
    
    def get_frames(self, scene_id: str) -> List[Dict[str, Any]]:
        if self._mock_mode:
            return self._get_mock_frames(scene_id)
        
        try:
            scene = self.nusc.get('scene', scene_id)
        except:
            return []
        
        frames = []
        sample_token = scene['first_sample_token']
        
        while sample_token:
            sample = self.nusc.get('sample', sample_token)
            frames.append({
                "frame_id": sample['token'],
                "timestamp": sample['timestamp'] / 1e6,
                "scene_id": scene_id
            })
            sample_token = sample['next']
        
        return frames
    
    def get_frame_detail(self, frame_id: str) -> Optional[Dict[str, Any]]:
        if self._mock_mode:
            if not frame_id.startswith("scene-"):
                return None
            
            scene_id = "-".join(frame_id.split("-")[:2])
            frames = self._get_mock_frames(scene_id)
            frame = next((f for f in frames if f["frame_id"] == frame_id), None)
            
            if frame:
                frame["available_sensors"] = [
                    "CAM_FRONT",
                    "CAM_FRONT_LEFT",
                    "CAM_FRONT_RIGHT",
                    "LIDAR_TOP"
                ]
            return frame
        
        try:
            sample = self.nusc.get('sample', frame_id)
        except:
            return None
        
        available_sensors = list(sample['data'].keys())
        
        return {
            "frame_id": frame_id,
            "timestamp": sample['timestamp'] / 1e6,
            "scene_id": sample['scene_token'],
            "available_sensors": available_sensors
        }
    
    def get_sensor_data(self, frame_id: str, sensor_type: str) -> Optional[Dict[str, Any]]:
        if self._mock_mode:
            if "CAM" in sensor_type:
                return {
                    "sensor_type": sensor_type,
                    "data_type": "image",
                    "data_url": f"/api/mock/image/{frame_id}/{sensor_type}",
                    "metadata": {
                        "width": 1600,
                        "height": 900,
                        "format": "jpg"
                    }
                }
            elif "LIDAR" in sensor_type:
                points = self._generate_mock_pointcloud()
                return {
                    "sensor_type": sensor_type,
                    "data_type": "pointcloud",
                    "data": points,
                    "metadata": {
                        "point_count": len(points),
                        "format": "xyz"
                    }
                }
            return None
        
        try:
            sample = self.nusc.get('sample', frame_id)
        except:
            return None
        
        if sensor_type not in sample['data']:
            return None
        
        sensor_token = sample['data'][sensor_type]
        sensor_data = self.nusc.get('sample_data', sensor_token)
        
        if "CAM" in sensor_type:
            file_path = os.path.join(self.dataroot, sensor_data['filename'])
            return {
                "sensor_type": sensor_type,
                "data_type": "image",
                "data_url": f"/api/files/{sensor_data['filename']}",
                "metadata": {
                    "filename": sensor_data['filename'],
                    "timestamp": sensor_data['timestamp'] / 1e6
                }
            }
        elif "LIDAR" in sensor_type:
            from nuscenes.utils.data_classes import LidarPointCloud
            file_path = os.path.join(self.dataroot, sensor_data['filename'])
            pc = LidarPointCloud.from_file(file_path)
            points = pc.points[:3, ::10].T.tolist()
            
            return {
                "sensor_type": sensor_type,
                "data_type": "pointcloud",
                "data": points,
                "metadata": {
                    "point_count": len(points),
                    "original_count": pc.points.shape[1]
                }
            }
        
        return None
    
    def _generate_mock_pointcloud(self, num_points: int = 1000) -> List[List[float]]:
        import random
        points = []
        for _ in range(num_points):
            x = random.uniform(-50, 50)
            y = random.uniform(-50, 50)
            z = random.uniform(-2, 5)
            points.append([x, y, z])
        return points

nuscenes_service = NuScenesService()

# nuScenes Data Visualization - Backend

FastAPI backend for browsing and inspecting nuScenes autonomous driving dataset.

## Features

- RESTful API for accessing scenes and frames
- Multi-sensor data retrieval (camera images, LiDAR point clouds)
- Automated data quality inspection
- Mock data mode for development without full dataset

## Setup

### Prerequisites

- Python 3.8+
- pip

### Installation

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python3 -m venv venv
```

3. Activate virtual environment:
```bash
source venv/bin/activate
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. (Optional) Set nuScenes data path:
```bash
export NUSCENES_DATAROOT=/path/to/nuscenes/data
```

If not set, the service will run in mock mode with sample data.

## Running the Server

1. Activate virtual environment (if not already activated):
```bash
source venv/bin/activate
```

2. Start the development server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at: `http://localhost:8000`

API documentation: `http://localhost:8000/docs`

## API Endpoints

### GET /api/scenes
List all available scenes.

**Response:**
```json
{
  "scenes": [
    {
      "scene_id": "string",
      "name": "string",
      "description": "string",
      "frame_count": 10
    }
  ]
}
```

### GET /api/scenes/{scene_id}/frames
Get all frames in a scene.

### GET /api/frames/{frame_id}
Get detailed information about a specific frame.

### GET /api/frames/{frame_id}/sensor/{sensor_type}
Get sensor data for a specific frame and sensor.

**Sensor types:** CAM_FRONT, CAM_FRONT_LEFT, CAM_FRONT_RIGHT, LIDAR_TOP, etc.

### GET /api/frames/{frame_id}/quality
Run quality inspection on a frame.

**Response:**
```json
{
  "frame_id": "string",
  "status": "PASS|WARNING|FAIL",
  "checks": [
    {
      "check_name": "string",
      "status": "PASS|WARNING|FAIL",
      "message": "string"
    }
  ],
  "timestamp": 1234567890.0
}
```

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app initialization
│   ├── routers/
│   │   ├── __init__.py
│   │   └── scenes.py        # API endpoints
│   ├── services/
│   │   ├── __init__.py
│   │   ├── nuscenes_service.py    # Dataset interaction
│   │   └── quality_inspector.py   # Quality checks
│   └── schemas/
│       ├── __init__.py
│       └── models.py        # Pydantic models
├── requirements.txt
└── README.md
```

## Mock Mode

When nuScenes dataset is not available, the service automatically runs in mock mode with:
- 3 sample scenes
- 8-12 frames per scene
- Mock camera images
- Generated point cloud data

This allows frontend development without requiring the full dataset.

## Quality Checks

The quality inspector performs:
1. **Sensor Availability** - Checks for required sensors (CAM_FRONT, LIDAR_TOP)
2. **Timestamp Validity** - Validates timestamp ranges
3. **Sensor Data Integrity** - Verifies sensor data accessibility

Results: PASS (all checks pass), WARNING (some issues), FAIL (critical issues)

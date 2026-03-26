# nuScenes Data Visualization Tool - Implementation Plan

## Project Overview
Full-stack web application for browsing and inspecting nuScenes autonomous driving dataset with multi-sensor visualization and data quality checks.

**Tech Stack:**
- Frontend: React + Vite + Three.js
- Backend: FastAPI + Python
- Dataset: nuScenes (official SDK)

---

## PHASE 1: Project Setup & Backend Foundation
**Goal:** Set up project structure, install dependencies, initialize FastAPI backend

### Step 1.1: Create Backend Structure
- Create backend folder structure
- Create `requirements.txt` with dependencies
- Create `__init__.py` files
- Create `main.py` with FastAPI app initialization

**Files:**
- `/backend/requirements.txt`
- `/backend/app/__init__.py`
- `/backend/app/main.py`

**Test:** Run `uvicorn app.main:app --reload` and verify server starts

---

### Step 1.2: Create Pydantic Schemas
- Define data models for API responses
- Scene, Frame, SensorData, QualityReport schemas

**Files:**
- `/backend/app/schemas/__init__.py`
- `/backend/app/schemas/models.py`

**Test:** Import schemas in Python REPL

---

### Step 1.3: Implement nuScenes Service
- Create service to load and interact with nuScenes dataset
- Methods: get_scenes(), get_frames(), get_sensor_data()
- Handle dataset initialization

**Files:**
- `/backend/app/services/__init__.py`
- `/backend/app/services/nuscenes_service.py`

**Test:** Instantiate service and call methods with sample data

---

### Step 1.4: Implement Quality Inspector
- Create quality inspection logic
- Check: missing sensors, timestamp consistency, annotations
- Return PASS/WARNING/FAIL status

**Files:**
- `/backend/app/services/quality_inspector.py`

**Test:** Run inspector on sample frame data

---

### Step 1.5: Create API Routes
- Implement REST endpoints:
  - GET /api/scenes - list all scenes
  - GET /api/scenes/{scene_id}/frames - list frames in scene
  - GET /api/frames/{frame_id} - get frame details
  - GET /api/frames/{frame_id}/sensor/{sensor_type} - get sensor data
  - GET /api/frames/{frame_id}/quality - run quality check

**Files:**
- `/backend/app/routers/__init__.py`
- `/backend/app/routers/scenes.py`

**Test:** Use curl or Postman to test each endpoint

### Step 1.6: How to get the data and use it
!mkdir -p /data/sets/nuscenes  # Make the directory to store the nuScenes dataset in.

!wget https://www.nuscenes.org/data/v1.0-mini.tgz  # Download the nuScenes mini split.

!tar -xf v1.0-mini.tgz -C /data/sets/nuscenes  # Uncompress the nuScenes mini split.

!pip install nuscenes-devkit &> /dev/null  # Install nuSce
### A Gentle Introduction to nuScenes
In this part of the tutorial, let us go through a top-down introduction of our database. Our dataset comprises of elemental building blocks that are the following:

log - Log information from which the data was extracted.
scene - 20 second snippet of a car's journey.
sample - An annotated snapshot of a scene at a particular timestamp.
sample_data - Data collected from a particular sensor.
ego_pose - Ego vehicle poses at a particular timestamp.
sensor - A specific sensor type.
calibrated sensor - Definition of a particular sensor as calibrated on a particular vehicle.
instance - Enumeration of all object instance we observed.
category - Taxonomy of object categories (e.g. vehicle, human).
attribute - Property of an instance that can change while the category remains the same.
visibility - Fraction of pixels visible in all the images collected from 6 different cameras.
sample_annotation - An annotated instance of an object within our interest.
map - Map data that is stored as binary semantic masks from a top-down view.
The database schema is visualized below. For more information see the nuScenes schema page.

---

## PHASE 2: Frontend Setup & Basic UI
**Goal:** Initialize React app, create basic layout and navigation

### Step 2.1: Initialize React + Vite Project
- Create frontend with Vite
- Install dependencies (react, react-dom, axios, three.js)
- Configure Vite for proxy to backend

**Files:**
- `/frontend/package.json`
- `/frontend/vite.config.js`
- `/frontend/index.html`
- `/frontend/src/main.jsx`

**Test:** Run `npm run dev` and verify app loads

---

### Step 2.2: Create API Service Layer
- Create axios-based API client
- Methods matching backend endpoints

**Files:**
- `/frontend/src/services/api.js`

**Test:** Call API methods from browser console

---

### Step 2.3: Build Scene Browser Component
- Display list of available scenes
- Click to select scene

**Files:**
- `/frontend/src/components/SceneBrowser.jsx`

**Test:** Verify scenes load and display

---

### Step 2.4: Build Frame Navigator Component
- Display frames for selected scene
- Previous/Next navigation buttons
- Frame counter display

**Files:**
- `/frontend/src/components/FrameNavigator.jsx`

**Test:** Navigate through frames

---

## PHASE 3: Sensor Visualization
**Goal:** Implement camera and LiDAR visualization

### Step 3.1: Camera Image Viewer
- Display camera images for selected frame
- Support multiple camera views
- Image loading states

**Files:**
- `/frontend/src/components/CameraViewer.jsx`

**Test:** View camera images from different sensors

---

### Step 3.2: LiDAR Point Cloud Viewer
- Use Three.js to render point cloud
- Basic camera controls (orbit, zoom)
- Color coding by height or intensity

**Files:**
- `/frontend/src/components/LiDARViewer.jsx`

**Test:** Render and interact with point cloud

---

### Step 3.3: Sensor Data Container
- Container component to organize sensor views
- Toggle between camera/LiDAR views
- Layout management

**Files:**
- `/frontend/src/components/SensorDataView.jsx`

**Test:** Switch between sensor types

---

## PHASE 4: Data Quality Inspection
**Goal:** Display quality check results

### Step 4.1: Quality Inspector Component
- Fetch quality report for current frame
- Display PASS/WARNING/FAIL status
- Show detailed check results
- Color-coded indicators

**Files:**
- `/frontend/src/components/QualityInspector.jsx`

**Test:** View quality reports for different frames

---

### Step 4.2: Integrate Quality Checks into UI
- Add quality indicator to frame navigator
- Show warnings/errors prominently
- Filter frames by quality status (optional)

**Test:** Navigate and see quality status update

---

## PHASE 5: Frontend-Backend Integration
**Goal:** Ensure seamless communication between frontend and backend, handle CORS, proxy setup, and end-to-end data flow

### Step 5.1: Configure CORS and Proxy
- Set up CORS middleware in FastAPI backend
- Configure Vite proxy for development
- Set environment variables for API URLs
- Test cross-origin requests

**Files:**
- `/backend/app/main.py` (add CORS middleware)
- `/frontend/vite.config.js` (proxy configuration)
- `/frontend/.env` (API base URL)

**Test:** Verify frontend can make requests to backend without CORS errors

---

### Step 5.2: End-to-End Data Flow Testing
- Test complete flow: scene selection → frame loading → sensor data display
- Verify all API endpoints return correct data format
- Test error handling for failed requests
- Verify loading states work correctly

**Test:** 
- Select scene and verify frames load
- Navigate frames and verify sensor data updates
- Trigger quality check and verify results display
- Test with network throttling

---

### Step 5.3: Static File Serving
- Configure FastAPI to serve camera images
- Set up proper file paths and URL generation
- Handle missing files gracefully
- Optimize image loading

**Files:**
- `/backend/app/main.py` (static file mounting)
- `/backend/app/services/nuscenes_service.py` (URL generation)

**Test:** Verify camera images load in frontend

---

### Step 5.4: Error Handling & Edge Cases
- Implement proper error responses in backend
- Add error boundaries in frontend
- Handle network failures gracefully
- Add retry logic for failed requests
- Display user-friendly error messages

**Files:**
- `/backend/app/routers/scenes.py` (error handling)
- `/frontend/src/services/api.js` (error handling)
- `/frontend/src/components/ErrorBoundary.jsx`

**Test:** 
- Test with invalid scene/frame IDs
- Test with backend offline
- Test with slow network
- Verify error messages display correctly

---

## PHASE 6: UI Polish & Styling
**Goal:** Add styling, improve UX, finalize visual design

### Step 6.1: Main App Integration
- Combine all components in App.jsx
- Implement state management (useState/useContext)
- Handle loading and error states
- Add global app layout

**Files:**
- `/frontend/src/App.jsx`

**Test:** Full user flow from scene selection to visualization

---

### Step 6.2: Styling & UX
- Add CSS for clean, professional look
- Responsive layout
- Loading spinners
- Error messages

**Files:**
- `/frontend/src/App.css`
- `/frontend/src/index.css`

**Test:** Visual inspection and responsive behavior

---

### Step 6.3: Documentation
- Create comprehensive README
- Setup instructions
- Architecture overview
- API documentation
- Screenshots

**Files:**
- `/README.md`
- `/backend/README.md`

**Test:** Follow README to set up project from scratch

---

## PHASE 7: Testing & Demo
**Goal:** Verify everything works, create demo materials

### Step 7.1: Manual Testing
- Test all user flows
- Test error cases
- Test with different scenes/frames

**Test Checklist:**
- [ ] Backend starts without errors
- [ ] Frontend connects to backend
- [ ] Scenes load and display
- [ ] Frame navigation works
- [ ] Camera images display
- [ ] LiDAR visualization works
- [ ] Quality checks run and display
- [ ] Error handling works

---

### Step 7.2: Demo Materials
- Take screenshots of key features
- Document interesting findings
- Note any limitations

**Deliverables:**
- Screenshots in `/docs/screenshots/`
- Demo notes

---

## API Contract Definition

### GET /api/scenes
**Response:**
```json
{
  "scenes": [
    {
      "scene_id": "string",
      "name": "string",
      "description": "string",
      "frame_count": "integer"
    }
  ]
}
```

### GET /api/scenes/{scene_id}/frames
**Response:**
```json
{
  "frames": [
    {
      "frame_id": "string",
      "timestamp": "float",
      "scene_id": "string"
    }
  ]
}
```

### GET /api/frames/{frame_id}
**Response:**
```json
{
  "frame_id": "string",
  "timestamp": "float",
  "scene_id": "string",
  "available_sensors": ["string"]
}
```

### GET /api/frames/{frame_id}/sensor/{sensor_type}
**Response:**
```json
{
  "sensor_type": "string",
  "data_type": "image|pointcloud",
  "data_url": "string",
  "metadata": {}
}
```

### GET /api/frames/{frame_id}/quality
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
  "timestamp": "float"
}
```

---

## Notes
- Start with mini nuScenes dataset for faster development
- Mock data acceptable if nuScenes setup is complex
- Focus on clean architecture over feature completeness
- Each phase should be fully functional before moving to next

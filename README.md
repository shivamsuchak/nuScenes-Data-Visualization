<p align="center">
  <strong>nuScenes Viz</strong><br/>
  <sub>A full-stack autonomous driving data visualization platform</sub>
</p>

<p align="center">
  <strong>Browse scenes, inspect multi-sensor data, and play back driving sequences — all in your browser.</strong><br/>
  React · FastAPI · Three.js · nuScenes
</p>

<p align="center">
  <a href="https://github.com/shivamsuchak/nuScenes-Data-Visualization"><img src="https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite%207-61DAFB?style=flat-square&logo=react" alt="React" /></a>
  <a href="https://github.com/shivamsuchak/nuScenes-Data-Visualization"><img src="https://img.shields.io/badge/Backend-FastAPI%201.0-009688?style=flat-square&logo=fastapi" alt="FastAPI" /></a>
  <a href="https://github.com/shivamsuchak/nuScenes-Data-Visualization"><img src="https://img.shields.io/badge/3D-Three.js%20%2B%20OrbitControls-000000?style=flat-square&logo=three.js" alt="Three.js" /></a>
  <a href="https://github.com/shivamsuchak/nuScenes-Data-Visualization"><img src="https://img.shields.io/badge/license-Educational-blue?style=flat-square" alt="License" /></a>
</p>

nuScenes Viz is a web-based visualization tool for the [nuScenes](https://www.nuscenes.org/) autonomous driving dataset. It lets you browse driving scenes from Boston and Singapore, scrub through time-stamped frames, view all six surround cameras simultaneously, orbit interactive 3D LiDAR point clouds, and run automated data quality inspections — all from a single browser tab.

---

## Highlights

- **Playback mode**: camera feed and LiDAR point cloud displayed **side-by-side** with play/pause, configurable speed (0.5×–4×), and a scrubber timeline. Both panels update in sync while preserving your zoom and pan state.
- **6-camera surround view**: all six cameras (front, front-left, front-right, back, back-left, back-right) rendered in a responsive grid. Click any camera for a fullscreen modal with left/right navigation.
- **Interactive 3D LiDAR**: Three.js point cloud with **OrbitControls** — smooth damped rotation, right-click pan, scroll zoom with limits, touch/trackpad support. Preset views (Top, Side, Front, Iso) with animated transitions. Camera state persists across frame changes.
- **Quality inspector**: automated per-frame checks for sensor availability, timestamp validity, and data integrity. Results shown as PASS / WARNING / FAIL.
- **Keyboard-driven workflow**: navigate frames, toggle playback, and switch views without touching the mouse.
- **Responsive design**: side-by-side layout on desktop, vertical stacking on smaller screens. Scene sidebar auto-hides on mobile.
- **Zero config data loading**: the backend auto-discovers the nuScenes dataset on disk and serves camera images and LiDAR data via a REST API with automatic retry logic.

---

## Quick Start

### Prerequisites

- **Python 3.8+**
- **Node.js 16+** and **npm**
- **~4 GB** disk space for the [nuScenes mini dataset](https://www.nuscenes.org/nuscenes#download)

### 1. Clone and download data

```sh
git clone https://github.com/shivamsuchak/nuScenes-Data-Visualization.git
cd nuScenes-Data-Visualization
```

Download the **nuScenes v1.0-mini** dataset and extract it into the `data/` directory so the structure looks like:

```
data/
└── v1.0-mini/
    ├── samples/          # sensor keyframes (camera images, LiDAR .bin)
    ├── maps/             # map raster data (optional)
    └── *.json            # metadata tables
```

### 2. Start the backend

```sh
cd backend
python3 -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API is now live at `http://localhost:8000`:

| URL | Description |
|---|---|
| `/docs` | Interactive Swagger documentation |
| `/health` | Health check endpoint |
| `/api/scenes` | List all scenes |

### 3. Start the frontend

```sh
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` — the Vite dev server proxies `/api` requests to the backend automatically.

---

## Usage

### Browse scenes

Select a scene from the sidebar on the left. Each scene card shows its name, description, and location (Boston / Singapore).

### Navigate frames

Use the **timeline bar** at the bottom of the screen:

- Click the **scrubber track** to jump to any frame.
- Click **‹ / ›** buttons to step one frame at a time.
- Press **▶** to start auto-playback; press again to pause.
- Click the **speed badge** to cycle through 0.5×, 1×, 2×, 4× playback speeds.

### View sensor data

Switch between four view modes via the tab bar:

| Tab | What it shows |
|---|---|
| **Playback** | Camera grid + LiDAR side-by-side (default) |
| **Cameras** | Full 6-camera grid with fullscreen modal |
| **LiDAR** | Dedicated 3D point cloud with controls |
| **Quality** | Automated data quality report |

### LiDAR interaction

| Input | Action |
|---|---|
| Left drag | Orbit / rotate |
| Right drag | Pan |
| Scroll wheel | Zoom (clamped 2–200 units) |
| Pinch (trackpad) | Zoom |
| Two-finger drag | Pan |
| Preset buttons | Animated camera transition (Top, Side, Front, Iso, Reset) |
| Grid / Axes toggles | Show or hide reference helpers |

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `←` | Previous frame |
| `→` | Next frame |
| `Space` | Play / Pause |
| `1` | Switch to Playback view |
| `2` | Switch to Cameras view |
| `3` | Switch to LiDAR view |
| `4` | Switch to Quality view |
| `Esc` | Close fullscreen camera |
| `←` / `→` (in fullscreen) | Navigate between cameras |

---

## Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                     Frontend (React 19 + Vite 7)              │
│                                                               │
│  ┌──────────┐  ┌──────────────┐  ┌────────────┐              │
│  │  TopBar   │  │SensorDataView│  │FrameNav    │              │
│  │  (header) │  │ (tab router) │  │ (timeline) │              │
│  └──────────┘  └──────┬───────┘  └────────────┘              │
│                       │                                       │
│       ┌───────────────┼───────────────┐                       │
│       ▼               ▼               ▼                       │
│  ┌──────────┐  ┌────────────┐  ┌──────────────┐              │
│  │ Camera   │  │  LiDAR     │  │   Quality    │              │
│  │ Viewer   │  │  Viewer    │  │  Inspector   │              │
│  │ (6 cams) │  │(OrbitCtrl) │  │  (3 checks)  │              │
│  └──────────┘  └────────────┘  └──────────────┘              │
│       │               │               │                       │
│  SceneBrowser ─────── API Service (Axios + retry) ───────────│
└───────────────────────────┬───────────────────────────────────┘
                            │
                     Vite Proxy (/api → :8000)
                            │
┌───────────────────────────┴───────────────────────────────────┐
│                    Backend (FastAPI + Uvicorn)                 │
│                                                               │
│  ┌──────────────┐  ┌──────────────────┐  ┌────────────────┐  │
│  │  API Router  │  │ nuScenes Service  │  │Quality Inspector│ │
│  │  /api/*      │  │  (devkit wrapper) │  │ (3 auto checks)│  │
│  └──────────────┘  └──────────────────┘  └────────────────┘  │
│  ┌──────────────┐  ┌──────────────────┐                      │
│  │ Static Files │  │ Pydantic Models  │                      │
│  │ /api/files/* │  │ (request/response)│                     │
│  └──────────────┘  └──────────────────┘                      │
└───────────────────────────┬───────────────────────────────────┘
                            │
                    nuScenes v1.0-mini
                    (10 scenes · 400+ frames · 12 sensors/frame)
```

### Data Flow

1. **Scene selection** → `GET /api/scenes` → sidebar populates with 10 scenes.
2. **Frame loading** → `GET /api/scenes/{id}/frames` → timeline bar fills with frame dots.
3. **Sensor fetch** → `GET /api/frames/{id}/sensor/CAM_FRONT` (×6 cameras) + `LIDAR_TOP` → camera images and 3D point cloud render in the viewport.
4. **Playback** → `setInterval` auto-advances frames; only the point cloud data is swapped — the Three.js scene, camera, and OrbitControls state are preserved.
5. **Quality check** → `GET /api/frames/{id}/quality` → backend runs sensor availability, timestamp, and integrity checks and returns a structured report.

---

## API Reference

### Scenes

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/scenes` | List all scenes with metadata |
| `GET` | `/api/scenes/{scene_id}/frames` | Get all frames for a scene |

### Frames

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/frames/{frame_id}` | Frame detail (sensors, timestamp) |
| `GET` | `/api/frames/{frame_id}/sensor/{sensor_type}` | Sensor data (image URL or point cloud) |
| `GET` | `/api/frames/{frame_id}/quality` | Quality inspection report |

### Static Files

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/files/{path}` | Serve camera images and data files |

### Utilities

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | API info and version |
| `GET` | `/health` | Health check |

Full interactive docs available at `http://localhost:8000/docs` (Swagger UI).

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| UI Framework | [React](https://react.dev/) | 19 |
| Build Tool | [Vite](https://vite.dev/) | 7 |
| 3D Rendering | [Three.js](https://threejs.org/) + OrbitControls | 0.160 |
| HTTP Client | [Axios](https://axios-http.com/) | 1.6 |
| Backend | [FastAPI](https://fastapi.tiangolo.com/) | 0.109 |
| Validation | [Pydantic](https://docs.pydantic.dev/) | 2.5 |
| Dataset SDK | [nuScenes DevKit](https://github.com/nutonomy/nuscenes-devkit) | 1.1 |
| ASGI Server | [Uvicorn](https://www.uvicorn.org/) | 0.27 |
| Image Processing | [Pillow](https://pillow.readthedocs.io/) | 10.2 |

---

## Project Structure

```
nuScenes-Data-Visualization/
├── frontend/                         # React + Vite frontend
│   ├── src/
│   │   ├── App.jsx                   # Root layout: topbar, sidebar, viewport, timeline
│   │   ├── App.css                   # Design system: tokens, layout, components
│   │   ├── main.jsx                  # React entry point
│   │   ├── index.css                 # Global base styles
│   │   ├── components/
│   │   │   ├── SceneBrowser.jsx      # Scene list sidebar
│   │   │   ├── FrameNavigator.jsx    # Timeline bar with play/pause/speed
│   │   │   ├── SensorDataView.jsx    # Tab router: Playback, Cameras, LiDAR, Quality
│   │   │   ├── CameraViewer.jsx      # 6-camera grid + fullscreen modal
│   │   │   ├── LiDARViewer.jsx       # Three.js point cloud with OrbitControls
│   │   │   ├── QualityInspector.jsx  # Quality report viewer
│   │   │   └── ErrorBoundary.jsx     # React error boundary
│   │   └── services/
│   │       └── api.js                # Axios API client with retry logic
│   ├── index.html                    # HTML entry (Google Fonts: Inter, JetBrains Mono)
│   ├── package.json
│   └── vite.config.js                # Vite config with API proxy
├── backend/                          # FastAPI backend
│   ├── app/
│   │   ├── main.py                   # App setup, CORS, static files mount
│   │   ├── routers/
│   │   │   └── scenes.py             # REST API endpoints
│   │   ├── services/
│   │   │   ├── nuscenes_service.py   # nuScenes DevKit wrapper
│   │   │   └── quality_inspector.py  # Automated quality checks
│   │   └── schemas/
│   │       └── models.py             # Pydantic request/response models
│   └── requirements.txt              # Python dependencies
├── data/                             # nuScenes dataset (gitignored)
│   └── v1.0-mini/                    # 10 scenes, 400+ frames
├── .gitignore
└── README.md
```

---

## Quality Inspection

The backend performs three automated checks on every frame:

| Check | What it verifies | Failure condition |
|---|---|---|
| **Sensor Availability** | Required sensors (`CAM_FRONT`, `LIDAR_TOP`) are present in the frame | Missing sensor token |
| **Timestamp Validity** | Frame timestamp is within a valid range | Timestamp is zero, negative, or in the future |
| **Data Integrity** | Sensor data files exist and are accessible on disk | File missing or unreadable |

Results are returned as a structured report with an overall status:

- **PASS** — all checks passed
- **WARNING** — non-critical issues detected
- **FAIL** — critical issues found

---

## Key Technical Details

- **Playback engine**: `setInterval` with configurable speed (0.5×–4×). Uses refs instead of state for the frame index and frame list to avoid stale closure issues inside the interval callback. Restarts from frame 0 if playback is triggered at the end.
- **LiDAR state preservation**: Three.js scene is initialized once on component mount (`useEffect([], [])`). Frame changes only swap the point cloud geometry — the camera, OrbitControls, grid, and axes persist. This means zoom, pan, and rotation are maintained during playback.
- **OrbitControls**: replaces custom mouse handlers with Three.js's built-in `OrbitControls` addon. Provides smooth damping (`dampingFactor: 0.12`), zoom limits (2–200 units), screen-space panning, touch/trackpad support, and proper cleanup via `controls.dispose()`.
- **Responsive layout**: CSS flexbox with `flex-direction: row` for side-by-side panels on desktop, `flex-direction: column` via `@media (max-width: 768px)` for vertical stacking on mobile. Camera grid adapts from 3-column to 2-column to 1-column.
- **API retry logic**: Axios client with automatic retry and exponential backoff for transient network failures.
- **ResizeObserver**: LiDAR viewer uses a `ResizeObserver` to dynamically update the Three.js renderer and camera aspect ratio when the container resizes (e.g., window resize, panel layout changes).
- **Design system**: CSS custom properties for colors (purple/cyan dark theme), spacing, typography (Inter + JetBrains Mono), border radius, and z-index. Single source of truth in `:root` variables.

---

## Development

### Running the dev servers

```sh
# Terminal 1 — backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 — frontend
cd frontend
npm run dev
```

The Vite dev server at `:5173` proxies `/api` requests to `:8000` automatically.

### Building for production

```sh
cd frontend
npm run build        # outputs to frontend/dist/
```

The backend serves static files from `data/` and is production-ready as-is with Uvicorn.

### Linting

```sh
cd frontend
npm run lint         # ESLint
```

---

## Performance

| Metric | Value |
|---|---|
| Scenes | 10 (Boston + Singapore) |
| Frames per scene | 39–41 |
| Total frames | 400+ |
| Sensors per frame | 12 (6 cameras, 5 radars, 1 LiDAR) |
| LiDAR points per frame | ~34,000 |
| API response time | < 100ms typical |
| Frontend render | 60 fps (Three.js with damped OrbitControls) |

---

## Roadmap

- [ ] Radar sensor visualization
- [ ] 3D bounding box annotation overlays
- [ ] Frame-to-frame comparison mode
- [ ] Exportable quality reports (PDF / JSON)
- [ ] User preferences and settings panel
- [ ] Data filtering and search
- [ ] GPS / ego-vehicle trajectory overlay

---

## Acknowledgments

- **[nuScenes](https://www.nuscenes.org/)** dataset by [Motional](https://motional.com/) — the benchmark autonomous driving dataset
- **[FastAPI](https://fastapi.tiangolo.com/)** — high-performance Python web framework
- **[Three.js](https://threejs.org/)** — 3D rendering in the browser
- **[React](https://react.dev/)** and **[Vite](https://vite.dev/)** — modern frontend tooling

---

## License

This project is for educational and demonstration purposes.

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import apiService from '../services/api';

function LiDARViewer({ frameId }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const pointsRef = useRef(null);
  const animationFrameRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pointCount, setPointCount] = useState(0);
  const [showGrid, setShowGrid] = useState(true);
  const [showAxes, setShowAxes] = useState(true);

  const gridHelperRef = useRef(null);
  const axesHelperRef = useRef(null);
  const resizeObserverRef = useRef(null);

  const DEFAULT_POS = new THREE.Vector3(0, 20, 40);
  const DEFAULT_TARGET = new THREE.Vector3(0, 0, 0);

  const setCameraPreset = (preset) => {
    const controls = controlsRef.current;
    const camera = cameraRef.current;
    if (!controls || !camera) return;

    let pos, target;

    switch (preset) {
      case 'top':
        pos = new THREE.Vector3(0, 60, 0.1);
        target = new THREE.Vector3(0, 0, 0);
        break;
      case 'side':
        pos = new THREE.Vector3(50, 10, 0);
        target = new THREE.Vector3(0, 0, 0);
        break;
      case 'front':
        pos = new THREE.Vector3(0, 10, 50);
        target = new THREE.Vector3(0, 0, 0);
        break;
      case 'iso':
        pos = new THREE.Vector3(30, 30, 30);
        target = new THREE.Vector3(0, 0, 0);
        break;
      case 'reset':
      default:
        pos = DEFAULT_POS.clone();
        target = DEFAULT_TARGET.clone();
    }

    // Smooth transition
    const startPos = camera.position.clone();
    const startTarget = controls.target.clone();
    const duration = 500;
    const startTime = Date.now();

    const animateTransition = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      camera.position.lerpVectors(startPos, pos, eased);
      controls.target.lerpVectors(startTarget, target, eased);
      controls.update();

      if (progress < 1) {
        requestAnimationFrame(animateTransition);
      }
    };

    animateTransition();
  };

  const toggleGrid = () => {
    if (gridHelperRef.current) {
      gridHelperRef.current.visible = !showGrid;
      setShowGrid(!showGrid);
    }
  };

  const toggleAxes = () => {
    if (axesHelperRef.current) {
      axesHelperRef.current.visible = !showAxes;
      setShowAxes(!showAxes);
    }
  };

  // Initialize Three.js scene ONCE on mount — preserves camera state across frame changes
  useEffect(() => {
    initThreeJS();
    return () => { cleanup(); };
  }, []);

  // Load new point cloud data whenever frameId changes (without resetting the scene/camera)
  useEffect(() => {
    if (frameId && sceneRef.current) {
      loadLiDARData();
    }
  }, [frameId]);

  const initThreeJS = () => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || 300;
    const height = containerRef.current.clientHeight || 300;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080C14);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000);
    camera.position.copy(DEFAULT_POS);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);

    // OrbitControls — replaces custom mouse handlers
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(DEFAULT_TARGET);
    controls.enableDamping = true;
    controls.dampingFactor = 0.12;
    controls.rotateSpeed = 0.8;
    controls.panSpeed = 0.8;
    controls.zoomSpeed = 1.2;
    controls.minDistance = 2;
    controls.maxDistance = 200;
    controls.maxPolarAngle = Math.PI * 0.95;
    controls.enablePan = true;
    controls.screenSpacePanning = true;
    controls.update();
    controlsRef.current = controls;

    // Grid
    const gridHelper = new THREE.GridHelper(100, 20, 0x21262D, 0x161B22);
    gridHelperRef.current = gridHelper;
    scene.add(gridHelper);

    // Axes
    const axesHelper = new THREE.AxesHelper(10);
    axesHelperRef.current = axesHelper;
    scene.add(axesHelper);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // Animation loop (OrbitControls damping needs per-frame update)
    const animateLoop = () => {
      animationFrameRef.current = requestAnimationFrame(animateLoop);
      controls.update();
      renderer.render(scene, camera);
    };
    animateLoop();

    // Auto-resize on container size change
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      const h = entry.contentRect.height;
      if (w > 0 && h > 0 && rendererRef.current && cameraRef.current) {
        rendererRef.current.setSize(w, h);
        cameraRef.current.aspect = w / h;
        cameraRef.current.updateProjectionMatrix();
      }
    });
    ro.observe(containerRef.current);
    resizeObserverRef.current = ro;
  };

  const loadLiDARData = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await apiService.getSensorData(frameId, 'LIDAR_TOP');

      if (data && data.data && Array.isArray(data.data)) {
        renderPointCloud(data.data);
        setPointCount(data.data.length);
      } else {
        setError('No LiDAR data available');
      }
    } catch (err) {
      setError('Failed to load LiDAR data: ' + err.message);
      console.error('Error loading LiDAR data:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderPointCloud = (points) => {
    if (!sceneRef.current) return;

    // Remove previous point cloud
    if (pointsRef.current) {
      sceneRef.current.remove(pointsRef.current);
      pointsRef.current.geometry.dispose();
      pointsRef.current.material.dispose();
    }

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(points.length * 3);
    const colors = new Float32Array(points.length * 3);

    points.forEach((point, i) => {
      positions[i * 3] = point[0];
      positions[i * 3 + 1] = point[2];
      positions[i * 3 + 2] = point[1];

      const height = point[2];
      const normalizedHeight = (height + 2) / 7;

      const color = new THREE.Color();
      color.setHSL(0.6 - normalizedHeight * 0.6, 1.0, 0.5);

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    });

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      sizeAttenuation: true,
    });

    const pointCloud = new THREE.Points(geometry, material);
    pointsRef.current = pointCloud;
    sceneRef.current.add(pointCloud);
  };

  const cleanup = () => {
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
    }

    if (controlsRef.current) {
      controlsRef.current.dispose();
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (pointsRef.current) {
      pointsRef.current.geometry.dispose();
      pointsRef.current.material.dispose();
    }

    if (rendererRef.current) {
      rendererRef.current.dispose();
    }
  };

  if (!frameId) {
    return (
      <div className="lidar-viewer">
        <div className="viewport-empty">
          <div className="viewport-empty-icon">◎</div>
          <div className="viewport-empty-title">No frame selected</div>
        </div>
      </div>
    );
  }

  return (
    <div className="lidar-viewer">
      <div className="lidar-header">
        <span className="lidar-title">LiDAR Point Cloud</span>
        <div className="lidar-stats">
          {pointCount > 0 && (
            <span className="lidar-stat cyan">{pointCount.toLocaleString()} pts</span>
          )}
          <span className="lidar-stat">LIDAR_TOP</span>
        </div>
      </div>

      {/* Controls */}
      {!loading && !error && (
        <div className="lidar-controls">
          <div className="ctrl-group">
            <span className="ctrl-group-label">VIEW</span>
            <button className="ctrl-btn" onClick={() => setCameraPreset('top')}>Top</button>
            <button className="ctrl-btn" onClick={() => setCameraPreset('side')}>Side</button>
            <button className="ctrl-btn" onClick={() => setCameraPreset('front')}>Front</button>
            <button className="ctrl-btn" onClick={() => setCameraPreset('iso')}>Iso</button>
            <button className="ctrl-btn" onClick={() => setCameraPreset('reset')}>Reset</button>
          </div>
          <div className="ctrl-group">
            <span className="ctrl-group-label">SHOW</span>
            <button className={`ctrl-btn ${showGrid ? 'active' : ''}`} onClick={toggleGrid}>Grid</button>
            <button className={`ctrl-btn ${showAxes ? 'active' : ''}`} onClick={toggleAxes}>Axes</button>
          </div>
        </div>
      )}

      {loading && (
        <div className="lidar-loading">
          <div className="loading-ring" />
          Loading point cloud…
        </div>
      )}

      {error && (
        <div className="lidar-error">{error}</div>
      )}

      <div
        ref={containerRef}
        className="lidar-canvas"
        style={{ width: '100%', flex: 1, minHeight: '200px' }}
      />

      <div className="lidar-info-bar">
        <div className="lidar-info-item"><strong>Left drag</strong> rotate</div>
        <div className="lidar-info-item"><strong>Right drag</strong> pan</div>
        <div className="lidar-info-item"><strong>Scroll</strong> zoom</div>
        <div className="lidar-info-item"><strong>Color</strong> height-based</div>
      </div>
    </div>
  );
}

export default LiDARViewer;

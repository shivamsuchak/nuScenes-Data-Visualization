import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import apiService from '../services/api';

function LiDARViewer({ frameId }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const pointsRef = useRef(null);
  const animationFrameRef = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pointCount, setPointCount] = useState(0);
  const [showGrid, setShowGrid] = useState(true);
  const [showAxes, setShowAxes] = useState(true);

  const mouseRef = useRef({ x: 0, y: 0, isDown: false });
  const initialCameraPosition = useRef({ x: 0, y: 10, z: 30 });
  const gridHelperRef = useRef(null);
  const axesHelperRef = useRef(null);
  const resizeObserverRef = useRef(null);

  const setCameraPreset = (preset) => {
    if (!cameraRef.current) return;
    
    const camera = cameraRef.current;
    let targetPosition;
    
    switch(preset) {
      case 'top':
        targetPosition = { x: 0, y: 50, z: 0.1 };
        break;
      case 'side':
        targetPosition = { x: 50, y: 10, z: 0 };
        break;
      case 'front':
        targetPosition = { x: 0, y: 10, z: 50 };
        break;
      case 'iso':
        targetPosition = { x: 30, y: 30, z: 30 };
        break;
      case 'reset':
      default:
        targetPosition = initialCameraPosition.current;
    }
    
    // Smooth transition
    const startPos = camera.position.clone();
    const endPos = new THREE.Vector3(targetPosition.x, targetPosition.y, targetPosition.z);
    const duration = 500; // ms
    const startTime = Date.now();
    
    const animateCamera = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      
      camera.position.lerpVectors(startPos, endPos, eased);
      camera.lookAt(0, 0, 0);
      
      if (progress < 1) {
        requestAnimationFrame(animateCamera);
      }
    };
    
    animateCamera();
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

  useEffect(() => {
    if (frameId) {
      initThreeJS();
      loadLiDARData();
    }

    return () => {
      cleanup();
    };
  }, [frameId]);

  const initThreeJS = () => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080C14);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 10, 30);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    rendererRef.current = renderer;

    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);

    const gridHelper = new THREE.GridHelper(100, 20, 0x21262D, 0x161B22);
    gridHelperRef.current = gridHelper;
    scene.add(gridHelper);

    const axesHelper = new THREE.AxesHelper(10);
    axesHelperRef.current = axesHelper;
    scene.add(axesHelper);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    setupMouseControls();
    animate();

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

  const setupMouseControls = () => {
    const canvas = rendererRef.current?.domElement;
    if (!canvas) return;

    canvas.addEventListener('mousedown', (e) => {
      mouseRef.current.isDown = true;
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    });

    canvas.addEventListener('mouseup', () => {
      mouseRef.current.isDown = false;
    });

    canvas.addEventListener('mousemove', (e) => {
      if (!mouseRef.current.isDown || !cameraRef.current) return;

      const deltaX = e.clientX - mouseRef.current.x;
      const deltaY = e.clientY - mouseRef.current.y;

      const camera = cameraRef.current;
      const radius = Math.sqrt(
        camera.position.x ** 2 + camera.position.z ** 2
      );

      const angle = Math.atan2(camera.position.z, camera.position.x);
      const newAngle = angle - deltaX * 0.01;

      camera.position.x = radius * Math.cos(newAngle);
      camera.position.z = radius * Math.sin(newAngle);
      camera.position.y += deltaY * 0.1;

      camera.lookAt(0, 0, 0);

      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    });

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (!cameraRef.current) return;

      const camera = cameraRef.current;
      const zoomSpeed = 0.1;
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);

      if (e.deltaY < 0) {
        camera.position.addScaledVector(direction, zoomSpeed);
      } else {
        camera.position.addScaledVector(direction, -zoomSpeed);
      }
    });
  };

  const animate = () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

    animationFrameRef.current = requestAnimationFrame(animate);
    rendererRef.current.render(sceneRef.current, cameraRef.current);
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
        <div className="lidar-info-item"><strong>Rotate</strong> drag</div>
        <div className="lidar-info-item"><strong>Zoom</strong> scroll</div>
        <div className="lidar-info-item"><strong>Color</strong> height-based</div>
      </div>
    </div>
  );
}

export default LiDARViewer;

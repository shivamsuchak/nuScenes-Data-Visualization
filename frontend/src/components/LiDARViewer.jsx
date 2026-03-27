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
    scene.background = new THREE.Color(0x1a1a1a);
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

    const gridHelper = new THREE.GridHelper(100, 20, 0x444444, 0x222222);
    gridHelperRef.current = gridHelper;
    scene.add(gridHelper);

    const axesHelper = new THREE.AxesHelper(10);
    axesHelperRef.current = axesHelper;
    scene.add(axesHelper);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    setupMouseControls();
    animate();
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
        <h3>LiDAR Point Cloud</h3>
        <div className="info-message">Select a frame to view LiDAR data</div>
      </div>
    );
  }

  return (
    <div className="lidar-viewer">
      <div className="lidar-header">
        <h3>LiDAR Point Cloud</h3>
        {pointCount > 0 && (
          <div className="point-count">{pointCount.toLocaleString()} points</div>
        )}
      </div>

      {/* Camera Presets */}
      {!loading && !error && (
        <div className="lidar-controls">
          <div className="camera-presets">
            <span className="control-label">View:</span>
            <button className="preset-btn" onClick={() => setCameraPreset('top')}>
              📐 Top
            </button>
            <button className="preset-btn" onClick={() => setCameraPreset('side')}>
              ↔️ Side
            </button>
            <button className="preset-btn" onClick={() => setCameraPreset('front')}>
              ⬆️ Front
            </button>
            <button className="preset-btn" onClick={() => setCameraPreset('iso')}>
              🔷 Isometric
            </button>
            <button className="preset-btn preset-reset" onClick={() => setCameraPreset('reset')}>
              🔄 Reset
            </button>
          </div>
          
          <div className="lidar-toggles">
            <span className="control-label">Display:</span>
            <button 
              className={`toggle-btn ${showGrid ? 'active' : ''}`}
              onClick={toggleGrid}
            >
              {showGrid ? '✓' : '○'} Grid
            </button>
            <button 
              className={`toggle-btn ${showAxes ? 'active' : ''}`}
              onClick={toggleAxes}
            >
              {showAxes ? '✓' : '○'} Axes
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="loading">
          Loading LiDAR data...
          <p className="loading-detail">Rendering point cloud...</p>
        </div>
      )}

      {error && (
        <div className="error">{error}</div>
      )}

      <div 
        ref={containerRef} 
        className="lidar-canvas"
        style={{ width: '100%', height: '500px' }}
      />

      <div className="lidar-controls-info">
        <div className="control-info-item">
          <strong>🖱️ Controls:</strong> Drag to rotate • Scroll to zoom
        </div>
        <div className="control-info-item">
          <strong>🎨 Color:</strong> Height-based (blue=low, red=high)
        </div>
        <div className="control-info-item">
          <strong>💡 Tip:</strong> Use preset views for quick navigation
        </div>
      </div>
    </div>
  );
}

export default LiDARViewer;

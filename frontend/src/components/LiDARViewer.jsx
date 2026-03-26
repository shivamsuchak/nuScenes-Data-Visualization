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

  const mouseRef = useRef({ x: 0, y: 0, isDown: false });

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
    scene.add(gridHelper);

    const axesHelper = new THREE.AxesHelper(10);
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

      {loading && (
        <div className="loading">Loading LiDAR data...</div>
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
        <p><strong>Controls:</strong> Drag to rotate • Scroll to zoom</p>
        <p><strong>Color:</strong> Height-based (blue=low, red=high)</p>
      </div>
    </div>
  );
}

export default LiDARViewer;

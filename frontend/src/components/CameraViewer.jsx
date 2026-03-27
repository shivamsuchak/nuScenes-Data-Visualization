import { useState, useEffect } from 'react';
import apiService from '../services/api';

function CameraViewer({ frameId }) {
  const [cameraData, setCameraData] = useState({});
  const [loadingStates, setLoadingStates] = useState({});
  const [errors, setErrors] = useState({});
  const [fullscreenCamera, setFullscreenCamera] = useState(null);

  const cameras = [
    { id: 'CAM_FRONT', label: 'Front' },
    { id: 'CAM_FRONT_LEFT', label: 'Front Left' },
    { id: 'CAM_FRONT_RIGHT', label: 'Front Right' },
    { id: 'CAM_BACK', label: 'Back' },
    { id: 'CAM_BACK_LEFT', label: 'Back Left' },
    { id: 'CAM_BACK_RIGHT', label: 'Back Right' },
  ];

  useEffect(() => {
    if (frameId) {
      loadAllCameras();
    }
  }, [frameId]);

  const loadAllCameras = async () => {
    // Reset states
    setCameraData({});
    setErrors({});
    
    // Load all cameras in parallel
    const loadPromises = cameras.map(async (camera) => {
      setLoadingStates(prev => ({ ...prev, [camera.id]: true }));
      
      try {
        const data = await apiService.getSensorData(frameId, camera.id);
        setCameraData(prev => ({ ...prev, [camera.id]: data }));
        setErrors(prev => ({ ...prev, [camera.id]: null }));
      } catch (err) {
        setErrors(prev => ({ ...prev, [camera.id]: err.message }));
        console.error(`Error loading ${camera.id}:`, err);
      } finally {
        setLoadingStates(prev => ({ ...prev, [camera.id]: false }));
      }
    });
    
    await Promise.all(loadPromises);
  };

  const handleCameraClick = (cameraId) => {
    setFullscreenCamera(cameraId);
  };

  const closeFullscreen = () => {
    setFullscreenCamera(null);
  };

  const navigateFullscreen = (direction) => {
    const currentIndex = cameras.findIndex(c => c.id === fullscreenCamera);
    let newIndex;
    
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % cameras.length;
    } else {
      newIndex = (currentIndex - 1 + cameras.length) % cameras.length;
    }
    
    setFullscreenCamera(cameras[newIndex].id);
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (fullscreenCamera) {
        if (e.key === 'Escape') {
          closeFullscreen();
        } else if (e.key === 'ArrowLeft') {
          navigateFullscreen('prev');
        } else if (e.key === 'ArrowRight') {
          navigateFullscreen('next');
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [fullscreenCamera]);

  if (!frameId) {
    return (
      <div className="camera-viewer">
        <h3>Camera View</h3>
        <div className="info-message">Select a frame to view camera images</div>
      </div>
    );
  }

  return (
    <div className="camera-viewer">
      <div className="camera-grid-header">
        <span className="camera-grid-title">
          All Cameras
          <span className="camera-grid-badge">6 channels · 360°</span>
        </span>
      </div>

      <div className="camera-grid">
        {cameras.map((camera) => (
          <div key={camera.id} className="camera-grid-item">
            <div className="camera-label">{camera.label}</div>

            {loadingStates[camera.id] && (
              <div className="camera-loading">
                <div className="loading-ring" />
                <span>{camera.id}</span>
              </div>
            )}

            {errors[camera.id] && (
              <div className="camera-error">
                <span>✕</span>
                <span>no signal</span>
              </div>
            )}

            {!loadingStates[camera.id] && !errors[camera.id] && cameraData[camera.id]?.data_url && (
              <div className="camera-image-wrapper" onClick={() => handleCameraClick(camera.id)}>
                <img
                  src={apiService.getSensorImageUrl(cameraData[camera.id].data_url)}
                  alt={camera.label}
                  className="camera-grid-image"
                  onError={() => setErrors(prev => ({ ...prev, [camera.id]: 'load failed' }))}
                />
                <div className="camera-overlay">
                  <div className="camera-overlay-icon">⤢</div>
                </div>
              </div>
            )}

            {!loadingStates[camera.id] && !errors[camera.id] && !cameraData[camera.id] && (
              <div className="camera-empty">no data</div>
            )}
          </div>
        ))}
      </div>

      {/* Fullscreen Modal */}
      {fullscreenCamera && cameraData[fullscreenCamera] && (
        <div className="camera-fullscreen-modal" onClick={closeFullscreen}>
          <div className="fullscreen-content" onClick={(e) => e.stopPropagation()}>
            <button className="fullscreen-close" onClick={closeFullscreen}>✕</button>

            <button className="fullscreen-nav" onClick={() => navigateFullscreen('prev')}>‹</button>

            <div className="fullscreen-image-container">
              <div className="fullscreen-title">
                {cameras.find(c => c.id === fullscreenCamera)?.label}
              </div>
              <img
                src={apiService.getSensorImageUrl(cameraData[fullscreenCamera].data_url)}
                alt={fullscreenCamera}
                className="fullscreen-image"
              />
              {cameraData[fullscreenCamera].metadata?.timestamp && (
                <div className="fullscreen-metadata">
                  <span>ts: {new Date(cameraData[fullscreenCamera].metadata.timestamp * 1000).toLocaleString()}</span>
                  <span>channel: {fullscreenCamera}</span>
                </div>
              )}
            </div>

            <button className="fullscreen-nav" onClick={() => navigateFullscreen('next')}>›</button>

            <div className="fullscreen-hint">← → navigate · ESC close</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CameraViewer;

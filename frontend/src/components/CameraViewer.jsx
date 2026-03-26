import { useState, useEffect } from 'react';
import apiService from '../services/api';

function CameraViewer({ frameId }) {
  const [selectedCamera, setSelectedCamera] = useState('CAM_FRONT');
  const [sensorData, setSensorData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cameras = [
    { id: 'CAM_FRONT', label: 'Front' },
    { id: 'CAM_FRONT_LEFT', label: 'Front Left' },
    { id: 'CAM_FRONT_RIGHT', label: 'Front Right' },
    { id: 'CAM_BACK', label: 'Back' },
    { id: 'CAM_BACK_LEFT', label: 'Back Left' },
    { id: 'CAM_BACK_RIGHT', label: 'Back Right' },
  ];

  useEffect(() => {
    if (frameId && selectedCamera) {
      loadCameraData();
    }
  }, [frameId, selectedCamera]);

  const loadCameraData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getSensorData(frameId, selectedCamera);
      setSensorData(data);
    } catch (err) {
      setError('Failed to load camera data: ' + err.message);
      console.error('Error loading camera data:', err);
    } finally {
      setLoading(false);
    }
  };

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
      <div className="camera-header">
        <h3>Camera View</h3>
        <div className="camera-selector">
          {cameras.map((camera) => (
            <button
              key={camera.id}
              className={`camera-button ${selectedCamera === camera.id ? 'active' : ''}`}
              onClick={() => setSelectedCamera(camera.id)}
            >
              {camera.label}
            </button>
          ))}
        </div>
      </div>

      <div className="camera-display">
        {loading && (
          <div className="loading">Loading camera image...</div>
        )}

        {error && (
          <div className="error">{error}</div>
        )}

        {!loading && !error && sensorData && sensorData.data_url && (
          <div className="camera-image-container">
            <img
              src={apiService.getSensorImageUrl(sensorData.data_url)}
              alt={`${selectedCamera} view`}
              className="camera-image"
              onError={(e) => {
                e.target.style.display = 'none';
                setError('Failed to load image');
              }}
            />
            <div className="camera-metadata">
              <span><strong>Sensor:</strong> {sensorData.sensor_type}</span>
              {sensorData.metadata?.timestamp && (
                <span><strong>Timestamp:</strong> {new Date(sensorData.metadata.timestamp * 1000).toLocaleTimeString()}</span>
              )}
            </div>
          </div>
        )}

        {!loading && !error && !sensorData && (
          <div className="info-message">No camera data available</div>
        )}
      </div>
    </div>
  );
}

export default CameraViewer;

import { useState } from 'react';
import CameraViewer from './CameraViewer';
import LiDARViewer from './LiDARViewer';
import QualityInspector from './QualityInspector';

function SensorDataView({ frameId }) {
  const [activeView, setActiveView] = useState('camera');

  if (!frameId) {
    return (
      <div className="sensor-data-view">
        <div className="placeholder">
          <p>Select a scene and frame to view sensor data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sensor-data-view">
      <div className="view-selector">
        <button
          className={`view-button ${activeView === 'camera' ? 'active' : ''}`}
          onClick={() => setActiveView('camera')}
        >
          📷 Camera
        </button>
        <button
          className={`view-button ${activeView === 'lidar' ? 'active' : ''}`}
          onClick={() => setActiveView('lidar')}
        >
          🎯 LiDAR
        </button>
        <button
          className={`view-button ${activeView === 'quality' ? 'active' : ''}`}
          onClick={() => setActiveView('quality')}
        >
          🔍 Quality
        </button>
      </div>

      <div className="view-content">
        {activeView === 'camera' && <CameraViewer frameId={frameId} />}
        {activeView === 'lidar' && <LiDARViewer frameId={frameId} />}
        {activeView === 'quality' && <QualityInspector frameId={frameId} />}
      </div>
    </div>
  );
}

export default SensorDataView;

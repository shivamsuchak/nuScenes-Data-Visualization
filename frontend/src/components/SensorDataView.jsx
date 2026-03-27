import { useState } from 'react';
import CameraViewer from './CameraViewer';
import LiDARViewer from './LiDARViewer';
import QualityInspector from './QualityInspector';

function SensorDataView({ frameId, activeView = 'camera', onViewChange }) {
  const [layoutMode, setLayoutMode] = useState('single'); // 'single' or 'split'
  const handleViewChange = (view) => {
    if (onViewChange) {
      onViewChange(view);
    }
  };

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
        <div className="view-tabs">
          <button
            className={`view-button ${activeView === 'camera' ? 'active' : ''}`}
            onClick={() => handleViewChange('camera')}
          >
            📷 Camera
          </button>
          <button
            className={`view-button ${activeView === 'lidar' ? 'active' : ''}`}
            onClick={() => handleViewChange('lidar')}
          >
            🎯 LiDAR
          </button>
          <button
            className={`view-button ${activeView === 'quality' ? 'active' : ''}`}
            onClick={() => handleViewChange('quality')}
          >
            🔍 Quality
          </button>
        </div>
        
        <div className="layout-toggle">
          <button
            className={`layout-button ${layoutMode === 'single' ? 'active' : ''}`}
            onClick={() => setLayoutMode('single')}
            title="Single view"
          >
            ▢ Single
          </button>
          <button
            className={`layout-button ${layoutMode === 'split' ? 'active' : ''}`}
            onClick={() => setLayoutMode('split')}
            title="Split view (Camera + LiDAR)"
          >
            ▦ Split
          </button>
        </div>
      </div>

      {layoutMode === 'single' ? (
        <div className="view-content">
          {activeView === 'camera' && <CameraViewer frameId={frameId} />}
          {activeView === 'lidar' && <LiDARViewer frameId={frameId} />}
          {activeView === 'quality' && <QualityInspector frameId={frameId} />}
        </div>
      ) : (
        <div className="view-content split-view">
          <div className="split-panel split-left">
            <div className="split-header">📷 Camera Views</div>
            <CameraViewer frameId={frameId} />
          </div>
          <div className="split-panel split-right">
            <div className="split-header">🎯 LiDAR Point Cloud</div>
            <LiDARViewer frameId={frameId} />
          </div>
        </div>
      )}
    </div>
  );
}

export default SensorDataView;

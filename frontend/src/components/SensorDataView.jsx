import { useState } from 'react';
import CameraViewer from './CameraViewer';
import LiDARViewer from './LiDARViewer';
import QualityInspector from './QualityInspector';

const TABS = [
  { id: 'camera',  label: 'Cameras',         icon: '⬡' },
  { id: 'lidar',   label: 'LiDAR',            icon: '◎' },
  { id: 'quality', label: 'Quality',          icon: '⬕' },
];

function SensorDataView({ frameId, activeView = 'camera', onViewChange }) {
  const [layoutMode, setLayoutMode] = useState('single');

  if (!frameId) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="view-tabbar">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`view-tab ${activeView === tab.id ? 'active' : ''}`}
              onClick={() => onViewChange?.(tab.id)}
            >
              <span style={{ fontFamily: 'monospace' }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="viewport-empty">
          <div className="viewport-empty-icon">⬡</div>
          <div className="viewport-empty-title">No frame selected</div>
          <div className="viewport-empty-sub">Select a scene, then a frame to begin</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Tab bar */}
      <div className="view-tabbar">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`view-tab ${activeView === tab.id ? 'active' : ''}`}
            onClick={() => onViewChange?.(tab.id)}
          >
            <span style={{ fontFamily: 'monospace' }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}

        <div className="view-tabbar-right">
          <button
            className={`layout-btn ${layoutMode === 'single' ? 'active' : ''}`}
            onClick={() => setLayoutMode('single')}
            title="Single view"
          >
            Single
          </button>
          <button
            className={`layout-btn ${layoutMode === 'split' ? 'active' : ''}`}
            onClick={() => setLayoutMode('split')}
            title="Split — Cameras + LiDAR"
          >
            Split
          </button>
        </div>
      </div>

      {/* Content */}
      {layoutMode === 'single' ? (
        <div className="view-content">
          {activeView === 'camera'  && <CameraViewer frameId={frameId} />}
          {activeView === 'lidar'   && <LiDARViewer  frameId={frameId} />}
          {activeView === 'quality' && <QualityInspector frameId={frameId} />}
        </div>
      ) : (
        <div className="view-content split-view">
          <div className="split-panel split-left">
            <div className="split-header">◉ CAMERAS</div>
            <div className="view-content">
              <CameraViewer frameId={frameId} />
            </div>
          </div>
          <div className="split-panel split-right">
            <div className="split-header">◎ LIDAR</div>
            <div className="view-content">
              <LiDARViewer frameId={frameId} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SensorDataView;

import { useState } from 'react';
import CameraViewer from './CameraViewer';
import LiDARViewer from './LiDARViewer';
import QualityInspector from './QualityInspector';

const TABS = [
  { id: 'playback', label: 'Playback',  icon: '▶' },
  { id: 'camera',   label: 'Cameras',   icon: '⬡' },
  { id: 'lidar',    label: 'LiDAR',     icon: '◎' },
  { id: 'quality',  label: 'Quality',   icon: '⬕' },
];

function SensorDataView({ frameId, activeView = 'playback', onViewChange }) {
  if (!frameId) {
    return (
      <div className="sensor-wrapper">
        <div className="view-tabbar">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`view-tab ${activeView === tab.id ? 'active' : ''}`}
              onClick={() => onViewChange?.(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="viewport-empty">
          <div className="viewport-empty-icon">▶</div>
          <div className="viewport-empty-title">No frame selected</div>
          <div className="viewport-empty-sub">Select a scene, then press play to begin</div>
        </div>
      </div>
    );
  }

  return (
    <div className="sensor-wrapper">
      {/* Tab bar */}
      <div className="view-tabbar">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`view-tab ${activeView === tab.id ? 'active' : ''}`}
            onClick={() => onViewChange?.(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeView === 'playback' ? (
        <div className="view-content playback-view">
          <div className="playback-panel playback-cameras">
            <div className="playback-panel-header">◉ CAMERAS</div>
            <div className="playback-panel-body">
              <CameraViewer frameId={frameId} />
            </div>
          </div>
          <div className="playback-panel playback-lidar">
            <div className="playback-panel-header">◎ LIDAR</div>
            <div className="playback-panel-body">
              <LiDARViewer frameId={frameId} />
            </div>
          </div>
        </div>
      ) : (
        <div className="view-content">
          {activeView === 'camera'  && <CameraViewer frameId={frameId} />}
          {activeView === 'lidar'   && <LiDARViewer  frameId={frameId} />}
          {activeView === 'quality' && <QualityInspector frameId={frameId} />}
        </div>
      )}
    </div>
  );
}

export default SensorDataView;

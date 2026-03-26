import { useState, useEffect } from 'react';
import SceneBrowser from './components/SceneBrowser';
import FrameNavigator from './components/FrameNavigator';
import SensorDataView from './components/SensorDataView';
import './App.css';

function App() {
  const [selectedScene, setSelectedScene] = useState(null);
  const [selectedFrame, setSelectedFrame] = useState(null);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [activeView, setActiveView] = useState('camera');
  const [showShortcuts, setShowShortcuts] = useState(false);

  const handleSceneSelect = (scene) => {
    setSelectedScene(scene);
    setSelectedFrame(null);
    setCurrentFrameIndex(0);
  };

  const handleFrameSelect = (frame, index) => {
    setSelectedFrame(frame);
    setCurrentFrameIndex(index);
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT') return;
      
      switch(e.key) {
        case 'ArrowLeft':
          document.querySelector('.nav-button:first-of-type:not(:disabled)')?.click();
          break;
        case 'ArrowRight':
          document.querySelector('.nav-button:last-of-type:not(:disabled)')?.click();
          break;
        case '1':
          setActiveView('camera');
          break;
        case '2':
          setActiveView('lidar');
          break;
        case '3':
          setActiveView('quality');
          break;
        case '?':
          setShowShortcuts(prev => !prev);
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>nuScenes Data Visualization Tool</h1>
        <p>Multi-Sensor Data Inspection for Autonomous Driving</p>
      </header>

      {/* Breadcrumb Navigation */}
      {selectedScene && (
        <div className="breadcrumb">
          <span>Scene: {selectedScene.name}</span>
          <span className="separator">›</span>
          <span>Frame: {currentFrameIndex + 1} / {selectedScene.num_frames || '?'}</span>
          {selectedFrame && (
            <>
              <span className="separator">›</span>
              <span className="active">{activeView.charAt(0).toUpperCase() + activeView.slice(1)} View</span>
            </>
          )}
        </div>
      )}

      <div className="app-container">
        <aside className="sidebar">
          <SceneBrowser 
            onSceneSelect={handleSceneSelect}
            selectedSceneId={selectedScene?.scene_id}
          />
        </aside>

        <main className="main-content">
          <FrameNavigator 
            sceneId={selectedScene?.scene_id}
            onFrameSelect={handleFrameSelect}
            currentFrameIndex={currentFrameIndex}
          />

          <SensorDataView 
            frameId={selectedFrame?.frame_id} 
            activeView={activeView}
            onViewChange={setActiveView}
          />
        </main>
      </div>

      {/* Keyboard Shortcuts Panel */}
      <div className="keyboard-shortcuts">
        <button 
          className="shortcuts-toggle"
          onClick={() => setShowShortcuts(!showShortcuts)}
        >
          ⌨️ Shortcuts
        </button>
        {showShortcuts && (
          <div className="shortcuts-panel">
            <h4>Keyboard Shortcuts</h4>
            <div className="shortcut-item">
              <span>Previous Frame</span>
              <span className="shortcut-key">←</span>
            </div>
            <div className="shortcut-item">
              <span>Next Frame</span>
              <span className="shortcut-key">→</span>
            </div>
            <div className="shortcut-item">
              <span>Camera View</span>
              <span className="shortcut-key">1</span>
            </div>
            <div className="shortcut-item">
              <span>LiDAR View</span>
              <span className="shortcut-key">2</span>
            </div>
            <div className="shortcut-item">
              <span>Quality View</span>
              <span className="shortcut-key">3</span>
            </div>
            <div className="shortcut-item">
              <span>Toggle Shortcuts</span>
              <span className="shortcut-key">?</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

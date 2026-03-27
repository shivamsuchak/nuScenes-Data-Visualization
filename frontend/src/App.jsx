import { useState, useEffect, useRef } from 'react';
import SceneBrowser from './components/SceneBrowser';
import FrameNavigator from './components/FrameNavigator';
import SensorDataView from './components/SensorDataView';
import './App.css';

function App() {
  const [selectedScene, setSelectedScene] = useState(null);
  const [selectedFrame, setSelectedFrame] = useState(null);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);
  const [activeView, setActiveView] = useState('camera');
  const frameNavRef = useRef(null);

  const handleSceneSelect = (scene) => {
    setSelectedScene(scene);
    setSelectedFrame(null);
    setCurrentFrameIndex(0);
    setTotalFrames(0);
  };

  const handleFrameSelect = (frame, index, total) => {
    setSelectedFrame(frame);
    setCurrentFrameIndex(index);
    if (total !== undefined) setTotalFrames(total);
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT') return;
      switch (e.key) {
        case 'ArrowLeft':  frameNavRef.current?.prev(); break;
        case 'ArrowRight': frameNavRef.current?.next(); break;
        case '1': setActiveView('camera');  break;
        case '2': setActiveView('lidar');   break;
        case '3': setActiveView('quality'); break;
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div className="app">

      {/* ── TOP BAR ── */}
      <div className="topbar">
        <div className="topbar-logo">
          <div className="topbar-logo-mark">ns</div>
          <span className="topbar-logo-text">nuScenes <em>Viz</em></span>
        </div>

        {selectedScene && (
          <>
            <div className="topbar-sep" />
            <div className="topbar-scene-info">
              <span className="topbar-scene-name">{selectedScene.name}</span>
              <span className="topbar-scene-sub">
                {totalFrames > 0 ? `${totalFrames} frames` : selectedScene.description?.slice(0, 40)}
              </span>
            </div>
          </>
        )}

        <div className="topbar-spacer" />

        {selectedFrame && (
          <div className="topbar-frame-badge">
            FRAME <span className="frame-current">{String(currentFrameIndex + 1).padStart(4, '0')}</span>
            {totalFrames > 0 && <span>/ {totalFrames}</span>}
          </div>
        )}

        <div className="topbar-status">LIVE</div>
      </div>

      {/* ── BODY ── */}
      <div className="app-body">

        {/* Slim scene sidebar */}
        <div className="scene-sidebar">
          <SceneBrowser
            onSceneSelect={handleSceneSelect}
            selectedSceneId={selectedScene?.scene_id}
          />
        </div>

        {/* Main viewport */}
        <div className="main-viewport">
          <SensorDataView
            frameId={selectedFrame?.frame_id}
            activeView={activeView}
            onViewChange={setActiveView}
          />
        </div>
      </div>

      {/* ── TIMELINE BAR ── */}
      <FrameNavigator
        ref={frameNavRef}
        sceneId={selectedScene?.scene_id}
        onFrameSelect={handleFrameSelect}
        currentFrameIndex={currentFrameIndex}
        currentFrame={selectedFrame}
      />
    </div>
  );
}

export default App;

import { useState } from 'react';
import SceneBrowser from './components/SceneBrowser';
import FrameNavigator from './components/FrameNavigator';
import SensorDataView from './components/SensorDataView';
import './App.css';

function App() {
  const [selectedScene, setSelectedScene] = useState(null);
  const [selectedFrame, setSelectedFrame] = useState(null);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);

  const handleSceneSelect = (scene) => {
    setSelectedScene(scene);
    setSelectedFrame(null);
    setCurrentFrameIndex(0);
  };

  const handleFrameSelect = (frame, index) => {
    setSelectedFrame(frame);
    setCurrentFrameIndex(index);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>nuScenes Data Visualization Tool</h1>
        <p>Multi-Sensor Data Inspection for Autonomous Driving</p>
      </header>

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

          <SensorDataView frameId={selectedFrame?.frame_id} />
        </main>
      </div>
    </div>
  );
}

export default App;

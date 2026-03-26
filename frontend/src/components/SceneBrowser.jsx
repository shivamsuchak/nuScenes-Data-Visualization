import { useState, useEffect } from 'react';
import apiService from '../services/api';

function SceneBrowser({ onSceneSelect, selectedSceneId }) {
  const [scenes, setScenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadScenes();
  }, []);

  const loadScenes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getScenes();
      setScenes(data.scenes || []);
    } catch (err) {
      setError('Failed to load scenes: ' + err.message);
      console.error('Error loading scenes:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="scene-browser">
        <h2>Scenes</h2>
        <div className="loading">Loading scenes...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="scene-browser">
        <h2>Scenes</h2>
        <div className="error">{error}</div>
        <button onClick={loadScenes}>Retry</button>
      </div>
    );
  }

  return (
    <div className="scene-browser">
      <h2>Scenes ({scenes.length})</h2>
      <div className="scene-list">
        {scenes.map((scene) => (
          <div
            key={scene.scene_id}
            className={`scene-item ${selectedSceneId === scene.scene_id ? 'selected' : ''}`}
            onClick={() => onSceneSelect(scene)}
          >
            <div className="scene-name">{scene.name}</div>
            <div className="scene-description">{scene.description}</div>
            <div className="scene-frames">{scene.frame_count} frames</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SceneBrowser;

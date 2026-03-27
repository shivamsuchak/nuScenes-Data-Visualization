import { useState, useEffect } from 'react';
import apiService from '../services/api';

function SceneBrowser({ onSceneSelect, selectedSceneId }) {
  const [scenes, setScenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { loadScenes(); }, []);

  const loadScenes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getScenes();
      setScenes(data.scenes || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="sidebar-header">
        <span className="sidebar-title">Scenes</span>
        {!loading && !error && (
          <span className="sidebar-count">{scenes.length}</span>
        )}
      </div>

      <div className="sidebar-body">
        {loading && (
          <div className="sidebar-state">
            <div className="loading-ring" />
            Loading...
          </div>
        )}

        {error && (
          <div className="sidebar-state error">
            <span>Failed to load</span>
            <button className="retry-btn" onClick={loadScenes}>Retry</button>
          </div>
        )}

        {!loading && !error && scenes.map((scene) => (
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
    </>
  );
}

export default SceneBrowser;

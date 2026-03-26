import { useState, useEffect } from 'react';
import apiService from '../services/api';

function FrameNavigator({ sceneId, onFrameSelect, currentFrameIndex }) {
  const [frames, setFrames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (sceneId) {
      loadFrames();
    } else {
      setFrames([]);
    }
  }, [sceneId]);

  const loadFrames = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getFrames(sceneId);
      setFrames(data.frames || []);
      if (data.frames && data.frames.length > 0) {
        onFrameSelect(data.frames[0], 0);
      }
    } catch (err) {
      setError('Failed to load frames: ' + err.message);
      console.error('Error loading frames:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevious = () => {
    if (currentFrameIndex > 0) {
      const newIndex = currentFrameIndex - 1;
      onFrameSelect(frames[newIndex], newIndex);
    }
  };

  const handleNext = () => {
    if (currentFrameIndex < frames.length - 1) {
      const newIndex = currentFrameIndex + 1;
      onFrameSelect(frames[newIndex], newIndex);
    }
  };

  const handleFrameClick = (frame, index) => {
    onFrameSelect(frame, index);
  };

  if (!sceneId) {
    return (
      <div className="frame-navigator">
        <h3>Frame Navigator</h3>
        <div className="info-message">Select a scene to view frames</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="frame-navigator">
        <h3>Frame Navigator</h3>
        <div className="loading">Loading frames...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="frame-navigator">
        <h3>Frame Navigator</h3>
        <div className="error">{error}</div>
        <button onClick={loadFrames}>Retry</button>
      </div>
    );
  }

  if (frames.length === 0) {
    return (
      <div className="frame-navigator">
        <h3>Frame Navigator</h3>
        <div className="info-message">No frames available</div>
      </div>
    );
  }

  return (
    <div className="frame-navigator">
      <h3>Frame Navigator</h3>
      
      <div className="frame-controls">
        <button 
          onClick={handlePrevious} 
          disabled={currentFrameIndex === 0}
          className="nav-button"
        >
          ← Previous
        </button>
        
        <div className="frame-counter">
          Frame {currentFrameIndex + 1} / {frames.length}
        </div>
        
        <button 
          onClick={handleNext} 
          disabled={currentFrameIndex === frames.length - 1}
          className="nav-button"
        >
          Next →
        </button>
      </div>

      <div className="frame-info">
        {frames[currentFrameIndex] && (
          <>
            <div className="frame-id">
              <strong>Frame ID:</strong> {frames[currentFrameIndex].frame_id.substring(0, 8)}...
            </div>
            <div className="frame-timestamp">
              <strong>Timestamp:</strong> {new Date(frames[currentFrameIndex].timestamp * 1000).toLocaleString()}
            </div>
          </>
        )}
      </div>

      <div className="frame-timeline">
        {frames.map((frame, index) => (
          <div
            key={frame.frame_id}
            className={`timeline-marker ${index === currentFrameIndex ? 'active' : ''}`}
            onClick={() => handleFrameClick(frame, index)}
            title={`Frame ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default FrameNavigator;

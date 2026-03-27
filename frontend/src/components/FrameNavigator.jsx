import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import apiService from '../services/api';

const FrameNavigator = forwardRef(function FrameNavigator(
  { sceneId, onFrameSelect, currentFrameIndex, currentFrame },
  ref
) {
  const [frames, setFrames] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sceneId) loadFrames();
    else setFrames([]);
  }, [sceneId]);

  const loadFrames = async () => {
    try {
      setLoading(true);
      const data = await apiService.getFrames(sceneId);
      const list = data.frames || [];
      setFrames(list);
      if (list.length > 0) onFrameSelect(list[0], 0, list.length);
    } catch (err) {
      console.error('Error loading frames:', err);
    } finally {
      setLoading(false);
    }
  };

  const goTo = (index) => {
    if (index >= 0 && index < frames.length) {
      onFrameSelect(frames[index], index, frames.length);
    }
  };

  useImperativeHandle(ref, () => ({
    prev: () => goTo(currentFrameIndex - 1),
    next: () => goTo(currentFrameIndex + 1),
  }));

  const progress = frames.length > 1
    ? (currentFrameIndex / (frames.length - 1)) * 100
    : 0;

  const ts = currentFrame?.timestamp
    ? new Date(currentFrame.timestamp * 1000).toLocaleTimeString()
    : null;

  const MAX_DOTS = 120;
  const dotsToShow = frames.length > MAX_DOTS
    ? frames.filter((_, i) => i % Math.ceil(frames.length / MAX_DOTS) === 0)
    : frames;

  return (
    <div className="timeline-bar">
      <button
        className="timeline-nav-btn"
        onClick={() => goTo(currentFrameIndex - 1)}
        disabled={currentFrameIndex === 0 || frames.length === 0}
        title="Previous frame (←)"
      >
        ‹
      </button>

      <div className="timeline-scrubber">
        <div
          className="timeline-track"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = (e.clientX - rect.left) / rect.width;
            goTo(Math.round(ratio * (frames.length - 1)));
          }}
        >
          <div className="timeline-fill" style={{ width: `${progress}%` }} />
          <div className="timeline-thumb" style={{ left: `${progress}%` }} />
        </div>

        <div className="timeline-dots">
          {dotsToShow.map((frame, dotIdx) => {
            const realIndex = frames.indexOf(frame);
            return (
              <div
                key={frame.frame_id}
                className={`timeline-dot ${realIndex === currentFrameIndex ? 'active' : ''}`}
                onClick={() => goTo(realIndex)}
                title={`Frame ${realIndex + 1}`}
              />
            );
          })}
        </div>
      </div>

      <div className="timeline-meta">
        <div className="timeline-counter">
          <span className="cur">{String(currentFrameIndex + 1).padStart(3, '0')}</span>
          {frames.length > 0 && ` / ${frames.length}`}
        </div>
        {ts && <div className="timeline-ts">{ts}</div>}
        {loading && <div className="timeline-ts">Loading…</div>}
      </div>

      <button
        className="timeline-nav-btn"
        onClick={() => goTo(currentFrameIndex + 1)}
        disabled={currentFrameIndex >= frames.length - 1 || frames.length === 0}
        title="Next frame (→)"
      >
        ›
      </button>
    </div>
  );
});

export default FrameNavigator;

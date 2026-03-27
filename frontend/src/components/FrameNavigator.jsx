import { useState, useEffect, useImperativeHandle, forwardRef, useRef, useCallback } from 'react';
import apiService from '../services/api';

const SPEEDS = [
  { label: '0.5×', ms: 1000 },
  { label: '1×',   ms: 500  },
  { label: '2×',   ms: 250  },
  { label: '4×',   ms: 125  },
];

const FrameNavigator = forwardRef(function FrameNavigator(
  { sceneId, onFrameSelect, currentFrameIndex, currentFrame },
  ref
) {
  const [frames, setFrames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(1); // default 1×
  const intervalRef = useRef(null);
  const framesRef = useRef([]);
  const indexRef = useRef(0);

  // Keep refs in sync for the interval callback
  framesRef.current = frames;
  indexRef.current = currentFrameIndex;

  useEffect(() => {
    if (sceneId) { loadFrames(); setPlaying(false); }
    else { setFrames([]); setPlaying(false); }
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

  const goTo = useCallback((index) => {
    if (index >= 0 && index < framesRef.current.length) {
      onFrameSelect(framesRef.current[index], index, framesRef.current.length);
    }
  }, [onFrameSelect]);

  // Play / pause logic
  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        const next = indexRef.current + 1;
        if (next >= framesRef.current.length) {
          setPlaying(false); // stop at end
        } else {
          goTo(next);
        }
      }, SPEEDS[speedIdx].ms);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing, speedIdx, goTo]);

  const togglePlay = () => {
    if (!playing && currentFrameIndex >= frames.length - 1) {
      // If at end, restart from beginning
      goTo(0);
    }
    setPlaying(p => !p);
  };

  const cycleSpeed = () => {
    setSpeedIdx(i => (i + 1) % SPEEDS.length);
  };

  useImperativeHandle(ref, () => ({
    prev: () => { setPlaying(false); goTo(currentFrameIndex - 1); },
    next: () => { setPlaying(false); goTo(currentFrameIndex + 1); },
    play: () => setPlaying(true),
    pause: () => setPlaying(false),
    togglePlay,
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
      {/* Prev */}
      <button
        className="timeline-nav-btn"
        onClick={() => { setPlaying(false); goTo(currentFrameIndex - 1); }}
        disabled={currentFrameIndex === 0 || frames.length === 0}
        title="Previous frame (←)"
      >
        ‹
      </button>

      {/* Play / Pause */}
      <button
        className={`timeline-play-btn ${playing ? 'playing' : ''}`}
        onClick={togglePlay}
        disabled={frames.length === 0}
        title={playing ? 'Pause (Space)' : 'Play (Space)'}
      >
        {playing ? '❚❚' : '▶'}
      </button>

      {/* Speed */}
      <button
        className="timeline-speed-btn"
        onClick={cycleSpeed}
        title="Playback speed"
      >
        {SPEEDS[speedIdx].label}
      </button>

      {/* Scrubber */}
      <div className="timeline-scrubber">
        <div
          className="timeline-track"
          onClick={(e) => {
            setPlaying(false);
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = (e.clientX - rect.left) / rect.width;
            goTo(Math.round(ratio * (frames.length - 1)));
          }}
        >
          <div className="timeline-fill" style={{ width: `${progress}%` }} />
          <div className="timeline-thumb" style={{ left: `${progress}%` }} />
        </div>

        <div className="timeline-dots">
          {dotsToShow.map((frame) => {
            const realIndex = frames.indexOf(frame);
            return (
              <div
                key={frame.frame_id}
                className={`timeline-dot ${realIndex === currentFrameIndex ? 'active' : ''}`}
                onClick={() => { setPlaying(false); goTo(realIndex); }}
                title={`Frame ${realIndex + 1}`}
              />
            );
          })}
        </div>
      </div>

      {/* Meta */}
      <div className="timeline-meta">
        <div className="timeline-counter">
          <span className="cur">{String(currentFrameIndex + 1).padStart(3, '0')}</span>
          {frames.length > 0 && ` / ${frames.length}`}
        </div>
        {ts && <div className="timeline-ts">{ts}</div>}
        {loading && <div className="timeline-ts">Loading…</div>}
      </div>

      {/* Next */}
      <button
        className="timeline-nav-btn"
        onClick={() => { setPlaying(false); goTo(currentFrameIndex + 1); }}
        disabled={currentFrameIndex >= frames.length - 1 || frames.length === 0}
        title="Next frame (→)"
      >
        ›
      </button>
    </div>
  );
});

export default FrameNavigator;

import { useState, useEffect } from 'react';
import apiService from '../services/api';

function QualityInspector({ frameId }) {
  const [qualityReport, setQualityReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (frameId) {
      loadQualityReport();
    } else {
      setQualityReport(null);
    }
  }, [frameId]);

  const loadQualityReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const report = await apiService.getQualityReport(frameId);
      setQualityReport(report);
    } catch (err) {
      setError('Failed to load quality report: ' + err.message);
      console.error('Error loading quality report:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PASS':
        return '✅';
      case 'WARNING':
        return '⚠️';
      case 'FAIL':
        return '❌';
      default:
        return '❓';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'PASS':    return 'pass';
      case 'WARNING': return 'warn';
      case 'FAIL':    return 'fail';
      default:        return '';
    }
  };

  if (!frameId) {
    return (
      <div className="quality-inspector">
        <div className="viewport-empty">
          <div className="viewport-empty-title">No frame selected</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="quality-inspector">
        <div className="state-loading">
          <div className="loading-ring" />
          Running quality checks…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quality-inspector">
        <div className="state-error">
          {error}
          <button className="retry-btn" onClick={loadQualityReport}>Retry</button>
        </div>
      </div>
    );
  }

  if (!qualityReport) {
    return (
      <div className="quality-inspector">
        <div className="state-loading">No report available</div>
      </div>
    );
  }

  return (
    <div className="quality-inspector">
      <div className="quality-inspector-header">
        <span className="quality-inspector-title">Quality Inspection</span>
        <div className={`quality-overall ${getStatusClass(qualityReport.status)}`}>
          {getStatusIcon(qualityReport.status)} {qualityReport.status}
        </div>
      </div>

      <div className="quality-checks">
        {qualityReport.checks && qualityReport.checks.map((check, index) => (
          <div key={index} className={`quality-check-item ${getStatusClass(check.status)}`}>
            <span className="check-icon">{getStatusIcon(check.status)}</span>
            <div className="check-body">
              <div className="check-name">{check.check_name}</div>
              <div className="check-message">{check.message}</div>
            </div>
            <span className={`check-badge ${getStatusClass(check.status)}`}>
              {check.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default QualityInspector;

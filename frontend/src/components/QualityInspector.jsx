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
      case 'PASS':
        return 'status-pass';
      case 'WARNING':
        return 'status-warning';
      case 'FAIL':
        return 'status-fail';
      default:
        return '';
    }
  };

  if (!frameId) {
    return (
      <div className="quality-inspector">
        <h3>Quality Inspection</h3>
        <div className="info-message">Select a frame to view quality report</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="quality-inspector">
        <h3>Quality Inspection</h3>
        <div className="loading">Running quality checks...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quality-inspector">
        <h3>Quality Inspection</h3>
        <div className="error">{error}</div>
        <button onClick={loadQualityReport}>Retry</button>
      </div>
    );
  }

  if (!qualityReport) {
    return (
      <div className="quality-inspector">
        <h3>Quality Inspection</h3>
        <div className="info-message">No quality report available</div>
      </div>
    );
  }

  return (
    <div className="quality-inspector">
      <div className="quality-header">
        <h3>Quality Inspection</h3>
        <div className={`overall-status ${getStatusClass(qualityReport.status)}`}>
          <span className="status-icon">{getStatusIcon(qualityReport.status)}</span>
          <span className="status-text">{qualityReport.status}</span>
        </div>
      </div>

      <div className="quality-checks">
        {qualityReport.checks && qualityReport.checks.map((check, index) => (
          <div key={index} className={`quality-check ${getStatusClass(check.status)}`}>
            <div className="check-header">
              <span className="check-icon">{getStatusIcon(check.status)}</span>
              <span className="check-name">{check.check_name}</span>
              <span className={`check-status ${getStatusClass(check.status)}`}>
                {check.status}
              </span>
            </div>
            <div className="check-message">{check.message}</div>
          </div>
        ))}
      </div>

      <div className="quality-footer">
        <button onClick={loadQualityReport} className="refresh-button">
          🔄 Refresh Report
        </button>
        <div className="report-timestamp">
          Last checked: {new Date(qualityReport.timestamp * 1000).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}

export default QualityInspector;

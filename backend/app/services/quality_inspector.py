import time
from typing import Dict, Any, List
from app.schemas.models import QualityStatus, QualityCheck, QualityReport

class QualityInspector:
    def __init__(self, nuscenes_service):
        self.nuscenes_service = nuscenes_service
    
    def inspect_frame(self, frame_id: str) -> QualityReport:
        checks = []
        
        frame_detail = self.nuscenes_service.get_frame_detail(frame_id)
        
        if not frame_detail:
            return QualityReport(
                frame_id=frame_id,
                status=QualityStatus.FAIL,
                checks=[
                    QualityCheck(
                        check_name="Frame Existence",
                        status=QualityStatus.FAIL,
                        message="Frame not found in dataset"
                    )
                ],
                timestamp=time.time()
            )
        
        checks.append(self._check_sensor_availability(frame_detail))
        checks.append(self._check_timestamp_validity(frame_detail))
        checks.append(self._check_sensor_data_integrity(frame_id, frame_detail))
        
        overall_status = self._determine_overall_status(checks)
        
        return QualityReport(
            frame_id=frame_id,
            status=overall_status,
            checks=checks,
            timestamp=time.time()
        )
    
    def _check_sensor_availability(self, frame_detail: Dict[str, Any]) -> QualityCheck:
        available_sensors = frame_detail.get("available_sensors", [])
        required_sensors = ["CAM_FRONT", "LIDAR_TOP"]
        
        missing_sensors = [s for s in required_sensors if s not in available_sensors]
        
        if not missing_sensors:
            return QualityCheck(
                check_name="Sensor Availability",
                status=QualityStatus.PASS,
                message=f"All required sensors present ({len(available_sensors)} total)"
            )
        elif len(missing_sensors) == len(required_sensors):
            return QualityCheck(
                check_name="Sensor Availability",
                status=QualityStatus.FAIL,
                message=f"All required sensors missing: {', '.join(missing_sensors)}"
            )
        else:
            return QualityCheck(
                check_name="Sensor Availability",
                status=QualityStatus.WARNING,
                message=f"Some sensors missing: {', '.join(missing_sensors)}"
            )
    
    def _check_timestamp_validity(self, frame_detail: Dict[str, Any]) -> QualityCheck:
        timestamp = frame_detail.get("timestamp", 0)
        
        if timestamp <= 0:
            return QualityCheck(
                check_name="Timestamp Validity",
                status=QualityStatus.FAIL,
                message="Invalid timestamp (zero or negative)"
            )
        
        min_valid_timestamp = 1500000000
        max_valid_timestamp = 2000000000
        
        if timestamp < min_valid_timestamp or timestamp > max_valid_timestamp:
            return QualityCheck(
                check_name="Timestamp Validity",
                status=QualityStatus.WARNING,
                message=f"Timestamp outside expected range: {timestamp}"
            )
        
        return QualityCheck(
            check_name="Timestamp Validity",
            status=QualityStatus.PASS,
            message=f"Timestamp valid: {timestamp}"
        )
    
    def _check_sensor_data_integrity(self, frame_id: str, frame_detail: Dict[str, Any]) -> QualityCheck:
        available_sensors = frame_detail.get("available_sensors", [])
        
        if not available_sensors:
            return QualityCheck(
                check_name="Sensor Data Integrity",
                status=QualityStatus.FAIL,
                message="No sensor data available"
            )
        
        accessible_count = 0
        failed_sensors = []
        
        for sensor in available_sensors[:3]:
            sensor_data = self.nuscenes_service.get_sensor_data(frame_id, sensor)
            if sensor_data:
                accessible_count += 1
            else:
                failed_sensors.append(sensor)
        
        if accessible_count == 0:
            return QualityCheck(
                check_name="Sensor Data Integrity",
                status=QualityStatus.FAIL,
                message="No sensor data accessible"
            )
        elif failed_sensors:
            return QualityCheck(
                check_name="Sensor Data Integrity",
                status=QualityStatus.WARNING,
                message=f"Some sensor data inaccessible: {', '.join(failed_sensors)}"
            )
        else:
            return QualityCheck(
                check_name="Sensor Data Integrity",
                status=QualityStatus.PASS,
                message=f"All checked sensors accessible ({accessible_count} sensors)"
            )
    
    def _determine_overall_status(self, checks: List[QualityCheck]) -> QualityStatus:
        if any(check.status == QualityStatus.FAIL for check in checks):
            return QualityStatus.FAIL
        elif any(check.status == QualityStatus.WARNING for check in checks):
            return QualityStatus.WARNING
        else:
            return QualityStatus.PASS

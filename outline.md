Technical Assessment (with Full-Stack part)
Multi-Sensor Data Visualization and Data Quality
Inspection
Background
Autonomous driving systems rely on large-scale multi-sensor datasets including cameras, LiDAR,
and radar.
Data visualization and quality inspection are important tools for validating these datasets.
In this assessment, you will build a small full-stack system for exploring and inspecting the
nuScenes dataset.
You may use the official SDK: https://www.nuscenes.org/nuscenes?tutorial=nuscenes
Goal
Build a web-based tool that allows users to:
• Browse scenes and frames from the nuScenes dataset
• Visualize multi-sensor data (camera and/or LiDAR)
• Perform basic data quality checks on each frame
The goal is to evaluate your ability to design and implement a small data inspection system.
Functional Requirements
1. Dataset Access
The backend should load nuScenes data and provide an API for accessing scenes and frames.
2. Sensor Visualization
The frontend should allow users to visualize sensor data for a selected frame.
• Camera image visualization
• LiDAR point cloud or a simplified representation
3. Frame Navigation
Users should be able to navigate through frames within a scene.
4. Data Quality Inspection
Implement a basic mechanism to evaluate data quality for a frame.
• Missing sensor data
• Timestamp inconsistencies
• Annotation availability
The system should produce a simple inspection result (e.g., PASS / WARNING / FAIL).
Technical Guidelines
• Frontend: React / Next.js / Vue
• Backend: Python (FastAPI / Flask) or Node.js
• Visualization: Three.js / WebGL / Other approaches
Deliverables
• Source Code – A repository containing frontend and backend code.
• Documentation – A README describing system architecture, setup instructions, and how to
run the system.
• Demonstration – Either screenshots or a short demo video.
Evaluation Criteria
• System design
• Code quality
• Usability of the visualization
• Backend API design
• Data inspection logic
• Documentation clarity
Estimated Time
The task is designed to take approximately 6–10 hours.
You do not need to implement a production-ready system. Focus on demonstrating your
engineering approach and design decisions.
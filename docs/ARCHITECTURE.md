# Industrial Predictive Maintenance & Remaining Useful Life (RUL) Intelligence
## Architecture, File Directory & Operational Documentation

---

### 1. System Overview
The **Predictive Maintenance & RUL Intelligence Platform** is a machine health monitoring suite built for rotating plant machinery (Centrifugal Slurry Pumps, High-Speed CNC Spindles, Turbocompressors, Gearboxes). 

It combines:
- **Condition-Based Monitoring (CBM)**: ISO 10816 vibration velocity RMS (mm/s), acoustic ultrasonic peak acceleration (g), thermal infrared delta, and stator motor current signature analysis (MCSA).
- **Remaining Useful Life (RUL) Prognostics**: Statistical Weibull hazard rate modeling + degradation curve fitting estimating hours remaining with 95% confidence intervals.
- **Explainable Anomaly Attribution**: Root-cause diagnostic tree (Bearing Outer Race Defect BPFO, Inner Race BPFI, Ball Pass BSF, Shaft Misalignment, Cavitation).
- **Proactive Work Order Dispatch**: Automated generation of ISO 55000 maintenance work orders before catastrophic failure.

---

### 2. Directory Structure & File Map

```
predictive-maintenance-rul/
├── docker-compose.yml              # Multi-container orchestration (Mongo:27020, Server:5003, Client:3003)
├── README.md                       # Quickstart documentation
├── docs/                           # Architecture and prognosis runbooks
│   └── ARCHITECTURE.md             # This document
├── client/                         # React 18 + Vite Frontend Application
│   ├── Dockerfile                  # Multi-stage build (Node 20 build -> Nginx Alpine runtime)
│   ├── nginx.conf                  # Nginx reverse proxy mapping /api to server:5003
│   ├── package.json                # Frontend dependencies (Lucide icons, charts)
│   ├── vite.config.js              # Vite bundler configuration
│   ├── index.html                  # HTML entry point with industrial dark-amber telemetry styling
│   └── src/
│       ├── App.jsx                 # Machinery fleet view, FFT spectrum simulator, RUL Weibull curve, Work orders
│       ├── index.css               # Clean STRATIS-inspired modern light enterprise theme
│       ├── main.jsx                # React root mount
│       └── mockData.js             # High-precision industrial machinery vibration dataset
└── server/                         # Express & Mongoose API Server
    ├── Dockerfile                  # Node.js 20 Alpine container
    ├── package.json                # Backend dependencies (express, mongoose, cors)
    ├── server.js                   # REST API routes, CBM thresholds, RUL prognosis calculation
    └── seeder.js                   # Seed industrial assets, vibration spectrums, and active work orders
```

---

### 3. Detailed Component Breakdown

#### Backend (`server/`)
- **`server/server.js`**:
  - Express REST API running on port `5003`.
  - MongoDB models for `Asset`, `TelemetryRecord`, `AnomalyEvent`, `WorkOrder`.
  - Core API Routes:
    - `GET /health`: Healthcheck.
    - `GET /api/overview`: Fleet health index, critical assets under 100h RUL, active work orders.
    - `GET /api/assets`: Asset list with current vibration RMS, bearing health %, and RUL estimate.
    - `GET /api/assets/:id/rul`: Detailed Weibull degradation curve with confidence upper/lower bounds.
    - `POST /api/work-orders`: Generate preventive maintenance work orders.
    - `POST /api/telemetry`: Ingest high-frequency vibration and temperature telemetry.
- **`server/seeder.js`**:
  - Seeds critical rotating assets (`PUMP-SLURRY-04`, `SPINDLE-CNC-01`, `COMPRESSOR-TURBO-02`), baseline vibration signatures, and pending repairs.

#### Frontend (`client/`)
- **`client/src/App.jsx`**:
  - Interactive industrial reliability dashboard:
    1. **Fleet Health Overview**: Overall asset reliability index, critical warning radar.
    2. **Asset Telemetry Matrix**: Live vibration RMS gauge, bearing temperature vs ISO 10816 Class IV standards.
    3. **RUL Degradation & Prognostics**: Dynamic curve projection with estimated days to failure.
    4. **Diagnostic Attribution**: Root cause breakdown (e.g. 74% Bearing Outer Race BPFO).
    5. **Work Order Dispatcher**: Direct link from diagnostic to technician dispatch.

---

### 4. Zero-Dependency Execution via Docker

To run on any recipient laptop with Docker Desktop:
```bash
# 1. Unzip the project folder on the target laptop
cd predictive-maintenance-rul

# 2. Build and launch all 3 containers
docker compose up --build -d

# 3. Access in browser:
# Frontend Dashboard: http://localhost:3003
# Backend Healthcheck: http://localhost:5003/health
# API Overview:       http://localhost:5003/api/overview
```
Port Mappings:
- Client: `3003`
- Server: `5003`
- MongoDB: `27020`

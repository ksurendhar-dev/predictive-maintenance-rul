# Equipment Health & Maintenance Monitor — Predictive Maintenance & RUL

A production-grade, enterprise MERN-stack industrial predictive maintenance system for rotating machinery and heavy plant assets (5-axis CNC spindles, centrifugal compressors, hydraulic pumps, industrial gearboxes). Continuous condition monitoring via real-time vibration velocity (mm/s RMS), bearing impact shock (Peak-G), and operating temperature.

> 📄 **Reviewer Resources:**
> - [PROJECT_OVERVIEW.txt](PROJECT_OVERVIEW.txt) — Concise plain-text architecture, demo script, and defense guide.
> - [REVIEWER_REPORT.md](REVIEWER_REPORT.md) — Comprehensive technical report, system breakdown, and Q&A defense cheat sheet.

---

## ✨ Features & Architecture (70%+ Completed)

- **Machine Fleet Health Index**: Continuous monitoring of vibration RMS (mm/s), bearing peak acceleration (g), acoustic emission (dB), stator temperature (°C), and lube dielectric degradation.
- **RUL Prognostics Horizon**: Remaining Useful Life prediction countdowns with 95% confidence intervals (`[min - max hours]`) to plan non-disruptive changeover windows.
- **Explainable Anomaly Alerts**: Real-time sensor feature attribution detailing the exact mechanical failure precursors (e.g., *Outer Raceway Ball Pass Frequency BPFO at 842 Hz, Thermal Runaway Risk*).
- **Proactive Repair & Task Scheduling**: Auto-populates kitting requirements and OEM parts lists (hybrid ceramic bearings, Viton seal kits, high-speed grease) with maintenance technician assignments.
- **Live Spline Waveform**: Cubic Bezier spline chart streaming physical vibration every 3 seconds with auto-zoom and ISO 10816 Zone D trip limits.
- **Simulation Cockpit**: Minimal dark floating bar to simulate real-world vibration spikes, bearing defects, and RUL drops in 1 click.
- **1-Click Baseline Healing**: Resolving an incident automatically clears alerts, heals equipment baseline, and broadcasts updates via WebSockets.

---

## 🚀 One-Command Launch with Docker (Seamless on Any Laptop)

No setup or configuration required. Run from this folder:

```bash
docker compose up -d --build
```

- **Frontend Dashboard**: Open [http://localhost:3003](http://localhost:3003)
- **Backend API**: [http://localhost:5003/api/overview](http://localhost:5003/api/overview)
- **MongoDB**: Running internally on port `27020` with persistent volumes

To stop:
```bash
docker compose down
```

---

## 💻 Local Development (Without Docker)

### 1. Prerequisites
- Node.js 18+
- MongoDB on `mongodb://127.0.0.1:27017`

### 2. Backend Setup
```bash
cd server
npm install
npm start
```
*API runs on `http://localhost:5003`.*

### 3. Frontend Setup
```bash
cd client
npm install
npm run dev
```
*Dashboard runs on `http://localhost:5176`.*

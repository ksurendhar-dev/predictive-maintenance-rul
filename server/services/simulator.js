const mongoose = require('mongoose');
const Machine = require('../models/Machine');
const TelemetryReading = require('../models/TelemetryReading');
const AnomalyAlert = require('../models/AnomalyAlert');
const MaintenanceAction = require('../models/MaintenanceAction');

let simTick = 0;
let tickCount = 0;
let isProcessing = false;
let cachedCounts = null;
let countsRefreshedAt = 0;
const COUNTS_TTL_MS = 5000;

const startTelemetrySimulator = (io) => {
  console.log('Predictive Maintenance & RUL Simulator active (1s heartbeat, dynamic wave oscillation)');

  setInterval(async () => {
    if (isProcessing || mongoose.connection.readyState !== 1) return;
    isProcessing = true;
    try {
      const machines = await Machine.find();
      if (!machines || machines.length === 0) return;

      simTick += 0.25;
      tickCount++;
      const updatedMachines = [];

      await Promise.all(
        machines.map(async (m) => {
          const seed = (m.machineId && typeof m.machineId === 'string')
            ? m.machineId.charCodeAt(m.machineId.length - 1)
            : 42;
          // Harmonic vibration cycle (fundamental + 2nd harmonic for realistic continuous mechanical wave)
          const fundamental = Math.sin(simTick + seed);
          const harmonic = Math.sin(2.1 * simTick + seed * 1.5) * 0.22;
          const continuousWave = (fundamental * 0.78 + harmonic);
          const microNoise = (Math.random() - 0.5) * 0.02; // Micro sensor flutter

          let newRpm = 1800 + Math.round(continuousWave * 15);
          let newAmps = +(18.5 + continuousWave * 0.6).toFixed(1);
          let newDb = 58 + Math.round(continuousWave * 2);
          let newPeakG;
          let newTemp;
          let newVib;

          if (m.status === 'HEALTHY') {
            newVib = +(1.8 + continuousWave * 0.28 + microNoise).toFixed(2);
            if (newVib < 0.8) newVib = 0.8;
            newPeakG = +(0.85 + continuousWave * 0.12).toFixed(2);
            newTemp = +(52.0 + continuousWave * 1.0).toFixed(1);
          } else if (m.status === 'EARLY_DEGRADATION') {
            newVib = +(3.7 + continuousWave * 0.35 + microNoise).toFixed(2);
            newPeakG = +(2.1 + continuousWave * 0.20).toFixed(2);
            newTemp = +(68.0 + continuousWave * 1.5).toFixed(1);
            newDb = 72 + Math.round(continuousWave * 3);
          } else if (m.status === 'CRITICAL_SHUTDOWN') {
            newVib = +(8.4 + continuousWave * 0.45 + microNoise).toFixed(2);
            newPeakG = +(4.2 + continuousWave * 0.30).toFixed(2);
            newTemp = +(83.0 + continuousWave * 1.8).toFixed(1);
            newDb = 92 + Math.round(continuousWave * 4);
          } else {
            // SEVERE_ANOMALY
            newVib = +(6.2 + continuousWave * 0.40 + microNoise).toFixed(2);
            newPeakG = +(3.0 + continuousWave * 0.25).toFixed(2);
            newTemp = +(76.0 + continuousWave * 1.5).toFixed(1);
            newDb = 86 + Math.round(continuousWave * 4);
          }

          let status = m.status;
          let health = m.healthScore;
          let anomalyScore = m.anomalyScore;

          if (newVib >= m.warningVibrationRms * 1.4 || newPeakG >= 4.0 || newTemp >= 80) {
            status = 'CRITICAL_SHUTDOWN';
            health = Math.min(health, 35);
            anomalyScore = Math.max(anomalyScore, 0.88);
          } else if (newVib >= m.warningVibrationRms || newPeakG >= 2.5 || newTemp >= m.warningTempC) {
            if (status !== 'CRITICAL_SHUTDOWN') status = 'SEVERE_ANOMALY';
            health = Math.min(health, 55);
            anomalyScore = Math.max(anomalyScore, 0.65);
          } else if (newVib >= 3.2 || newPeakG >= 1.8) {
            if (status === 'HEALTHY') status = 'EARLY_DEGRADATION';
          }

          const originalState = {
            currentVibrationRms: m.currentVibrationRms,
            currentTempC: m.currentTempC,
            currentBearingPeakG: m.currentBearingPeakG,
            healthScore: m.healthScore,
            status: m.status,
            anomalyScore: m.anomalyScore
          };

          m.currentVibrationRms = newVib;
          m.currentTempC = newTemp;
          m.currentBearingPeakG = newPeakG;
          m.healthScore = health;
          m.status = status;
          m.anomalyScore = anomalyScore;

          const telemetry = new TelemetryReading({
            machineId: m.machineId,
            timestamp: new Date(),
            vibrationRms: newVib,
            bearingPeakG: newPeakG,
            tempC: newTemp,
            acousticEmissionDb: newDb,
            motorCurrentAmps: newAmps,
            rpm: newRpm,
            anomalyFlag: status !== 'HEALTHY'
          });

          let machineSaved = false;
          try {
            await m.save();
            machineSaved = true;
            await telemetry.save();
            io.emit('telemetry:stream', {
              machineId: m.machineId,
              telemetry,
              machine: m
            });
            updatedMachines.push(m);
          } catch (e) {
            console.error(`Simulator error saving ${m.machineId}:`, e.message);
            if (!machineSaved) {
              Object.assign(m, originalState);
            }
          }
        })
      );

      if (updatedMachines.length === 0) return;

      // Memory aggregation for instant broadcast across fleet using persisted machine states
      const healthyCount = machines.filter(m => m.status === 'HEALTHY').length;
      const earlyDegradationCount = machines.filter(m => m.status === 'EARLY_DEGRADATION').length;
      const severeAnomalyCount = machines.filter(m => m.status === 'SEVERE_ANOMALY' || m.status === 'CRITICAL_SHUTDOWN').length;
      const criticalRulCount = machines.filter(m => m.predictedRulHours <= 200).length;
      const avgHealth = Math.round(machines.reduce((acc, m) => acc + (m.healthScore || 0), 0) / machines.length);

      // Refresh alert counts every 5 seconds based on staleness and TTL
      if (!cachedCounts || Date.now() - countsRefreshedAt >= COUNTS_TTL_MS) {
        const [openAnomalies, criticalAnomalies, activeWorkOrders] = await Promise.all([
          AnomalyAlert.countDocuments({ status: { $ne: 'RESOLVED' } }),
          AnomalyAlert.countDocuments({ severity: 'CRITICAL', status: { $ne: 'RESOLVED' } }),
          MaintenanceAction.countDocuments({ status: { $ne: 'COMPLETED' } })
        ]);
        cachedCounts = { openAnomalies, criticalAnomalies, activeWorkOrders };
        countsRefreshedAt = Date.now();
      }

      // Emit overview update on every tick for real-time responsiveness
      io.emit('overview:update', {
        totalMachines: machines.length,
        avgHealth,
        ...cachedCounts,
        criticalRulCount,
        fleetDistribution: {
          healthy: healthyCount,
          earlyDegradation: earlyDegradationCount,
          severeAnomaly: severeAnomalyCount
        }
      });

    } catch (err) {
      console.error('Simulator heartbeat error:', err.message);
    } finally {
      isProcessing = false;
    }
  }, 1000);
};

module.exports = { startTelemetrySimulator };

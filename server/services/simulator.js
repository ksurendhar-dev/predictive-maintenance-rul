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
          const wave = Math.sin(simTick + seed);
          const noise = (Math.random() - 0.5);

          let newVib = m.currentVibrationRms;
          let newTemp = m.currentTempC;
          let newPeakG = m.currentBearingPeakG;
          let newRpm = 1800 + Math.round(wave * 25 + noise * 10);
          let newAmps = 18.5 + +(wave * 1.2 + noise * 0.4).toFixed(1);
          let newDb = 58 + Math.round(wave * 3 + noise * 2);

          if (m.status === 'HEALTHY') {
            newVib = +(1.8 + wave * 0.35 + noise * 0.15).toFixed(2);
            if (newVib < 0.8) newVib = 0.8;
            newPeakG = +(0.85 + wave * 0.18 + noise * 0.08).toFixed(2);
            newTemp = +(52.0 + wave * 1.5 + noise * 0.5).toFixed(1);
          } else if (m.status === 'EARLY_DEGRADATION') {
            newVib = +(3.8 + wave * 0.5 + noise * 0.25).toFixed(2);
            newPeakG = +(2.1 + wave * 0.3 + noise * 0.1).toFixed(2);
            newTemp = +(68.0 + wave * 2.0 + noise * 0.8).toFixed(1);
            newDb = 72 + Math.round(wave * 4);
          } else {
            newVib = +(m.currentVibrationRms + wave * 0.4 + noise * 0.2).toFixed(2);
            if (newVib < 5.5) newVib = 5.5;
            newPeakG = +(m.currentBearingPeakG + wave * 0.2 + noise * 0.1).toFixed(2);
            newTemp = +(m.currentTempC + wave * 1.0 + noise * 0.3).toFixed(1);
            newDb = 88 + Math.round(wave * 5);
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

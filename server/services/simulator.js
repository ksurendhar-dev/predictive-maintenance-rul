const mongoose = require('mongoose');
const Machine = require('../models/Machine');
const TelemetryReading = require('../models/TelemetryReading');
const AnomalyAlert = require('../models/AnomalyAlert');
const MaintenanceAction = require('../models/MaintenanceAction');

let simTick = 0;

const startTelemetrySimulator = (io) => {
  console.log('Predictive Maintenance & RUL Simulator active (3s heartbeat, dynamic wave oscillation)');

  setInterval(async () => {
    try {
      if (mongoose.connection.readyState !== 1) return;
      const machines = await Machine.find();
      if (!machines || machines.length === 0) return;

      simTick += 0.25;
      const updatedMachines = [];

      for (const m of machines) {
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
          // Keep in safe healthy range
          newVib = +(1.8 + wave * 0.35 + noise * 0.15).toFixed(2);
          if (newVib < 0.8) newVib = 0.8;
          newPeakG = +(0.85 + wave * 0.18 + noise * 0.08).toFixed(2);
          newTemp = +(52.0 + wave * 1.5 + noise * 0.5).toFixed(1);
        } else if (m.status === 'EARLY_DEGRADATION') {
          // Moderate oscillation
          newVib = +(3.8 + wave * 0.5 + noise * 0.25).toFixed(2);
          newPeakG = +(2.1 + wave * 0.3 + noise * 0.1).toFixed(2);
          newTemp = +(68.0 + wave * 2.0 + noise * 0.8).toFixed(1);
          newDb = 72 + Math.round(wave * 4);
        } else {
          // SEVERE_ANOMALY or CRITICAL_SHUTDOWN (from scenario)
          newVib = +(m.currentVibrationRms + wave * 0.4 + noise * 0.2).toFixed(2);
          if (newVib < 5.5) newVib = 5.5;
          newPeakG = +(m.currentBearingPeakG + wave * 0.2 + noise * 0.1).toFixed(2);
          newTemp = +(m.currentTempC + wave * 1.0 + noise * 0.3).toFixed(1);
          newDb = 88 + Math.round(wave * 5);
        }

        // Evaluate physical status
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

        m.currentVibrationRms = newVib;
        m.currentTempC = newTemp;
        m.currentBearingPeakG = newPeakG;
        m.healthScore = health;
        m.status = status;
        m.anomalyScore = anomalyScore;
        await m.save();

        // Save telemetry record
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
        await telemetry.save();

        // Broadcast live telemetry point
        io.emit('telemetry:stream', {
          machineId: m.machineId,
          telemetry,
          machine: m
        });

        updatedMachines.push(m);
      }

      // Broadcast overview update
      const openAnomalies = await AnomalyAlert.countDocuments({ status: { $ne: 'RESOLVED' } });
      const criticalAnomalies = await AnomalyAlert.countDocuments({ severity: 'CRITICAL', status: { $ne: 'RESOLVED' } });
      const criticalRulCount = updatedMachines.filter(m => m.predictedRulHours <= 200).length;
      const activeWorkOrders = await MaintenanceAction.countDocuments({ status: { $ne: 'COMPLETED' } });
      const avgHealth = Math.round(updatedMachines.reduce((acc, m) => acc + (m.healthScore || 0), 0) / updatedMachines.length);

      io.emit('overview:update', {
        totalMachines: updatedMachines.length,
        avgHealth,
        openAnomalies,
        criticalAnomalies,
        criticalRulCount,
        activeWorkOrders,
        fleetDistribution: {
          healthy: updatedMachines.filter(m => m.status === 'HEALTHY').length,
          earlyDegradation: updatedMachines.filter(m => m.status === 'EARLY_DEGRADATION').length,
          severeAnomaly: updatedMachines.filter(m => m.status === 'SEVERE_ANOMALY' || m.status === 'CRITICAL_SHUTDOWN').length
        }
      });

    } catch (err) {
      console.error('Simulator heartbeat error:', err.message);
    }
  }, 3000);
};

module.exports = { startTelemetrySimulator };

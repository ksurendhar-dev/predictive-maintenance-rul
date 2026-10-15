const express = require('express');
const router = express.Router();
const Machine = require('../models/Machine');
const TelemetryReading = require('../models/TelemetryReading');
const AnomalyAlert = require('../models/AnomalyAlert');
const MaintenanceAction = require('../models/MaintenanceAction');

// 1. Overview KPIs
router.get('/overview', async (req, res) => {
  try {
    const machines = await Machine.find();
    const openAnomalies = await AnomalyAlert.countDocuments({ status: { $ne: 'RESOLVED' } });
    const criticalAnomalies = await AnomalyAlert.countDocuments({ severity: 'CRITICAL', status: { $ne: 'RESOLVED' } });
    const criticalRulCount = machines.filter(m => m.predictedRulHours <= 200).length;
    const activeWorkOrders = await MaintenanceAction.countDocuments({ status: { $ne: 'COMPLETED' } });

    const avgHealth = machines.length > 0 
      ? Math.round(machines.reduce((acc, m) => acc + (m.healthScore || 0), 0) / machines.length) 
      : 88;

    const healthyCount = machines.filter(m => m.status === 'HEALTHY').length;
    const earlyDegradationCount = machines.filter(m => m.status === 'EARLY_DEGRADATION').length;
    const severeAnomalyCount = machines.filter(m => m.status === 'SEVERE_ANOMALY' || m.status === 'CRITICAL_SHUTDOWN').length;

    res.json({
      success: true,
      data: {
        totalMachines: machines.length,
        avgHealth,
        openAnomalies,
        criticalAnomalies,
        criticalRulCount,
        activeWorkOrders,
        fleetDistribution: {
          healthy: healthyCount,
          earlyDegradation: earlyDegradationCount,
          severeAnomaly: severeAnomalyCount
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Simulation Scenarios
router.post('/simulator/scenario', async (req, res) => {
  try {
    const { scenario } = req.body;
    const io = req.app.get('io');
    let message = '';

    if (scenario === 'VIBRATION_SPIKE') {
      const machine = await Machine.findOne({ machineId: 'MCH-CNC-501' });
      if (machine) {
        machine.currentVibrationRms = 8.6;
        machine.currentTempC = 82.5;
        machine.currentBearingPeakG = 3.9;
        machine.healthScore = 32;
        machine.status = 'CRITICAL_SHUTDOWN';
        machine.anomalyScore = 0.94;
        machine.predictedRulHours = 24;
        machine.rulConfidenceMin = 16;
        machine.rulConfidenceMax = 36;
        await machine.save();

        const alert = new AnomalyAlert({
          alertId: `ALT-VIB-${Date.now().toString().slice(-5)}`,
          machineId: machine.machineId,
          machineName: machine.name,
          line: machine.line,
          severity: 'CRITICAL',
          failureMode: 'Spindle Unbalance & High-Order Vibration Spike',
          anomalyScore: 0.94,
          explainability: [
            { feature: 'Vibration RMS (8.6 mm/s)', contributionPercent: 68, description: 'ISO 10816 Zone D severe vibration limit exceeded' },
            { feature: 'Bearing Peak G (3.9g)', contributionPercent: 22, description: 'Harmonic impact spikes on inner race' },
            { feature: 'Operating Temp (82.5°C)', contributionPercent: 10, description: 'Elevated bearing friction heat' }
          ],
          recommendedAction: 'Immediate spindle speed throttle and dynamic balancing audit',
          status: 'OPEN'
        });
        await alert.save();

        const telemetry = new TelemetryReading({
          machineId: machine.machineId,
          timestamp: new Date(),
          vibrationRms: 8.6,
          bearingPeakG: 3.9,
          tempC: 82.5,
          acousticEmissionDb: 89,
          motorCurrentAmps: 26.4,
          rpm: 2100,
          anomalyFlag: true
        });
        await telemetry.save();

        if (io) {
          io.emit('machine:update', machine);
          io.emit('alert:new', alert);
          io.emit('telemetry:stream', { machineId: machine.machineId, telemetry, machine });
        }
      }
      message = 'Simulated Severe Vibration Spike (8.6 mm/s) on CNC Spindle MCH-CNC-501';

    } else if (scenario === 'BEARING_DEFECT') {
      const machine = await Machine.findOne({ machineId: 'MCH-CMP-202' });
      if (machine) {
        machine.currentBearingPeakG = 5.2;
        machine.currentVibrationRms = 6.8;
        machine.currentTempC = 89.0;
        machine.healthScore = 38;
        machine.status = 'SEVERE_ANOMALY';
        machine.anomalyScore = 0.89;
        machine.predictedRulHours = 46;
        machine.rulConfidenceMin = 30;
        machine.rulConfidenceMax = 65;
        await machine.save();

        const alert = new AnomalyAlert({
          alertId: `ALT-BRG-${Date.now().toString().slice(-5)}`,
          machineId: machine.machineId,
          machineName: machine.name,
          line: machine.line,
          severity: 'HIGH',
          failureMode: 'Outer Race Bearing Flaking (BPFO Resonance)',
          anomalyScore: 0.89,
          explainability: [
            { feature: 'Bearing Peak G (5.2g)', contributionPercent: 62, description: 'Repeated shock envelope signals at outer race pass frequency' },
            { feature: 'Housing Temp (89.0°C)', contributionPercent: 24, description: 'Rapid heat buildup from rolling element skidding' },
            { feature: 'Vibration RMS (6.8 mm/s)', contributionPercent: 14, description: 'Broadband acoustic energy propagation' }
          ],
          recommendedAction: 'Schedule precision bearing cartridge replacement within 48h',
          status: 'OPEN'
        });
        await alert.save();

        const telemetry = new TelemetryReading({
          machineId: machine.machineId,
          timestamp: new Date(),
          vibrationRms: 6.8,
          bearingPeakG: 5.2,
          tempC: 89.0,
          acousticEmissionDb: 92,
          motorCurrentAmps: 31.0,
          rpm: 3600,
          anomalyFlag: true
        });
        await telemetry.save();

        if (io) {
          io.emit('machine:update', machine);
          io.emit('alert:new', alert);
          io.emit('telemetry:stream', { machineId: machine.machineId, telemetry, machine });
        }
      }
      message = 'Simulated Bearing BPFO Defect (5.2g Peak) on Compressor MCH-CMP-202';

    } else if (scenario === 'RUL_COLLAPSE') {
      const machine = await Machine.findOne({ machineId: 'MCH-PMP-102' });
      if (machine) {
        machine.predictedRulHours = 14;
        machine.rulConfidenceMin = 8;
        machine.rulConfidenceMax = 20;
        machine.healthScore = 26;
        machine.status = 'CRITICAL_SHUTDOWN';
        machine.anomalyScore = 0.96;
        machine.currentVibrationRms = 7.4;
        machine.currentTempC = 78.5;
        await machine.save();

        const alert = new AnomalyAlert({
          alertId: `ALT-RUL-${Date.now().toString().slice(-5)}`,
          machineId: machine.machineId,
          machineName: machine.name,
          line: machine.line,
          severity: 'CRITICAL',
          failureMode: 'Impeller Cavitation & Rapid RUL Collapse',
          anomalyScore: 0.96,
          explainability: [
            { feature: 'Remaining Useful Life (14 Hours)', contributionPercent: 70, description: 'Degradation model predicts catastrophic fatigue within 1 shift' },
            { feature: 'Fluid Pulsation Vibration (7.4 mm/s)', contributionPercent: 20, description: 'Hydraulic shock waves from vapor bubble collapse' },
            { feature: 'Suction Temp (78.5°C)', contributionPercent: 10, description: 'Thermal dissipation above hydraulic oil rating' }
          ],
          recommendedAction: 'Emergency shutdown: switch load to secondary pump backup',
          status: 'OPEN'
        });
        await alert.save();

        const telemetry = new TelemetryReading({
          machineId: machine.machineId,
          timestamp: new Date(),
          vibrationRms: 7.4,
          bearingPeakG: 3.5,
          tempC: 78.5,
          acousticEmissionDb: 86,
          motorCurrentAmps: 22.0,
          rpm: 1450,
          anomalyFlag: true
        });
        await telemetry.save();

        if (io) {
          io.emit('machine:update', machine);
          io.emit('alert:new', alert);
          io.emit('telemetry:stream', { machineId: machine.machineId, telemetry, machine });
        }
      }
      message = 'Simulated Critical RUL Collapse (14 Hours remaining) on Hydraulic Pump MCH-PMP-102';

    } else if (scenario === 'RESET') {
      const defaultBaselines = {
        'MCH-CNC-501': { health: 96, vib: 1.8, temp: 52.0, peakG: 0.85, rul: 1420 },
        'MCH-CMP-202': { health: 94, vib: 1.9, temp: 54.0, peakG: 0.90, rul: 1350 },
        'MCH-PMP-102': { health: 95, vib: 1.6, temp: 48.0, peakG: 0.75, rul: 1510 },
        'MCH-GBX-401': { health: 97, vib: 1.5, temp: 46.0, peakG: 0.70, rul: 1680 },
        'MCH-FAN-304': { health: 98, vib: 1.4, temp: 44.0, peakG: 0.65, rul: 1850 },
        'MCH-ROB-108': { health: 95, vib: 1.7, temp: 50.0, peakG: 0.80, rul: 1490 }
      };

      const machines = await Machine.find();
      for (const m of machines) {
        const base = defaultBaselines[m.machineId] || { health: 95, vib: 1.8, temp: 50.0, peakG: 0.8, rul: 1400 };
        m.healthScore = base.health;
        m.status = 'HEALTHY';
        m.anomalyScore = 0.08;
        m.currentVibrationRms = base.vib;
        m.currentTempC = base.temp;
        m.currentBearingPeakG = base.peakG;
        m.predictedRulHours = base.rul;
        m.rulConfidenceMin = base.rul - 150;
        m.rulConfidenceMax = base.rul + 200;
        await m.save();

        if (io) io.emit('machine:update', m);
      }

      await AnomalyAlert.updateMany(
        { status: { $ne: 'RESOLVED' } },
        { $set: { status: 'RESOLVED' } }
      );

      message = 'Fleet Reset: All industrial equipment restored to healthy nominal baseline';
    }

    const updatedMachines = await Machine.find().sort({ machineId: 1 });
    const updatedAlerts = await AnomalyAlert.find().sort({ createdAt: -1 });

    if (io) {
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
    }

    res.json({
      success: true,
      message,
      data: {
        machines: updatedMachines,
        alerts: updatedAlerts
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Machines
router.get('/machines', async (req, res) => {
  try {
    const { status, type, line } = req.query;
    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    if (line) query.line = line;

    const machines = await Machine.find(query).sort({ healthScore: 1 });
    res.json({ success: true, data: machines });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/machines/:id', async (req, res) => {
  try {
    const machine = await Machine.findOne({ machineId: req.params.id });
    if (!machine) return res.status(404).json({ success: false, message: 'Machine not found' });
    const recentTelemetry = await TelemetryReading.find({ machineId: req.params.id }).sort({ timestamp: -1 }).limit(25);
    res.json({ success: true, data: { machine, telemetry: recentTelemetry.reverse() } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. RUL Predictions
router.get('/rul', async (req, res) => {
  try {
    const machines = await Machine.find().sort({ predictedRulHours: 1 });
    res.json({ success: true, data: machines });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 5. Anomaly Alerts
router.get('/alerts', async (req, res) => {
  try {
    const { severity, status } = req.query;
    const query = {};
    if (severity) query.severity = severity;
    if (status) query.status = status;

    const alerts = await AnomalyAlert.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: alerts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/alerts/:id/acknowledge', async (req, res) => {
  try {
    const alert = await AnomalyAlert.findOneAndUpdate(
      { alertId: req.params.id },
      { $set: { acknowledged: true } },
      { new: true }
    );
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
    
    if (req.app.get('io')) {
      req.app.get('io').emit('alert:acknowledged', alert);
    }
    res.json({ success: true, data: alert });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/alerts/:id/resolve', async (req, res) => {
  try {
    const alert = await AnomalyAlert.findOneAndUpdate(
      { alertId: req.params.id },
      { $set: { status: 'RESOLVED', acknowledged: true } },
      { new: true }
    );
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });

    const io = req.app.get('io');
    let updatedMachine = null;

    if (alert.machineId) {
      const machine = await Machine.findOne({ machineId: alert.machineId });
      if (machine) {
        const otherUnresolved = await AnomalyAlert.find({ 
          machineId: alert.machineId, 
          status: { $ne: 'RESOLVED' } 
        });

        if (otherUnresolved.length === 0) {
          // Restore to healthy baseline
          machine.healthScore = 96;
          machine.status = 'HEALTHY';
          machine.anomalyScore = 0.08;
          machine.currentVibrationRms = 1.8;
          machine.currentBearingPeakG = 0.85;
          machine.currentTempC = 52.0;
          machine.predictedRulHours = Math.max(machine.predictedRulHours, 1350);
          machine.rulConfidenceMin = machine.predictedRulHours - 150;
          machine.rulConfidenceMax = machine.predictedRulHours + 200;
        } else {
          const hasCritical = otherUnresolved.some(a => a.severity === 'CRITICAL');
          machine.status = hasCritical ? 'CRITICAL_SHUTDOWN' : 'SEVERE_ANOMALY';
        }
        await machine.save();
        updatedMachine = machine;

        const telemetry = new TelemetryReading({
          machineId: machine.machineId,
          timestamp: new Date(),
          vibrationRms: machine.currentVibrationRms,
          bearingPeakG: machine.currentBearingPeakG,
          tempC: machine.currentTempC,
          acousticEmissionDb: 58,
          motorCurrentAmps: 18.2,
          rpm: 1800,
          anomalyFlag: false
        });
        await telemetry.save();

        if (io) {
          io.emit('machine:update', machine);
          io.emit('telemetry:stream', { machineId: machine.machineId, telemetry, machine });
        }
      }
    }

    if (io) {
      io.emit('alert:resolved', alert);

      const machines = await Machine.find();
      const openAnomalies = await AnomalyAlert.countDocuments({ status: { $ne: 'RESOLVED' } });
      const criticalAnomalies = await AnomalyAlert.countDocuments({ severity: 'CRITICAL', status: { $ne: 'RESOLVED' } });
      const criticalRulCount = machines.filter(m => m.predictedRulHours <= 200).length;
      const activeWorkOrders = await MaintenanceAction.countDocuments({ status: { $ne: 'COMPLETED' } });
      const avgHealth = Math.round(machines.reduce((acc, m) => acc + (m.healthScore || 0), 0) / machines.length);

      io.emit('overview:update', {
        totalMachines: machines.length,
        avgHealth,
        openAnomalies,
        criticalAnomalies,
        criticalRulCount,
        activeWorkOrders,
        fleetDistribution: {
          healthy: machines.filter(m => m.status === 'HEALTHY').length,
          earlyDegradation: machines.filter(m => m.status === 'EARLY_DEGRADATION').length,
          severeAnomaly: machines.filter(m => m.status === 'SEVERE_ANOMALY' || m.status === 'CRITICAL_SHUTDOWN').length
        }
      });
    }

    res.json({
      success: true,
      data: alert,
      machine: updatedMachine,
      message: `Alert ${alert.alertId} resolved. Machine telemetry and health restored to nominal baseline.`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/alerts', async (req, res) => {
  try {
    const { machineId, severity, failureMode, recommendedAction } = req.body;
    const machine = await Machine.findOne({ machineId });

    const alert = new AnomalyAlert({
      alertId: `ALT-MAN-${Date.now().toString().slice(-5)}`,
      machineId,
      machineName: machine ? machine.name : 'Unknown Equipment',
      line: machine ? machine.line : 'Production Floor',
      severity: severity || 'HIGH',
      failureMode: failureMode || 'Operator Flagged Anomaly',
      anomalyScore: severity === 'CRITICAL' ? 0.95 : 0.72,
      explainability: [
        { feature: 'Manual Inspection Finding', contributionPercent: 100, description: 'Technician logged abnormal noise / temperature signature' }
      ],
      recommendedAction: recommendedAction || 'Conduct diagnostic vibration sweep',
      status: 'OPEN'
    });
    await alert.save();

    if (machine) {
      if (severity === 'CRITICAL') {
        machine.status = 'CRITICAL_SHUTDOWN';
      } else if (machine.status === 'HEALTHY') {
        machine.status = 'SEVERE_ANOMALY';
      }
      await machine.save();
      if (req.app.get('io')) req.app.get('io').emit('machine:update', machine);
    }

    if (req.app.get('io')) req.app.get('io').emit('alert:new', alert);
    res.status(201).json({ success: true, data: alert, machine });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 6. Work Orders
router.get('/work-orders', async (req, res) => {
  try {
    const orders = await MaintenanceAction.find().sort({ scheduledDate: 1 });
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/work-orders', async (req, res) => {
  try {
    const { machineId, title, priority, assignedTeam, scheduledDate, estimatedDowntimeHours, partsRequired, alertId } = req.body;
    const machine = await Machine.findOne({ machineId });

    const wo = new MaintenanceAction({
      workOrderId: `WO-RUL-${Date.now().toString().slice(-5)}`,
      machineId,
      machineName: machine ? machine.name : 'Target Machine',
      title,
      priority: priority || 'HIGH',
      assignedTeam: assignedTeam || 'Condition-Based Maintenance Specialists',
      scheduledDate,
      estimatedDowntimeHours: Number(estimatedDowntimeHours) || 4,
      partsRequired: partsRequired || [
        { partNumber: 'SKF-7214-BEP', name: 'Angular Contact Spindle Bearing Pair', inStock: true }
      ],
      status: 'DISPATCHED'
    });
    await wo.save();

    if (alertId) {
      await AnomalyAlert.findOneAndUpdate(
        { alertId },
        { $set: { status: 'WORK_ORDER_DISPATCHED' } }
      );
    }

    if (req.app.get('io')) req.app.get('io').emit('work-order:new', wo);
    res.status(201).json({ success: true, data: wo });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/work-orders/:id/complete', async (req, res) => {
  try {
    const wo = await MaintenanceAction.findOneAndUpdate(
      { workOrderId: req.params.id },
      { $set: { status: 'COMPLETED' } },
      { new: true }
    );
    if (!wo) return res.status(404).json({ success: false, message: 'Work order not found' });

    const io = req.app.get('io');
    let updatedMachine = null;

    // Restore machine health
    if (wo.machineId) {
      const machine = await Machine.findOne({ machineId: wo.machineId });
      if (machine) {
        machine.healthScore = 98;
        machine.status = 'HEALTHY';
        machine.anomalyScore = 0.05;
        machine.currentVibrationRms = 1.6;
        machine.currentBearingPeakG = 0.75;
        machine.currentTempC = 50.0;
        machine.predictedRulHours = 1650;
        machine.rulConfidenceMin = 1450;
        machine.rulConfidenceMax = 1850;
        machine.lastMaintenanceDate = new Date();
        await machine.save();
        updatedMachine = machine;

        if (io) io.emit('machine:update', machine);
      }
    }

    // Resolve any open alerts for this machine
    await AnomalyAlert.updateMany(
      { machineId: wo.machineId, status: { $ne: 'RESOLVED' } },
      { $set: { status: 'RESOLVED' } }
    );

    if (io) {
      io.emit('work-order:completed', wo);

      const machines = await Machine.find();
      const openAnomalies = await AnomalyAlert.countDocuments({ status: { $ne: 'RESOLVED' } });
      const criticalAnomalies = await AnomalyAlert.countDocuments({ severity: 'CRITICAL', status: { $ne: 'RESOLVED' } });
      const criticalRulCount = machines.filter(m => m.predictedRulHours <= 200).length;
      const activeWorkOrders = await MaintenanceAction.countDocuments({ status: { $ne: 'COMPLETED' } });
      const avgHealth = Math.round(machines.reduce((acc, m) => acc + (m.healthScore || 0), 0) / machines.length);

      io.emit('overview:update', {
        totalMachines: machines.length,
        avgHealth,
        openAnomalies,
        criticalAnomalies,
        criticalRulCount,
        activeWorkOrders,
        fleetDistribution: {
          healthy: machines.filter(m => m.status === 'HEALTHY').length,
          earlyDegradation: machines.filter(m => m.status === 'EARLY_DEGRADATION').length,
          severeAnomaly: machines.filter(m => m.status === 'SEVERE_ANOMALY' || m.status === 'CRITICAL_SHUTDOWN').length
        }
      });
    }

    res.json({ success: true, data: wo, machine: updatedMachine, message: 'Work order completed and equipment restored.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/work-orders/:id', async (req, res) => {
  try {
    if (req.body.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Use PATCH /api/work-orders/:id/complete to resolve equipment alerts and complete a work order.'
      });
    }
    const allowed = ['title', 'priority', 'status', 'assignedTeam', 'scheduledDate', 'estimatedDowntimeHours', 'partsRequired', 'notes'];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    const wo = await MaintenanceAction.findOneAndUpdate(
      { workOrderId: req.params.id },
      { $set: update },
      { new: true, runValidators: true }
    );
    if (!wo) return res.status(404).json({ success: false, message: 'Work order not found' });
    res.json({ success: true, data: wo });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 7. Telemetry Trends
router.get('/telemetry/:machineId', async (req, res) => {
  try {
    const points = await TelemetryReading.find({ machineId: req.params.machineId })
      .sort({ timestamp: -1 })
      .limit(30);
    res.json({ success: true, data: points.reverse() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

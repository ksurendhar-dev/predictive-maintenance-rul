const mongoose = require('mongoose');
const Machine = require('../models/Machine');
const TelemetryReading = require('../models/TelemetryReading');
const AnomalyAlert = require('../models/AnomalyAlert');
const MaintenanceAction = require('../models/MaintenanceAction');

const seedDatabase = async () => {
  try {
    const count = await Machine.countDocuments();
    if (count > 0) {
      console.log('Predictive Maintenance database already seeded.');
      return;
    }

    console.log('Seeding industrial equipment fleet & RUL models...');

    // 1. Machines
    const machines = [
      {
        machineId: 'MCH-CNC-501',
        name: 'Hermle C42U 5-Axis Milling Spindle',
        line: 'Powertrain Machining Cell 3',
        type: 'SPINDLE_MOTOR',
        healthScore: 58,
        anomalyScore: 0.76,
        status: 'SEVERE_ANOMALY',
        predictedRulHours: 138,
        rulConfidenceMin: 110,
        rulConfidenceMax: 172,
        currentVibrationRms: 6.2,
        warningVibrationRms: 4.5,
        currentTempC: 81.4,
        warningTempC: 75.0,
        currentBearingPeakG: 3.8,
        lubeDielectricConstant: 3.2,
        totalOperatingHours: 7240,
        criticality: 'CRITICAL_BOTTLENECK'
      },
      {
        machineId: 'MCH-CMP-202',
        name: 'Atlas Copco ZH 1000 Centrifugal Air Compressor',
        line: 'Utility Infrastructure Bay A',
        type: 'CENTRIFUGAL_COMPRESSOR',
        healthScore: 48,
        anomalyScore: 0.88,
        status: 'SEVERE_ANOMALY',
        predictedRulHours: 86,
        rulConfidenceMin: 65,
        rulConfidenceMax: 115,
        currentVibrationRms: 7.1,
        warningVibrationRms: 4.5,
        currentTempC: 88.0,
        warningTempC: 75.0,
        currentBearingPeakG: 4.5,
        lubeDielectricConstant: 3.8,
        totalOperatingHours: 12400,
        criticality: 'CRITICAL_BOTTLENECK'
      },
      {
        machineId: 'MCH-PMP-102',
        name: 'Rexroth A4VSO High-Pressure Hydraulic Pump',
        line: 'Stamping Press Line 1',
        type: 'HYDRAULIC_PUMP',
        healthScore: 74,
        anomalyScore: 0.42,
        status: 'EARLY_DEGRADATION',
        predictedRulHours: 340,
        rulConfidenceMin: 290,
        rulConfidenceMax: 410,
        currentVibrationRms: 4.1,
        warningVibrationRms: 4.5,
        currentTempC: 69.2,
        warningTempC: 75.0,
        currentBearingPeakG: 1.8,
        lubeDielectricConstant: 2.7,
        totalOperatingHours: 5410,
        criticality: 'HIGH'
      },
      {
        machineId: 'MCH-GBX-401',
        name: 'Flender Helical Gearbox Extruder Drive',
        line: 'Battery Anode Slurry Coating',
        type: 'ROBOTIC_GEARBOX',
        healthScore: 81,
        anomalyScore: 0.28,
        status: 'EARLY_DEGRADATION',
        predictedRulHours: 590,
        rulConfidenceMin: 510,
        rulConfidenceMax: 680,
        currentVibrationRms: 3.4,
        warningVibrationRms: 4.5,
        currentTempC: 64.0,
        warningTempC: 75.0,
        currentBearingPeakG: 1.4,
        lubeDielectricConstant: 2.5,
        totalOperatingHours: 4120,
        criticality: 'HIGH'
      },
      {
        machineId: 'MCH-FAN-304',
        name: 'Howden Centrifugal Exhaust Turbofan',
        line: 'Foundry Emissions Scrubber',
        type: 'CENTRIFUGAL_COMPRESSOR',
        healthScore: 92,
        anomalyScore: 0.12,
        status: 'HEALTHY',
        predictedRulHours: 1420,
        rulConfidenceMin: 1250,
        rulConfidenceMax: 1650,
        currentVibrationRms: 2.1,
        warningVibrationRms: 4.5,
        currentTempC: 52.8,
        warningTempC: 75.0,
        currentBearingPeakG: 0.8,
        lubeDielectricConstant: 2.1,
        totalOperatingHours: 3100,
        criticality: 'MEDIUM'
      },
      {
        machineId: 'MCH-ROB-108',
        name: 'KUKA Titan Heavy Arm J1 Harmonic Drive',
        line: 'Underbody Framing Cell',
        type: 'ROBOTIC_GEARBOX',
        healthScore: 89,
        anomalyScore: 0.16,
        status: 'HEALTHY',
        predictedRulHours: 1100,
        rulConfidenceMin: 950,
        rulConfidenceMax: 1300,
        currentVibrationRms: 2.4,
        warningVibrationRms: 4.5,
        currentTempC: 56.1,
        warningTempC: 75.0,
        currentBearingPeakG: 0.9,
        lubeDielectricConstant: 2.2,
        totalOperatingHours: 6200,
        criticality: 'HIGH'
      }
    ];
    await Machine.insertMany(machines);

    // 2. Anomaly Alerts with Explainability Drivers
    const alerts = [
      {
        alertId: 'ALT-ANO-401',
        machineId: 'MCH-CMP-202',
        machineName: 'Atlas Copco ZH 1000 Centrifugal Air Compressor',
        line: 'Utility Infrastructure Bay A',
        severity: 'CRITICAL',
        failureMode: 'Impeller Thrust Collar Fretting & Stage 2 Surging',
        anomalyScore: 0.88,
        recommendedAction: 'Execute emergency bypass to redundant compressor and inspect thrust bearing assembly within 72h.',
        acknowledged: false,
        status: 'OPEN',
        explainability: [
          { feature: 'Vibration RMS Axial Velocity (7.1 mm/s)', contributionPercent: 44, description: 'Exceeded ISO 10816 Zone D trip threshold (4.5 mm/s).' },
          { feature: 'High-Frequency Bearing Crest Factor (4.5 g)', contributionPercent: 32, description: 'Indicative of sub-surface micro-spalling on thrust collar face.' },
          { feature: 'Thrust Collar Thermal Gradient (+14°C over ambient)', contributionPercent: 24, description: 'Frictional thermal escalation detected.' }
        ]
      },
      {
        alertId: 'ALT-ANO-402',
        machineId: 'MCH-CNC-501',
        machineName: 'Hermle C42U 5-Axis Milling Spindle',
        line: 'Powertrain Machining Cell 3',
        severity: 'HIGH',
        failureMode: 'Hybrid Ceramic Bearing Outer Race Ball Pass Frequency (BPFO)',
        anomalyScore: 0.76,
        recommendedAction: 'Schedule precision spindle cartridge swap during planned weekend changeover window.',
        acknowledged: true,
        status: 'WORK_ORDER_DISPATCHED',
        explainability: [
          { feature: 'Spectral BPFO Peak at 842 Hz', contributionPercent: 52, description: 'Harmonic peak amplitude rising +2.4 dB/week.' },
          { feature: 'Stator Housing Temperature (81.4°C)', contributionPercent: 28, description: 'Above warning threshold 75.0°C during heavy roughing pass.' },
          { feature: 'Lube Oil Dielectric Degradation (3.2)', contributionPercent: 20, description: 'Contamination or micro-particulate metallic shear wear.' }
        ]
      }
    ];
    await AnomalyAlert.insertMany(alerts);

    // 3. Maintenance Work Orders
    const workOrders = [
      {
        workOrderId: 'WO-RUL-1082',
        machineId: 'MCH-CNC-501',
        machineName: 'Hermle C42U 5-Axis Milling Spindle',
        title: 'Precision Spindle Motor Cartridge Overhaul & Bearing Swap',
        priority: 'HIGH',
        assignedTeam: 'Precision Machining Maintenance Crew #2',
        scheduledDate: new Date(Date.now() + 2 * 86400000),
        estimatedDowntimeHours: 6,
        partsRequired: [
          { partNumber: 'HR-7014-CT-DUL', name: 'Angular Contact Spindle Hybrid Bearing Set', inStock: true },
          { partNumber: 'KLUBER-NBU-15', name: 'High-Speed Isoflex Spindle Synthetic Grease', inStock: true }
        ],
        status: 'DISPATCHED',
        notes: 'Dispatched from RUL alert ALT-ANO-402. Work scheduled ahead of 138-hour RUL failure threshold.'
      },
      {
        workOrderId: 'WO-RUL-1080',
        machineId: 'MCH-PMP-102',
        machineName: 'Rexroth A4VSO High-Pressure Hydraulic Pump',
        title: 'Hydraulic Proportional Valve & Piston Swashplate Inspection',
        priority: 'MEDIUM',
        assignedTeam: 'Fluid Power & Hydraulics Specialists',
        scheduledDate: new Date(Date.now() + 5 * 86400000),
        estimatedDowntimeHours: 4,
        partsRequired: [
          { partNumber: 'R9024-SEAL-KIT', name: 'FKM Viton High-Pressure Rotary Seal Kit', inStock: true }
        ],
        status: 'DISPATCHED',
        notes: 'Proactive inspection based on cavitation acoustic emission signature.'
      }
    ];
    await MaintenanceAction.insertMany(workOrders);

    // 4. Telemetry History (generate 25 points for MCH-CNC-501)
    const now = Date.now();
    const readings = [];
    for (let i = 25; i >= 0; i--) {
      const time = new Date(now - i * 5 * 60 * 1000);
      readings.push({
        machineId: 'MCH-CNC-501',
        timestamp: time,
        vibrationRms: +(5.4 + (25 - i) * 0.04 + (Math.random() - 0.5) * 0.3).toFixed(2),
        bearingPeakG: +(3.0 + (25 - i) * 0.03 + (Math.random() - 0.5) * 0.2).toFixed(2),
        tempC: +(76.0 + (25 - i) * 0.2 + (Math.random() - 0.5) * 0.8).toFixed(1),
        acousticEmissionDb: Math.round(68 + (25 - i) * 0.4 + (Math.random() - 0.5) * 2),
        motorCurrentAmps: +(24.5 + (Math.random() - 0.5) * 1.5).toFixed(1),
        rpm: 12000,
        anomalyFlag: i < 10
      });
    }
    await TelemetryReading.insertMany(readings);

    console.log('Predictive Maintenance dataset successfully seeded!');
  } catch (err) {
    console.error('Error seeding predictive maintenance:', err);
  }
};

module.exports = seedDatabase;

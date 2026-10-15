const mongoose = require('mongoose');

const machineSchema = new mongoose.Schema({
  machineId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  line: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['SPINDLE_MOTOR', 'HYDRAULIC_PUMP', 'CENTRIFUGAL_COMPRESSOR', 'ROBOTIC_GEARBOX'],
    default: 'SPINDLE_MOTOR' 
  },
  healthScore: { type: Number, required: true, min: 0, max: 100 },
  anomalyScore: { type: Number, required: true, min: 0, max: 1.0 },
  status: { 
    type: String, 
    enum: ['HEALTHY', 'EARLY_DEGRADATION', 'SEVERE_ANOMALY', 'CRITICAL_SHUTDOWN'],
    default: 'HEALTHY' 
  },
  predictedRulHours: { type: Number, required: true },
  rulConfidenceMin: { type: Number, required: true },
  rulConfidenceMax: { type: Number, required: true },
  currentVibrationRms: { type: Number, required: true },
  warningVibrationRms: { type: Number, default: 4.5 },
  currentTempC: { type: Number, required: true },
  warningTempC: { type: Number, default: 75.0 },
  currentBearingPeakG: { type: Number, required: true },
  lubeDielectricConstant: { type: Number, default: 2.4 },
  totalOperatingHours: { type: Number, default: 5000 },
  criticality: { 
    type: String, 
    enum: ['CRITICAL_BOTTLENECK', 'HIGH', 'MEDIUM'],
    default: 'HIGH' 
  },
  lastMaintenanceDate: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Machine', machineSchema);

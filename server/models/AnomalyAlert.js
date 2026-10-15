const mongoose = require('mongoose');

const explainabilityFeatureSchema = new mongoose.Schema({
  feature: { type: String, required: true },
  contributionPercent: { type: Number, required: true },
  description: { type: String, required: true }
});

const anomalyAlertSchema = new mongoose.Schema({
  alertId: { type: String, required: true, unique: true },
  machineId: { type: String, required: true },
  machineName: { type: String, required: true },
  line: { type: String, required: true },
  severity: { 
    type: String, 
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'HIGH' 
  },
  failureMode: { type: String, required: true },
  anomalyScore: { type: Number, required: true },
  explainability: [explainabilityFeatureSchema],
  recommendedAction: { type: String, required: true },
  acknowledged: { type: Boolean, default: false },
  status: { 
    type: String, 
    enum: ['OPEN', 'WORK_ORDER_DISPATCHED', 'RESOLVED'],
    default: 'OPEN' 
  }
}, { timestamps: true });

module.exports = mongoose.model('AnomalyAlert', anomalyAlertSchema);

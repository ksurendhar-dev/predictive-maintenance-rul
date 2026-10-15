const mongoose = require('mongoose');

const telemetryReadingSchema = new mongoose.Schema({
  machineId: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  vibrationRms: { type: Number, required: true },
  bearingPeakG: { type: Number, required: true },
  tempC: { type: Number, required: true },
  acousticEmissionDb: { type: Number, required: true },
  motorCurrentAmps: { type: Number, required: true },
  rpm: { type: Number, required: true },
  anomalyFlag: { type: Boolean, default: false }
}, { timestamps: true });

telemetryReadingSchema.index({ machineId: 1, timestamp: -1 });

module.exports = mongoose.model('TelemetryReading', telemetryReadingSchema);

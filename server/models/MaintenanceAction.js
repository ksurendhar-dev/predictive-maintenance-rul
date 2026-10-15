const mongoose = require('mongoose');

const partSchema = new mongoose.Schema({
  partNumber: { type: String, required: true },
  name: { type: String, required: true },
  inStock: { type: Boolean, default: true }
});

const maintenanceActionSchema = new mongoose.Schema({
  workOrderId: { type: String, required: true, unique: true },
  machineId: { type: String, required: true },
  machineName: { type: String, required: true },
  title: { type: String, required: true },
  priority: { 
    type: String, 
    enum: ['MEDIUM', 'HIGH', 'URGENT'],
    default: 'HIGH' 
  },
  assignedTeam: { type: String, required: true },
  scheduledDate: { type: Date, required: true },
  estimatedDowntimeHours: { type: Number, required: true },
  partsRequired: [partSchema],
  status: { 
    type: String, 
    enum: ['DISPATCHED', 'IN_PROGRESS', 'COMPLETED'],
    default: 'DISPATCHED' 
  },
  notes: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('MaintenanceAction', maintenanceActionSchema);

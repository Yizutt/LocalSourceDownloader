const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  licenseKey:  { type: String, required: true, unique: true, index: true },
  machineCode: { type: String, required: true },
  validityDays:{ type: Number, required: true },
  isActivated: { type: Boolean, default: false },
  expiryDate:  Date,
  generateTime:{ type: Date, default: Date.now },
  activateTime:Date,
  lastHeartbeat:Date,
  unbindCount: { type: Number, default: 0 },
});

module.exports = mongoose.model('License', schema);

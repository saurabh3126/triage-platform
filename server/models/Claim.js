const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  action:    { type: String, enum: ['submitted', 'reviewed', 'disputed'] },
  status:    String,
  note:      String,
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const claimSchema = new mongoose.Schema({
  text:     { type: String, required: true, trim: true },
  platform: { type: String, enum: ['WhatsApp', 'X', 'Instagram', 'Other'], required: true },
  category: { type: String, enum: ['Politics', 'Health', 'Finance', 'Other'], required: true },

  flags: {
    sensational: { type: Boolean, default: false },
    shouting:    { type: Boolean, default: false },
    unsourced:   { type: Boolean, default: false },
  },

  riskScore:  { type: Number, default: 0, min: 0, max: 100 },
  riskLevel:  { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Low' },
  isHighRisk: { type: Boolean, default: false },

  status:       { type: String, enum: ['Unverified', 'Verified True', 'Verified False', 'Misleading'], default: 'Unverified' },
  reviewerNote: { type: String, default: '' },

  history:     [historySchema],
  submittedAt: { type: Date, default: Date.now },
  updatedAt:   { type: Date, default: Date.now },
});

module.exports = mongoose.model('Claim', claimSchema);
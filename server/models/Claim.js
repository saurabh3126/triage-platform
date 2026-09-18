const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  action:      { type: String, enum: ['submitted', 'reviewed', 'disputed', 'voted', 'auto-resolved'] },
  status:      String,
  note:        String,
  performedBy: { type: String, default: 'Anonymous' },
  timestamp:   { type: Date, default: Date.now },
}, { _id: false });

const voteSchema = new mongoose.Schema({
  ip:      String,
  votedAt: { type: Date, default: Date.now },
}, { _id: false });

const claimSchema = new mongoose.Schema({
  text:     { type: String, required: true, trim: true },
  platform: { type: String, enum: ['WhatsApp', 'X', 'Instagram', 'Reddit', 'Other'], required: true },
  category: { type: String, enum: ['Politics', 'Health', 'Finance', 'Other'], required: true },

  flags: {
    sensational: { type: Boolean, default: false },
    shouting:    { type: Boolean, default: false },
    unsourced:   { type: Boolean, default: false },
  },

  riskScore:  { type: Number, default: 0, min: 0, max: 100 },
  riskLevel:  { type: String, enum: ['Low Risk', 'Medium Risk', 'High Risk', 'Critical Risk', 'Low', 'Medium', 'High', 'Critical'], default: 'Low' },
  isHighRisk: { type: Boolean, default: false },

  // Added 'Disputed' to the enum
  status:       { type: String, enum: ['Unverified', 'Verified True', 'Verified False', 'Misleading', 'Disputed'], default: 'Unverified' },
  reviewerNote: { type: String, default: '' },
  reviewedBy:   { type: String, default: '' },

  community: {
    trueVotes:       [voteSchema],
    falseVotes:      [voteSchema],
    votingDeadline:  { type: Date, default: null },
    resolved:        { type: Boolean, default: false },
  },

  history:     [historySchema],
  submittedAt: { type: Date, default: Date.now },
  updatedAt:   { type: Date, default: Date.now },
});

module.exports = mongoose.model('Claim', claimSchema);
const express  = require('express');
const router   = express.Router();
const Claim    = require('../models/Claim');
const { analyzeFlags, getSimilarity } = require('../middleware/flagAnalyzer');

// POST /api/claims — Submit new claim
router.post('/', async (req, res) => {
  try {
    const { text, platform, category } = req.body;
    if (!text || !platform || !category)
      return res.status(400).json({ error: 'text, platform and category are required' });

    // Duplicate detection
    const all = await Claim.find({}).select('text _id status riskScore riskLevel submittedAt').lean();
    for (const existing of all) {
      if (getSimilarity(text, existing.text) >= 0.4)
        return res.status(200).json({ duplicate: true, existingClaim: existing });
    }

    const { sensational, shouting, unsourced, isHighRisk, riskScore, riskLevel } = analyzeFlags(text);

    const claim = new Claim({
      text, platform, category,
      flags: { sensational, shouting, unsourced },
      isHighRisk, riskScore, riskLevel,
      history: [{ action: 'submitted', status: 'Unverified', note: 'Claim submitted', timestamp: new Date() }],
    });

    await claim.save();
    res.status(201).json({ duplicate: false, claim });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/claims/stats — Dashboard data (MUST be before /:id)
router.get('/stats', async (req, res) => {
  try {
    const [total, byStatus, byCategory, byRiskLevel] = await Promise.all([
      Claim.countDocuments(),
      Claim.aggregate([{ $group: { _id: '$status',    count: { $sum: 1 } } }]),
      Claim.aggregate([{ $group: { _id: '$category',  count: { $sum: 1 } } }]),
      Claim.aggregate([{ $group: { _id: '$riskLevel', count: { $sum: 1 } } }]),
    ]);
    res.json({ total, byStatus, byCategory, byRiskLevel });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/claims/trending — Top 5 risky claims last 24h (MUST be before /:id)
router.get('/trending', async (req, res) => {
  try {
    const since  = new Date(Date.now() - 86400000);
    const claims = await Claim.find({ submittedAt: { $gte: since } })
      .sort({ riskScore: -1 })
      .limit(5)
      .select('text riskScore riskLevel status submittedAt')
      .lean();
    res.json(claims);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/claims — Public feed
router.get('/', async (req, res) => {
  try {
    const { category, status, sort, search } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (status)   filter.status   = status;
    if (search)   filter.text     = { $regex: search, $options: 'i' };

    const sortObj = sort === 'recency' ? { submittedAt: -1 } : { riskScore: -1, submittedAt: -1 };
    const claims  = await Claim.find(filter).sort(sortObj).lean();
    res.json(claims);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/claims/:id — Claim detail
router.get('/:id', async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id);
    if (!claim) return res.status(404).json({ error: 'Claim not found' });
    res.json(claim);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/claims/:id/review — Review a claim
router.patch('/:id/review', async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id);
    if (!claim) return res.status(404).json({ error: 'Claim not found' });
    if (claim.status !== 'Unverified')
      return res.status(403).json({ error: 'This claim has already been reviewed.' });

    const { status, reviewerNote } = req.body;
    const valid = ['Verified True', 'Verified False', 'Misleading'];
    if (!valid.includes(status))
      return res.status(400).json({ error: 'Invalid status' });

    claim.status       = status;
    claim.reviewerNote = reviewerNote;
    claim.updatedAt    = new Date();
    claim.history.push({ action: 'reviewed', status, note: reviewerNote, timestamp: new Date() });

    await claim.save();
    res.json(claim);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/claims/:id/dispute — Dispute a verdict
router.patch('/:id/dispute', async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id);
    if (!claim) return res.status(404).json({ error: 'Claim not found' });
    if (claim.status === 'Unverified')
      return res.status(400).json({ error: 'Cannot dispute an unverified claim.' });

    const prevStatus   = claim.status;
    claim.status       = 'Unverified';
    claim.reviewerNote = '';
    claim.updatedAt    = new Date();
    claim.history.push({
      action: 'disputed',
      status: 'Unverified',
      note: `Previously marked as "${prevStatus}". Under dispute.`,
      timestamp: new Date(),
    });

    await claim.save();
    res.json(claim);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
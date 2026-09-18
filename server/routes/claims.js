const express  = require('express');
const router   = express.Router();
const Claim    = require('../models/Claim');
const { analyzeFlags, getSimilarity } = require('../middleware/flagAnalyzer');
const { protect, adminOnly, optionalAuth } = require('../middleware/auth');

// POST /api/claims — Submit new claim (with optional image)
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { text, platform, category, imageUrl } = req.body;
    if (!text || !platform || !category)
      return res.status(400).json({ error: 'text, platform and category are required' });

    // Duplicate detection
    const all = await Claim.find({}).select('text _id status riskScore riskLevel submittedAt').lean();
    for (const existing of all) {
      if (getSimilarity(text, existing.text) >= 0.4)
        return res.status(200).json({ duplicate: true, existingClaim: existing });
    }

    const { sensational, shouting, unsourced, isHighRisk, riskScore, riskLevel } = analyzeFlags(text);
    const submittedBy = req.user ? `@${req.user.username}` : 'Anonymous';

    const claim = new Claim({
      text,
      platform,
      category,
      imageUrl: imageUrl || '', // Stored screenshot / image
      flags: { sensational, shouting, unsourced },
      isHighRisk,
      riskScore,
      riskLevel,
      history: [{
        action:      'submitted',
        status:      'Unverified',
        note:        'Claim submitted',
        performedBy: submittedBy,
        timestamp:   new Date(),
      }],
    });

    await claim.save();
    res.status(201).json({ duplicate: false, claim });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/claims/stats — Dashboard data (BEFORE /:id)
router.get('/stats', async (req, res) => {
  try {
    const [total, byStatus, byCategory, byRiskLevel, byPlatform, recent] = await Promise.all([
      Claim.countDocuments(),
      Claim.aggregate([{ $group: { _id: '$status',    count: { $sum: 1 } } }]),
      Claim.aggregate([{ $group: { _id: '$category',  count: { $sum: 1 } } }]),
      Claim.aggregate([{ $group: { _id: '$riskLevel', count: { $sum: 1 } } }]),
      Claim.aggregate([{ $group: { _id: '$platform',  count: { $sum: 1 } } }]),
      // Last 5 history actions across all claims
      Claim.aggregate([
        { $unwind: '$history' },
        { $sort:   { 'history.timestamp': -1 } },
        { $limit:  5 },
        { $project: {
          text:            { $substr: ['$text', 0, 60] },
          action:          '$history.action',
          status:          '$history.status',
          performedBy:     '$history.performedBy',
          timestamp:       '$history.timestamp',
          category:        1,
          riskLevel:       1,
        }},
      ]),
    ]);
    res.json({ total, byStatus, byCategory, byRiskLevel, byPlatform, recent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/claims/trending — Top 5 risky claims last 24h (BEFORE /:id)
router.get('/trending', async (req, res) => {
  try {
    const since  = new Date(Date.now() - 86400000);
    const claims = await Claim.find({ submittedAt: { $gte: since } })
      .sort({ riskScore: -1 })
      .limit(5)
      .select('text riskScore riskLevel status submittedAt imageUrl')
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

    const sortObj = sort === 'recency'
      ? { submittedAt: -1 }
      : { riskScore: -1, submittedAt: -1 };

    const claims = await Claim.find(filter).sort(sortObj).lean();
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

// PATCH /api/claims/:id/review — Admin only
router.patch('/:id/review', protect, adminOnly, async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id);
    if (!claim) return res.status(404).json({ error: 'Claim not found' });
    if (claim.status !== 'Unverified')
      return res.status(403).json({ error: 'This claim has already been reviewed.' });

    const { status, reviewerNote } = req.body;
    const valid = ['Verified True', 'Verified False', 'Misleading'];
    if (!valid.includes(status))
      return res.status(400).json({ error: 'Invalid status' });

    const reviewerName    = `@${req.user.username}`;
    claim.status          = status;
    claim.reviewerNote    = reviewerNote;
    claim.reviewedBy      = reviewerName;
    claim.updatedAt       = new Date();
    claim.history.push({
      action:      'reviewed',
      status,
      note:        reviewerNote,
      performedBy: reviewerName,
      timestamp:   new Date(),
    });

    await claim.save();
    res.json(claim);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/claims/:id/dispute — Optional auth
router.patch('/:id/dispute', optionalAuth, async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id);
    if (!claim) return res.status(404).json({ error: 'Claim not found' });
    if (claim.status === 'Unverified')
      return res.status(400).json({ error: 'Cannot dispute an unverified claim.' });

    const prevStatus      = claim.status;
    const disputedBy      = req.user ? `@${req.user.username}` : 'Anonymous';
    claim.status          = 'Unverified';
    claim.reviewerNote    = '';
    claim.reviewedBy      = '';
    claim.updatedAt       = new Date();
    claim.history.push({
      action:      'disputed',
      status:      'Unverified',
      note:        `Previously marked as "${prevStatus}". Under dispute.`,
      performedBy: disputedBy,
      timestamp:   new Date(),
    });

    await claim.save();
    res.json(claim);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
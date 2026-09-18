const express  = require('express');
const router   = express.Router();
const axios    = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Claim    = require('../models/Claim');
const { analyzeFlags, getSimilarity } = require('../middleware/flagAnalyzer');
const { protect, adminOnly, optionalAuth } = require('../middleware/auth');

// POST /api/claims/extract-link
router.post('/extract-link', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    if (url.includes('reddit.com')) {
      try {
        const cleanUrl = url.split('?')[0].replace(/\/+$/, '') + '.json';
        const redditRes = await axios.get(cleanUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
          timeout: 8000,
        });
        const postData = redditRes.data?.[0]?.data?.children?.[0]?.data;
        if (postData) {
          const title    = postData.title || '';
          const selftext = postData.selftext || '';
          const imageUrl =
            postData.url_overridden_by_dest &&
            /\.(jpg|png|jpeg|webp)$/i.test(postData.url_overridden_by_dest)
              ? postData.url_overridden_by_dest : '';
          const combined = [title, selftext].filter(Boolean).join('\n\n');
          return res.json({ text: combined, imageUrl, platform: 'Other' });
        }
      } catch {}
    }

    const htmlRes = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
      timeout: 8000,
    });
    const html = htmlRes.data;

    const getMeta = (prop) => {
      const m =
        html.match(new RegExp(`<meta[^>]+(?:property|name)=["'](?:og:|twitter:)?${prop}["'][^>]+content=["']([^"']+)["']`, 'i')) ||
        html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:|twitter:)?${prop}["']`, 'i'));
      return m ? m[1] : '';
    };

    const title    = getMeta('title') || (html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || '');
    const desc     = getMeta('description') || '';
    const imageUrl = getMeta('image') || '';

    const text = [title, desc].filter(Boolean).join('\n\n');
    res.json({
      text: text || 'Could not extract clean text from this link.',
      imageUrl,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to extract content: ' + err.message });
  }
});

// POST /api/claims/gemini-analyze
router.post('/gemini-analyze', async (req, res) => {
  try {
    const { text, imageBase64 } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is missing on the server.' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const safeText = (text || '')
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, ' ')
      .slice(0, 3000);

    const prompt = `
      You are an expert Misinformation Triage AI. Analyze this viral social media claim.
      1. If an image is provided, perform OCR and extract the text exactly.
      2. Combine any extracted text with this user input: "${safeText}"
      3. Calculate a misinformation Risk Score from 0 to 100 based on the combined text.
      4. Determine if it triggers these flags (true/false): sensationalism, ALL-CAPS shouting, missing sources.
      5. Categorize the claim into exactly one of these: "Politics", "Health", "Finance", or "Other".
      6. Guess the source platform from visual UI or text clues (must be exactly "WhatsApp", "X", "Instagram", "Reddit", or "Other").
      
      Respond ONLY in raw JSON format (no markdown tags, no backticks). Structure it exactly like this:
      {
        "extractedText": "The combined text from the image and input...",
        "riskScore": 85,
        "sensational": true,
        "shouting": false,
        "unsourced": true,
        "reasoning": "A 1-sentence explanation of why it received this risk score.",
        "category": "Politics",
        "platform": "X"
      }
    `;

    let result;
    if (imageBase64) {
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const mimeType   = imageBase64.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/jpeg';
      result = await model.generateContent([prompt, { inlineData: { data: base64Data, mimeType } }]);
    } else {
      result = await model.generateContent(prompt);
    }

    const responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    res.json(JSON.parse(responseText));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gemini AI Analysis failed: ' + err.message });
  }
});

// POST /api/claims — Submit new claim
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { text, platform, category, imageUrl } = req.body;
    if (!text || !platform || !category)
      return res.status(400).json({ error: 'text, platform and category are required' });

    const all = await Claim.find({}).select('text _id status riskScore riskLevel submittedAt').lean();
    for (const existing of all) {
      if (getSimilarity(text, existing.text) >= 0.4)
        return res.status(200).json({ duplicate: true, existingClaim: existing });
    }

    const { sensational, shouting, unsourced, isHighRisk, riskScore, riskLevel } = analyzeFlags(text);
    const submittedBy = req.user ? `@${req.user.username}` : 'Anonymous';

    const claim = new Claim({
      text, platform, category, imageUrl: imageUrl || '',
      flags: { sensational, shouting, unsourced },
      isHighRisk, riskScore, riskLevel,
      history: [{
        action: 'submitted', status: 'Unverified', note: 'Claim submitted',
        performedBy: submittedBy, timestamp: new Date(),
      }],
    });

    await claim.save();
    res.status(201).json({ duplicate: false, claim });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/claims
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

// GET /api/claims/stats  ← MUST be before /:id so Express doesn't treat "stats" as an id param
router.get('/stats', async (req, res) => {
  try {
    const [total, byStatus, byCategory, byRiskLevel, byPlatform, recent] = await Promise.all([
      Claim.countDocuments(),
      Claim.aggregate([{ $group: { _id: '$status',    count: { $sum: 1 } } }]),
      Claim.aggregate([{ $group: { _id: '$category',  count: { $sum: 1 } } }]),
      Claim.aggregate([{ $group: { _id: '$riskLevel', count: { $sum: 1 } } }]),
      Claim.aggregate([{ $group: { _id: '$platform',  count: { $sum: 1 } } }]),
      Claim.aggregate([
        { $unwind: '$history' },
        { $sort: { 'history.timestamp': -1 } },
        { $limit: 5 },
        { $project: {
          text: { $substrCP: ['$text', 0, 60] },   // $substrCP = code points (safe for emoji/unicode)
          action: '$history.action',
          status: '$history.status',
          performedBy: '$history.performedBy',
          timestamp: '$history.timestamp',
          category: 1,
          riskLevel: 1,
        }},
      ]),
    ]);
    res.json({ total, byStatus, byCategory, byRiskLevel, byPlatform, recent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/claims/trending  ← also before /:id
router.get('/trending', async (req, res) => {
  try {
    const since  = new Date(Date.now() - 86400000);
    const claims = await Claim.find({ submittedAt: { $gte: since } })
      .sort({ riskScore: -1 }).limit(5)
      .select('text riskScore riskLevel status submittedAt imageUrl').lean();
    res.json(claims);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/claims/:id  ← catch-all LAST
router.get('/:id', async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id);
    if (!claim) return res.status(404).json({ error: 'Claim not found' });
    res.json(claim);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/claims/:id/review (Open to anyone)
router.patch('/:id/review', async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id);
    if (!claim) return res.status(404).json({ error: 'Claim not found' });
    if (claim.status !== 'Unverified') return res.status(400).json({ error: 'Already reviewed.' });

    const { status, reviewerNote } = req.body;
    claim.status       = status;
    claim.reviewerNote = reviewerNote;
    claim.reviewedBy   = 'Community Reviewer';
    claim.updatedAt    = new Date();
    claim.history.push({ action: 'reviewed', status, note: reviewerNote, performedBy: 'Anonymous', timestamp: new Date() });

    await claim.save();
    res.json(claim);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/claims/:id/dispute (Triggers 12h Voting)
router.patch('/:id/dispute', async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id);
    if (!claim) return res.status(404).json({ error: 'Claim not found' });
    if (claim.status === 'Unverified' || claim.status === 'Disputed') 
      return res.status(400).json({ error: 'Cannot dispute this claim right now.' });

    const prevStatus = claim.status;
    claim.status = 'Disputed';
    claim.community.votingDeadline = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours from now
    claim.community.resolved = false;
    claim.community.trueVotes = [];
    claim.community.falseVotes = [];
    
    claim.updatedAt = new Date();
    claim.history.push({ action: 'disputed', status: 'Disputed', note: `Disputed the "${prevStatus}" verdict. Sent to community vote.`, performedBy: 'Anonymous', timestamp: new Date() });

    await claim.save();
    res.json(claim);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/claims/:id/vote — Community voting
router.post('/:id/vote', async (req, res) => {
  try {
    const { vote } = req.body;
    if (!['true', 'false'].includes(vote)) return res.status(400).json({ error: 'Invalid vote' });

    const ip = (req.headers['x-forwarded-for'] || req.ip || 'unknown').split(',')[0].trim();
    const claim = await Claim.findById(req.params.id);
    if (!claim) return res.status(404).json({ error: 'Claim not found' });
    
    if (claim.status !== 'Disputed' || claim.community?.resolved) 
      return res.status(400).json({ error: 'Voting is not active for this claim.' });

    const alreadyTrue  = claim.community.trueVotes.some(v => v.ip === ip);
    const alreadyFalse = claim.community.falseVotes.some(v => v.ip === ip);
    if (alreadyTrue || alreadyFalse)
      return res.status(400).json({ error: 'You already voted on this claim.' });

    if (vote === 'true')  claim.community.trueVotes.push({ ip });
    if (vote === 'false') claim.community.falseVotes.push({ ip });

    claim.history.push({
      action: 'voted', status: claim.status, note: `Vote: ${vote === 'true' ? 'True ✅' : 'False ❌'}`, performedBy: 'Community', timestamp: new Date()
    });

    const trueCount  = claim.community.trueVotes.length;
    const falseCount = claim.community.falseVotes.length;
    const totalVotes = trueCount + falseCount;
    const deadline   = claim.community.votingDeadline;

    // Check 12h deadline auto-resolve
    if (deadline && new Date() >= deadline && totalVotes >= 3 && !claim.community.resolved) {
      let newStatus = 'Unverified';
      if (trueCount  / totalVotes >= 0.6) newStatus = 'Verified True';
      if (falseCount / totalVotes >= 0.6) newStatus = 'Verified False';
      
      claim.status = newStatus;
      claim.reviewerNote = `Auto-resolved after 12h: ${trueCount} True / ${falseCount} False`;
      claim.reviewedBy   = 'Community Vote';
      claim.history.push({ action: 'auto-resolved', status: newStatus, note: claim.reviewerNote, performedBy: 'System', timestamp: new Date() });
      claim.community.resolved = true;
    }

    claim.updatedAt = new Date();
    await claim.save();
    res.json(claim);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/claims/:id/resolve — Force resolve after 12h deadline
router.post('/:id/resolve', async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id);
    if (!claim || claim.status !== 'Disputed') return res.status(404).json({ error: 'Not eligible' });

    const trueCount  = claim.community.trueVotes.length;
    const falseCount = claim.community.falseVotes.length;
    const totalVotes = trueCount + falseCount;
    const deadline   = claim.community.votingDeadline;

    if (!deadline || new Date() < deadline) return res.status(400).json({ error: '12h period not over.' });

    if (totalVotes >= 3) {
      let newStatus = 'Unverified';
      if (trueCount  / totalVotes >= 0.6) newStatus = 'Verified True';
      if (falseCount / totalVotes >= 0.6) newStatus = 'Verified False';
      claim.status = newStatus;
      claim.reviewerNote = `Auto-resolved after 12h: ${trueCount} True / ${falseCount} False`;
      claim.reviewedBy   = 'Community Vote';
      claim.history.push({ action: 'auto-resolved', status: newStatus, note: claim.reviewerNote, performedBy: 'System', timestamp: new Date() });
    }
    claim.community.resolved = true;
    claim.updatedAt = new Date();
    await claim.save();
    res.json(claim);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
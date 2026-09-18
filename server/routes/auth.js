const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const { protect, JWT_SECRET } = require('../middleware/auth');

// Generate JWT token
const generateToken = (id) =>
  jwt.sign({ id }, JWT_SECRET, { expiresIn: '7d' });

// ─── POST /api/auth/register ──────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password)
      return res.status(400).json({ error: 'All fields are required' });

    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists)
      return res.status(400).json({ error: 'Username or email already taken' });

    // Only allow admin role if secret key is provided
    const assignedRole =
      role === 'admin' && req.body.adminKey === process.env.ADMIN_KEY
        ? 'admin'
        : 'user';

    const user = await User.create({ username, email, password, role: assignedRole });

    res.status(201).json({
      _id:      user._id,
      username: user.username,
      email:    user.email,
      role:     user.role,
      token:    generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required' });

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ error: 'Invalid email or password' });

    res.json({
      _id:      user._id,
      username: user.username,
      email:    user.email,
      role:     user.role,
      token:    generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', protect, (req, res) => {
  res.json({
    _id:      req.user._id,
    username: req.user.username,
    email:    req.user.email,
    role:     req.user.role,
  });
});

module.exports = router;
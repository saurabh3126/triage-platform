require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const claimsRouter = require('./routes/claims');

const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB error:', err));

app.use('/api/claims', claimsRouter);
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
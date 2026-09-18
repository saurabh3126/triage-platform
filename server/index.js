require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const mongoose  = require('mongoose');
const claimsRouter = require('./routes/claims');
const authRouter   = require('./routes/auth');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB error:', err));

// Root landing message
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'FactTriage Misinformation Triage API is running!',
    endpoints: {
      health: '/api/health',
      claims: '/api/claims',
      stats: '/api/claims/stats',
      trending: '/api/claims/trending',
    },
  });
});

// Routes
app.use('/api/auth',   authRouter);
app.use('/api/claims', claimsRouter);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
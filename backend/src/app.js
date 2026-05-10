const express = require('express');
const cors = require('cors');
const bookRoutes = require('./routes/bookRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const loanRequestRoutes = require('./routes/loanRequestRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api', bookRoutes);
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api/loan-requests', loanRequestRoutes);

module.exports = app;

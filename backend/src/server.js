require('dotenv').config();
const express = require('express');
const cors = require('cors');
const settlementRoutes = require('./routes/settlement.routes');
const expenseGroupRoutes = require('./routes/expenseGroup.routes');
const userRoutes = require('./routes/user.routes');
const expenseRoutes = require('./routes/expense.routes');
const authRoutes = require('./routes/auth.routes');
const groupMembershipsRoutes = require('./routes/groupMemberships.routes');


// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the frontend directory
app.use(express.static('../frontend'));
// Serve index.html for any unmatched frontend routes
app.get(['/', '/index.html', '/dashboard.html', '/groups.html', '/expenses.html', '/settlements.html', '/profile.html', '/login.html', '/signup.html'], (req, res) => {
    res.sendFile(req.path === '/' ? 'index.html' : req.path, { root: '../frontend' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/settlements', settlementRoutes);
app.use('/api/expense_groups', expenseGroupRoutes);
app.use('/api/users', userRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/memberships', groupMembershipsRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'active',
    message: 'EvenUp Payments API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ 
    status: 'error',
    message: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  const statusCode = err.statusCode || 500;
  const response = {
    status: 'error',
    message: err.message || 'Internal Server Error',
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
});

// Start the server
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

module.exports = app;

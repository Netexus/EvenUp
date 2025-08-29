const express = require('express');
const router = express.Router();


const userController = require('../controllers/user.controller');
const { requireAuth } = require('../middleware/jwt');

// New user
router.post('/', (req, res) => {
  userController.createUser(req, res);
});

// Get current user's profile (protected)
router.get('/me', requireAuth, (req, res) => {
  userController.getProfile(req, res);
});

// Get all users
router.get('/', (req, res) => {
  userController.getUsers(req, res);
});

// Search users by username or email
router.get('/search', (req, res) => {
  userController.searchUsers(req, res);
});

// Get user by ID
router.get('/:id', (req, res) => {
  userController.getUserById(req, res);
});

// Get profile information
router.get('/profile/:id', (req, res) => {
  userController.getProfile(req, res);
});

// Update user by ID
router.put('/:id', (req, res) => {
  userController.updateUser(req, res);
});

// Delete user by ID
router.delete('/:id', (req, res) => {
  res.send(`User deleted with ID ${req.params.id}`);
    userController.deleteUser(req, res);
});

// Export routes
module.exports = router;
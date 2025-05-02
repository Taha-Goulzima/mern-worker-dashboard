const express = require('express');
const router = express.Router();
const { register, login, getUsers, updateUser, deleteUser, uploadProfilePicture, getCurrentUser } = require('../controllers/userController');
const { auth, adminAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes
router.post('/register', upload.single('profilePicture'), register);
router.post('/login', login);

// Protected routes
router.get('/me', auth, getCurrentUser);
router.get('/users', auth, adminAuth, getUsers);
router.patch('/users/:id', auth, adminAuth, upload.single('profilePicture'), updateUser);
router.delete('/users/:id', auth, adminAuth, deleteUser);

// Profile picture upload route
router.post('/profile-picture', auth, upload.single('profilePicture'), uploadProfilePicture);

module.exports = router;  
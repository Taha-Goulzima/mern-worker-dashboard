const User = require('../models/User');
const jwt = require('jsonwebtoken');
const upload = require('../middleware/upload');
const fs = require('fs');
const path = require('path');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '24h' });
};

const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const user = new User({ 
      name, 
      email, 
      password, 
      role,
      profilePicture: req.file ? req.file.filename : 'default-profile.png'
    });
    await user.save();

    const token = generateToken(user._id);
    res.status(201).json({ user, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user._id);
    res.json({ user, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    // If user is admin, return all users, otherwise return only workers
    const users = req.user.role === 'admin' 
      ? await User.find()
      : await User.find({ role: 'worker' });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    
    // Handle profile picture upload
    if (req.file) {
      // Delete old profile picture if it exists and is not the default
      const user = await User.findById(id);
      if (user && user.profilePicture && user.profilePicture !== 'default-profile.png') {
        const oldImagePath = path.join(__dirname, '..', 'uploads', user.profilePicture);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      updates.profilePicture = req.file.filename;
    }
    
    const updatedUser = await User.findByIdAndUpdate(id, updates, { new: true });
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete old profile picture if it exists and is not the default
    if (user.profilePicture && user.profilePicture !== 'default-profile.png') {
      const oldImagePath = path.join(__dirname, '..', 'uploads', user.profilePicture);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // Update user's profile picture
    user.profilePicture = req.file.filename;
    await user.save();

    res.json({
      message: 'Profile picture uploaded successfully',
      profilePicture: user.profilePicture
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error uploading profile picture' });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  register,
  login,
  getUsers,
  updateUser,
  deleteUser,
  uploadProfilePicture,
  getCurrentUser
}; 
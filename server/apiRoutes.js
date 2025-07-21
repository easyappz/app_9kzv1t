const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// JWT Secret Key (hardcoded since .env is not used)
const JWT_SECRET = 'mysecretkey123';

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// User Schema
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  points: { type: Number, default: 0 },
  gender: { type: String, enum: ['male', 'female', 'other'], default: 'other' },
  age: { type: Number, default: 0 },
  resetToken: { type: String, default: null }
});

const User = mongoose.model('User', UserSchema);

// Photo Schema
const PhotoSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  filePath: { type: String, required: true },
  isActive: { type: Boolean, default: false },
  ratings: [{
    raterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    score: { type: Number, required: true },
    raterGender: { type: String },
    raterAge: { type: Number }
  }]
});

const Photo = mongoose.model('Photo', PhotoSchema);

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token missing' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token', details: error.message });
  }
};

// Registration Endpoint
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    res.status(201).json({ token, user: { id: user._id, email: user.email, points: user.points } });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

// Login Endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: user._id, email: user.email, points: user.points } });
  } catch (error) {
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

// Password Reset Request Endpoint
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const resetToken = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '15m' });
    user.resetToken = resetToken;
    await user.save();

    res.json({ message: 'Password reset token generated', resetToken });
  } catch (error) {
    res.status(500).json({ error: 'Password reset failed', details: error.message });
  }
});

// Password Reset Endpoint
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) {
      return res.status(400).json({ error: 'Reset token and new password are required' });
    }

    const decoded = jwt.verify(resetToken, JWT_SECRET);
    const user = await User.findOne({ _id: decoded.id, resetToken });
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetToken = null;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ error: 'Password reset failed', details: error.message });
  }
});

// Update User Profile (Gender and Age)
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { gender, age } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (gender) user.gender = gender;
    if (age) user.age = age;
    await user.save();

    res.json({ message: 'Profile updated', user: { id: user._id, email: user.email, gender: user.gender, age: user.age, points: user.points } });
  } catch (error) {
    res.status(500).json({ error: 'Profile update failed', details: error.message });
  }
});

// Upload Photo Endpoint
router.post('/upload-photo', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const photo = new Photo({
      userId: req.user.id,
      filePath: req.file.path
    });
    await photo.save();

    res.status(201).json({ message: 'Photo uploaded', photoId: photo._id, filePath: photo.filePath });
  } catch (error) {
    res.status(500).json({ error: 'Photo upload failed', details: error.message });
  }
});

// Toggle Photo Active Status (Add/Remove from Evaluation List)
router.put('/photo/:id/toggle-active', authenticateToken, async (req, res) => {
  try {
    const photo = await Photo.findOne({ _id: req.params.id, userId: req.user.id });
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found or not owned by user' });
    }

    const user = await User.findById(req.user.id);
    if (!photo.isActive && user.points < 1) {
      return res.status(400).json({ error: 'Not enough points to activate photo' });
    }

    photo.isActive = !photo.isActive;
    await photo.save();

    if (photo.isActive) {
      user.points -= 1;
      await user.save();
    }

    res.json({ message: photo.isActive ? 'Photo activated for evaluation' : 'Photo deactivated', photoId: photo._id, isActive: photo.isActive, points: user.points });
  } catch (error) {
    res.status(500).json({ error: 'Toggle photo status failed', details: error.message });
  }
});

// Delete Photo Endpoint
router.delete('/photo/:id', authenticateToken, async (req, res) => {
  try {
    const photo = await Photo.findOne({ _id: req.params.id, userId: req.user.id });
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found or not owned by user' });
    }

    const user = await User.findById(req.user.id);
    if (photo.isActive && user.points < 1) {
      return res.status(400).json({ error: 'Not enough points to delete an active photo' });
    }

    if (photo.isActive) {
      user.points -= 1;
      await user.save();
    }

    await Photo.deleteOne({ _id: req.params.id });
    res.json({ message: 'Photo deleted', photoId: req.params.id, points: user.points });
  } catch (error) {
    res.status(500).json({ error: 'Photo deletion failed', details: error.message });
  }
});

// Get Photos for Evaluation (with Filters)
router.get('/photos-for-evaluation', authenticateToken, async (req, res) => {
  try {
    const { gender, minAge, maxAge } = req.query;
    let query = { isActive: true, userId: { $ne: req.user.id } };

    if (gender) {
      query['userId'] = { $in: await User.find({ gender }).select('_id') };
    }
    if (minAge || maxAge) {
      const ageQuery = {};
      if (minAge) ageQuery.$gte = Number(minAge);
      if (maxAge) ageQuery.$lte = Number(maxAge);
      query['userId'] = { $in: await User.find({ age: ageQuery }).select('_id') };
    }

    const photos = await Photo.find(query).populate('userId', 'email gender age');
    res.json(photos);
  } catch (error) {
    res.status(500).json({ error: 'Fetching photos failed', details: error.message });
  }
});

// Rate Photo Endpoint
router.post('/rate-photo/:id', authenticateToken, async (req, res) => {
  try {
    const { score } = req.body;
    if (!score || score < 1 || score > 5) {
      return res.status(400).json({ error: 'Invalid score. Must be between 1 and 5' });
    }

    const photo = await Photo.findOne({ _id: req.params.id, isActive: true, userId: { $ne: req.user.id } });
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found or not available for rating' });
    }

    const rater = await User.findById(req.user.id);
    const photoOwner = await User.findById(photo.userId);

    // Check if user already rated this photo
    if (photo.ratings.some(rating => rating.raterId.toString() === req.user.id)) {
      return res.status(400).json({ error: 'You have already rated this photo' });
    }

    // Add rating
    photo.ratings.push({
      raterId: req.user.id,
      score,
      raterGender: rater.gender,
      raterAge: rater.age
    });
    await photo.save();

    // Update points: rater gains 1, owner loses 1
    rater.points += 1;
    photoOwner.points -= 1;
    await rater.save();
    await photoOwner.save();

    res.json({ message: 'Photo rated', photoId: photo._id, score, raterPoints: rater.points });
  } catch (error) {
    res.status(500).json({ error: 'Rating photo failed', details: error.message });
  }
});

// Get User Photos with Statistics
router.get('/my-photos', authenticateToken, async (req, res) => {
  try {
    const photos = await Photo.find({ userId: req.user.id });
    const photosWithStats = photos.map(photo => {
      const ratings = photo.ratings;
      const totalRatings = ratings.length;
      const averageScore = totalRatings > 0 ? ratings.reduce((sum, r) => sum + r.score, 0) / totalRatings : 0;
      const genderStats = {};
      const ageStats = { 'under20': 0, '20-30': 0, '30-40': 0, 'over40': 0 };

      ratings.forEach(r => {
        genderStats[r.raterGender] = (genderStats[r.raterGender] || 0) + 1;
        if (r.raterAge < 20) ageStats['under20']++;
        else if (r.raterAge < 30) ageStats['20-30']++;
        else if (r.raterAge < 40) ageStats['30-40']++;
        else ageStats['over40']++;
      });

      return {
        id: photo._id,
        filePath: photo.filePath,
        isActive: photo.isActive,
        totalRatings,
        averageScore,
        genderStats,
        ageStats
      };
    });

    res.json(photosWithStats);
  } catch (error) {
    res.status(500).json({ error: 'Fetching user photos failed', details: error.message });
  }
});

// Get User Points
router.get('/points', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ points: user.points });
  } catch (error) {
    res.status(500).json({ error: 'Fetching points failed', details: error.message });
  }
});

module.exports = router;

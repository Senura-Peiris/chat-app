const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Adjust path to your User model

// Search users by username or email
router.get('/search', async (req, res) => {
  const query = req.query.query || '';
  try {
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } }
      ]
    }).select('-password'); // exclude password field

    res.json({ users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

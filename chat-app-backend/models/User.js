const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: String,
  username: String,
  password: String,
  profileImage: String
});

module.exports = mongoose.model('User', userSchema);

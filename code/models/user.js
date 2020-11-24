const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

const { hashPassword } = require('../utils/password');

// TODO: add validation
const userSchema = new mongoose.Schema({
  email: String,
  password: {
    type: String,
    default: nanoid,
  },
});

userSchema.pre('save', function (next) {
  this.password = hashPassword(this.password);

  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;

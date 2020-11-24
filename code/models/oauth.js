const mongoose = require('mongoose');

// TODO: add validation
const oAuthSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  type: String,
  oauthId: String,
});

const OAuth = mongoose.model('OAuth', oAuthSchema, 'OAuth');

module.exports = OAuth;

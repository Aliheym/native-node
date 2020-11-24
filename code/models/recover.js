const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

// TODO: add validation
const recoverSchema = new mongoose.Schema({
  uuid: {
    type: String,
    default: () => nanoid(),
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  expiredAt: {
    type: Date,
    default: () => Date.now() + 60 * 1000 * 60,
  },
});

recoverSchema.virtual('user').get(function () {
  return this.user_id;
});

const Recover = mongoose.model('Recover', recoverSchema);

module.exports = Recover;

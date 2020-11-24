const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

// TODO: add validation
const invitationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  uuid: {
    type: String,
    default: nanoid,
  },
  expiredAt: {
    type: Date,
    default: () => Date.now() + 1000 * 60 * 60,
  },
});

invitationSchema.virtual('user').get(function () {
  return this.user_id;
});

const Invitation = mongoose.model('Invitation', invitationSchema);

module.exports = Invitation;

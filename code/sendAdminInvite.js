const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/user');
const Invitation = require('./models/invitation');

const email = require('./utils/email');
const { HttpError } = require('./utils/error');

const getInvitationText = (url) => `
  Hi! You received an invitation from Study Board project.

  Click here: ${url}

  If you don't want - just ignore this message!
`;

(async () => {
  const connectionURL = `mongodb://${process.env.MONGO_HOST}:27017/${process.env.MONGO_DB_NAME}`;

  try {
    connection = await mongoose.connect(connectionURL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    });
  } catch (err) {
    process.stderr.write(err.message);
    process.exit(1);
  }

  const toEmail = process.env.ADMIN_EMAIL;

  let user = await User.findOne({ email: toEmail });
  if (user) {
    throw new HttpError('An account with this email already exists.', 400);
  }

  user = new User({
    email: toEmail,
  });

  const invitation = new Invitation({
    user_id: user._id,
  });
  const code = invitation.uuid;
  const url = `http://localhost:3000/complete-invitation?code=${code}`;

  try {
    await email.sendMail({
      from: `Study Board <${process.env.EMAIL_SENDER}>`,
      to: toEmail,
      subject: 'Invitation from Study Board',
      text: getInvitationText(url),
    });

    await user.save();
    await invitation.save();

    process.stdout.write('Successfully sent\n');
    process.exit(0);
  } catch (err) {
    throw new HttpError('Email was not sent');
  }
})();

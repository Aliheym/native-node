const User = require('../models/user');
const Invitation = require('../models/invitation');

const email = require('../utils/email');
const { HttpError } = require('../utils/error');

const getInvitationText = (url) => `
  Hi! You received an invitation from Study Board project.

  Click here: ${url}

  If you don't want - just ignore this message!
`;

module.exports.inviteUser = async (req, res, next) => {
  const { email: toEmail } = req.body;
  if (!toEmail) {
    return next(new HttpError('Invalid email', 400));
  }

  let user = await User.findOne({ email: toEmail });
  if (user) {
    return next(
      new HttpError('An account with this email already exists', 400)
    );
  }

  user = new User({
    email: toEmail,
  });

  const invitation = new Invitation({
    user_id: user._id,
  });
  const code = invitation.uuid;
  const url = `http://${req.headers['host']}/complete-invitation?code=${code}`;

  try {
    await email.sendMail({
      from: `Study Board <${process.env.EMAIL_SENDER}>`,
      to: toEmail,
      subject: 'Invitation from Sudy Board',
      text: getInvitationText(url),
    });

    await user.save();
    await invitation.save();

    res.writeHead(200, {
      'Content-Type': 'application/json',
    });
    res.end(JSON.stringify({ success: true }));
  } catch (err) {
    return next(new HttpError('Email was not sent'));
  }
};

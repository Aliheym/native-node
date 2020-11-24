const session = require('../utils/session');

const email = require('../utils/email');
const { HttpError } = require('../utils/error');
const { hashPassword } = require('../utils/password');

const Invitation = require('../models/invitation');
const Recover = require('../models/recover');
const User = require('../models/user');

const getRecoverText = (url) => `
    Hi! ou receive a recover link from Study Board project
    Link here: ${url}
    If you don't want - just ignore this message!`;

module.exports.forgotPassword = async (req, res, next) => {
  const { email: targetEmail } = req.body;
  if (!targetEmail) {
    return next(new HttpError('Invalid email', 400));
  }

  let user = await User.findOne({ email: targetEmail });
  if (!user) {
    return next(new HttpError('Invalid email', 400));
  }

  let recover = await Recover.findOne({ user_id: user._id });
  if (recover) {
    return next(
      new HttpError('Check your mailbox. We sent you a recover message', 400)
    );
  }

  recover = new Recover({
    user_id: user._id,
  });
  const code = recover.uuid;
  const url = `http://${req.headers['host']}/complete-recover?code=${code}`;

  try {
    await email.sendMail({
      from: `Study Board <${process.env.EMAIL_SENDER}>`,
      to: targetEmail,
      subject: 'Recover request',
      text: getRecoverText(url),
    });

    await recover.save();

    res.writeHead(200, {
      'Content-Type': 'application/json',
    });
    res.end(JSON.stringify({ success: true }));
  } catch (err) {
    return next(new HttpError('Email was not sent'));
  }
};

module.exports.completeRecover = async (req, res, next) => {
  const { password, code: uuid } = req.body;

  if (!uuid) {
    return next(new HttpError('Invalid request', 400));
  }
  if (!password) {
    return next(new HttpError('Invalid password', 400));
  }

  const recover = await Recover.findOne({ uuid }).populate('user_id').exec();
  if (!recover || !recover.user) {
    return next(new HttpError("A recover request or user don't exist", 400));
  }
  if (recover.expiredAt < Date.now()) {
    return next(new HttpError('A recovery request expires', 400));
  }

  const hashedPassword = hashPassword(password);

  await User.updateOne({ _id: recover.user._id }, { password: hashedPassword });
  await Recover.deleteOne({ _id: recover._id });

  const token = session.startSession({
    id: recover.user._id,
    email: recover.user.email,
    isAdmin: recover.user.email === process.env.ADMIN_EMAIL,
  });

  res.writeHead(200, {
    'Content-Type': 'application/json',
  });
  res.end(JSON.stringify({ token, success: true }));
};

module.exports.completeInvitation = async (req, res, next) => {
  const { password, code: uuid } = req.body;

  if (!uuid) {
    return next(new HttpError('Invalid request', 400));
  }
  if (!password) {
    return next(new HttpError('Invalid password', 400));
  }

  const invitation = await Invitation.findOne({ uuid })
    .populate('user_id')
    .exec();
  if (!invitation || !invitation.user) {
    return next(new HttpError("Invitation or user doesn't exists", 400));
  }
  if (invitation.expiredAt < Date.now()) {
    return next(new HttpError('Invitation expires', 400));
  }

  const hashedPassword = hashPassword(password);

  await User.updateOne(
    { _id: invitation.user._id },
    { password: hashedPassword }
  );
  await Invitation.deleteOne({ _id: invitation._id });

  const token = session.startSession({
    id: invitation.user._id,
    email: invitation.user.email,
    isAdmin: invitation.user.email === process.env.ADMIN_EMAIL,
  });

  res.writeHead(200, {
    'Content-Type': 'application/json',
  });
  res.end(JSON.stringify({ token, success: true }));
};

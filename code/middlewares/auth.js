const { HttpError } = require('../utils/error');
const { getSession } = require('../utils/session');

module.exports.getUserData = (req, res, next) => {
  const token = req.headers['x-authorization'];

  if (!token) {
    return next();
  }

  try {
    req.user = getSession(token);

    next();
  } catch (err) {
    throw new HttpError('Invalid user token', 400);
  }
};

module.exports.protect = (req, res, next) => {
  if (!req.user) {
    throw new HttpError('Access denied', 401);
  }

  next();
};

module.exports.onlyAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    throw new HttpError('Access denied', 403);
  }

  next();
};

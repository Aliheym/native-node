const jwt = require('jsonwebtoken');

module.exports.startSession = function (payload) {
  return jwt.sign(payload, process.env.JWT_SECRET);
};

module.exports.getSession = function (token) {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports.destroySession = function (token) {};

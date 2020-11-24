const bcrypt = require('bcryptjs');

module.exports.matchPassword = function (password, targetPassword) {
  return bcrypt.compareSync(password, targetPassword);
};

module.exports.hashPassword = function (password) {
  return bcrypt.hashSync(password);
};

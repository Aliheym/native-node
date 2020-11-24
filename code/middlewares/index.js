const auth = require('./auth');
const static = require('./static');
const errorHandler = require('./error');
const bodyParser = require('./bodyParser');

module.exports = {
  auth,
  static,
  errorHandler,
  bodyParser,
};

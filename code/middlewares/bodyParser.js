const querystring = require('querystring');

module.exports = function (req, res, next) {
  req.body = {};

  let data;

  const contentType = req.headers['content-type'];
  switch (contentType) {
    case 'application/x-www-form-urlencoded':
      data = '';

      req.on('data', (chunk) => {
        data += chunk;
      });

      req.on('end', () => {
        req.body = querystring.parse(data);

        next();
      });
      break;
    case 'application/json':
      data = '';

      req.on('data', (chunk) => {
        data += chunk;
      });

      req.on('end', () => {
        req.body = JSON.parse(data);

        next();
      });
      break;
    default:
      next();
      break;
  }
};

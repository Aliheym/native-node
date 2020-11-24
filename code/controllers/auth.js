const https = require('https');
const querystring = require('querystring');

const User = require('../models/user.js');
const OAuth = require('../models/oauth');

const session = require('../utils/session');
const { HttpError } = require('../utils/error');
const { matchPassword } = require('../utils/password');

module.exports.authLocal = async (req, res, next) => {
  if (req.user) {
    return next(new HttpError('You are already logged in', 400));
  }

  const { email, password } = req.body;
  if (!email || !password) {
    return next(new HttpError('Input the email and the password', 400));
  }

  const user = await User.findOne({ email });
  if (!user) {
    return next(new HttpError('Invalid credentials', 400));
  }

  const matchedPassword = matchPassword(password, user.password);
  if (!matchedPassword) {
    return next(new HttpError('Invalid credentials', 400));
  }

  const token = session.startSession({
    id: user._id,
    email: user.email,
    isAdmin: user.email === process.env.ADMIN_EMAIL,
  });

  res.writeHead(200, {
    'Content-Type': 'application/json',
  });
  res.end(JSON.stringify({ token, success: true }));
};

const GOOGLE_TOKEN_URL = 'https://www.googleapis.com/oauth2/v4/token';
const FACEBOOK_TOKEN_URL = 'https://graph.facebook.com/v9.0/oauth/access_token';

module.exports.authGoogle = function (req, res, next) {
  if (req.user) {
    throw new HttpError('Access denied', 403);
  }

  const { code } = req.query;
  if (!code) {
    throw new HttpError('Invalid request', 400);
  }

  const body = {
    redirect_uri: `http://${req.headers['host']}/oauth-redirect/google`,
    code,
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    grant_type: 'authorization_code',
  };

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  };

  const request = https.request(GOOGLE_TOKEN_URL, options, (response) => {
    let data = '';

    response.on('data', (chunk) => {
      data += chunk;
    });

    response.on('end', async () => {
      const result = JSON.parse(data);
      const { access_token, id_token } = result;

      if (!id_token || !access_token) {
        return next(new HttpError('Error during authorization', 400));
      }

      const encodedData = Buffer.from(id_token.split('.')[1], 'base64');
      const { email } = JSON.parse(encodedData.toString());
      if (!email) {
        return next(new HttpError('Error during authorization', 400));
      }

      const user = await User.find({ email });
      if (!user) {
        return next(new HttpError('Error during authorization', 400));
      }

      const oauth = OAuth.findOne({ user_id: user._id, type: 'google' });
      if (!oauth) {
        oauth = new OAuth({
          user_id: user._id,
          type: 'google',
          oauthId: access_token,
        });

        await oauth.save();
      }

      const token = session.startSession({
        id: user._id,
        email: user.email,
        isAdmin: user.email === process.env.ADMIN_EMAIL,
      });

      res.writeHead(301, {
        Location: `/oauth-redirect?token=${token}`,
      });
      res.end();
    });
  });

  request.write(querystring.stringify(body));
  request.end();
};

module.exports.authFacebook = function (req, res, next) {
  if (req.user) {
    next(new HttpError('Access denied', 403));
  }

  const { code } = req.query;
  if (!code) {
    next(new HttpError('Invalid request', 400));
  }

  const body = {
    redirect_uri: `http://${req.headers['host']}/oauth-redirect/facebook`,
    code,
    client_id: process.env.FACEBOOK_CLIENT_ID,
    client_secret: process.env.FACEBOOK_CLIENT_SECRET,
  };

  const url = `${FACEBOOK_TOKEN_URL}?${querystring.encode(body)}`;
  const request = https.get(url, (response) => {
    let data = '';

    response.on('data', (chunk) => {
      data += chunk;
    });

    response.on('end', async () => {
      const { access_token } = JSON.parse(data);
      if (!access_token) {
        return next(new HttpError('Error during authorization', 400));
      }

      const request = https.get(
        `https://graph.facebook.com/v9.0/me?fields=email&access_token=${access_token}`,
        (response) => {
          let data = '';

          response.on('data', (chunk) => {
            data += chunk;
          });

          response.on('end', async () => {
            const { email } = JSON.parse(data);
            if (!email) {
              return next(new HttpError('Error during authorization', 400));
            }

            const user = await User.find({ email });
            if (!user) {
              return next(new HttpError('Error during authorization', 400));
            }

            const oauth = OAuth.findOne({
              user_id: user._id,
              type: 'facebook',
            });
            if (!oauth) {
              oauth = new OAuth({
                user_id: user._id,
                type: 'facebook',
                oauthId: access_token,
              });

              await oauth.save();
            }

            const token = session.startSession({
              id: user._id,
              email: user.email,
              isAdmin: user.email === process.env.ADMIN_EMAIL,
            });

            res.writeHead(301, {
              Location: `/oauth-redirect?token=${token}`,
            });
            res.end();
          });
        }
      );

      request.end();
    });
  });

  request.end();
};

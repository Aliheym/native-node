const url = require('url');
const querystring = require('querystring');

function Router() {
  this._rules = [];
  this._req = this._res = null;
  this._errorHandler = null;
}

Router.prototype.set = function (req, res) {
  this._req = req;
  this._res = res;
  this._index = 0;

  const parsedURL = url.parse(this._req.url);
  this._path = parsedURL.pathname;
  this._req.query = querystring.parse(parsedURL.query);

  return this;
};

Router.prototype._next = function (err) {
  if (err !== undefined && typeof this._errorHandler === 'function') {
    return this._errorHandler(err, this._req, this._res);
  }

  this.route();
};

Router.prototype.route = function () {
  const method = this._req.method;

  for (let i = this._index; i < this._rules.length; i++) {
    const rule = this._rules[i];

    if (Router.matchRule(this._path, method, rule)) {
      this._index = i + 1;

      try {
        rule.router(this._req, this._res, this._next.bind(this));
      } catch (err) {
        if (typeof this._errorHandler === 'function') {
          return this._next(err);
        } else {
          throw err;
        }
      }

      break;
    }
  }

  return this;
};

Router.prototype.addRoute = function (path, method, options, ...routers) {
  const normalizedRules = routers.map((router) =>
    Router.normalizeRule(path, method, options, router)
  );
  this._rules.push(...normalizedRules);
};

Router.prototype.use = function (path, router) {
  if (router === undefined) {
    router = path;
    path = '/';
  }

  this.addRoute(path, '', { exact: false }, router);
};

Router.prototype.catch = function (handler) {
  this._errorHandler = handler;
};

Router.normalizeRule = function (path, method, options, router) {
  return {
    path,
    method,
    exact: true,
    ...options,
    router,
  };
};

Router.matchRule = function (url, method, rule) {
  if (rule.method && rule.method !== method) return false;
  if (!rule.path) return true;

  return rule.exact ? url === rule.path : url.startsWith(rule.path);
};

const methods = ['POST', 'GET', 'PUT', 'PATCH', 'DELETE'];

for (let i = 0; i < methods.length; i++) {
  const method = methods[i].toLowerCase();

  Router.prototype[method] = function (path, ...routers) {
    this.addRoute(path, methods[i], {}, ...routers);
  };
}

module.exports = new Router();

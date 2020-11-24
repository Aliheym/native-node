function Router(root) {
  this._rules = [];
  this._root = root;

  window.addEventListener('popstate', () => {
    this.route();
  });
}

Router.prototype._render = function (rule) {
  this._root.innerHTML = '';
  console.log(rule);
  const renderedData = rule.render();
  let html, onMount;

  if (typeof renderedData === 'string') {
    html = renderedData;
  } else if (Array.isArray(renderedData)) {
    html = renderedData[0];
    onMount = renderedData[1];
  } else {
    return;
  }

  this._root.innerHTML = html;
  if (typeof onMount === 'function') onMount();
};

Router.prototype.push = function (rule) {
  history.pushState(null, rule.path, rule.path);

  this._render(rule);
};

Router.prototype.redirect = function (path) {
  const matchedRule = this.getMatchedRule(path);

  if (matchedRule) {
    this.push(matchedRule);
  }
};

Router.prototype.linkTo = function (path) {
  const matchedRule = this.getMatchedRule(path);

  if (matchedRule) {
    this.push(matchedRule);
  }
};

Router.prototype.getMatchedRule = function (path) {
  const url = path || window.location.pathname;

  for (let i = 0; i < this._rules.length; i++) {
    const rule = this._rules[i];

    if (Router.matchRule(url, rule)) {
      return rule;
    }
  }

  return null;
};

Router.prototype.route = function () {
  const activeRule = this.getMatchedRule();
  this._render(activeRule);

  return this;
};

Router.prototype.addRoute = function (path, render) {
  const normalizedRule = Router.normalizeRule({
    path,
    render,
  });

  this._rules.push(normalizedRule);

  return this;
};

Router.normalizeRule = function (rule) {
  return {
    ...rule,
  };
};

Router.matchRule = function (url, rule) {
  return !rule.path || url === rule.path;
};

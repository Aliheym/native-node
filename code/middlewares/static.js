const fs = require('fs');
const path = require('path');
const mime = require('mime');

module.exports = (root) => {
  return function (req, res) {
    let resolvedPath = path.join(root, req.url);

    fs.stat(resolvedPath, (err, stats) => {
      if (!stats || stats.isDirectory()) {
        resolvedPath = path.join(root, 'index.html');
      }

      fs.readFile(resolvedPath, (err, data) => {
        if (err) {
          return;
        }

        res.writeHead(200, {
          'Content-Type': mime.getType(resolvedPath),
        });
        res.end(data);
      });
    });
  };
};

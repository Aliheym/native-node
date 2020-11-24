module.exports = function (err, req, res) {
  res.writeHead(err.statusCode || 500, {
    'Content-Type': 'application/json',
  });

  res.end(
    JSON.stringify({
      error: err.message,
      status: err.statusCode || 500,
    })
  );
};

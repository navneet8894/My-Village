function notFound(req, res, next) {
  res.status(404);
  const err = new Error(`Not Found - ${req.originalUrl}`);
  next(err);
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || (res.statusCode !== 200 ? res.statusCode : 500);
  res.status(status === 200 ? 500 : status);
  res.json({
    message: err.message || 'Server error',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
}

module.exports = { notFound, errorHandler };

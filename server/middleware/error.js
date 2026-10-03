export const notFound = (req, res) => res.status(404).json({ message: `Route not found: ${req.originalUrl}` });

export const errorHandler = (err, _req, res, _next) => {
  let status = res.statusCode >= 400 ? res.statusCode : 500;
  let message = err.message || 'Server error';
  if (err.name === 'ValidationError') { status = 400; message = Object.values(err.errors).map((e) => e.message).join(', '); }
  if (err.name === 'CastError') { status = 400; message = 'Invalid id'; }
  if (err.code === 11000) { status = 400; message = `Duplicate value for ${Object.keys(err.keyValue).join(', ')}`; }
  res.status(status).json({ message });
};

// wraps async handlers so errors reach errorHandler
export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

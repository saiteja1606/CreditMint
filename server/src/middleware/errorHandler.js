const errorHandler = (err, req, res, next) => {
  console.error('[Error]', err.message);

  // Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({ success: false, message: 'A record with this value already exists.' });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ success: false, message: 'Record not found.' });
  }
  if (err.code === 'P2003') {
    return res.status(400).json({ success: false, message: 'Related record not found.' });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

const createError = (message, statusCode = 500) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

module.exports = { errorHandler, createError };

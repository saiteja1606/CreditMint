/**
 * Standard API response helpers
 */

const success = (res, data = {}, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({ success: true, message, data });
};

const created = (res, data = {}, message = 'Created successfully') => {
  return res.status(201).json({ success: true, message, data });
};

const error = (res, message = 'An error occurred', statusCode = 500, details = null) => {
  const response = { success: false, message };
  if (details && process.env.NODE_ENV !== 'production') {
    response.details = details;
  }
  return res.status(statusCode).json(response);
};

const notFound = (res, message = 'Resource not found') => {
  return res.status(404).json({ success: false, message });
};

const unauthorized = (res, message = 'Unauthorized') => {
  return res.status(401).json({ success: false, message });
};

const forbidden = (res, message = 'Forbidden') => {
  return res.status(403).json({ success: false, message });
};

const badRequest = (res, message = 'Bad request', errors = null) => {
  const response = { success: false, message };
  if (errors) response.errors = errors;
  return res.status(400).json(response);
};

module.exports = { success, created, error, notFound, unauthorized, forbidden, badRequest };

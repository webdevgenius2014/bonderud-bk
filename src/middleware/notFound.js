export const notFound = (req, res) => {
  res.status(404).json({
    status: 'fail',
    message: `Route ${req.originalUrl} not found on this server!`,
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.originalUrl,
  });
};
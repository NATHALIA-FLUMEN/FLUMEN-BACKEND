export const errorHandler = (err, req, res, next) => {
  const status = err.statusCode || 500;
  const message = status === 500 ? 'Error interno del servidor' : err.message;

  if (status === 500) {
    console.error(`[ERROR] ${err.stack}`);
  }

  res.status(status).json({
    success: false,
    status,
    message
  });
};

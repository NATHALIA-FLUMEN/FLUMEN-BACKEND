export const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `No se encontró el recurso: ${req.originalUrl}`
  });
};

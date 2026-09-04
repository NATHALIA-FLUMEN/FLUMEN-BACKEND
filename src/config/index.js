export default {
  port: process.env.PORT || 4000,
  env: process.env.NODE_ENV || 'development',
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
  }
};

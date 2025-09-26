require('dotenv').config();
module.exports = {
  PORT: process.env.PORT || 3000,
  MONGO_URL: process.env.MONGO_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRE: process.env.JWT_EXPIRE,
  ADMIN_USERNAME: process.env.ADMIN_USERNAME,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
};

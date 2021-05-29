require("dotenv").config();

const config = {
  PORT,
  CACHE_TTL,
  ALLOWED_ORIGIN,
} = process.env;

module.exports = config;

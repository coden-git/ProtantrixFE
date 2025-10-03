const { config } = require('dotenv');

// Load .env from project root
config({ path: './.env' });

module.exports = ({ config: expoConfig }) => {
  const extra = {
    BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:3000/api',
    NODE_ENV: process.env.NODE_ENV || 'development',
  };

  return {
    ...expoConfig,
    extra,
  };
};

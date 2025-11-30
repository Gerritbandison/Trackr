// migrate-mongo configuration
require('dotenv').config();

const config = {
  mongodb: {
    // MongoDB connection URL from environment variable
    url: process.env.MONGO_URI || "mongodb://localhost:27017/trackr",

    // Database name extracted from MONGO_URI or default to 'trackr'
    databaseName: process.env.MONGO_DB_NAME || "trackr",

    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  },

  // Migrations directory
  migrationsDir: "migrations",

  // Collection to track applied migrations
  changelogCollectionName: "changelog",

  // Collection for migration locks (prevents concurrent migrations)
  lockCollectionName: "changelog_lock",

  // Lock TTL in seconds (0 = no TTL)
  lockTtl: 0,

  // Migration file extension
  migrationFileExtension: ".js",

  // Enable file hash checking for idempotent migrations
  useFileHash: false,

  // Module system
  moduleSystem: 'commonjs',
};

module.exports = config;

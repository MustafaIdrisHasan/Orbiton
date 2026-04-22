const { Pool } = require("pg");
const { env } = require("../../config/env");

const pool = env.postgresUrl
  ? new Pool({ connectionString: env.postgresUrl })
  : null;

module.exports = {
  pool
};


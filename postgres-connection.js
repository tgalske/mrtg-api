const pgp = require('pg-promise')(/*options*/);
require('dotenv').config();

// fetch environment variables for postgres connection parameters
const connectionParams = {
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD
};
// create connection
const connection = pgp(connectionParams);

module.exports = connection;

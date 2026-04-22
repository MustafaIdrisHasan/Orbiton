const { MongoClient } = require("mongodb");
const { env } = require("../../config/env");

const client = env.mongoUrl ? new MongoClient(env.mongoUrl) : null;

module.exports = {
  client
};


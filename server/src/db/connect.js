const mongoose = require("mongoose");
const env = require("../config/env");
const logger = require("../utils/logger");

async function connectDB() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongoUri);
  logger.info({ db: mongoose.connection.name }, "MongoDB connected");
}

module.exports = { connectDB };

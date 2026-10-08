const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const pinoHttp = require("pino-http");
const env = require("./config/env");
const logger = require("./utils/logger");
const { notFound, errorHandler } = require("./middleware/error");

const app = express();

app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    autoLogging: { ignore: (req) => req.url === "/api/v1/health" },
  })
);

app.use(helmet());

app.use(
  cors({
    origin(origin, cb) {
      // Allow same-origin/no-origin (curl, server-to-server) and whitelisted origins.
      if (!origin || env.corsOrigins.includes(origin)) return cb(null, true);
      cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(mongoSanitize());

app.get("/api/v1/health", (req, res) => {
  const mongoose = require("mongoose");
  res.json({
    status: "ok",
    env: env.nodeEnv,
    db: mongoose.connection.readyState === 1 ? "up" : "down",
    uptime: Math.round(process.uptime()),
  });
});

app.use("/api/v1/auth", require("./routes/auth.routes"));
app.use("/api/v1/products", require("./routes/products.routes"));
app.use("/api/v1/brands", require("./routes/brands.routes"));

app.use("/api", notFound);
app.use(errorHandler);

module.exports = app;

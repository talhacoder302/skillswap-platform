const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const routes = require(`${__routes}/index`);

const app = express();

/**
 * Security
 */
app.use(helmet());

/**
 * Enable CORS
 */
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
  }),
);

/**
 * Parse Request Body
 */
app.use(cookieParser());

app.use(express.json({ limit: "10mb" }));
app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  }),
);

/**
 * Compression
 */
app.use(compression());

/**
 * Logger
 */
app.use(morgan("dev"));

/**
 * Static Files
 */
app.use("/public", express.static(__public));
app.use("/uploads", express.static(__uploads));

/**
 * Health Check
 */
app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "SkillSwap Backend Running Successfully 🚀",
  });
});

/**
 * API Routes
 */
app.use("/api", routes);

/**
 * 404 Handler
 */
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "Route Not Found",
  });
});

module.exports = app;

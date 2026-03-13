import pino from "pino";

/**
 * Shared application logger.
 * Uses pino-pretty in development for human-readable output,
 * and plain JSON in production for structured log ingestion.
 */
const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  transport:
    process.env.NODE_ENV !== "production"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
});

export default logger;

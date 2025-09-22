import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: process.env.PORT || 5000,
  host: process.env.HOST || process.env.SERVER_HOST || "localhost",
  mongoUri: process.env.MONGODB_URI,
  nodeEnv: process.env.NODE_ENV,
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
  hostaway: {
    apiUrl: process.env.HOSTAWAY_API_URL,
    apiKey: process.env.HOSTAWAY_API_KEY,
    accountId: process.env.HOSTAWAY_ACCOUNT_ID,
  },
  googlePlacesAPIKey: process.env.GOOGLE_PLACES_API_KEY,
  googlePlacesBaseUrl: process.env.GOOGLE_PLACES_BASE_URL,
  gooleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  healthMonitoring: {
    enabled: process.env.HEALTH_MONITORING_ENABLED === "true" || true,
    cronSchedule: process.env.HEALTH_MONITORING_CRON_SCHEDULE || "*/5 * * * *", // Every 5 minutes
    endpoint: process.env.HEALTH_MONITORING_ENDPOINT || "/api/health",
    baseUrl: process.env.HEALTH_MONITORING_BASE_URL || null, // If null, will be constructed dynamically
    timeout: parseInt(process.env.HEALTH_MONITORING_TIMEOUT || "10000", 10), // 10 seconds
    maxRetries: parseInt(process.env.HEALTH_MONITORING_MAX_RETRIES || "3", 10),
    retryDelay: parseInt(
      process.env.HEALTH_MONITORING_RETRY_DELAY || "2000",
      10
    ), // 2 seconds
    logging: {
      enabled: process.env.HEALTH_MONITORING_LOGGING_ENABLED !== "false",
      filePath:
        process.env.HEALTH_MONITORING_LOG_PATH ||
        "./logs/health-monitoring.log",
      maxFileSize: process.env.HEALTH_MONITORING_LOG_MAX_SIZE || "10MB",
      maxFiles: parseInt(
        process.env.HEALTH_MONITORING_LOG_MAX_FILES || "5",
        10
      ),
      format:
        (process.env.HEALTH_MONITORING_LOG_FORMAT as "json" | "text") || "json",
    },
  },
};

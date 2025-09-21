import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: process.env.PORT || 5000,
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
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET
};

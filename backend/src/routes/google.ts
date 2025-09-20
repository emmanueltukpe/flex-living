import express from "express";
import { GoogleController } from "../controllers/GoogleController";
import { GoogleService } from "../services/GoogleService";

const router = express.Router();

// Initialize dependencies
const googleService = new GoogleService();
const googleController = new GoogleController(googleService);

// Routes
router.get("/reviews", googleController.getReviews);
router.get("/place-search", googleController.searchPlaces);
router.get("/status", googleController.getApiStatus);
router.get("/test-connection", googleController.testConnection);

export default router;

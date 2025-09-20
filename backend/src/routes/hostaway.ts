import express from "express";
import { HostawayController } from "../controllers/HostawayController";
import { HostawayService } from "../services/HostawayService";
import { ReviewService } from "../services/ReviewService";
import { PropertyService } from "../services/PropertyService";
import { ReviewRepository } from "../repositories/ReviewRepository";
import { PropertyRepository } from "../repositories/PropertyRepository";

const router = express.Router();

// Initialize dependencies
const reviewRepository = new ReviewRepository();
const propertyRepository = new PropertyRepository();
const propertyService = new PropertyService(propertyRepository);
const reviewService = new ReviewService(reviewRepository);
const hostawayService = new HostawayService(reviewService, propertyService);
const hostawayController = new HostawayController(hostawayService);

// Routes
router.get("/reviews", hostawayController.getReviews);
router.post("/sync", hostawayController.syncData);

export default router;

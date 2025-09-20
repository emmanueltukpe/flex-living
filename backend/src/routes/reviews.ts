import express from "express";
import { ReviewController } from "../controllers/ReviewController";
import { ReviewService } from "../services/ReviewService";
import { ReviewRepository } from "../repositories/ReviewRepository";
import { HostawayService } from "../services/HostawayService";
import { PropertyService } from "../services/PropertyService";
import { PropertyRepository } from "../repositories/PropertyRepository";

const router = express.Router();

// Initialize dependencies
const reviewRepository = new ReviewRepository();
const propertyRepository = new PropertyRepository();
const reviewService = new ReviewService(reviewRepository);
const propertyService = new PropertyService(propertyRepository);
const hostawayService = new HostawayService(reviewService, propertyService);
const reviewController = new ReviewController(reviewService, hostawayService);

// Routes
router.get("/", reviewController.getAllReviews);
router.get("/statistics", reviewController.getStatistics);
router.get("/hostaway", reviewController.getHostawayReviews); // Required route for assessment
router.get("/export", reviewController.exportReviews);
router.post("/bulk-update", reviewController.bulkUpdateReviews);
router.get("/:id", reviewController.getReviewById);
router.put("/:id", reviewController.updateReview);
router.delete("/:id", reviewController.deleteReview);
router.post("/:id/helpful", reviewController.markReviewHelpful);

export default router;

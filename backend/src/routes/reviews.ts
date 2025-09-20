import express from "express";
import { ReviewController } from "../controllers/ReviewController";
import { ReviewService } from "../services/ReviewService";
import { ReviewRepository } from "../repositories/ReviewRepository";

const router = express.Router();

// Initialize dependencies
const reviewRepository = new ReviewRepository();
const reviewService = new ReviewService(reviewRepository);
const reviewController = new ReviewController(reviewService);

// Routes
router.get("/", reviewController.getAllReviews);
router.get("/statistics", reviewController.getStatistics);
router.get("/:id", reviewController.getReviewById);
router.put("/:id", reviewController.updateReview);
router.post("/:id/helpful", reviewController.markReviewHelpful);

export default router;

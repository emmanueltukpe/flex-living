import express from "express";
import { PropertyController } from "../controllers/PropertyController";
import { PropertyService } from "../services/PropertyService";
import { ReviewService } from "../services/ReviewService";
import { PropertyRepository } from "../repositories/PropertyRepository";
import { ReviewRepository } from "../repositories/ReviewRepository";

const router = express.Router();

// Initialize dependencies
const propertyRepository = new PropertyRepository();
const reviewRepository = new ReviewRepository();
const propertyService = new PropertyService(propertyRepository);
const reviewService = new ReviewService(reviewRepository);
const propertyController = new PropertyController(
  propertyService,
  reviewService
);

// Routes
router.get("/", propertyController.getAllProperties);
router.get("/:id", propertyController.getPropertyById);
router.put("/:id", propertyController.updateProperty);

export default router;

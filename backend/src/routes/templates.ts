import express from "express";
import { TemplateController } from "../controllers/TemplateController";
import { TemplateService } from "../services/TemplateService";

const router = express.Router();

// Initialize dependencies
const templateService = new TemplateService();
const templateController = new TemplateController(templateService);

// Routes
router.get("/", templateController.getAllTemplates);
router.post("/", templateController.createTemplate);
router.get("/:id", templateController.getTemplateById);
router.put("/:id", templateController.updateTemplate);
router.delete("/:id", templateController.deleteTemplate);

export default router;

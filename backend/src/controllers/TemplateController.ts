import { Request, Response } from "express";
import { BaseController } from "./BaseController";
import { TemplateService } from "../services/TemplateService";

export class TemplateController extends BaseController {
  private templateService: TemplateService;

  constructor(templateService: TemplateService) {
    super();
    this.templateService = templateService;
  }

  getAllTemplates = this.asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const templates = await this.templateService.getAll();
      this.sendSuccess(res, { templates });
    }
  );

  createTemplate = this.asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const templateData = req.body;

      // Validate required fields
      if (!templateData.name || !templateData.content) {
        this.sendError(res, "Name and content are required", 400);
        return;
      }

      const template = await this.templateService.create(templateData);
      res.status(201);
      this.sendSuccess(res, { template });
    }
  );

  getTemplateById = this.asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { id } = req.params;
      this.validateId(id);

      const template = await this.templateService.getById(id);

      if (!template) {
        this.sendError(res, "Template not found", 404);
        return;
      }

      this.sendSuccess(res, { template });
    }
  );

  updateTemplate = this.asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { id } = req.params;
      this.validateId(id);

      const updateData = req.body;
      const template = await this.templateService.update(id, updateData);

      if (!template) {
        this.sendError(res, "Template not found", 404);
        return;
      }

      this.sendSuccess(res, { template });
    }
  );

  deleteTemplate = this.asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { id } = req.params;
      this.validateId(id);

      const deleted = await this.templateService.delete(id);

      if (!deleted) {
        this.sendError(res, "Template not found", 404);
        return;
      }

      this.sendSuccess(res, { message: "Template deleted successfully" });
    }
  );
}

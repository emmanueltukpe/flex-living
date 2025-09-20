import { Request, Response } from "express";
import { BaseController } from "./BaseController";
import { GoogleService } from "../services/GoogleService";

export class GoogleController extends BaseController {
  private googleService: GoogleService;

  constructor(googleService: GoogleService) {
    super();
    this.googleService = googleService;
  }

  getReviews = this.asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { placeId } = req.query;

      const result = await this.googleService.getReviews(placeId as string);

      if (result.status === "success") {
        res.json(result);
      } else {
        const statusCode = result.message?.includes("Place ID is required")
          ? 400
          : 500;
        this.sendError(
          res,
          result.message || "Failed to fetch Google reviews",
          statusCode
        );
      }
    }
  );

  searchPlaces = this.asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { query } = req.query;

      const result = await this.googleService.searchPlaces(query as string);

      if (result.status === "success") {
        this.sendSuccess(res, result.data);
      } else {
        const statusCode = result.message?.includes("required") ? 400 : 500;
        this.sendError(
          res,
          result.message || "Failed to search places",
          statusCode
        );
      }
    }
  );

  getApiStatus = this.asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const status = this.googleService.getApiStatus();
      this.sendSuccess(res, status);
    }
  );

  testConnection = this.asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const result = await this.googleService.testApiConnection();

      if (result.success) {
        this.sendSuccess(res, result);
      } else {
        this.sendError(res, result.message, 502, result.error);
      }
    }
  );
}

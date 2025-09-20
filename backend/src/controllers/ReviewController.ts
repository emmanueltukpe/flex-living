import { Request, Response } from "express";
import { BaseController } from "./BaseController";
import { ReviewService } from "../services/ReviewService";
import { HostawayService } from "../services/HostawayService";
import { ReviewFilters, StatisticsFilters } from "../types";

export class ReviewController extends BaseController {
  private reviewService: ReviewService;
  private hostawayService?: HostawayService;

  constructor(reviewService: ReviewService, hostawayService?: HostawayService) {
    super();
    this.reviewService = reviewService;
    this.hostawayService = hostawayService;
  }

  getAllReviews = this.asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const filters = this.buildReviewFilters(req.query);
      const result = await this.reviewService.getAllReviews(filters);

      res.json(result);
    }
  );

  getReviewById = this.asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { id } = req.params;
      this.validateId(id);

      const review = await this.reviewService.getReviewById(id);
      this.sendSuccess(res, review);
    }
  );

  updateReview = this.asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { id } = req.params;
      this.validateId(id);

      const updateData = this.sanitizeInput(req.body);
      const updatedReview = await this.reviewService.updateReview(
        id,
        updateData
      );

      this.sendSuccess(res, updatedReview);
    }
  );

  markReviewHelpful = this.asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { id } = req.params;
      this.validateId(id);

      const { helpful } = req.body;
      if (typeof helpful !== "boolean") {
        this.sendError(res, "helpful field must be a boolean", 400);
        return;
      }

      const updatedReview = await this.reviewService.markReviewHelpful(
        id,
        helpful
      );
      this.sendSuccess(res, updatedReview);
    }
  );

  getStatistics = this.asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const filters = this.buildStatisticsFilters(req.query);
      const statistics = await this.reviewService.getStatistics(filters);

      this.sendSuccess(res, statistics);
    }
  );

  getHostawayReviews = this.asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      if (!this.hostawayService) {
        this.sendError(res, "Hostaway service not available", 503);
        return;
      }

      const useApi =
        this.parseBooleanParam(req.query.useApi as string) || false;
      const result = await this.hostawayService.fetchReviews(useApi);

      res.json(result);
    }
  );

  bulkUpdateReviews = this.asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { reviewIds, updates } = req.body;

      if (!Array.isArray(reviewIds) || reviewIds.length === 0) {
        this.sendError(res, "reviewIds must be a non-empty array", 400);
        return;
      }

      if (!updates || typeof updates !== "object") {
        this.sendError(res, "updates object is required", 400);
        return;
      }

      const results = await this.reviewService.bulkUpdate(reviewIds, updates);

      this.sendSuccess(res, {
        message: `Successfully updated ${results.modifiedCount} reviews`,
        results,
      });
    }
  );

  exportReviews = this.asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const filters = this.buildReviewFilters(req.query);
      const format = (req.query.format as string) || "json";

      const response = await this.reviewService.getAllReviews(filters);
      const reviews = response.data || [];

      if (format === "csv") {
        const csv = this.convertToCSV(reviews);
        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          'attachment; filename="reviews.csv"'
        );
        res.send(csv);
      } else {
        res.setHeader("Content-Type", "application/json");
        res.setHeader(
          "Content-Disposition",
          'attachment; filename="reviews.json"'
        );
        this.sendSuccess(res, { reviews });
      }
    }
  );

  deleteReview = this.asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { id } = req.params;
      this.validateId(id);

      const deleted = await this.reviewService.delete(id);

      if (!deleted) {
        this.sendError(res, "Review not found", 404);
        return;
      }

      this.sendSuccess(res, { message: "Review deleted successfully" });
    }
  );

  private convertToCSV(reviews: any[]): string {
    if (reviews.length === 0) return "";

    const headers = [
      "ID",
      "External ID",
      "Guest Name",
      "Property",
      "Channel",
      "Rating",
      "Status",
      "Public Review",
      "Submitted At",
      "Show On Website",
    ];

    const rows = reviews.map((review) => [
      review._id,
      review.externalId,
      review.guestName,
      review.listingName,
      review.channel,
      review.rating,
      review.status,
      `"${review.publicReview.replace(/"/g, '""')}"`,
      review.submittedAt,
      review.showOnWebsite,
    ]);

    return [headers, ...rows].map((row) => row.join(",")).join("\n");
  }

  private buildReviewFilters(query: any): ReviewFilters {
    const pagination = this.extractPaginationParams(query);
    const sorting = this.extractSortParams(query, "submittedAt");
    const dateRange = this.extractDateRangeParams(query);

    return {
      listingId: query.listingId,
      channel: query.channel,
      rating: this.parseNumericParam(query.rating),
      status: query.status,
      showOnWebsite: this.parseBooleanParam(query.showOnWebsite),
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      sortBy: sorting.sortBy,
      order: sorting.order,
      page: pagination.page,
      limit: pagination.limit,
    };
  }

  private buildStatisticsFilters(query: any): StatisticsFilters {
    const dateRange = this.extractDateRangeParams(query);

    return {
      listingId: query.listingId,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    };
  }
}

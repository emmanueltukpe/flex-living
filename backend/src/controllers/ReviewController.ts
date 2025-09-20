import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { ReviewService } from '../services/ReviewService';
import { ReviewFilters, StatisticsFilters } from '../types';

export class ReviewController extends BaseController {
  private reviewService: ReviewService;

  constructor(reviewService: ReviewService) {
    super();
    this.reviewService = reviewService;
  }

  getAllReviews = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const filters = this.buildReviewFilters(req.query);
    const result = await this.reviewService.getAllReviews(filters);
    
    res.json(result);
  });

  getReviewById = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    this.validateId(id);
    
    const review = await this.reviewService.getReviewById(id);
    this.sendSuccess(res, review);
  });

  updateReview = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    this.validateId(id);
    
    const updateData = this.sanitizeInput(req.body);
    const updatedReview = await this.reviewService.updateReview(id, updateData);
    
    this.sendSuccess(res, updatedReview);
  });

  markReviewHelpful = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    this.validateId(id);
    
    const { helpful } = req.body;
    if (typeof helpful !== 'boolean') {
      this.sendError(res, 'helpful field must be a boolean', 400);
      return;
    }
    
    const updatedReview = await this.reviewService.markReviewHelpful(id, helpful);
    this.sendSuccess(res, updatedReview);
  });

  getStatistics = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const filters = this.buildStatisticsFilters(req.query);
    const statistics = await this.reviewService.getStatistics(filters);
    
    this.sendSuccess(res, statistics);
  });

  private buildReviewFilters(query: any): ReviewFilters {
    const pagination = this.extractPaginationParams(query);
    const sorting = this.extractSortParams(query, 'submittedAt');
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
      limit: pagination.limit
    };
  }

  private buildStatisticsFilters(query: any): StatisticsFilters {
    const dateRange = this.extractDateRangeParams(query);
    
    return {
      listingId: query.listingId,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    };
  }
}

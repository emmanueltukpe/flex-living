import { ReviewRepository } from "../repositories/ReviewRepository";
import { BaseService } from "./BaseService";
import {
  IReview,
  ReviewFilters,
  StatisticsFilters,
  StatisticsResponse,
  PaginatedResponse,
  Review,
} from "../types";
import {
  CreateReviewData,
  UpdateReviewData,
  REVIEW_VALIDATION_RULES,
  NotFoundError,
} from "../types/validation";

export class ReviewService extends BaseService {
  private reviewRepository: ReviewRepository;

  constructor(reviewRepository: ReviewRepository) {
    super();
    this.reviewRepository = reviewRepository;
  }

  async getAllReviews(
    filters: ReviewFilters
  ): Promise<PaginatedResponse<Review>> {
    const result = await this.reviewRepository.findWithFilters(filters);

    return {
      status: "success",
      data: result.reviews.map(this.transformReviewDocument),
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: result.pages,
      },
    };
  }

  async getReviewById(id: string): Promise<Review> {
    const review = await this.reviewRepository.findById(id);
    if (!review) {
      throw new NotFoundError("Review", id);
    }

    return this.transformReviewDocument(review);
  }

  async createReview(reviewData: CreateReviewData): Promise<Review> {
    // Validate input data
    const validation = this.validateData(
      reviewData as any,
      REVIEW_VALIDATION_RULES
    );
    if (!validation.isValid) {
      this.throwValidationError(validation.errors);
    }

    // Transform and sanitize data
    const transformedData = this.transformCreateData(reviewData);

    // Check if review with same external ID already exists
    if (transformedData.externalId) {
      const existingReview = await this.reviewRepository.findByExternalId(
        transformedData.externalId
      );
      if (existingReview) {
        throw new Error(
          `Review with external ID ${transformedData.externalId} already exists`
        );
      }
    }

    const createdReview = await this.reviewRepository.create(transformedData);
    return this.transformReviewDocument(createdReview);
  }

  async updateReview(
    id: string,
    updateData: UpdateReviewData
  ): Promise<Review> {
    // Validate update data
    const allowedFields = ["showOnWebsite", "responseText", "status"];
    const filteredData: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        filteredData[key] = value;
      }
    }

    // Add response timestamp if responseText is provided
    if (filteredData.responseText !== undefined) {
      filteredData.respondedAt = new Date();
    }

    const updatedReview = await this.reviewRepository.updateById(
      id,
      filteredData
    );
    if (!updatedReview) {
      throw new NotFoundError("Review", id);
    }

    // Update property statistics if status changed to published
    if (updateData.status === "published") {
      await this.updatePropertyStatistics(updatedReview.listingId);
    }

    return this.transformReviewDocument(updatedReview);
  }

  async markReviewHelpful(id: string, helpful: boolean): Promise<Review> {
    const updatedReview = await this.reviewRepository.updateHelpfulCount(
      id,
      helpful
    );
    if (!updatedReview) {
      throw new NotFoundError("Review", id);
    }

    return this.transformReviewDocument(updatedReview);
  }

  async getStatistics(
    filters: StatisticsFilters = {}
  ): Promise<StatisticsResponse> {
    return await this.reviewRepository.getStatistics(filters);
  }

  async getReviewsByListingId(
    listingId: string,
    options: {
      showOnWebsite?: boolean;
      status?: string;
      limit?: number;
    } = {}
  ): Promise<Review[]> {
    const reviews = await this.reviewRepository.findByListingId(listingId, {
      ...options,
      sort: { submittedAt: -1 },
    });

    return reviews.map(this.transformReviewDocument);
  }

  async upsertReview(
    externalId: number,
    reviewData: Partial<CreateReviewData>
  ): Promise<Review> {
    const transformedData = this.transformCreateData(
      reviewData as CreateReviewData
    );
    const upsertedReview = await this.reviewRepository.upsertByExternalId(
      externalId,
      transformedData
    );

    return this.transformReviewDocument(upsertedReview);
  }

  async calculateAverageRating(
    categories: Array<{ category: string; rating: number }>
  ): Promise<number> {
    if (!categories || categories.length === 0) return 0;

    const ratings = categories.map((cat) => cat.rating);
    return this.calculateAverage(ratings);
  }

  private async updatePropertyStatistics(_listingId: string): Promise<void> {
    // Property statistics would be updated by a separate service or job
  }

  private transformCreateData(data: CreateReviewData): Partial<IReview> {
    return {
      externalId: data.externalId,
      type: data.type,
      status: data.status,
      rating: data.rating,
      publicReview: this.sanitizeString(data.publicReview),
      privateReview: data.privateReview
        ? this.sanitizeString(data.privateReview)
        : undefined,
      reviewCategory: data.reviewCategory as any,
      submittedAt: this.parseDate(data.submittedAt),
      guestName: this.sanitizeString(data.guestName),
      listingId: data.listingId,
      listingName: this.sanitizeString(data.listingName),
      channel: data.channel as any,
      reservationId: data.reservationId,
      showOnWebsite: false,
      helpful: 0,
      notHelpful: 0,
    };
  }

  private transformReviewDocument(review: IReview): Review {
    return {
      _id: review._id.toString(),
      externalId: review.externalId,
      type: review.type,
      status: review.status,
      rating: review.rating,
      publicReview: review.publicReview,
      privateReview: review.privateReview,
      reviewCategory: review.reviewCategory,
      submittedAt: review.submittedAt,
      guestName: review.guestName,
      listingId: review.listingId,
      listingName: review.listingName,
      channel: review.channel,
      reservationId: review.reservationId,
      showOnWebsite: review.showOnWebsite,
      responseText: review.responseText,
      respondedAt: review.respondedAt,
      helpful: review.helpful || 0,
      notHelpful: review.notHelpful || 0,
    };
  }
}

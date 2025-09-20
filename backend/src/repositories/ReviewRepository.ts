import { FilterQuery, Types } from "mongoose";
import Review from "../models/Review";
import { BaseRepository } from "./BaseRepository";
import {
  IReview,
  ReviewFilters,
  ReviewStatistics,
  CategoryStatistics,
  ChannelStatistics,
  MonthlyTrend,
  StatisticsFilters,
} from "../types";

export class ReviewRepository extends BaseRepository<IReview> {
  constructor() {
    super(Review as any);
  }

  async findWithFilters(filters: ReviewFilters): Promise<{
    reviews: IReview[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    const filter = this.buildFilterQuery(filters);
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const sortBy = filters.sortBy || "submittedAt";
    const order = filters.order === "asc" ? 1 : -1;

    const result = await this.findWithPagination(filter, page, limit, {
      [sortBy]: order,
    });
    return {
      reviews: result.documents,
      total: result.total,
      page: result.page,
      limit: result.limit,
      pages: result.pages,
    };
  }

  async findByExternalId(externalId: number): Promise<IReview | null> {
    return await this.findOne({ externalId });
  }

  async findByListingId(
    listingId: string,
    options: {
      showOnWebsite?: boolean;
      status?: string;
      limit?: number;
      sort?: Record<string, 1 | -1>;
    } = {}
  ): Promise<IReview[]> {
    const filter: FilterQuery<IReview> = { listingId };

    if (options.showOnWebsite !== undefined) {
      filter.showOnWebsite = options.showOnWebsite;
    }

    if (options.status) {
      filter.status = options.status;
    }

    const queryOptions: any = {};
    if (options.limit) {
      queryOptions.limit = options.limit;
    }
    if (options.sort) {
      queryOptions.sort = options.sort;
    }

    return await this.findAll(filter, queryOptions);
  }

  async updateHelpfulCount(
    id: string,
    helpful: boolean
  ): Promise<IReview | null> {
    const update = helpful
      ? { $inc: { helpful: 1 } }
      : { $inc: { notHelpful: 1 } };

    return await this.updateById(id, update);
  }

  async getStatistics(filters: StatisticsFilters = {}): Promise<{
    overview: ReviewStatistics;
    categoryBreakdown: CategoryStatistics[];
    channelBreakdown: ChannelStatistics[];
    monthlyTrend: MonthlyTrend[];
  }> {
    const matchStage = this.buildStatisticsMatchStage(filters);

    // Overview statistics
    const overviewPipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
          publishedReviews: {
            $sum: { $cond: [{ $eq: ["$status", "published"] }, 1, 0] },
          },
          websiteReviews: {
            $sum: { $cond: ["$showOnWebsite", 1, 0] },
          },
        },
      },
    ];

    // Category breakdown
    const categoryPipeline = [
      { $match: matchStage },
      { $unwind: "$reviewCategory" },
      {
        $group: {
          _id: "$reviewCategory.category",
          avgRating: { $avg: "$reviewCategory.rating" },
          count: { $sum: 1 },
        },
      },
    ];

    // Channel breakdown
    const channelPipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: "$channel",
          count: { $sum: 1 },
          avgRating: { $avg: "$rating" },
        },
      },
    ];

    // Monthly trend
    const monthlyPipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: "$submittedAt" },
            month: { $month: "$submittedAt" },
          },
          count: { $sum: 1 },
          avgRating: { $avg: "$rating" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ];

    const [overview, categoryBreakdown, channelBreakdown, monthlyTrend] =
      await Promise.all([
        this.aggregate<ReviewStatistics>(overviewPipeline),
        this.aggregate<CategoryStatistics>(categoryPipeline),
        this.aggregate<ChannelStatistics>(channelPipeline),
        this.aggregate<MonthlyTrend>(monthlyPipeline),
      ]);

    return {
      overview: overview[0] || {
        avgRating: 0,
        totalReviews: 0,
        publishedReviews: 0,
        websiteReviews: 0,
      },
      categoryBreakdown,
      channelBreakdown,
      monthlyTrend,
    };
  }

  async findPublishedByListingId(listingId: string): Promise<IReview[]> {
    return await this.findByListingId(listingId, {
      status: "published",
    });
  }

  async upsertByExternalId(
    externalId: number,
    reviewData: Partial<IReview>
  ): Promise<IReview> {
    return await this.upsert({ externalId }, reviewData);
  }

  private buildFilterQuery(filters: ReviewFilters): FilterQuery<IReview> {
    const filter: FilterQuery<IReview> = {};

    if (filters.listingId) filter.listingId = filters.listingId;
    if (filters.channel) filter.channel = filters.channel;
    if (filters.rating) filter.rating = { $gte: Number(filters.rating) };
    if (filters.status) filter.status = filters.status;
    if (filters.showOnWebsite !== undefined)
      filter.showOnWebsite = filters.showOnWebsite;

    if (filters.startDate || filters.endDate) {
      filter.submittedAt = {};
      if (filters.startDate)
        filter.submittedAt.$gte = new Date(filters.startDate);
      if (filters.endDate) filter.submittedAt.$lte = new Date(filters.endDate);
    }

    return filter;
  }

  private buildStatisticsMatchStage(
    filters: StatisticsFilters
  ): FilterQuery<IReview> {
    const matchStage: FilterQuery<IReview> = { status: "published" };

    if (filters.listingId) matchStage.listingId = filters.listingId;

    if (filters.startDate || filters.endDate) {
      matchStage.submittedAt = {};
      if (filters.startDate)
        matchStage.submittedAt.$gte = new Date(filters.startDate);
      if (filters.endDate)
        matchStage.submittedAt.$lte = new Date(filters.endDate);
    }

    return matchStage;
  }

  async bulkUpdate(reviewIds: string[], updates: any): Promise<any> {
    const objectIds = reviewIds.map((id) => new Types.ObjectId(id));

    const result = await Review.updateMany(
      { _id: { $in: objectIds } },
      { $set: updates }
    );

    return result;
  }

  async delete(id: string): Promise<boolean> {
    const result = await Review.findByIdAndDelete(id);
    return !!result;
  }
}

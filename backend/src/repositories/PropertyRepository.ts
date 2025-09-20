import { FilterQuery } from "mongoose";
import Property from "../models/Property";
import { BaseRepository } from "./BaseRepository";
import { IProperty, PropertyFilters } from "../types";

export class PropertyRepository extends BaseRepository<IProperty> {
  constructor() {
    super(Property as any);
  }

  async findWithFilters(filters: PropertyFilters): Promise<IProperty[]> {
    const filter = this.buildFilterQuery(filters);
    const sortBy = filters.sortBy || "avgRating";
    const order = filters.order === "asc" ? 1 : -1;

    return await this.findAll(filter, { sort: { [sortBy]: order } });
  }

  async findByExternalId(externalId: string): Promise<IProperty | null> {
    return await this.findOne({ externalId });
  }

  async findByIdOrExternalId(identifier: string): Promise<IProperty | null> {
    // Try to find by MongoDB _id first, then by externalId
    const byId = await this.findById(identifier);
    if (byId) return byId;

    return await this.findByExternalId(identifier);
  }

  async findActiveProperties(
    sortBy: string = "avgRating",
    order: "asc" | "desc" = "desc"
  ): Promise<IProperty[]> {
    return await this.findWithFilters({
      isActive: true,
      sortBy,
      order,
    });
  }

  async findInactiveProperties(): Promise<IProperty[]> {
    return await this.findAll({ isActive: false });
  }

  async updateStatistics(
    externalId: string,
    avgRating: number,
    totalReviews: number
  ): Promise<IProperty | null> {
    return await this.updateOne(
      { externalId },
      {
        avgRating: Math.round(avgRating * 10) / 10,
        totalReviews,
      }
    );
  }

  async upsertByExternalId(
    externalId: string,
    propertyData: Partial<IProperty>
  ): Promise<IProperty> {
    return await this.upsert({ externalId }, propertyData);
  }

  async activateProperty(externalId: string): Promise<IProperty | null> {
    return await this.updateOne({ externalId }, { isActive: true });
  }

  async deactivateProperty(externalId: string): Promise<IProperty | null> {
    return await this.updateOne({ externalId }, { isActive: false });
  }

  async findPropertiesWithRatingAbove(minRating: number): Promise<IProperty[]> {
    return await this.findAll({
      avgRating: { $gte: minRating },
      isActive: true,
    });
  }

  async findPropertiesWithRatingBelow(maxRating: number): Promise<IProperty[]> {
    return await this.findAll({
      avgRating: { $lte: maxRating },
      isActive: true,
    });
  }

  async findPropertiesByType(type: string): Promise<IProperty[]> {
    return await this.findAll({
      type,
      isActive: true,
    });
  }

  async findPropertiesByCapacity(
    minGuests: number,
    maxGuests?: number
  ): Promise<IProperty[]> {
    const filter: FilterQuery<IProperty> = {
      maxGuests: { $gte: minGuests },
      isActive: true,
    };

    if (maxGuests) {
      filter.maxGuests = { ...filter.maxGuests, $lte: maxGuests };
    }

    return await this.findAll(filter);
  }

  async getPropertyStatistics(): Promise<{
    totalProperties: number;
    activeProperties: number;
    inactiveProperties: number;
    averageRating: number;
    totalReviews: number;
    propertiesByType: Array<{ _id: string; count: number }>;
  }> {
    const [
      totalProperties,
      activeProperties,
      inactiveProperties,
      avgRatingResult,
      totalReviewsResult,
      propertiesByType,
    ] = await Promise.all([
      this.count(),
      this.count({ isActive: true }),
      this.count({ isActive: false }),
      this.aggregate([
        { $match: { isActive: true, avgRating: { $exists: true } } },
        { $group: { _id: null, avgRating: { $avg: "$avgRating" } } },
      ]),
      this.aggregate([
        { $match: { isActive: true, totalReviews: { $exists: true } } },
        { $group: { _id: null, totalReviews: { $sum: "$totalReviews" } } },
      ]),
      this.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: "$type", count: { $sum: 1 } } },
      ]),
    ]);

    return {
      totalProperties,
      activeProperties,
      inactiveProperties,
      averageRating: (avgRatingResult[0] as any)?.avgRating || 0,
      totalReviews: (totalReviewsResult[0] as any)?.totalReviews || 0,
      propertiesByType: propertiesByType as Array<{
        _id: string;
        count: number;
      }>,
    };
  }

  private buildFilterQuery(filters: PropertyFilters): FilterQuery<IProperty> {
    const filter: FilterQuery<IProperty> = {};

    if (filters.isActive !== undefined) {
      filter.isActive = filters.isActive;
    } else {
      // Default to active properties only
      filter.isActive = true;
    }

    return filter;
  }
}

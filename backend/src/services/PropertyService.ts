import { PropertyRepository } from "../repositories/PropertyRepository";
import { BaseService } from "./BaseService";
import {
  IProperty,
  Property,
  PropertyFilters,
  PropertyWithReviews,
  ApiResponse,
} from "../types";
import {
  CreatePropertyData,
  UpdatePropertyData,
  PROPERTY_VALIDATION_RULES,
  NotFoundError,
} from "../types/validation";

export class PropertyService extends BaseService {
  private propertyRepository: PropertyRepository;

  constructor(propertyRepository: PropertyRepository) {
    super();
    this.propertyRepository = propertyRepository;
  }

  async getAllProperties(
    filters: PropertyFilters = {}
  ): Promise<ApiResponse<Property[]>> {
    const properties = await this.propertyRepository.findWithFilters(filters);

    return {
      status: "success",
      data: properties.map(this.transformPropertyDocument),
    };
  }

  async getPropertyById(id: string): Promise<Property> {
    const property = await this.propertyRepository.findByExternalId(id);
    if (!property) {
      throw new NotFoundError("Property", id);
    }

    return this.transformPropertyDocument(property);
  }

  async getPropertyWithReviews(
    id: string,
    reviewService?: any
  ): Promise<PropertyWithReviews> {
    const property = await this.getPropertyById(id);
    console.log(property);
    

    let reviews: any[] = [];
    if (reviewService) {
      reviews = await reviewService.getReviewsByListingId(property.externalId, {
        showOnWebsite: true,
        status: "published",
        limit: 10,
      });
    }

    return {
      property,
      reviews,
    };
  }

  async createProperty(propertyData: CreatePropertyData): Promise<Property> {
    // Validate input data
    const validation = this.validateData(
      propertyData,
      PROPERTY_VALIDATION_RULES
    );
    if (!validation.isValid) {
      this.throwValidationError(validation.errors);
    }

    // Transform and sanitize data
    const transformedData = this.transformCreateData(propertyData);

    // Check if property with same external ID already exists
    if (transformedData.externalId) {
      const existingProperty = await this.propertyRepository.findByExternalId(
        transformedData.externalId
      );
      if (existingProperty) {
        throw new Error(
          `Property with external ID ${transformedData.externalId} already exists`
        );
      }
    }

    const createdProperty = await this.propertyRepository.create(
      transformedData
    );
    return this.transformPropertyDocument(createdProperty);
  }

  async updateProperty(
    id: string,
    updateData: UpdatePropertyData
  ): Promise<Property> {
    // Validate update data
    const allowedFields = [
      "name",
      "address",
      "type",
      "bedrooms",
      "bathrooms",
      "maxGuests",
      "imageUrl",
      "description",
      "amenities",
      "isActive",
    ];

    const filteredData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        if (typeof value === "string") {
          filteredData[key] = this.sanitizeString(value);
        } else {
          filteredData[key] = value;
        }
      }
    }

    const updatedProperty = await this.propertyRepository.updateById(
      id,
      filteredData
    );
    if (!updatedProperty) {
      throw new NotFoundError("Property", id);
    }

    return this.transformPropertyDocument(updatedProperty);
  }

  async updatePropertyStatistics(
    externalId: string,
    avgRating: number,
    totalReviews: number
  ): Promise<void> {
    await this.propertyRepository.updateStatistics(
      externalId,
      avgRating,
      totalReviews
    );
  }

  async upsertProperty(
    externalId: string,
    propertyData: CreatePropertyData
  ): Promise<Property> {
    const transformedData = this.transformCreateData(propertyData);
    const upsertedProperty = await this.propertyRepository.upsertByExternalId(
      externalId,
      transformedData
    );

    return this.transformPropertyDocument(upsertedProperty);
  }

  async getActiveProperties(
    sortBy: string = "avgRating",
    order: "asc" | "desc" = "desc"
  ): Promise<Property[]> {
    const properties = await this.propertyRepository.findActiveProperties(
      sortBy,
      order
    );
    return properties.map(this.transformPropertyDocument);
  }

  async activateProperty(externalId: string): Promise<Property> {
    const property = await this.propertyRepository.activateProperty(externalId);
    if (!property) {
      throw new NotFoundError("Property", externalId);
    }

    return this.transformPropertyDocument(property);
  }

  async deactivateProperty(externalId: string): Promise<Property> {
    const property = await this.propertyRepository.deactivateProperty(
      externalId
    );
    if (!property) {
      throw new NotFoundError("Property", externalId);
    }

    return this.transformPropertyDocument(property);
  }

  async getPropertiesByType(type: string): Promise<Property[]> {
    const properties = await this.propertyRepository.findPropertiesByType(type);
    return properties.map(this.transformPropertyDocument);
  }

  async getPropertiesByCapacity(
    minGuests: number,
    maxGuests?: number
  ): Promise<Property[]> {
    const properties = await this.propertyRepository.findPropertiesByCapacity(
      minGuests,
      maxGuests
    );
    return properties.map(this.transformPropertyDocument);
  }

  async getPropertiesWithHighRating(
    minRating: number = 8
  ): Promise<Property[]> {
    const properties =
      await this.propertyRepository.findPropertiesWithRatingAbove(minRating);
    return properties.map(this.transformPropertyDocument);
  }

  async getPropertiesWithLowRating(maxRating: number = 6): Promise<Property[]> {
    const properties =
      await this.propertyRepository.findPropertiesWithRatingBelow(maxRating);
    return properties.map(this.transformPropertyDocument);
  }

  async getPropertyStatistics(): Promise<{
    totalProperties: number;
    activeProperties: number;
    inactiveProperties: number;
    averageRating: number;
    totalReviews: number;
    propertiesByType: Array<{ _id: string; count: number }>;
  }> {
    return await this.propertyRepository.getPropertyStatistics();
  }

  private transformCreateData(data: CreatePropertyData): Partial<IProperty> {
    return {
      externalId: data.externalId,
      name: this.sanitizeString(data.name),
      address: this.sanitizeString(data.address),
      type: data.type,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      maxGuests: data.maxGuests,
      imageUrl: data.imageUrl,
      description: data.description
        ? this.sanitizeString(data.description)
        : undefined,
      amenities: data.amenities,
      isActive: data.isActive !== undefined ? data.isActive : true,
      avgRating: 0,
      totalReviews: 0,
    };
  }

  private transformPropertyDocument(property: IProperty): Property {
    return {
      _id: property._id.toString(),
      externalId: property.externalId,
      name: property.name,
      address: property.address,
      type: property.type,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      maxGuests: property.maxGuests,
      imageUrl: property.imageUrl,
      description: property.description,
      amenities: property.amenities,
      avgRating: property.avgRating,
      totalReviews: property.totalReviews,
      isActive: property.isActive,
      createdAt: property.createdAt,
      updatedAt: property.updatedAt,
    };
  }

  async create(propertyData: any): Promise<Property> {
    const sanitizedData = this.sanitizePropertyData(propertyData);
    const property = await this.propertyRepository.create(sanitizedData);
    return this.transformPropertyDocument(property);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.propertyRepository.delete(id);
    return result;
  }

  private sanitizePropertyData(data: any): any {
    return {
      externalId: data.externalId,
      name: this.sanitizeString(data.name),
      address: this.sanitizeString(data.address),
      type: data.type,
      bedrooms: Number(data.bedrooms),
      bathrooms: Number(data.bathrooms),
      maxGuests: Number(data.maxGuests),
      imageUrl: data.imageUrl,
      description: data.description
        ? this.sanitizeString(data.description)
        : undefined,
      amenities: Array.isArray(data.amenities) ? data.amenities : [],
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
    };
  }

  protected sanitizeString(str: string): string {
    return str.trim().replace(/[<>]/g, "");
  }
}

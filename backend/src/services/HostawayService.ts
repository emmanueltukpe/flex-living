import axios from "axios";
import { BaseService } from "./BaseService";
import { ReviewService } from "./ReviewService";
import { PropertyService } from "./PropertyService";
import {
  HostawayReview,
  HostawayProperty,
  HostawayApiResponse,
  SyncResponse,
  Review,
  ReviewCategory,
} from "../types";
import { ExternalApiError } from "../types/validation";
import mockData from "../data/mockReviews.json";
import { env } from "../config";

export class HostawayService extends BaseService {
  private reviewService: ReviewService;
  private propertyService: PropertyService;
  private apiUrl: string;
  private apiKey: string;
  private accountId: string;

  constructor(reviewService: ReviewService, propertyService: PropertyService) {
    super();
    this.reviewService = reviewService;
    this.propertyService = propertyService;
    this.apiUrl = String(env.hostaway.apiUrl);
    this.apiKey = String(env.hostaway.apiKey);
    this.accountId = String(env.hostaway.accountId);
  }

  async fetchReviews(useApi: boolean = false): Promise<{
    status: "success" | "error";
    result: Review[];
    count: number;
    source: string;
  }> {
    let reviews: HostawayReview[] = [];
    let source = "mock";

    if (useApi && this.isApiConfigured()) {
      try {
        console.log("I got here");

        const apiReviews = await this.fetchReviewsFromApi();
        console.log(666);
        
        if (apiReviews.length > 0) {
          reviews = apiReviews;
          source = "hostaway";
        }
      } catch (error) {
        // Fall back to mock data if API fails
        reviews = mockData.reviews as HostawayReview[];
      }
    } else {
      reviews = mockData.reviews as HostawayReview[];
    }

    // Normalize and save reviews
    const normalizedReviews: Review[] = [];
    for (const review of reviews) {
      const normalizedReview = this.normalizeReview(review, source);
      const savedReview = await this.reviewService.upsertReview(
        normalizedReview.externalId,
        normalizedReview
      );
      normalizedReviews.push(savedReview);
    }

    return {
      status: "success",
      result: normalizedReviews,
      count: normalizedReviews.length,
      source,
    };
  }

  async syncData(): Promise<SyncResponse> {
    try {
      let propertiesCount = 0;
      let reviewsCount = 0;

      // Sync properties
      for (const propertyData of mockData.properties) {
        await this.propertyService.upsertProperty(propertyData.id, {
          externalId: propertyData.id,
          name: propertyData.name,
          address: propertyData.address,
          type: propertyData.type as any,
          bedrooms: propertyData.bedrooms,
          bathrooms: propertyData.bathrooms,
          maxGuests: propertyData.maxGuests,
          imageUrl: propertyData.imageUrl,
          isActive: true,
        });
        propertiesCount++;
      }

      // Sync reviews
      const reviewsResult = await this.fetchReviews(false);
      reviewsCount = reviewsResult.count;

      // Update property statistics
      await this.updateAllPropertyStatistics();

      return {
        status: "success",
        message: "Data synchronized successfully",
        properties: propertiesCount,
        reviews: reviewsCount,
      };
    } catch (error) {
      return {
        status: "error",
        message: error instanceof Error ? error.message : "Failed to sync data",
      };
    }
  }

  private async fetchReviewsFromApi(): Promise<HostawayReview[]> {
    try {
      const response = await axios.get<HostawayApiResponse>(
        `${this.apiUrl}/reviews`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Account-Id": this.accountId,
          },
          timeout: 10000,
        }
      );

      if (response.data && response.data.result) {
        return response.data.result;
      }

      return [];
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new ExternalApiError("Hostaway", error.message, error);
      }
      throw new ExternalApiError(
        "Hostaway",
        "Unknown API error",
        error as Error
      );
    }
  }

  private normalizeReview(review: HostawayReview, source: string): any {
    return {
      externalId: review.id,
      type: review.type || "guest-to-host",
      status: review.status || "published",
      rating:
        review.rating ||
        this.calculateAverageRating(review.reviewCategory || []),
      publicReview: review.publicReview || "",
      privateReview: review.privateReview || "",
      reviewCategory: review.reviewCategory || [],
      submittedAt: review.submittedAt,
      guestName: review.guestName || "Anonymous",
      listingId: review.listingId || "",
      listingName: review.listingName || "",
      channel: review.channel || "Hostaway",
      reservationId: review.reservationId || "",
      source,
    };
  }

  private calculateAverageRating(categories: ReviewCategory[]): number {
    if (!categories || categories.length === 0) return 0;
    const ratings = categories.map((cat) => cat.rating);
    return Math.round(this.calculateAverage(ratings));
  }

  private async updateAllPropertyStatistics(): Promise<void> {
    const properties = await this.propertyService.getActiveProperties();

    for (const property of properties) {
      const reviews = await this.reviewService.getReviewsByListingId(
        property.externalId,
        {
          status: "published",
        }
      );

      if (reviews.length > 0) {
        const ratings = reviews.map((review) => review.rating);
        const avgRating = this.calculateAverage(ratings);

        await this.propertyService.updatePropertyStatistics(
          property.externalId,
          avgRating,
          reviews.length
        );
      }
    }
  }

  private isApiConfigured(): boolean {
    console.log(this.apiUrl, this.apiKey, this.accountId);
    return !!(this.apiUrl && this.apiKey && this.accountId);
  }

  async getApiStatus(): Promise<{
    configured: boolean;
    url?: string;
    accountId?: string;
  }> {
    return {
      configured: this.isApiConfigured(),
      url: this.apiUrl || undefined,
      accountId: this.accountId || undefined,
    };
  }

  async testApiConnection(): Promise<{
    success: boolean;
    message: string;
    error?: string;
  }> {
    if (!this.isApiConfigured()) {
      return {
        success: false,
        message: "API not configured. Missing URL, API key, or account ID.",
      };
    }

    try {
      const response = await axios.get(`${this.apiUrl}/reviews`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Account-Id": this.accountId,
        },
        timeout: 5000,
      });

      return {
        success: true,
        message: "API connection successful",
      };
    } catch (error) {
      return {
        success: false,
        message: "API connection failed",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

import axios from "axios";
import { BaseService } from "./BaseService";
import {
  GoogleReview,
  GooglePlace,
  GoogleApiResponse,
  GooglePlaceSearchResult,
  Review,
} from "../types";
import { ExternalApiError } from "../types/validation";
import { env } from "../config";

export class GoogleService extends BaseService {
  private apiKey: string;
  private baseUrl: string = "https://maps.googleapis.com/maps/api/place";

  constructor(apiKey?: string) {
    super();
    this.apiKey = apiKey || env.googlePlacesAPIKey || "";
  }

  async getReviews(placeId: string): Promise<{
    status: "success" | "error";
    message?: string;
    data?: {
      placeName: string;
      placeRating: number;
      totalRatings: number;
      reviews: Review[];
    };
    documentation?: any;
  }> {
    if (!placeId) {
      return {
        status: "error",
        message: "Place ID is required",
        documentation: this.getDocumentation(),
      };
    }

    if (!this.isApiConfigured()) {
      return {
        status: "success",
        message:
          "Google API key not configured. Returning mock data for demonstration.",
        data: this.getMockReviewsData(),
        documentation: {
          note: "To enable real Google Reviews, add your API key to .env file",
        },
      };
    }

    try {
      const place = await this.fetchPlaceDetails(placeId);
      const normalizedReviews = this.normalizeGoogleReviews(
        place.reviews || [],
        placeId
      );

      return {
        status: "success",
        data: {
          placeName: place.name,
          placeRating: place.rating,
          totalRatings: place.user_ratings_total,
          reviews: normalizedReviews,
        },
      };
    } catch (error) {
      if (error instanceof ExternalApiError) {
        return {
          status: "error",
          message: error.message,
        };
      }

      return {
        status: "error",
        message: "Failed to fetch Google reviews",
      };
    }
  }

  async searchPlaces(query: string): Promise<{
    status: "success" | "error";
    message?: string;
    data?: GooglePlaceSearchResult[];
  }> {
    if (!query) {
      return {
        status: "error",
        message: "Search query is required",
      };
    }

    if (!this.isApiConfigured()) {
      return {
        status: "error",
        message: "Google API key not configured",
        data: [],
      };
    }

    try {
      const places = await this.searchPlacesApi(query);
      return {
        status: "success",
        data: places,
      };
    } catch (error) {
      return {
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to search for places",
      };
    }
  }

  private async fetchPlaceDetails(placeId: string): Promise<GooglePlace> {
    try {
      const response = await axios.get<GoogleApiResponse>(
        `${this.baseUrl}/details/json`,
        {
          params: {
            place_id: placeId,
            fields: "name,rating,user_ratings_total,reviews",
            key: this.apiKey,
          },
          timeout: 10000,
        }
      );

      if (response.data.status !== "OK") {
        throw new ExternalApiError(
          "Google Places",
          response.data.error_message || response.data.status
        );
      }

      return response.data.result;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new ExternalApiError("Google Places", error.message, error);
      }
      throw error;
    }
  }

  private async searchPlacesApi(
    query: string
  ): Promise<GooglePlaceSearchResult[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/textsearch/json`, {
        params: {
          query: query,
          key: this.apiKey,
        },
        timeout: 10000,
      });

      if (response.data.status !== "OK") {
        throw new ExternalApiError(
          "Google Places",
          response.data.error_message || response.data.status
        );
      }

      return response.data.results.map((place: any) => ({
        placeId: place.place_id,
        name: place.name,
        address: place.formatted_address,
        rating: place.rating,
        totalRatings: place.user_ratings_total,
      }));
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new ExternalApiError("Google Places", error.message, error);
      }
      throw error;
    }
  }

  private normalizeGoogleReviews(
    googleReviews: GoogleReview[],
    placeId: string
  ): Review[] {
    return googleReviews.map((review, index) => ({
      _id: `google_${placeId}_${index}`,
      externalId: parseInt(`${Date.now()}${index}`), // Generate unique ID
      type: "guest-to-host" as const,
      status: "published" as const,
      rating: review.rating * 2, // Convert 5-star to 10-star scale
      publicReview: review.text || "",
      privateReview: undefined,
      reviewCategory: [],
      submittedAt: new Date(review.time * 1000),
      guestName: review.author_name,
      listingId: placeId,
      listingName: "Google Place",
      channel: "Google" as const,
      reservationId: `google_${placeId}_${index}`,
      showOnWebsite: false,
      responseText: undefined,
      respondedAt: undefined,
      helpful: 0,
      notHelpful: 0,
    }));
  }

  private getMockReviewsData(): {
    placeName: string;
    placeRating: number;
    totalRatings: number;
    reviews: Review[];
  } {
    return {
      placeName: "FlexLiving Property",
      placeRating: 4.5,
      totalRatings: 127,
      reviews: [
        {
          _id: "google_mock_1",
          externalId: 999001,
          type: "guest-to-host",
          status: "published",
          rating: 9,
          publicReview:
            "Excellent location and very clean apartment. The host was very responsive.",
          privateReview: undefined,
          reviewCategory: [],
          submittedAt: new Date("2024-02-01"),
          guestName: "John Doe",
          listingId: "mock_place_id",
          listingName: "FlexLiving Property",
          channel: "Google",
          reservationId: "google_mock_1",
          showOnWebsite: false,
          responseText: undefined,
          respondedAt: undefined,
          helpful: 0,
          notHelpful: 0,
        },
        {
          _id: "google_mock_2",
          externalId: 999002,
          type: "guest-to-host",
          status: "published",
          rating: 8,
          publicReview:
            "Great place to stay. Only minor issue was with parking.",
          privateReview: undefined,
          reviewCategory: [],
          submittedAt: new Date("2024-01-28"),
          guestName: "Jane Smith",
          listingId: "mock_place_id",
          listingName: "FlexLiving Property",
          channel: "Google",
          reservationId: "google_mock_2",
          showOnWebsite: false,
          responseText: undefined,
          respondedAt: undefined,
          helpful: 0,
          notHelpful: 0,
        },
      ],
    };
  }

  private getDocumentation(): any {
    return {
      feasibility: "Google Reviews can be integrated using Google Places API",
      requirements: [
        "1. Google Cloud Platform account",
        "2. Enable Places API",
        "3. Get API key with proper restrictions",
        "4. Find Place IDs for each property",
      ],
      implementation: {
        endpoint: "https://maps.googleapis.com/maps/api/place/details/json",
        parameters: {
          place_id: "Property Place ID from Google",
          fields: "reviews,rating,user_ratings_total",
          key: "Your Google API Key",
        },
      },
      limitations: [
        "Maximum 5 most relevant reviews per place",
        "Cannot get all reviews",
        "Reviews are selected by Google algorithm",
        "Requires finding Place ID for each property",
        "API has usage limits and costs",
      ],
      alternativeSolutions: [
        "Google My Business API for managed locations",
        "Web scraping (against ToS)",
        "Third-party review aggregation services",
      ],
    };
  }

  private isApiConfigured(): boolean {
    return !!(this.apiKey && this.apiKey !== "your_google_places_api_key_here");
  }

  getApiStatus(): {
    configured: boolean;
    hasKey: boolean;
  } {
    return {
      configured: this.isApiConfigured(),
      hasKey: !!this.apiKey,
    };
  }
}

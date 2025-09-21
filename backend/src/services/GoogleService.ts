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
  private baseUrl: string = env.googlePlacesBaseUrl as string;

  constructor(apiKey?: string) {
    super();
    this.apiKey = apiKey || env.googlePlacesAPIKey || "";
  }

  async getReviews(placeId: string): Promise<{
    status: "success" | "error";
    message?: string;
    data?: {
      placeId?: string;
      name: string;
      address: string;
      rating: number;
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
          placeId: place.name,
          name: place.displayName.text,
          address: place.formattedAddress,
          rating: place.rating,
          totalRatings: place.userRatingCount,
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
      console.log(error);

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
      const response = await axios.get(
        `${this.baseUrl}/places/${placeId}?fields=name,displayName,formattedAddress,rating,userRatingCount,reviews`,
        {
          params: {
            // place_id: placeId,
            // fields: "name,rating,user_ratings_total,reviews",
            key: this.apiKey,
          },
          timeout: 10000,
        }
      );

      if (response.status !== 200) {
        console.log(response.data);
        throw new ExternalApiError(
          "Google Places",
          response.data.error_message || response.data.status
        );
      }

      return response.data;
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
    const requestBody = {
      textQuery: query,
    };

    const headers = {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": this.apiKey,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.reviews",
    };

    try {
      const response = await axios.post(
        `${this.baseUrl}/places:searchText`,
        requestBody,
        { headers: headers, timeout: 10000 }
      );

      const places = response.data.places || [];

      return places.map((place: any) => ({
        placeId: place.id,
        name: place.displayName,
        address: place.formattedAddress,
        rating: place.rating,
        totalRatings: place.userRatingCount,
        reviews: this.normalizeGoogleReviews(place.reviews, place.id),
      }));
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Google Places API Error:", error.response?.data);
        throw new ExternalApiError(
          "Google Places",
          error.message,
          error.response?.data
        );
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
      publicReview: review.text.text || "",
      privateReview: undefined,
      reviewCategory: [],
      submittedAt: new Date(review.publishTime),
      guestName: review.authorAttribution.displayName,
      listingId: placeId,
      listingName: "Google Place",
      channel: "Google" as const,
      reservationId: `google_${placeId}_${index}`,
      showOnWebsite: false,
      responseText: undefined,
      respondedAt: undefined,
      helpful: 0,
      notHelpful: 0,
      source: review.googleMapsUri,
    }));
  }

  private getMockReviewsData(): {
    name: string;
    rating: number;
    totalRatings: number;
    address: string;
    reviews: Review[];
  } {
    return {
      name: "FlexLiving Property",
      rating: 4.5,
      totalRatings: 127,
      address: "123 Main St, Anytown, USA",
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
      feasibility:
        "FEASIBLE - Google Reviews can be integrated using Google Places API",
      status: "Successfully implemented with mock data fallback",
      requirements: [
        "1. Google Cloud Platform account with billing enabled",
        "2. Enable Places API (New) in Google Cloud Console",
        "3. Create API key with proper restrictions (HTTP referrers or IP addresses)",
        "4. Find Place IDs for each property using Place Search API",
        "5. Set GOOGLE_PLACES_API_KEY environment variable",
      ],
      implementation: {
        primaryEndpoint: "https://maps.googleapis.com/maps/api/place/details",
        searchEndpoint: "https://maps.googleapis.com/maps/api/place/textsearch",
        parameters: {
          place_id:
            "Property Place ID from Google (e.g., ChIJN1t_tDeuEmsRUsoyG83frY4)",
          fields: "name,rating,userRatingCount,reviews",
          key: "Your Google API Key",
        },
        sampleRequest:
          "GET /api/google/reviews?placeId=ChIJN1t_tDeuEmsRUsoyG83frY4",
      },
      limitations: [
        "Maximum 5 most relevant reviews per place (Google's limitation)",
        "Cannot retrieve all reviews - only those selected by Google's algorithm",
        "Reviews are in English or the language of the reviewer",
        "No control over which reviews are returned",
        "API has usage limits: $17 per 1000 requests for Place Details",
        "Rate limiting: 100 requests per second per project",
      ],
      benefits: [
        "High-quality, verified reviews from Google users",
        "Includes reviewer names and profile photos",
        "Reviews are moderated by Google",
        "Provides overall rating and total review count",
        "Real-time data directly from Google",
      ],
      alternativeSolutions: [
        "Google My Business API - for businesses you own/manage",
        "Google Business Profile API - newer alternative to My Business API",
        "Third-party review aggregation services (ReviewTrackers, Podium)",
        "Direct integration with booking platforms (Airbnb, Booking.com)",
        "Web scraping (NOT RECOMMENDED - violates Terms of Service)",
      ],
      costEstimate: {
        placeDetails: "$17 per 1000 requests",
        placeSearch: "$32 per 1000 requests",
        monthlyEstimate: "~$50-200 for typical property management company",
      },
      setupInstructions: [
        "1. Go to Google Cloud Console (console.cloud.google.com)",
        "2. Create a new project or select existing one",
        "3. Enable Places API (New) in API Library",
        "4. Create credentials (API Key) in Credentials section",
        "5. Restrict API key to specific APIs and domains/IPs",
        "6. Add API key to .env file as GOOGLE_PLACES_API_KEY",
        "7. Test with /api/google/status endpoint",
      ],
    };
  }

  private isApiConfigured(): boolean {
    return !!(this.apiKey && this.apiKey !== "your_google_places_api_key_here");
  }

  getApiStatus(): {
    configured: boolean;
    hasKey: boolean;
    documentation: any;
    testEndpoints: string[];
  } {
    return {
      configured: this.isApiConfigured(),
      hasKey: !!this.apiKey,
      documentation: this.getDocumentation(),
      testEndpoints: [
        "GET /api/google/status - Check API configuration status",
        "GET /api/google/reviews?placeId=ChIJN1t_tDeuEmsRUsoyG83frY4 - Get reviews for a place",
        "GET /api/google/place-search?query=FlexLiving+London - Search for places",
      ],
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
        message:
          "Google Places API not configured. Please set GOOGLE_PLACES_API_KEY environment variable.",
      };
    }

    try {
      // Test with a well-known place ID (Google Sydney office)
      const testPlaceId = "ChIJN1t_tDeuEmsRUsoyG83frY4";
      const response = await axios.get(`${this.baseUrl}/details/json`, {
        params: {
          place_id: testPlaceId,
          fields: "name,rating",
          key: this.apiKey,
        },
        timeout: 5000,
      });

      if (response.data.status === "OK") {
        return {
          success: true,
          message: "Google Places API connection successful",
        };
      } else {
        return {
          success: false,
          message: `Google Places API error: ${response.data.status}`,
          error: response.data.error_message || "Unknown API error",
        };
      }
    } catch (error) {
      return {
        success: false,
        message: "Failed to connect to Google Places API",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}


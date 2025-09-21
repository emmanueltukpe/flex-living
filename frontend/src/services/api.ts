import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5001/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Types
export interface ReviewCategory {
  category: string;
  rating: number;
}

export interface Review {
  _id: string;
  externalId: number;
  type: "guest-to-host" | "host-to-guest";
  status: "published" | "pending" | "rejected";
  rating: number;
  publicReview: string;
  privateReview?: string;
  reviewCategory: ReviewCategory[];
  submittedAt: string;
  guestName: string;
  listingId: string;
  listingName: string;
  channel: string;
  reservationId: string;
  showOnWebsite: boolean;
  responseText?: string;
  respondedAt?: string;
  helpful?: number;
  notHelpful?: number;
}

export interface Property {
  _id: string;
  externalId: string;
  name: string;
  address: string;
  type: string;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  imageUrl?: string;
  description?: string;
  amenities?: string[];
  avgRating?: number;
  totalReviews?: number;
  isActive: boolean;
}

export interface ReviewStatistics {
  overview: {
    avgRating: number;
    totalReviews: number;
    publishedReviews: number;
    websiteReviews: number;
  };
  categoryBreakdown: Array<{
    _id: string;
    avgRating: number;
    count: number;
  }>;
  channelBreakdown: Array<{
    _id: string;
    count: number;
    avgRating: number;
  }>;
  monthlyTrend: Array<{
    _id: { year: number; month: number };
    count: number;
    avgRating: number;
  }>;
}

// Google Places Types
export interface GooglePlace {
  placeId: string;
  name:
    | string
    | {
        text: string;
        languageCode: string;
      };
  address: string;
  rating?: number;
  totalRatings?: number;
  reviews?: GoogleReview[];
}

export interface GoogleReview {
  name: string;
  relativePublishTimeDescription: string;
  rating: number;
  text: {
    text: string;
    languageCode: string;
  };
  originalText: {
    text: string;
    languageCode: string;
  };
  authorAttribution: {
    displayName: string;
    uri: string;
    photoUri: string;
  };
  publishTime: string;
  flagContentUri: string;
  googleMapsUri: string;
}

export interface GooglePlacesResponse {
  status: "success" | "error";
  message?: string;
  data?: {
    placeId?: string;
    name:
      | string
      | {
          text: string;
          languageCode: string;
        };
    address: string;
    rating: number;
    totalRatings: number;
    reviews: Review[];
  };
  documentation?: any;
}

export interface GooglePlaceSearchResult {
  placeId: string;
  name:
    | string
    | {
        text: string;
        languageCode: string;
      };
  address: string;
  rating?: number;
  totalRatings?: number;
  reviews?: GoogleReview[];
}

// API Methods

// Reviews
export const reviewsApi = {
  getAll: async (params?: any) => {
    const response = await api.get("/reviews", { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/reviews/${id}`);
    return response.data;
  },

  update: async (id: string, data: Partial<Review>) => {
    const response = await api.put(`/reviews/${id}`, data);
    return response.data;
  },

  getStatistics: async (params?: any) => {
    const response = await api.get("/reviews/statistics", { params });
    return response.data;
  },

  markHelpful: async (id: string, helpful: boolean) => {
    const response = await api.post(`/reviews/${id}/helpful`, { helpful });
    return response.data;
  },
};

// Properties
export const propertiesApi = {
  getAll: async (params?: any) => {
    const response = await api.get("/properties", { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/properties/${id}`);
    return response.data;
  },

  update: async (id: string, data: Partial<Property>) => {
    const response = await api.put(`/properties/${id}`, data);
    return response.data;
  },
};

// Hostaway
export const hostawayApi = {
  fetchReviews: async (useApi: boolean = false) => {
    const response = await api.get("/hostaway/reviews", {
      params: { useApi },
    });
    return response.data;
  },

  sync: async () => {
    const response = await api.post("/hostaway/sync");
    return response.data;
  },
};

// Google Places API
export const googleApi = {
  getReviews: async (placeId?: string): Promise<GooglePlacesResponse> => {
    try {
      const response = await api.get("/google/reviews", {
        params: { placeId },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching Google reviews:", error);
      return {
        status: "error",
        message: "Failed to fetch Google reviews",
      };
    }
  },

  searchPlaces: async (
    query: string
  ): Promise<{
    status: "success" | "error";
    data?: GooglePlaceSearchResult[];
    message?: string;
  }> => {
    try {
      const response = await api.get("/google/place-search", {
        params: { query },
      });
      return response.data;
    } catch (error) {
      console.error("Error searching Google places:", error);
      return {
        status: "error",
        message: "Failed to search Google places",
      };
    }
  },

  getApiStatus: async (): Promise<{
    configured: boolean;
    hasKey: boolean;
    documentation: any;
    testEndpoints: string[];
  }> => {
    try {
      const response = await api.get("/google/status");
      return response.data;
    } catch (error) {
      console.error("Error getting Google API status:", error);
      return {
        configured: false,
        hasKey: false,
        documentation: {},
        testEndpoints: [],
      };
    }
  },

  // Legacy method for backward compatibility
  searchPlace: async (query: string) => {
    return googleApi.searchPlaces(query);
  },
};

export default api;

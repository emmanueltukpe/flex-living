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

// Google Reviews
export const googleApi = {
  getReviews: async (placeId?: string) => {
    const response = await api.get("/google/reviews", {
      params: { placeId },
    });
    return response.data;
  },

  searchPlace: async (query: string) => {
    const response = await api.get("/google/place-search", {
      params: { query },
    });
    return response.data;
  },
};

export default api;

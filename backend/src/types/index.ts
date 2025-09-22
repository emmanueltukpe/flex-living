import { Document } from "mongoose";
import mongoose from "mongoose";

// Base API Response Types
export interface ApiResponse<T = unknown> {
  status: "success" | "error";
  message?: string;
  data?: T;
}

export interface ApiErrorResponse {
  status: "error";
  message: string;
  error?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationParams;
}

// Review Related Types
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
  submittedAt: Date;
  guestName: string;
  listingId: string;
  listingName: string;
  channel: string;
  reservationId: string;
  showOnWebsite: boolean;
  responseText?: string;
  respondedAt?: Date;
  helpful?: number;
  notHelpful?: number;
  source?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Mongoose Document Interfaces
export interface IReview extends Omit<Review, "_id">, Document {
  _id: mongoose.Types.ObjectId;
}

export interface ReviewFilters {
  listingId?: string;
  channel?: string;
  rating?: number;
  status?: string;
  showOnWebsite?: boolean;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface ReviewUpdateData {
  showOnWebsite?: boolean;
  responseText?: string;
  status?: "published" | "pending" | "rejected";
}

export interface ReviewHelpfulData {
  helpful: boolean;
}

// Property Related Types
export interface Property {
  _id: string;
  externalId: string;
  name: string;
  address: string;
  type: "Apartment" | "Studio" | "House" | "Penthouse" | "Villa" | "Other";
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  imageUrl?: string;
  description?: string;
  amenities?: string[];
  avgRating?: number;
  totalReviews?: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IProperty extends Omit<Property, "_id">, Document {
  _id: mongoose.Types.ObjectId;
}

export interface PropertyFilters {
  isActive?: boolean;
  sortBy?: string;
  order?: "asc" | "desc";
}

export interface PropertyWithReviews {
  property: Property;
  reviews: Review[];
}

// Statistics Types
export interface ReviewStatistics {
  avgRating: number;
  totalReviews: number;
  publishedReviews: number;
  websiteReviews: number;
}

export interface CategoryStatistics {
  _id: string;
  avgRating: number;
  count: number;
}

export interface ChannelStatistics {
  _id: string;
  count: number;
  avgRating: number;
}

export interface MonthlyTrend {
  _id: {
    year: number;
    month: number;
  };
  count: number;
  avgRating: number;
}

export interface StatisticsResponse {
  overview: ReviewStatistics;
  categoryBreakdown: CategoryStatistics[];
  channelBreakdown: ChannelStatistics[];
  monthlyTrend: MonthlyTrend[];
}

export interface StatisticsFilters {
  listingId?: string;
  startDate?: string;
  endDate?: string;
}

// External API Types
export interface HostawayReview {
  id: number;
  type?: string;
  status?: string;
  rating?: number;
  publicReview?: string;
  privateReview?: string;
  reviewCategory?: ReviewCategory[];
  submittedAt: string;
  guestName?: string;
  listingId?: string;
  listingName?: string;
  channel?: string;
  reservationId?: string;
}

export interface HostawayProperty {
  id: string;
  name: string;
  address: string;
  type: string;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  imageUrl?: string;
}

export interface HostawayApiResponse {
  result: HostawayReview[];
  count?: number;
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

export interface GooglePlace {
  name: string;
  displayName: {
    text: string;
    languageCode: string;
  };
  formattedAddress: string;
  rating: number;
  userRatingCount: number;
  reviews?: GoogleReview[];
}

export interface GoogleApiResponse {
  status: string;
  result: GooglePlace;
  error_message?: string;
}

export interface GooglePlaceSearchResult {
  placeId: string;
  name: string;
  address: string;
  rating?: number;
  totalRatings?: number;
  reviews?: GoogleReview[];
}

// Sync and Seed Types
export interface SyncResponse {
  status: "success" | "error";
  message: string;
  properties?: number;
  reviews?: number;
}

// Database Configuration Types
export interface DatabaseConfig {
  uri: string;
  options?: mongoose.ConnectOptions;
}

// Server Configuration Types
export interface ServerConfig {
  port: number;
  host: string;
  corsOrigin: string;
  mongoUri: string;
}

// Environment Variables Types
export interface EnvironmentVariables {
  PORT?: string;
  MONGODB_URI?: string;
  CORS_ORIGIN?: string;
  HOSTAWAY_ACCOUNT_ID?: string;
  HOSTAWAY_API_KEY?: string;
  HOSTAWAY_API_URL?: string;
  GOOGLE_PLACES_API_KEY?: string;
}

// Request/Response Handler Types
export interface RequestHandler<
  TParams = Record<string, string>,
  TQuery = Record<string, string>,
  TBody = unknown
> {
  params: TParams;
  query: TQuery;
  body: TBody;
}

export interface ResponseHandler<T = unknown> {
  json: (data: ApiResponse<T> | ApiErrorResponse) => void;
  status: (code: number) => ResponseHandler<T>;
}

// Health Monitoring Types
export interface HealthCheckResult {
  status: "healthy" | "unhealthy" | "degraded";
  timestamp: string;
  responseTime: number;
  httpStatusCode: number;
  endpoint: string;
  message?: string;
  error?: string;
  details?: {
    database?: {
      status: "healthy" | "unhealthy";
      state: string;
      host?: string;
      database?: string;
      error?: string;
    };
    uptime?: number;
  };
}

export interface HealthMonitoringLog {
  id: string;
  timestamp: string;
  checkResult: HealthCheckResult;
  applicationStatus: "healthy" | "unhealthy" | "degraded";
  metadata: {
    cronJobId: string;
    executionTime: number;
    retryCount?: number;
    environment: string;
  };
}

export interface CronJobConfig {
  schedule: string;
  enabled: boolean;
  timezone?: string;
  maxRetries: number;
  retryDelay: number;
  timeout: number;
}

export interface CronJobStatus {
  id: string;
  name: string;
  schedule: string;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  status: "running" | "stopped" | "error";
  runCount: number;
  errorCount: number;
  lastError?: string;
}

export interface HealthMonitoringConfig {
  cronJob: CronJobConfig;
  healthCheckEndpoint: string;
  logging: {
    enabled: boolean;
    filePath: string;
    maxFileSize: string;
    maxFiles: number;
    format: "json" | "text";
  };
  notifications?: {
    enabled: boolean;
    webhookUrl?: string;
    emailRecipients?: string[];
  };
}

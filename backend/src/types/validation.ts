// Validation Types and Schemas

export interface ValidationErrorItem {
  field: string;
  message: string;
  value?: unknown;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationErrorItem[];
}

// Review Validation Types
export interface CreateReviewData {
  externalId: number;
  type: "guest-to-host" | "host-to-guest";
  status: "published" | "pending" | "rejected";
  rating: number;
  publicReview: string;
  privateReview?: string;
  reviewCategory: Array<{
    category: string;
    rating: number;
  }>;
  submittedAt: string | Date;
  guestName: string;
  listingId: string;
  listingName: string;
  channel: string;
  reservationId: string;
}

export interface UpdateReviewData {
  showOnWebsite?: boolean;
  responseText?: string;
  status?: "published" | "pending" | "rejected";
}

// Property Validation Types
export interface CreatePropertyData {
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
  isActive?: boolean;
}

export interface UpdatePropertyData {
  name?: string;
  address?: string;
  type?: "Apartment" | "Studio" | "House" | "Penthouse" | "Villa" | "Other";
  bedrooms?: number;
  bathrooms?: number;
  maxGuests?: number;
  imageUrl?: string;
  description?: string;
  amenities?: string[];
  isActive?: boolean;
}

// Query Parameter Validation Types
export interface ReviewQueryParams {
  listingId?: string;
  channel?: string;
  rating?: string;
  status?: string;
  showOnWebsite?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  order?: string;
  page?: string;
  limit?: string;
}

export interface PropertyQueryParams {
  isActive?: string;
  sortBy?: string;
  order?: string;
}

export interface StatisticsQueryParams {
  listingId?: string;
  startDate?: string;
  endDate?: string;
}

export interface GoogleQueryParams {
  placeId?: string;
  query?: string;
}

export interface HostawayQueryParams {
  useApi?: string;
}

// Validation Rules
export interface ValidationRules {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: string[] | number[];
  type?: "string" | "number" | "boolean" | "date" | "array" | "object";
}

export interface FieldValidationRules {
  [fieldName: string]: ValidationRules;
}

// Common validation rule sets
export const REVIEW_VALIDATION_RULES: FieldValidationRules = {
  externalId: { required: true, type: "number", min: 1 },
  type: {
    required: true,
    type: "string",
    enum: ["guest-to-host", "host-to-guest"],
  },
  status: {
    required: true,
    type: "string",
    enum: ["published", "pending", "rejected"],
  },
  rating: { required: true, type: "number", min: 1, max: 10 },
  publicReview: {
    required: true,
    type: "string",
    minLength: 1,
    maxLength: 2000,
  },
  privateReview: { required: false, type: "string", maxLength: 2000 },
  guestName: { required: true, type: "string", minLength: 1, maxLength: 100 },
  listingId: { required: true, type: "string", minLength: 1 },
  listingName: { required: true, type: "string", minLength: 1, maxLength: 200 },
  channel: {
    required: true,
    type: "string",
    enum: [
      "Airbnb",
      "Booking.com",
      "Direct",
      "Vrbo",
      "Expedia",
      "Google",
      "Other",
    ],
  },
  reservationId: { required: true, type: "string", minLength: 1 },
};

export const PROPERTY_VALIDATION_RULES: FieldValidationRules = {
  externalId: { required: true, type: "string", minLength: 1 },
  name: { required: true, type: "string", minLength: 1, maxLength: 200 },
  address: { required: true, type: "string", minLength: 1, maxLength: 500 },
  type: {
    required: true,
    type: "string",
    enum: ["Apartment", "Studio", "House", "Penthouse", "Villa", "Other"],
  },
  bedrooms: { required: true, type: "number", min: 0, max: 20 },
  bathrooms: { required: true, type: "number", min: 0, max: 20 },
  maxGuests: { required: true, type: "number", min: 1, max: 50 },
  imageUrl: { required: false, type: "string", maxLength: 1000 },
  description: { required: false, type: "string", maxLength: 2000 },
};

// Error Types
export interface CustomError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

export class ValidationError extends Error {
  public statusCode: number = 400;
  public code: string = "VALIDATION_ERROR";
  public errors: ValidationErrorItem[];

  constructor(errors: ValidationErrorItem[]) {
    super("Validation failed");
    this.errors = errors;
    this.name = "ValidationError";
  }
}

export class NotFoundError extends Error {
  public statusCode: number = 404;
  public code: string = "NOT_FOUND";

  constructor(resource: string, id?: string) {
    super(`${resource}${id ? ` with id ${id}` : ""} not found`);
    this.name = "NotFoundError";
  }
}

export class DatabaseError extends Error {
  public statusCode: number = 500;
  public code: string = "DATABASE_ERROR";

  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = "DatabaseError";
  }
}

export class ExternalApiError extends Error {
  public statusCode: number = 502;
  public code: string = "EXTERNAL_API_ERROR";

  constructor(service: string, message: string, public originalError?: Error) {
    super(`${service} API error: ${message}`);
    this.name = "ExternalApiError";
  }
}

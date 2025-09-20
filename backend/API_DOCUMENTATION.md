# FlexLiving Reviews API Documentation

## Overview

This document provides comprehensive documentation for the FlexLiving Reviews API, a review management system for FlexLiving properties with integrations for Hostaway and Google Reviews.

## Interactive API Documentation

### Swagger UI Integration

The API now includes a fully integrated Swagger UI for interactive documentation and testing:

- **Primary URL**: `http://localhost:5001/api-docs`
- **Alternative URLs**:
  - `http://localhost:5001/docs`
  - `http://localhost:5001/swagger`
  - `http://localhost:5001/` (redirects to API docs)

### Features

- **Interactive Testing**: Test all API endpoints directly from the browser
- **Request/Response Examples**: View detailed examples for all endpoints
- **Schema Validation**: Real-time validation of request payloads
- **Authentication Support**: Built-in support for future authentication schemes
- **Export Options**: Download OpenAPI specification in JSON/YAML format

## OpenAPI Specification

The complete API specification is available in `backend/openapi.yaml` following OpenAPI 3.0.3 standards and is automatically loaded by the Swagger UI.

## Base URLs

- **Development**: `http://localhost:5001` (automatically configured)
- **Production**: To be configured

## API Endpoints SummaryTh

### Health Check

- `GET /api/health` - Get API and database health status

### Reviews Management

- `GET /api/reviews` - Get all reviews with filtering and pagination
- `GET /api/reviews/statistics` - Get comprehensive review statistics
- `GET /api/reviews/{id}` - Get specific review by ID
- `PUT /api/reviews/{id}` - Update review (status, visibility, response)
- `POST /api/reviews/{id}/helpful` - Mark review as helpful/not helpful

### Properties Management

- `GET /api/properties` - Get all properties with filtering
- `GET /api/properties/{id}` - Get property with associated reviews
- `PUT /api/properties/{id}` - Update property information

### Hostaway Integration

- `GET /api/hostaway/reviews` - Fetch reviews from Hostaway API or mock data
- `POST /api/hostaway/sync` - Synchronize properties and reviews from Hostaway

### Google Places Integration

- `GET /api/google/reviews` - Get Google Reviews for a specific place
- `GET /api/google/place-search` - Search for Google Places to find Place IDs

## Key Features

### Filtering and Pagination

- All list endpoints support comprehensive filtering
- Pagination with configurable page size (1-100 items)
- Sorting by multiple fields with ascending/descending order

### Review Filtering Options

- **Property**: Filter by `listingId`
- **Channel**: Filter by booking platform (Airbnb, Booking.com, etc.)
- **Rating**: Filter by minimum rating (1-10)
- **Status**: Filter by review status (published, pending, rejected)
- **Visibility**: Filter by website visibility
- **Date Range**: Filter by submission date range
- **Sorting**: Sort by submission date, rating, guest name, or channel

### Property Filtering Options

- **Status**: Filter by active/inactive properties
- **Sorting**: Sort by name, average rating, total reviews, or creation date

### Statistics and Analytics

- **Overview Statistics**: Average rating, total reviews, published reviews, website reviews
- **Category Breakdown**: Statistics by review categories (cleanliness, accuracy, etc.)
- **Channel Breakdown**: Statistics by booking channels
- **Monthly Trends**: Review counts and ratings over time

## Data Models

### Review

Complete review information including:

- External ID, type, status, rating
- Public and private review text
- Category ratings breakdown
- Guest information and booking details
- Response text and helpful votes
- Timestamps and source information

### Property

Property information including:

- External ID, name, address, type
- Capacity (bedrooms, bathrooms, max guests)
- Images, description, amenities
- Calculated statistics (average rating, total reviews)
- Active status and timestamps

### Statistics

Comprehensive analytics including:

- Overall review statistics
- Category-wise breakdowns
- Channel performance metrics
- Time-based trends

## Error Handling

### Standard Error Responses

- **400 Bad Request**: Invalid parameters or request data
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server-side errors
- **502 Bad Gateway**: External API errors
- **503 Service Unavailable**: Health check failures

### Validation Errors

Detailed validation error responses with field-level error information:

```json
{
  "status": "error",
  "message": "Validation failed",
  "error": "[{\"field\":\"rating\",\"message\":\"Rating must be between 1 and 10\",\"value\":15}]"
}
```

## Authentication

Currently, the API does not require authentication. This may be added in future versions.

## Rate Limiting

No rate limiting is currently implemented. Consider implementing rate limiting for production use.

## External Integrations

### Hostaway Integration

- Supports both real API calls and mock data for testing
- Synchronizes properties and reviews
- Handles API failures gracefully with fallback to mock data

### Google Places Integration

- Requires Google Places API key configuration
- Supports place search and review retrieval
- Limited to 5 most relevant reviews per place (Google API limitation)
- Provides mock data when API key is not configured

## Usage Examples

### Get Reviews with Filtering

```bash
GET /api/reviews?listingId=PROP001&channel=Airbnb&rating=8&status=published&page=1&limit=10
```

### Update Review Status

```bash
PUT /api/reviews/60f7b3b3b3b3b3b3b3b3b3b3
Content-Type: application/json

{
  "status": "published",
  "showOnWebsite": true,
  "responseText": "Thank you for your feedback!"
}
```

### Get Property with Reviews

```bash
GET /api/properties/60f7b3b3b3b3b3b3b3b3b3b3
```

### Sync Hostaway Data

```bash
POST /api/hostaway/sync
```

### Search Google Places

```bash
GET /api/google/place-search?query=FlexLiving Downtown Apartment
```

## Development Setup

1. Ensure the backend server is running on the configured port (default: 5000)
2. MongoDB connection is established
3. Environment variables are configured for external integrations
4. Use the OpenAPI specification for API client generation or testing

## Testing

The OpenAPI specification can be used with tools like:

- **Swagger UI**: Interactive API documentation and testing
- **Postman**: Import OpenAPI spec for API testing
- **Insomnia**: REST client with OpenAPI support
- **Code Generation**: Generate client SDKs in various languages

## Support

For API support and questions, contact the FlexLiving Development Team at dev@flexliving.com.

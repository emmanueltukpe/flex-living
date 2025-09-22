# FlexLiving Reviews Dashboard

A comprehensive review management system for FlexLiving properties, featuring a manager dashboard for review moderation and a public-facing review display that matches FlexLiving's design style.

## URLs

- Frontend: <https://flex-living-app.onrender.com/>
- Backend: <https://flex-living-a3s0.onrender.com/>
- Limitations: It was deployed on a free teir, which might cause application to sleep

## Features

### 1. Manager Dashboard

- **Review Management**: View, filter, sort, and manage all property reviews
- **Multi-property Support**: Switch between different properties
- **Advanced Filtering**: Filter by channel, rating, status, date range, and website visibility
- **Review Moderation**: Approve/reject reviews, toggle website visibility
- **Response Management**: Add professional responses to guest reviews
- **Bulk Actions**: Export reviews to CSV, sync with Hostaway

### 2. Analytics & Insights

- **Performance Metrics**: Average ratings, total reviews, response rates
- **Trend Analysis**: Monthly review trends with interactive charts
- **Category Breakdown**: Performance by review categories (cleanliness, location, etc.)
- **Channel Analytics**: Review distribution across booking channels
- **Smart Insights**: Automatic identification of areas needing improvement

### 3. Public Review Display

- **FlexLiving Style**: Matches the brand's olive/lime color scheme and modern design
- **Property Showcase**: Hero section with property details and amenities
- **Curated Reviews**: Only displays manager-approved reviews
- **Response Display**: Shows management responses to reviews
- **Mobile Responsive**: Optimized for all device sizes

### 4. API Integration

- **Hostaway Integration**: Mock data implementation with real API structure
- **Review Normalization**: Standardized data format across all sources
- **Google Reviews**: Documentation and exploration of integration possibilities

## Technical Stack

### Backend

- **Node.js & Express.js** with TypeScript
- **MongoDB** with Mongoose ODM
- **RESTful API** architecture
- **CORS enabled** for frontend communication

### Frontend

- **React** with TypeScript
- **Chart.js** for analytics visualization
- **Lucide React** for icons
- **Custom CSS** following FlexLiving design system

## API Endpoints

### Reviews

- `GET /api/reviews` - Get all reviews with filters
- `GET /api/reviews/statistics` - Get review statistics
- `GET /api/reviews/:id` - Get single review
- `PUT /api/reviews/:id` - Update review (status, visibility, response)
- `POST /api/reviews/:id/helpful` - Mark review as helpful

### Properties

- `GET /api/properties` - Get all properties
- `GET /api/properties/:id` - Get property with reviews

### Integrations

- `GET /api/hostaway/reviews` - Fetch Hostaway reviews (mock/real)
- `POST /api/hostaway/sync` - Sync all data
- `GET /api/google/reviews` - Google Reviews integration info

## Google Reviews Integration and Findings

### Google Integrations

- `GET /api/google/reviews` - Get Google Reviews for a specific place with their Place Ids
- `GET /api/google/place-search` - Search for Google Places by name

### Feasibility Assessment

Google Reviews was integrated using the **Google Places API**.

### Requirements

1. Google Cloud Platform account
2. Enable Places API
3. API key with proper restrictions
4. Place IDs for each property

### Limitations

- Maximum 5 most relevant reviews per place
- Reviews selected by Google's algorithm
- API usage limits and costs apply
- Cannot retrieve all reviews

### Alternative Solutions

1. **Google My Business API** - Better for managed locations
2. **Third-party aggregation services** - More comprehensive
3. **Review invitation systems** - Direct guest feedback

## Installation & Setup

### Prerequisites

- Node.js (v14+)
- MongoDB (local or cloud)
- npm or yarn

### Backend Setup

```bash
cd backend
npm install
# Configure .env file with your MongoDB URI
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

### Start both frontend and backend with a single command

./start.sh

## Environment Variables

### Backend (.env)

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/flexliving-reviews
CORS_ORIGIN=http://localhost:3000
HOSTAWAY_ACCOUNT_ID=61148
HOSTAWAY_API_KEY=your_key_here
GOOGLE_PLACES_API_KEY=your_google_key_here
```

## Usage

1. **Start MongoDB** locally or use cloud instance
2. **Start Backend** on port 5000
3. **Start Frontend** on port 3000
4. **Access Dashboard** at <http://localhost:3000>
5. **View Sample Property** at [http://localhost:3000/property/prop_001](http://localhost:3000/property/prop_001)

## Key Design Decisions

1. **Mock Data First**: Implemented with realistic mock data to ensure functionality
2. **Modular Architecture**: Separated concerns between API, business logic, and UI
3. **FlexLiving Design System**: Custom CSS matching brand colors (#323927, #D4F872)
4. **Performance Optimization**: Indexed MongoDB queries, pagination, lazy loading
5. **Security**: Input validation, CORS configuration, environment variables

## Future Enhancements

1. **Authentication System**: Implement JWT-based auth for managers
2. **Real-time Updates**: WebSocket for live review notifications
3. **AI Sentiment Analysis**: Automatic categorization of review sentiment
4. **Multi-language Support**: i18n for international properties
5. **Advanced Analytics**: Predictive trends, competitor analysis
6. **Email Notifications**: Alert managers of new reviews
7. **Review Templates**: Pre-written responses for common scenarios

## Testing

The application has been tested with:

- 10+ mock reviews across 5 properties
- Multiple booking channels (Airbnb, Booking.com, Direct)
- Various rating ranges and review statuses
- Responsive design on mobile/tablet/desktop

## AI Tools Used

- Augment code with Claude Sonnet 4
- Genspart ai with Claude Opus 4.1

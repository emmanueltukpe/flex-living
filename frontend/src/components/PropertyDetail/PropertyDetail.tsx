import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { propertiesApi, reviewsApi, Review, Property, ReviewStatistics } from '../../services/api';
import { 
  Star, 
  Calendar, 
  User, 
  ThumbsUp, 
  MapPin, 
  Bed, 
  Bath, 
  Users, 
  ArrowLeft,
  TrendingUp,
  MessageSquare,
  Eye,
  Filter,
  BarChart3
} from 'lucide-react';
import './PropertyDetail.css';

interface PropertyAnalytics {
  avgRating: number;
  totalReviews: number;
  publishedReviews: number;
  websiteReviews: number;
  categoryBreakdown: { [key: string]: number };
  channelBreakdown: { [key: string]: number };
  monthlyTrends: { month: string; reviews: number; avgRating: number }[];
}

const PropertyDetail: React.FC = () => {
  const { propertyId } = useParams<{ propertyId: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [statistics, setStatistics] = useState<ReviewStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'analytics'>('overview');
  const [reviewFilters, setReviewFilters] = useState({
    status: '',
    channel: '',
    rating: '',
    showOnWebsite: ''
  });

  useEffect(() => {
    if (propertyId) {
      loadPropertyData();
    }
  }, [propertyId]);

  useEffect(() => {
    applyFilters();
  }, [reviews, reviewFilters]);

  const loadPropertyData = async () => {
    if (!propertyId) return;
    
    setLoading(true);
    try {
      // Load property details
      const propertyRes = await propertiesApi.getById(propertyId);
      setProperty(propertyRes.data);

      // Load all reviews for this property
      const reviewsRes = await reviewsApi.getAll({ 
        listingId: propertyRes.data.externalId,
        limit: 100 
      });
      setReviews(reviewsRes.data);

      // Load statistics for this property
      const statsRes = await reviewsApi.getStatistics({ 
        listingId: propertyRes.data.externalId 
      });
      setStatistics(statsRes.data);
    } catch (error) {
      console.error('Error loading property data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...reviews];

    if (reviewFilters.status) {
      filtered = filtered.filter(review => review.status === reviewFilters.status);
    }
    if (reviewFilters.channel) {
      filtered = filtered.filter(review => review.channel === reviewFilters.channel);
    }
    if (reviewFilters.rating) {
      const rating = parseInt(reviewFilters.rating);
      filtered = filtered.filter(review => review.rating >= rating);
    }
    if (reviewFilters.showOnWebsite) {
      const showOnWebsite = reviewFilters.showOnWebsite === 'true';
      filtered = filtered.filter(review => review.showOnWebsite === showOnWebsite);
    }

    setFilteredReviews(filtered);
  };

  const analytics = useMemo((): PropertyAnalytics => {
    if (!reviews.length) {
      return {
        avgRating: 0,
        totalReviews: 0,
        publishedReviews: 0,
        websiteReviews: 0,
        categoryBreakdown: {},
        channelBreakdown: {},
        monthlyTrends: []
      };
    }

    const publishedReviews = reviews.filter(r => r.status === 'published');
    const websiteReviews = reviews.filter(r => r.showOnWebsite);
    
    // Category breakdown
    const categoryBreakdown: { [key: string]: number } = {};
    reviews.forEach(review => {
      review.reviewCategory?.forEach(category => {
        if (!categoryBreakdown[category.category]) {
          categoryBreakdown[category.category] = 0;
        }
        categoryBreakdown[category.category] += category.rating;
      });
    });

    // Channel breakdown
    const channelBreakdown: { [key: string]: number } = {};
    reviews.forEach(review => {
      channelBreakdown[review.channel] = (channelBreakdown[review.channel] || 0) + 1;
    });

    // Monthly trends (last 12 months)
    const monthlyTrends: { month: string; reviews: number; avgRating: number }[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthReviews = reviews.filter(review => {
        const reviewDate = new Date(review.submittedAt);
        return reviewDate.getMonth() === date.getMonth() && 
               reviewDate.getFullYear() === date.getFullYear();
      });
      
      const avgRating = monthReviews.length > 0 
        ? monthReviews.reduce((sum, r) => sum + r.rating, 0) / monthReviews.length 
        : 0;

      monthlyTrends.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        reviews: monthReviews.length,
        avgRating: Math.round(avgRating * 10) / 10
      });
    }

    return {
      avgRating: reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length,
      totalReviews: reviews.length,
      publishedReviews: publishedReviews.length,
      websiteReviews: websiteReviews.length,
      categoryBreakdown,
      channelBreakdown,
      monthlyTrends
    };
  }, [reviews]);

  const handleHelpfulClick = async (reviewId: string, isHelpful: boolean) => {
    try {
      await reviewsApi.markHelpful(reviewId, isHelpful);
      // Reload reviews to get updated counts
      loadPropertyData();
    } catch (error) {
      console.error('Error marking review as helpful:', error);
    }
  };

  if (loading) {
    return (
      <div className="property-detail-loading">
        <div className="spinner"></div>
        <p>Loading property details...</p>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="property-detail-error">
        <h2>Property not found</h2>
        <p>The property you're looking for doesn't exist or has been removed.</p>
        <Link to="/" className="btn btn-primary">
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const uniqueChannels = Array.from(new Set(reviews.map(r => r.channel)));

  return (
    <div className="property-detail">
      {/* Header */}
      <div className="property-detail-header">
        <div className="container">
          <Link to="/" className="back-link">
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
          <div className="property-header-content">
            <h1>{property.name}</h1>
            <div className="property-meta">
              <div className="property-location">
                <MapPin size={16} />
                <span>{property.address}</span>
              </div>
              <div className="property-features">
                <div className="feature">
                  <Bed size={14} />
                  <span>{property.bedrooms} bed</span>
                </div>
                <div className="feature">
                  <Bath size={14} />
                  <span>{property.bathrooms} bath</span>
                </div>
                <div className="feature">
                  <Users size={14} />
                  <span>{property.maxGuests} guests</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Property Image */}
      {property.imageUrl && (
        <div className="property-image-section">
          <div className="container">
            <img 
              src={property.imageUrl} 
              alt={property.name}
              className="property-main-image"
            />
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="property-tabs">
        <div className="container">
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`tab ${activeTab === 'reviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              Reviews ({reviews.length})
            </button>
            <button
              className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              <BarChart3 size={16} />
              Analytics
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="property-content">
        <div className="container">
          {activeTab === 'overview' && (
            <div className="overview-content">
              {/* Quick Stats */}
              <div className="quick-stats">
                <div className="stat-card">
                  <div className="stat-icon">
                    <Star />
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">{analytics.avgRating.toFixed(1)}</div>
                    <div className="stat-label">Average Rating</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">
                    <MessageSquare />
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">{analytics.totalReviews}</div>
                    <div className="stat-label">Total Reviews</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">
                    <Eye />
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">{analytics.websiteReviews}</div>
                    <div className="stat-label">Website Reviews</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">
                    <TrendingUp />
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">{analytics.publishedReviews}</div>
                    <div className="stat-label">Published</div>
                  </div>
                </div>
              </div>

              {/* Property Description */}
              {property.description && (
                <div className="property-description">
                  <h3>About this property</h3>
                  <p>{property.description}</p>
                </div>
              )}

              {/* Amenities */}
              {property.amenities && property.amenities.length > 0 && (
                <div className="property-amenities">
                  <h3>Amenities</h3>
                  <div className="amenities-grid">
                    {property.amenities.map((amenity, index) => (
                      <div key={index} className="amenity-item">
                        {amenity}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="reviews-content">
              {/* Review Filters */}
              <div className="review-filters">
                <div className="filters-header">
                  <h3>
                    <Filter size={18} />
                    Filter Reviews
                  </h3>
                </div>
                <div className="filters-grid">
                  <div className="filter-group">
                    <label>Status</label>
                    <select
                      value={reviewFilters.status}
                      onChange={(e) => setReviewFilters({...reviewFilters, status: e.target.value})}
                    >
                      <option value="">All Statuses</option>
                      <option value="published">Published</option>
                      <option value="pending">Pending</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <div className="filter-group">
                    <label>Channel</label>
                    <select
                      value={reviewFilters.channel}
                      onChange={(e) => setReviewFilters({...reviewFilters, channel: e.target.value})}
                    >
                      <option value="">All Channels</option>
                      {uniqueChannels.map(channel => (
                        <option key={channel} value={channel}>{channel}</option>
                      ))}
                    </select>
                  </div>
                  <div className="filter-group">
                    <label>Min Rating</label>
                    <select
                      value={reviewFilters.rating}
                      onChange={(e) => setReviewFilters({...reviewFilters, rating: e.target.value})}
                    >
                      <option value="">Any Rating</option>
                      <option value="8">8+ Stars</option>
                      <option value="6">6+ Stars</option>
                      <option value="4">4+ Stars</option>
                    </select>
                  </div>
                  <div className="filter-group">
                    <label>Website Visibility</label>
                    <select
                      value={reviewFilters.showOnWebsite}
                      onChange={(e) => setReviewFilters({...reviewFilters, showOnWebsite: e.target.value})}
                    >
                      <option value="">All Reviews</option>
                      <option value="true">Shown on Website</option>
                      <option value="false">Hidden from Website</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Reviews List */}
              <div className="reviews-list">
                <div className="reviews-header">
                  <h3>{filteredReviews.length} review{filteredReviews.length !== 1 ? 's' : ''}</h3>
                </div>

                {filteredReviews.length === 0 ? (
                  <div className="no-reviews">
                    <p>No reviews match the current filters.</p>
                  </div>
                ) : (
                  <div className="reviews-grid">
                    {filteredReviews.map((review) => (
                      <div key={review._id} className="review-card">
                        <div className="review-header">
                          <div className="reviewer-info">
                            <div className="reviewer-avatar">
                              <User size={20} />
                            </div>
                            <div className="reviewer-details">
                              <h4>{review.guestName}</h4>
                              <div className="review-meta">
                                <div className="review-date">
                                  <Calendar size={14} />
                                  <span>{new Date(review.submittedAt).toLocaleDateString()}</span>
                                </div>
                                <div className="review-channel">
                                  <span className={`channel-badge ${review.channel.toLowerCase()}`}>
                                    {review.channel}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="review-rating">
                            <Star size={16} fill="currentColor" />
                            <span>{review.rating}/10</span>
                          </div>
                        </div>

                        <div className="review-content">
                          <p>{review.publicReview}</p>
                        </div>

                        <div className="review-footer">
                          <div className="review-status">
                            <span className={`status-badge ${review.status}`}>
                              {review.status}
                            </span>
                            {review.showOnWebsite && (
                              <span className="website-badge">
                                <Eye size={12} />
                                On Website
                              </span>
                            )}
                          </div>

                          <div className="review-actions">
                            <button
                              className="helpful-btn"
                              onClick={() => handleHelpfulClick(review._id, true)}
                            >
                              <ThumbsUp size={14} />
                              {review.helpful || 0}
                            </button>
                          </div>
                        </div>

                        {review.responseText && (
                          <div className="review-response">
                            <h5>Response from FlexLiving:</h5>
                            <p>{review.responseText}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="analytics-content">
              {/* Analytics Overview */}
              <div className="analytics-overview">
                <h3>Performance Analytics</h3>
                <div className="analytics-grid">
                  <div className="analytics-card">
                    <h4>Channel Distribution</h4>
                    <div className="channel-breakdown">
                      {Object.entries(analytics.channelBreakdown).map(([channel, count]) => (
                        <div key={channel} className="channel-item">
                          <span className="channel-name">{channel}</span>
                          <span className="channel-count">{count} reviews</span>
                          <div className="channel-bar">
                            <div
                              className="channel-fill"
                              style={{ width: `${(count / analytics.totalReviews) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="analytics-card">
                    <h4>Category Ratings</h4>
                    <div className="category-breakdown">
                      {Object.entries(analytics.categoryBreakdown).map(([category, rating]) => (
                        <div key={category} className="category-item">
                          <span className="category-name">{category}</span>
                          <span className="category-rating">{(rating / reviews.length).toFixed(1)}/10</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Monthly Trends */}
              <div className="monthly-trends">
                <h3>Monthly Review Trends</h3>
                <div className="trends-chart">
                  {analytics.monthlyTrends.map((trend, index) => (
                    <div key={index} className="trend-item">
                      <div className="trend-month">{trend.month}</div>
                      <div className="trend-bar">
                        <div
                          className="trend-fill"
                          style={{ height: `${(trend.reviews / Math.max(...analytics.monthlyTrends.map(t => t.reviews))) * 100}%` }}
                        ></div>
                      </div>
                      <div className="trend-stats">
                        <div className="trend-count">{trend.reviews}</div>
                        <div className="trend-rating">{trend.avgRating || 0}/10</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyDetail;

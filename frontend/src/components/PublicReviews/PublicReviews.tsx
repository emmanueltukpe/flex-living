import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { propertiesApi, reviewsApi, Review, Property } from '../../services/api';
import { Star, Calendar, User, ThumbsUp, MapPin, Bed, Bath, Users } from 'lucide-react';
import './PublicReviews.css';

const PublicReviews: React.FC = () => {
  const { propertyId } = useParams<{ propertyId: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // Calculate review statistics
  const reviewStats = useMemo(() => {
    if (reviews.length === 0) return null;

    const totalReviews = reviews.length;
    const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;

    // Calculate category averages
    const categoryStats: { [key: string]: number[] } = {};
    reviews.forEach(review => {
      review.reviewCategory.forEach(cat => {
        if (!categoryStats[cat.category]) {
          categoryStats[cat.category] = [];
        }
        categoryStats[cat.category].push(cat.rating);
      });
    });

    const categoryAverages = Object.entries(categoryStats).map(([category, ratings]) => ({
      category,
      average: ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length,
      count: ratings.length
    }));

    return {
      totalReviews,
      avgRating,
      categoryAverages
    };
  }, [reviews]);

  useEffect(() => {
    const loadPropertyAndReviews = async () => {
      try {
        const response = await propertiesApi.getById(propertyId || '');
        setProperty(response.data.property);
        setReviews(response.data.reviews);
      } catch (error) {
        console.error('Error loading property:', error);
      } finally {
        setLoading(false);
      }
    };
    loadPropertyAndReviews();
  }, [propertyId]);

  const handleHelpfulClick = async (reviewId: string) => {
    try {
      await reviewsApi.markHelpful(reviewId, true);
      // Update the local state to reflect the change
      setReviews(prevReviews =>
        prevReviews.map(review =>
          review._id === reviewId
            ? { ...review, helpful: (review.helpful || 0) + 1 }
            : review
        )
      );
    } catch (error) {
      console.error('Error marking review as helpful:', error);
    }
  };

  if (loading) {
    return (
      <div className="public-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!property) {
    return <div className="public-error">Property not found</div>;
  }

  return (
    <div className="public-reviews">
      {/* Hero Section - Flex Living Style */}
      <div className="property-hero">
        <div className="hero-image">
          <img src={property.imageUrl || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688'} alt={property.name} />
          <div className="hero-overlay"></div>
        </div>
        <div className="hero-content">
          <div className="container">
            <h1 className="property-title">{property.name}</h1>
            <div className="property-location">
              <MapPin size={18} />
              <span>{property.address}</span>
            </div>
            <div className="property-features">
              <div className="feature">
                <Bed size={16} />
                <span>{property.bedrooms} Bedrooms</span>
              </div>
              <div className="feature">
                <Bath size={16} />
                <span>{property.bathrooms} Bathrooms</span>
              </div>
              <div className="feature">
                <Users size={16} />
                <span>Up to {property.maxGuests} Guests</span>
              </div>
            </div>
            {property.avgRating && (
              <div className="property-rating">
                <Star size={20} fill="currentColor" />
                <span className="rating-value">{property.avgRating.toFixed(1)}</span>
                <span className="rating-count">({property.totalReviews} reviews)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="reviews-section">
        <div className="container">
          <div className="section-header">
            <h2>Guest Reviews</h2>
            <p className="section-subtitle">What our guests are saying about this property</p>
          </div>

          {reviewStats && (
            <div className="review-stats">
              <div className="stats-overview">
                <div className="overall-rating">
                  <div className="rating-number">{reviewStats.avgRating.toFixed(1)}</div>
                  <div className="rating-stars">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={20}
                        fill={i < Math.floor(reviewStats.avgRating / 2) ? "currentColor" : "none"}
                        className="star"
                      />
                    ))}
                  </div>
                  <div className="rating-text">
                    Based on {reviewStats.totalReviews} review{reviewStats.totalReviews !== 1 ? 's' : ''}
                  </div>
                </div>

                {reviewStats.categoryAverages.length > 0 && (
                  <div className="category-ratings">
                    {reviewStats.categoryAverages.map((cat) => (
                      <div key={cat.category} className="category-item">
                        <span className="category-name">
                          {cat.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                        <div className="category-bar">
                          <div
                            className="category-fill"
                            style={{ width: `${(cat.average / 10) * 100}%` }}
                          ></div>
                        </div>
                        <span className="category-score">{cat.average.toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {reviews.length === 0 ? (
            <div className="no-reviews">
              <p>No reviews available for this property yet.</p>
            </div>
          ) : (
            <div className="reviews-grid">
              {reviews.map((review) => (
                <div key={review._id} className="review-card-public">
                  <div className="review-header-public">
                    <div className="reviewer-info">
                      <div className="reviewer-avatar">
                        <User size={20} />
                      </div>
                      <div className="reviewer-details">
                        <h4>{review.guestName}</h4>
                        <div className="review-date">
                          <Calendar size={14} />
                          <span>{new Date(review.submittedAt).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long' 
                          })}</span>
                        </div>
                      </div>
                    </div>
                    <div className="review-rating-badge">
                      <Star size={16} fill="currentColor" />
                      <span>{review.rating}/10</span>
                    </div>
                  </div>

                  <p className="review-text-public">{review.publicReview}</p>

                  {review.responseText && (
                    <div className="management-response">
                      <h5>Response from FlexLiving</h5>
                      <p>{review.responseText}</p>
                    </div>
                  )}

                  <div className="review-categories-public">
                    {review.reviewCategory.map((cat, idx) => (
                      <div key={idx} className="category-badge">
                        <span className="category-name">{cat.category.replace(/_/g, ' ')}</span>
                        <span className="category-score">{cat.rating}/10</span>
                      </div>
                    ))}
                  </div>

                  <div className="review-footer">
                    <div className="review-channel">
                      <span className="channel-badge">{review.channel}</span>
                    </div>
                    <button
                      className="helpful-btn"
                      onClick={() => handleHelpfulClick(review._id)}
                    >
                      <ThumbsUp size={14} />
                      <span>Helpful ({review.helpful || 0})</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Call to Action */}
      <div className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h3>Experience FlexLiving</h3>
            <p>Book this property for your next stay</p>
            <button className="btn btn-primary btn-lg">Check Availability</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicReviews;
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { propertiesApi, Review, Property } from '../../services/api';
import { Star, Calendar, User, ThumbsUp, MapPin, Bed, Bath, Users } from 'lucide-react';
import './PublicReviews.css';

const PublicReviews: React.FC = () => {
  const { propertyId } = useParams<{ propertyId: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPropertyAndReviews();
  }, [propertyId]);

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
                    <button className="helpful-btn">
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
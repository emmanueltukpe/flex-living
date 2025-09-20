import React, { useState } from 'react';
import { Review } from '../../services/api';
import { Star, Eye, EyeOff, MessageCircle, ThumbsUp, Calendar, User, Home } from 'lucide-react';
import './ReviewsList.css';

interface ReviewsListProps {
  reviews: Review[];
  onUpdateReview: (reviewId: string, updates: Partial<Review>) => void;
  loading: boolean;
}

const ReviewsList: React.FC<ReviewsListProps> = ({ reviews, onUpdateReview, loading }) => {
  const [expandedReview, setExpandedReview] = useState<string | null>(null);
  const [responseText, setResponseText] = useState<{ [key: string]: string }>({});

  const getRatingColor = (rating: number) => {
    if (rating >= 9) return 'rating-excellent';
    if (rating >= 7) return 'rating-good';
    if (rating >= 5) return 'rating-average';
    return 'rating-poor';
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'published': return 'badge-success';
      case 'pending': return 'badge-warning';
      case 'rejected': return 'badge-error';
      default: return '';
    }
  };

  const handleToggleWebsite = (review: Review) => {
    onUpdateReview(review._id, { showOnWebsite: !review.showOnWebsite });
  };

  const handleStatusChange = (review: Review, newStatus: string) => {
    onUpdateReview(review._id, { status: newStatus as Review['status'] });
  };

  const handleResponseSubmit = (review: Review) => {
    const response = responseText[review._id];
    if (response && response.trim()) {
      onUpdateReview(review._id, { responseText: response });
      setResponseText(prev => ({ ...prev, [review._id]: '' }));
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="reviews-loading">
        <div className="spinner"></div>
        <p>Loading reviews...</p>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="reviews-empty">
        <p>No reviews found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="reviews-list">
      {reviews.map((review) => (
        <div key={review._id} className="review-card">
          <div className="review-header">
            <div className="review-meta">
              <div className="review-guest">
                <User size={16} />
                <span className="guest-name">{review.guestName}</span>
              </div>
              <div className="review-property">
                <Home size={16} />
                <span>{review.listingName}</span>
              </div>
              <div className="review-date">
                <Calendar size={16} />
                <span>{formatDate(review.submittedAt)}</span>
              </div>
            </div>
            <div className="review-actions">
              <span className={`badge ${getStatusBadgeClass(review.status)}`}>
                {review.status}
              </span>
              <span className="badge">{review.channel}</span>
              <button
                className={`btn-icon ${review.showOnWebsite ? 'active' : ''}`}
                onClick={() => handleToggleWebsite(review)}
                title={review.showOnWebsite ? 'Hide from website' : 'Show on website'}
              >
                {review.showOnWebsite ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
          </div>

          <div className="review-content">
            <div className={`review-rating ${getRatingColor(review.rating)}`}>
              <Star size={20} fill="currentColor" />
              <span className="rating-value">{review.rating}/10</span>
            </div>
            
            <p className="review-text">{review.publicReview}</p>
            
            {review.privateReview && (
              <div className="private-review">
                <p className="private-label">Private feedback:</p>
                <p className="private-text">{review.privateReview}</p>
              </div>
            )}

            <div className="review-categories">
              {review.reviewCategory.map((cat, idx) => (
                <div key={idx} className="category-item">
                  <span className="category-name">{cat.category.replace(/_/g, ' ')}</span>
                  <div className="category-rating">
                    <div className="rating-bar">
                      <div 
                        className="rating-fill" 
                        style={{ width: `${cat.rating * 10}%` }}
                      />
                    </div>
                    <span className="rating-text">{cat.rating}/10</span>
                  </div>
                </div>
              ))}
            </div>

            {expandedReview === review._id && (
              <div className="review-expanded">
                <div className="response-section">
                  <h4>Management Response</h4>
                  {review.responseText ? (
                    <div className="existing-response">
                      <p>{review.responseText}</p>
                      <small>Responded on {formatDate(review.respondedAt || review.submittedAt)}</small>
                    </div>
                  ) : (
                    <div className="response-form">
                      <textarea
                        placeholder="Write a professional response to this review..."
                        value={responseText[review._id] || ''}
                        onChange={(e) => setResponseText(prev => ({ 
                          ...prev, 
                          [review._id]: e.target.value 
                        }))}
                        rows={3}
                      />
                      <button
                        className="btn btn-primary"
                        onClick={() => handleResponseSubmit(review)}
                      >
                        <MessageCircle size={16} />
                        Submit Response
                      </button>
                    </div>
                  )}
                </div>

                <div className="review-controls">
                  <label>Change Status:</label>
                  <div className="status-buttons">
                    <button
                      className={`btn btn-sm ${review.status === 'published' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleStatusChange(review, 'published')}
                    >
                      Published
                    </button>
                    <button
                      className={`btn btn-sm ${review.status === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleStatusChange(review, 'pending')}
                    >
                      Pending
                    </button>
                    <button
                      className={`btn btn-sm ${review.status === 'rejected' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleStatusChange(review, 'rejected')}
                    >
                      Rejected
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            className="review-expand-btn"
            onClick={() => setExpandedReview(
              expandedReview === review._id ? null : review._id
            )}
          >
            {expandedReview === review._id ? 'Show Less' : 'Manage Review'}
          </button>
        </div>
      ))}
    </div>
  );
};

export default ReviewsList;
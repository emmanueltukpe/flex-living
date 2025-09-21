import React, { useState, useMemo } from 'react';
import { Review } from '../../services/api';
import { Star, Eye, EyeOff, MessageCircle, Calendar, User, Home, ArrowUpDown, ArrowUp, ArrowDown, CheckSquare, Square, ChevronLeft, ChevronRight } from 'lucide-react';
import './ReviewsList.css';

interface ReviewsListProps {
  reviews: Review[];
  onUpdateReview: (reviewId: string, updates: Partial<Review>) => void;
  loading: boolean;
}

type SortField = 'submittedAt' | 'rating' | 'guestName' | 'channel' | 'status';
type SortOrder = 'asc' | 'desc';

const ReviewsList: React.FC<ReviewsListProps> = ({ reviews, onUpdateReview, loading }) => {
  const [expandedReview, setExpandedReview] = useState<string | null>(null);
  const [responseText, setResponseText] = useState<{ [key: string]: string }>({});
  const [sortField, setSortField] = useState<SortField>('submittedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedReviews, setSelectedReviews] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 20;

  // Sort reviews based on current sort field and order
  const sortedReviews = useMemo(() => {
    return [...reviews].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Handle date sorting
      if (sortField === 'submittedAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      // Handle string sorting (case insensitive)
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [reviews, sortField, sortOrder]);

  // Pagination calculations
  const totalPages = Math.ceil(sortedReviews.length / reviewsPerPage);
  const startIndex = (currentPage - 1) * reviewsPerPage;
  const endIndex = startIndex + reviewsPerPage;
  const paginatedReviews = sortedReviews.slice(startIndex, endIndex);

  // Reset to first page when reviews change
  useMemo(() => {
    setCurrentPage(1);
  }, [reviews.length, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown size={14} />;
    return sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
  };

  const handleSelectReview = (reviewId: string) => {
    const newSelected = new Set(selectedReviews);
    if (newSelected.has(reviewId)) {
      newSelected.delete(reviewId);
    } else {
      newSelected.add(reviewId);
    }
    setSelectedReviews(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const handleSelectAll = () => {
    if (selectedReviews.size === paginatedReviews.length) {
      setSelectedReviews(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedReviews(new Set(paginatedReviews.map(r => r._id)));
      setShowBulkActions(true);
    }
  };

  const handleBulkAction = (action: 'show' | 'hide' | 'publish' | 'reject') => {
    selectedReviews.forEach(reviewId => {
      const review = sortedReviews.find(r => r._id === reviewId);
      if (review) {
        switch (action) {
          case 'show':
            onUpdateReview(reviewId, { showOnWebsite: true });
            break;
          case 'hide':
            onUpdateReview(reviewId, { showOnWebsite: false });
            break;
          case 'publish':
            onUpdateReview(reviewId, { status: 'published' });
            break;
          case 'reject':
            onUpdateReview(reviewId, { status: 'rejected' });
            break;
        }
      }
    });
    setSelectedReviews(new Set());
    setShowBulkActions(false);
  };

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
      <div className="reviews-header">
        <div className="reviews-count">
          <button
            className="select-all-btn"
            onClick={handleSelectAll}
            title={selectedReviews.size === paginatedReviews.length ? 'Deselect all on page' : 'Select all on page'}
          >
            {selectedReviews.size === paginatedReviews.length ? <CheckSquare size={16} /> : <Square size={16} />}
          </button>
          {sortedReviews.length} review{sortedReviews.length !== 1 ? 's' : ''}
          {selectedReviews.size > 0 && (
            <span className="selected-count">({selectedReviews.size} selected)</span>
          )}
          <div className="pagination-info">
            Showing {startIndex + 1}-{Math.min(endIndex, sortedReviews.length)} of {sortedReviews.length}
          </div>
        </div>
        <div className="sort-controls">
          <span>Sort by:</span>
          <button
            className={`sort-btn ${sortField === 'submittedAt' ? 'active' : ''}`}
            onClick={() => handleSort('submittedAt')}
          >
            Date {getSortIcon('submittedAt')}
          </button>
          <button
            className={`sort-btn ${sortField === 'rating' ? 'active' : ''}`}
            onClick={() => handleSort('rating')}
          >
            Rating {getSortIcon('rating')}
          </button>
          <button
            className={`sort-btn ${sortField === 'guestName' ? 'active' : ''}`}
            onClick={() => handleSort('guestName')}
          >
            Guest {getSortIcon('guestName')}
          </button>
          <button
            className={`sort-btn ${sortField === 'channel' ? 'active' : ''}`}
            onClick={() => handleSort('channel')}
          >
            Channel {getSortIcon('channel')}
          </button>
          <button
            className={`sort-btn ${sortField === 'status' ? 'active' : ''}`}
            onClick={() => handleSort('status')}
          >
            Status {getSortIcon('status')}
          </button>
        </div>
      </div>

      {showBulkActions && (
        <div className="bulk-actions">
          <div className="bulk-actions-content">
            <span className="bulk-actions-label">
              {selectedReviews.size} review{selectedReviews.size !== 1 ? 's' : ''} selected
            </span>
            <div className="bulk-actions-buttons">
              <button
                className="bulk-btn bulk-btn-primary"
                onClick={() => handleBulkAction('show')}
              >
                <Eye size={14} />
                Show on Website
              </button>
              <button
                className="bulk-btn bulk-btn-secondary"
                onClick={() => handleBulkAction('hide')}
              >
                <EyeOff size={14} />
                Hide from Website
              </button>
              <button
                className="bulk-btn bulk-btn-success"
                onClick={() => handleBulkAction('publish')}
              >
                Publish
              </button>
              <button
                className="bulk-btn bulk-btn-danger"
                onClick={() => handleBulkAction('reject')}
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {paginatedReviews.map((review) => (
        <div key={review._id} className="review-card">
          <div className="review-header">
            <div className="review-meta">
              <button
                className="review-checkbox"
                onClick={() => handleSelectReview(review._id)}
                title={selectedReviews.has(review._id) ? 'Deselect review' : 'Select review'}
              >
                {selectedReviews.has(review._id) ? <CheckSquare size={16} /> : <Square size={16} />}
              </button>
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pagination-controls">
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={16} />
            Previous
          </button>

          <div className="pagination-pages">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              // Show first page, last page, current page, and pages around current page
              const showPage = page === 1 ||
                              page === totalPages ||
                              Math.abs(page - currentPage) <= 2;

              if (!showPage) {
                // Show ellipsis for gaps
                if (page === 2 && currentPage > 4) {
                  return <span key={page} className="pagination-ellipsis">...</span>;
                }
                if (page === totalPages - 1 && currentPage < totalPages - 3) {
                  return <span key={page} className="pagination-ellipsis">...</span>;
                }
                return null;
              }

              return (
                <button
                  key={page}
                  className={`pagination-page ${page === currentPage ? 'active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              );
            })}
          </div>

          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewsList;
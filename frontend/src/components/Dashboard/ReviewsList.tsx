import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Button,
  Stack,
  Divider,
  Checkbox,
  Rating,
  LinearProgress,
  Collapse,
  TextField,
  Alert,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Avatar,
  Paper
} from '@mui/material';
import {
  Eye,
  EyeOff,
  MessageCircle,
  Calendar,
  User,
  Home,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Reply
} from 'lucide-react';
import { Review } from '../../services/api';
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
    if (rating >= 9) return 'success';
    if (rating >= 7) return 'primary';
    if (rating >= 5) return 'warning';
    return 'error';
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'published': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      default: return 'default';
    }
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
      <Card sx={{ p: 4, textAlign: 'center' }}>
        <Stack spacing={2} alignItems="center">
          <LinearProgress sx={{ width: '100%', maxWidth: 200 }} />
          <Typography variant="body2" color="text.secondary">
            Loading reviews...
          </Typography>
        </Stack>
      </Card>
    );
  }

  if (reviews.length === 0) {
    return (
      <Card sx={{ p: 4, textAlign: 'center' }}>
        <Stack spacing={2} alignItems="center">
          <MessageCircle size={48} color="#93968B" />
          <Typography variant="h6" color="text.secondary">
            No reviews found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No reviews match your current criteria. Try adjusting your filters.
          </Typography>
        </Stack>
      </Card>
    );
  }

  return (
    <Stack spacing={2}>
      {/* Enhanced Header */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: 1, borderColor: 'divider' }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', md: 'center' }}
          spacing={2}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <Tooltip title={selectedReviews.size === paginatedReviews.length ? 'Deselect all on page' : 'Select all on page'}>
              <Checkbox
                checked={selectedReviews.size === paginatedReviews.length && paginatedReviews.length > 0}
                indeterminate={selectedReviews.size > 0 && selectedReviews.size < paginatedReviews.length}
                onChange={handleSelectAll}
                size="small"
              />
            </Tooltip>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {sortedReviews.length} review{sortedReviews.length !== 1 ? 's' : ''}
            </Typography>
            {selectedReviews.size > 0 && (
              <Chip
                label={`${selectedReviews.size} selected`}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
            <Typography variant="body2" color="text.secondary">
              Showing {startIndex + 1}-{Math.min(endIndex, sortedReviews.length)} of {sortedReviews.length}
            </Typography>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="body2" color="text.secondary">
              Sort by:
            </Typography>
            <Button
              variant={sortField === 'submittedAt' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => handleSort('submittedAt')}
              endIcon={getSortIcon('submittedAt')}
              sx={{ textTransform: 'none' }}
            >
              Date
            </Button>
            <Button
              variant={sortField === 'rating' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => handleSort('rating')}
              endIcon={getSortIcon('rating')}
              sx={{ textTransform: 'none' }}
            >
              Rating
            </Button>
            <Button
              variant={sortField === 'guestName' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => handleSort('guestName')}
              endIcon={getSortIcon('guestName')}
              sx={{ textTransform: 'none' }}
            >
              Guest
            </Button>
            <Button
              variant={sortField === 'channel' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => handleSort('channel')}
              endIcon={getSortIcon('channel')}
              sx={{ textTransform: 'none' }}
            >
              Channel
            </Button>
            <Button
              variant={sortField === 'status' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => handleSort('status')}
              endIcon={getSortIcon('status')}
              sx={{ textTransform: 'none' }}
            >
              Status
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Enhanced Bulk Actions */}
      <Collapse in={showBulkActions}>
        <Alert
          severity="info"
          sx={{
            borderRadius: 2,
            '& .MuiAlert-message': { width: '100%' }
          }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'stretch', sm: 'center' }}
            spacing={2}
          >
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {selectedReviews.size} review{selectedReviews.size !== 1 ? 's' : ''} selected
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Button
                variant="contained"
                size="small"
                startIcon={<Eye size={16} />}
                onClick={() => handleBulkAction('show')}
                sx={{ textTransform: 'none' }}
              >
                Show on Website
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<EyeOff size={16} />}
                onClick={() => handleBulkAction('hide')}
                sx={{ textTransform: 'none' }}
              >
                Hide from Website
              </Button>
              <Button
                variant="contained"
                size="small"
                color="success"
                onClick={() => handleBulkAction('publish')}
                sx={{ textTransform: 'none' }}
              >
                Publish
              </Button>
              <Button
                variant="contained"
                size="small"
                color="error"
                onClick={() => handleBulkAction('reject')}
                sx={{ textTransform: 'none' }}
              >
                Reject
              </Button>
            </Stack>
          </Stack>
        </Alert>
      </Collapse>

      {/* Enhanced Review Cards */}
      {paginatedReviews.map((review) => (
        <Card
          key={review._id}
          elevation={0}
          sx={{
            border: 1,
            borderColor: 'divider',
            borderRadius: 2,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              boxShadow: 2,
              borderColor: 'primary.light'
            }
          }}
        >
          <CardContent sx={{ p: 3 }}>
            {/* Review Header */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'stretch', sm: 'flex-start' }}
              spacing={2}
              sx={{ mb: 2 }}
            >
              <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap">
                <Tooltip title={selectedReviews.has(review._id) ? 'Deselect review' : 'Select review'}>
                  <Checkbox
                    checked={selectedReviews.has(review._id)}
                    onChange={() => handleSelectReview(review._id)}
                    size="small"
                  />
                </Tooltip>

                <Stack direction="row" alignItems="center" spacing={1}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light' }}>
                    <User size={16} />
                  </Avatar>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {review.guestName}
                  </Typography>
                </Stack>

                <Stack direction="row" alignItems="center" spacing={1}>
                  <Home size={16} color="#93968B" />
                  <Typography variant="body2" color="text.secondary">
                    {review.listingName}
                  </Typography>
                </Stack>

                <Stack direction="row" alignItems="center" spacing={1}>
                  <Calendar size={16} color="#93968B" />
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(review.submittedAt)}
                  </Typography>
                </Stack>
              </Stack>

              <Stack direction="row" alignItems="center" spacing={1}>
                <Chip
                  label={review.status}
                  color={getStatusColor(review.status)}
                  size="small"
                  variant="filled"
                />
                <Chip
                  label={review.channel}
                  size="small"
                  variant="outlined"
                />
                <Tooltip title={review.showOnWebsite ? 'Hide from website' : 'Show on website'}>
                  <IconButton
                    onClick={() => handleToggleWebsite(review)}
                    color={review.showOnWebsite ? 'primary' : 'default'}
                    size="small"
                  >
                    {review.showOnWebsite ? <Eye size={18} /> : <EyeOff size={18} />}
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>

            <Divider sx={{ mb: 2 }} />

            {/* Review Content */}
            <Stack spacing={2}>
              {/* Rating */}
              <Stack direction="row" alignItems="center" spacing={1}>
                <Rating
                  value={review.rating / 2}
                  readOnly
                  size="small"
                  precision={0.1}
                />
                <Chip
                  label={`${review.rating}/10`}
                  color={getRatingColor(review.rating)}
                  size="small"
                  variant="filled"
                  sx={{ fontWeight: 600 }}
                />
              </Stack>

              {/* Review Text */}
              <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                {review.publicReview}
              </Typography>

              {/* Private Review */}
              {review.privateReview && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    bgcolor: 'background.secondary',
                    borderRadius: 1,
                    border: 1,
                    borderColor: 'divider'
                  }}
                >
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, mb: 1, display: 'block' }}>
                    Private feedback:
                  </Typography>
                  <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                    {review.privateReview}
                  </Typography>
                </Paper>
              )}

              {/* Category Ratings */}
              {review.reviewCategory.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    Category Ratings
                  </Typography>
                  <Stack spacing={1}>
                    {review.reviewCategory.map((cat, idx) => (
                      <Stack key={idx} direction="row" alignItems="center" spacing={2}>
                        <Typography variant="body2" sx={{ minWidth: 120, textTransform: 'capitalize' }}>
                          {cat.category.replace(/_/g, ' ')}
                        </Typography>
                        <Box sx={{ flexGrow: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={cat.rating * 10}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              bgcolor: 'background.secondary',
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 3,
                                bgcolor: 'secondary.main'
                              }
                            }}
                          />
                        </Box>
                        <Typography variant="body2" sx={{ minWidth: 40, fontWeight: 500 }}>
                          {cat.rating}/10
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Box>
              )}

              {/* Expanded Review Section */}
              <Collapse in={expandedReview === review._id}>
                <Box sx={{ pt: 2 }}>
                  <Divider sx={{ mb: 2 }} />

                  {/* Management Response Section */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                      Management Response
                    </Typography>
                    {review.responseText ? (
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          bgcolor: 'background.secondary',
                          borderRadius: 1,
                          border: 1,
                          borderColor: 'divider'
                        }}
                      >
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          {review.responseText}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Responded on {formatDate(review.respondedAt || review.submittedAt)}
                        </Typography>
                      </Paper>
                    ) : (
                      <Stack spacing={2}>
                        <TextField
                          multiline
                          rows={3}
                          placeholder="Write a professional response to this review..."
                          value={responseText[review._id] || ''}
                          onChange={(e) => setResponseText(prev => ({
                            ...prev,
                            [review._id]: e.target.value
                          }))}
                          variant="outlined"
                          fullWidth
                        />
                        <Button
                          variant="contained"
                          startIcon={<Reply size={16} />}
                          onClick={() => handleResponseSubmit(review)}
                          sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
                        >
                          Submit Response
                        </Button>
                      </Stack>
                    )}
                  </Box>

                  {/* Status Controls */}
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                      Change Status:
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <Button
                        variant={review.status === 'published' ? 'contained' : 'outlined'}
                        size="small"
                        onClick={() => handleStatusChange(review, 'published')}
                        color="success"
                        sx={{ textTransform: 'none' }}
                      >
                        Published
                      </Button>
                      <Button
                        variant={review.status === 'pending' ? 'contained' : 'outlined'}
                        size="small"
                        onClick={() => handleStatusChange(review, 'pending')}
                        color="warning"
                        sx={{ textTransform: 'none' }}
                      >
                        Pending
                      </Button>
                      <Button
                        variant={review.status === 'rejected' ? 'contained' : 'outlined'}
                        size="small"
                        onClick={() => handleStatusChange(review, 'rejected')}
                        color="error"
                        sx={{ textTransform: 'none' }}
                      >
                        Rejected
                      </Button>
                    </Stack>
                  </Box>
                </Box>
              </Collapse>

              {/* Expand/Collapse Button */}
              <Button
                fullWidth
                variant="outlined"
                onClick={() => setExpandedReview(
                  expandedReview === review._id ? null : review._id
                )}
                sx={{
                  mt: 2,
                  textTransform: 'none',
                  borderStyle: 'dashed'
                }}
              >
                {expandedReview === review._id ? 'Show Less' : 'Manage Review'}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      ))}

      {/* Enhanced Pagination */}
      {totalPages > 1 && (
        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: 1, borderColor: 'divider' }}>
          <Stack direction="row" justifyContent="center" alignItems="center">
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={(_, page) => setCurrentPage(page)}
              color="primary"
              size="medium"
              showFirstButton
              showLastButton
              sx={{
                '& .MuiPaginationItem-root': {
                  borderRadius: 2
                }
              }}
            />
          </Stack>
        </Paper>
      )}
    </Stack>
  );
};

export default ReviewsList;
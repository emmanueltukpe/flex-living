import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Card,
  CardMedia,
  Typography,
  Stack,
  Avatar,
  Chip,
  LinearProgress,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Tabs,
  Tab
} from '@mui/material';
import {
  ArrowBack,
  Star as StarIcon,
  CalendarToday,
  Person,
  ThumbUp,
  LocationOn,
  Hotel as BedIcon,
  Bathtub,
  People,
  TrendingUp,
  Chat,
  Visibility,
  FilterList,
  Analytics,
  Home,
  CheckCircle
} from '@mui/icons-material';
import { propertiesApi, reviewsApi, Review, Property } from '../../services/api';

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
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'analytics'>('overview');
  const [reviewFilters, setReviewFilters] = useState({
    status: '',
    channel: '',
    rating: '',
    showOnWebsite: ''
  });

  const loadPropertyData = useCallback(async () => {
    if (!propertyId) return;

    setLoading(true);
    try {
      // Load property details
      const propertyRes = await propertiesApi.getById(propertyId);
      setProperty(propertyRes.data.property);

      // Load all reviews for this property
      const reviewsRes = await reviewsApi.getAll({
        listingId: propertyRes.data.property.externalId,
        limit: 100
      });
      setReviews(reviewsRes.data);
    } catch (error) {
      console.error('Error loading property data:', error);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  const applyFilters = useCallback(() => {
    let filtered = [...reviews];

    if (reviewFilters.status) {
      filtered = filtered.filter(review => review.status === reviewFilters.status);
    }

    if (reviewFilters.channel) {
      filtered = filtered.filter(review => review.channel === reviewFilters.channel);
    }

    if (reviewFilters.rating) {
      const minRating = parseInt(reviewFilters.rating);
      filtered = filtered.filter(review => review.rating >= minRating);
    }

    if (reviewFilters.showOnWebsite) {
      const showOnWebsite = reviewFilters.showOnWebsite === 'true';
      filtered = filtered.filter(review => review.showOnWebsite === showOnWebsite);
    }

    setFilteredReviews(filtered);
  }, [reviews, reviewFilters]);

  useEffect(() => {
    if (propertyId) {
      loadPropertyData();
    }
  }, [propertyId, loadPropertyData]);

  useEffect(() => {
    applyFilters();
  }, [reviews, reviewFilters, applyFilters]);



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
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 2 }}>
        <LinearProgress sx={{ width: '100%', maxWidth: 300 }} />
        <Typography variant="body2" color="text.secondary">
          Loading property details...
        </Typography>
      </Box>
    );
  }

  if (!property) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 2, textAlign: 'center' }}>
        <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
          Property not found
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          The property you're looking for doesn't exist or has been removed.
        </Typography>
        <Button
          component={Link}
          to="/"
          variant="contained"
          startIcon={<ArrowBack />}
          sx={{ textTransform: 'none' }}
        >
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  const uniqueChannels = Array.from(new Set(reviews.map(r => r.channel)));

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header */}
      <Paper elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Container maxWidth="lg" sx={{ py: 3 }}>
          <Button
            component={Link}
            to="/"
            startIcon={<ArrowBack />}
            sx={{ mb: 3, textTransform: 'none', color: 'text.secondary' }}
          >
            Back to Dashboard
          </Button>

          <Stack spacing={2}>
            <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
              {property.name}
            </Typography>

            <Stack direction="row" alignItems="center" spacing={1}>
              <LocationOn sx={{ color: 'text.secondary', fontSize: 20 }} />
              <Typography variant="body1" color="text.secondary">
                {property.address}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={4}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <BedIcon sx={{ fontSize: 18, color: 'text.primary' }} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {property.bedrooms} bed{property.bedrooms !== 1 ? 's' : ''}
                </Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Bathtub sx={{ fontSize: 18, color: 'text.primary' }} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {property.bathrooms} bath{property.bathrooms !== 1 ? 's' : ''}
                </Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={1}>
                <People sx={{ fontSize: 18, color: 'text.primary' }} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {property.maxGuests} guest{property.maxGuests !== 1 ? 's' : ''}
                </Typography>
              </Stack>
            </Stack>
          </Stack>
        </Container>
      </Paper>

      {/* Property Image */}
      {property.imageUrl && (
        <Paper elevation={0} sx={{ bgcolor: 'background.paper' }}>
          <Container maxWidth="lg" sx={{ py: 4 }}>
            <Card sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: 3 }}>
              <CardMedia
                component="img"
                height="400"
                image={property.imageUrl}
                alt={property.name}
                sx={{ objectFit: 'cover' }}
              />
            </Card>
          </Container>
        </Paper>
      )}

      {/* Navigation Tabs */}
      <Paper elevation={0} sx={{ borderBottom: 1, borderColor: 'divider', position: 'sticky', top: 0, zIndex: 10 }}>
        <Container maxWidth="lg">
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '1rem',
                minHeight: 64,
              }
            }}
          >
            <Tab
              value="overview"
              label="Overview"
              icon={<Home />}
              iconPosition="start"
            />
            <Tab
              value="reviews"
              label={`Reviews (${filteredReviews.length})`}
              icon={<Chat />}
              iconPosition="start"
            />
            <Tab
              value="analytics"
              label="Analytics"
              icon={<Analytics />}
              iconPosition="start"
            />
          </Tabs>
        </Container>
      </Paper>

      {/* Tab Content */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {activeTab === 'overview' && (
          <Stack spacing={4}>
            {/* Quick Stats */}
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2, transition: 'all 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 } }}>
                  <Box sx={{ width: 48, height: 48, bgcolor: 'secondary.main', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <StarIcon sx={{ color: 'primary.main', fontSize: 24 }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 0.5 }}>
                      {analytics.avgRating.toFixed(1)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Average Rating
                    </Typography>
                  </Box>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2, transition: 'all 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 } }}>
                  <Box sx={{ width: 48, height: 48, bgcolor: 'secondary.main', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Chat sx={{ color: 'primary.main', fontSize: 24 }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 0.5 }}>
                      {analytics.totalReviews}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Reviews
                    </Typography>
                  </Box>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2, transition: 'all 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 } }}>
                  <Box sx={{ width: 48, height: 48, bgcolor: 'secondary.main', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Visibility sx={{ color: 'primary.main', fontSize: 24 }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 0.5 }}>
                      {analytics.websiteReviews}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Website Reviews
                    </Typography>
                  </Box>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2, transition: 'all 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 } }}>
                  <Box sx={{ width: 48, height: 48, bgcolor: 'secondary.main', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TrendingUp sx={{ color: 'primary.main', fontSize: 24 }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 0.5 }}>
                      {analytics.publishedReviews}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Published
                    </Typography>
                  </Box>
                </Card>
              </Grid>
            </Grid>

            {/* Property Description */}
            {property.description && (
              <Card sx={{ p: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main', mb: 2 }}>
                  About this property
                </Typography>
                <Typography variant="body1" sx={{ lineHeight: 1.7, color: 'text.primary' }}>
                  {property.description}
                </Typography>
              </Card>
            )}

            {/* Amenities */}
            {property.amenities && property.amenities.length > 0 && (
              <Card sx={{ p: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main', mb: 3 }}>
                  Amenities
                </Typography>
                <Grid container spacing={2}>
                  {property.amenities.map((amenity, index) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                      <Chip
                        label={amenity}
                        variant="outlined"
                        sx={{
                          width: '100%',
                          justifyContent: 'flex-start',
                          bgcolor: 'background.default',
                          '& .MuiChip-label': { px: 2, py: 1 }
                        }}
                        icon={<CheckCircle sx={{ fontSize: 18 }} />}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Card>
            )}
          </Stack>
        )}

        {activeTab === 'reviews' && (
          <Stack spacing={4}>
            {/* Review Filters */}
            <Card sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                <FilterList sx={{ color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  Filter Reviews
                </Typography>
              </Stack>

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={reviewFilters.status}
                      label="Status"
                      onChange={(e) => setReviewFilters({...reviewFilters, status: e.target.value})}
                    >
                      <MenuItem value="">All Statuses</MenuItem>
                      <MenuItem value="published">Published</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="rejected">Rejected</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Channel</InputLabel>
                    <Select
                      value={reviewFilters.channel}
                      label="Channel"
                      onChange={(e) => setReviewFilters({...reviewFilters, channel: e.target.value})}
                    >
                      <MenuItem value="">All Channels</MenuItem>
                      {uniqueChannels.map(channel => (
                        <MenuItem key={channel} value={channel}>{channel}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Min Rating</InputLabel>
                    <Select
                      value={reviewFilters.rating}
                      label="Min Rating"
                      onChange={(e) => setReviewFilters({...reviewFilters, rating: e.target.value})}
                    >
                      <MenuItem value="">Any Rating</MenuItem>
                      <MenuItem value="8">8+ Stars</MenuItem>
                      <MenuItem value="6">6+ Stars</MenuItem>
                      <MenuItem value="4">4+ Stars</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Website Visibility</InputLabel>
                    <Select
                      value={reviewFilters.showOnWebsite}
                      label="Website Visibility"
                      onChange={(e) => setReviewFilters({...reviewFilters, showOnWebsite: e.target.value})}
                    >
                      <MenuItem value="">All Reviews</MenuItem>
                      <MenuItem value="true">Shown on Website</MenuItem>
                      <MenuItem value="false">Hidden from Website</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Card>

            {/* Reviews List */}
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main', mb: 3 }}>
                {filteredReviews.length} review{filteredReviews.length !== 1 ? 's' : ''}
              </Typography>

              {filteredReviews.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Typography variant="body1" color="text.secondary">
                    No reviews match the current filters.
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={3}>
                  {filteredReviews.map((review) => (
                    <Card key={review._id} variant="outlined" sx={{ p: 3, transition: 'all 0.2s', '&:hover': { boxShadow: 2 } }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                        <Stack direction="row" spacing={2}>
                          <Avatar sx={{ bgcolor: 'background.default', color: 'text.secondary' }}>
                            <Person />
                          </Avatar>
                          <Stack>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                              {review.guestName}
                            </Typography>
                            <Stack direction="row" spacing={2} alignItems="center">
                              <Stack direction="row" alignItems="center" spacing={0.5}>
                                <CalendarToday sx={{ fontSize: 14, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">
                                  {new Date(review.submittedAt).toLocaleDateString()}
                                </Typography>
                              </Stack>
                              <Chip
                                label={review.channel}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.75rem' }}
                              />
                            </Stack>
                          </Stack>
                        </Stack>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <StarIcon sx={{ color: 'secondary.main', fontSize: 18 }} />
                          <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                            {review.rating}/10
                          </Typography>
                        </Stack>
                      </Stack>

                      <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
                        {review.publicReview}
                      </Typography>

                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={1}>
                          <Chip
                            label={review.status}
                            size="small"
                            color={review.status === 'published' ? 'success' : review.status === 'pending' ? 'warning' : 'error'}
                            sx={{ textTransform: 'capitalize' }}
                          />
                          {review.showOnWebsite && (
                            <Chip
                              label="On Website"
                              size="small"
                              variant="outlined"
                              icon={<Visibility sx={{ fontSize: 14 }} />}
                              sx={{ fontSize: '0.75rem' }}
                            />
                          )}
                        </Stack>

                        <Button
                          size="small"
                          startIcon={<ThumbUp />}
                          onClick={() => handleHelpfulClick(review._id, true)}
                          sx={{ textTransform: 'none' }}
                        >
                          {review.helpful || 0}
                        </Button>
                      </Stack>

                      {review.responseText && (
                        <Paper sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderLeft: 4, borderColor: 'secondary.main' }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: 'primary.main' }}>
                            Response from FlexLiving:
                          </Typography>
                          <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                            {review.responseText}
                          </Typography>
                        </Paper>
                      )}
                    </Card>
                  ))}
                </Stack>
              )}
            </Card>
          </Stack>
        )}

        {activeTab === 'analytics' && (
          <Stack spacing={4}>
            {/* Analytics Overview */}
            <Card sx={{ p: 4 }}>
              <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main', mb: 3 }}>
                Performance Analytics
              </Typography>
              <Grid container spacing={4}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card variant="outlined" sx={{ p: 3, height: '100%' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main', mb: 2 }}>
                      Channel Distribution
                    </Typography>
                    <Stack spacing={2}>
                      {Object.entries(analytics.channelBreakdown).map(([channel, count]) => (
                        <Box key={channel}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {channel}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {count} reviews
                            </Typography>
                          </Stack>
                          <LinearProgress
                            variant="determinate"
                            value={(count / analytics.totalReviews) * 100}
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              bgcolor: 'background.default',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: 'secondary.main',
                                borderRadius: 4,
                              }
                            }}
                          />
                        </Box>
                      ))}
                    </Stack>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Card variant="outlined" sx={{ p: 3, height: '100%' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main', mb: 2 }}>
                      Category Ratings
                    </Typography>
                    <Stack spacing={2}>
                      {Object.entries(analytics.categoryBreakdown).map(([category, rating]) => (
                        <Stack key={category} direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 1.5, bgcolor: 'background.default', borderRadius: 2 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500, textTransform: 'capitalize' }}>
                            {category}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                            {(rating / reviews.length).toFixed(1)}/10
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </Card>
                </Grid>
              </Grid>
            </Card>

            {/* Monthly Trends */}
            <Card sx={{ p: 4 }}>
              <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main', mb: 3 }}>
                Monthly Review Trends
              </Typography>
              <Stack direction="row" spacing={2} alignItems="end" sx={{ height: 200, p: 2 }}>
                {analytics.monthlyTrends.map((trend, index) => (
                  <Stack key={index} alignItems="center" spacing={1} sx={{ flex: 1, height: '100%' }}>
                    <Stack alignItems="center" spacing={0.5}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                        {trend.reviews}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {trend.avgRating || 0}/10
                      </Typography>
                    </Stack>
                    <Box
                      sx={{
                        flex: 1,
                        width: 20,
                        bgcolor: 'background.default',
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'end',
                        minHeight: 20,
                      }}
                    >
                      <Box
                        sx={{
                          width: '100%',
                          bgcolor: 'secondary.main',
                          borderRadius: 1,
                          minHeight: 4,
                          height: `${(trend.reviews / Math.max(...analytics.monthlyTrends.map(t => t.reviews))) * 100}%`,
                          transition: 'height 0.3s ease',
                        }}
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
                      {trend.month}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Card>
          </Stack>
        )}
      </Container>
    </Box>
  );
};

export default PropertyDetail;

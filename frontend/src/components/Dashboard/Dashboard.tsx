import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Tabs,
  Tab,
  Paper,
  Stack,
  CircularProgress
} from '@mui/material';
import {
  RefreshCw,
  Download,
  BarChart3,
  Building2,
  MessageSquare,
  MapPin,
} from 'lucide-react';
import { reviewsApi, propertiesApi, hostawayApi, Review, Property, ReviewStatistics } from '../../services/api';
import ReviewsList from './ReviewsList';
import PropertyStats from './PropertyStats';
import PropertyList from './PropertyList';
import ReviewFilters from './ReviewFilters';
import Analytics from './Analytics';
import GoogleReviewsList from '../GoogleReviews/GoogleReviewsList';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [statistics, setStatistics] = useState<ReviewStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [filters, setFilters] = useState({
    channel: '',
    rating: '',
    status: '',
    showOnWebsite: '',
    startDate: '',
    endDate: ''
  });
  const [activeTab, setActiveTab] = useState<'reviews' | 'properties' | 'analytics'>('reviews');
  const [reviewSource, setReviewSource] = useState<'hostaway' | 'google'>('hostaway');
  const [selectedGooglePlace, setSelectedGooglePlace] = useState<string>('');

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      // Load properties
      const propertiesRes = await propertiesApi.getAll();
      setProperties(propertiesRes.data);

      // Load reviews with filters
      const reviewParams = {
        ...filters,
        listingId: selectedProperty,
        limit: 50
      };
      const reviewsRes = await reviewsApi.getAll(reviewParams);
      setReviews(reviewsRes.data);

      // Load statistics
      const statsRes = await reviewsApi.getStatistics({
        listingId: selectedProperty,
        startDate: filters.startDate,
        endDate: filters.endDate
      });
      setStatistics(statsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, selectedProperty]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSync = async () => {
    setLoading(true);
    try {
      await hostawayApi.sync();
      await loadData();
    } catch (error) {
      console.error('Error syncing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewUpdate = async (reviewId: string, updates: Partial<Review>) => {
    try {
      await reviewsApi.update(reviewId, updates);
      await loadData();
    } catch (error) {
      console.error('Error updating review:', error);
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['Guest Name', 'Property', 'Rating', 'Channel', 'Date', 'Review', 'Show on Website'],
      ...reviews.map(r => [
        r.guestName,
        r.listingName,
        r.rating.toString(),
        r.channel,
        new Date(r.submittedAt).toLocaleDateString(),
        r.publicReview.replace(/,/g, ';'),
        r.showOnWebsite ? 'Yes' : 'No'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reviews-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading && reviews.length === 0) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        gap={2}
      >
        <CircularProgress size={40} />
        <Typography variant="body2" color="text.secondary">
          Loading dashboard...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Enhanced Header */}
      <Paper
        elevation={0}
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper'
        }}
      >
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Stack spacing={3}>
            <Box>
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '2rem', md: '2.5rem' },
                  fontWeight: 700,
                  color: 'primary.main',
                  mb: 1
                }}
              >
                FlexLiving Reviews Dashboard
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage and analyze guest reviews across all properties
              </Typography>
            </Box>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              sx={{ pt: 1 }}
            >
              <Button
                variant="outlined"
                startIcon={<RefreshCw size={18} />}
                onClick={handleSync}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 500
                }}
              >
                Sync Data
              </Button>
              <Button
                variant="contained"
                startIcon={<Download size={18} />}
                onClick={handleExport}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 500,
                  boxShadow: 'none',
                  '&:hover': {
                    boxShadow: 2
                  }
                }}
              >
                Export CSV
              </Button>

            </Stack>
          </Stack>
        </Container>
      </Paper>

      {/* Property Stats */}
      <PropertyStats properties={properties} statistics={statistics} />

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden' }}>
          {/* Enhanced Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              sx={{ px: 3, pt: 2 }}
            >
              <Tab
                value="reviews"
                label={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <MessageSquare size={18} />
                    <span>Reviews Management</span>
                  </Stack>
                }
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                  minHeight: 48
                }}
              />
              <Tab
                value="properties"
                label={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Building2 size={18} />
                    <span>Properties</span>
                  </Stack>
                }
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                  minHeight: 48
                }}
              />
              <Tab
                value="analytics"
                label={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <BarChart3 size={18} />
                    <span>Analytics & Insights</span>
                  </Stack>
                }
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                  minHeight: 48
                }}
              />
            </Tabs>
          </Box>

          {/* Tab Content */}
          <Box sx={{ p: 3 }}>
            {activeTab === 'reviews' && (
              <Box>
                {/* Review Source Toggle */}
                <Paper elevation={0} sx={{ mb: 3, p: 2, borderRadius: 2, border: 1, borderColor: 'divider' }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Review Source
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant={reviewSource === 'hostaway' ? 'contained' : 'outlined'}
                        onClick={() => setReviewSource('hostaway')}
                        startIcon={<Building2 size={16} />}
                        sx={{
                          textTransform: 'none',
                          borderRadius: 2
                        }}
                      >
                        Hostaway Reviews
                      </Button>
                      <Button
                        variant={reviewSource === 'google' ? 'contained' : 'outlined'}
                        onClick={() => setReviewSource('google')}
                        startIcon={<MapPin size={16} />}
                        sx={{
                          textTransform: 'none',
                          borderRadius: 2
                        }}
                      >
                        Google Places
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>

                {/* Conditional Content Based on Review Source */}
                {reviewSource === 'hostaway' ? (
                  <Box>
                    <ReviewFilters
                      filters={filters}
                      onFilterChange={setFilters}
                      properties={properties}
                      selectedProperty={selectedProperty}
                      onPropertyChange={setSelectedProperty}
                    />
                    <ReviewsList
                      reviews={reviews}
                      onUpdateReview={handleReviewUpdate}
                      loading={loading}
                    />
                  </Box>
                ) : (
                  <GoogleReviewsList
                    selectedPlaceId={selectedGooglePlace}
                    onPlaceSelect={setSelectedGooglePlace}
                  />
                )}
              </Box>
            )}

            {activeTab === 'properties' && (
              <Box>
                <PropertyList
                  properties={properties}
                  loading={loading}
                />
              </Box>
            )}

            {activeTab === 'analytics' && (
              <Box>
                <Analytics
                  statistics={statistics}
                  reviews={reviews}
                  selectedProperty={selectedProperty}
                />
              </Box>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Dashboard;
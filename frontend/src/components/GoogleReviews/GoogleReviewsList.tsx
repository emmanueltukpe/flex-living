import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Rating,
  Avatar,
  Chip,
  LinearProgress,
  Alert,
  Button,
  TextField,
  Paper,
  Divider
} from '@mui/material';
import {
  MapPin,
  Star,
  Calendar,
  User,
  Search,
  AlertCircle
} from 'lucide-react';
import { googleApi, GooglePlacesResponse, GooglePlaceSearchResult } from '../../services/api';

interface GoogleReviewsListProps {
  selectedPlaceId?: string;
  onPlaceSelect?: (placeId: string) => void;
}

const GoogleReviewsList: React.FC<GoogleReviewsListProps> = ({ 
  selectedPlaceId, 
  onPlaceSelect 
}) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [placeData, setPlaceData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GooglePlaceSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (selectedPlaceId) {
      loadGoogleReviews(selectedPlaceId);
    }
  }, [selectedPlaceId]);

  const loadGoogleReviews = async (placeId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response: GooglePlacesResponse = await googleApi.getReviews(placeId);
      
      if (response.status === 'success' && response.data) {
        setReviews(response.data.reviews || []);
        setPlaceData(response.data);
      } else {
        setError(response.message || 'Failed to load Google reviews');
        setReviews([]);
        setPlaceData(null);
      }
    } catch (err) {
      setError('An error occurred while loading reviews');
      setReviews([]);
      setPlaceData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      const response = await googleApi.searchPlaces(searchQuery);
      if (response.status === 'success' && response.data) {
        setSearchResults(response.data);
      } else {
        setError(response.message || 'Failed to search places');
        setSearchResults([]);
      }
    } catch (err) {
      setError('An error occurred while searching');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handlePlaceSelect = (place: GooglePlaceSearchResult) => {
    if (onPlaceSelect) {
      onPlaceSelect(place.placeId);
    }
    setSearchResults([]);
    setSearchQuery('');
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getRatingColor = (rating: number): 'success' | 'primary' | 'warning' | 'error' => {
    if (rating >= 4.5) return 'success';
    if (rating >= 3.5) return 'primary';
    if (rating >= 2.5) return 'warning';
    return 'error';
  };

  const getPlaceName = (name: string | { text: string; languageCode: string } | undefined): string => {
    if (!name) return 'Unknown Place';
    if (typeof name === 'string') return name;
    return name.text || 'Unknown Place';
  };

  return (
    <Stack spacing={3}>
      {/* Place Search */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: 1, borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Search Google Places
        </Typography>
        <Stack direction="row" spacing={2}>
          <TextField
            fullWidth
            placeholder="Search for a place (e.g., 'FlexLiving London', 'Hotel Name')"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            size="small"
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={searching || !searchQuery.trim()}
            startIcon={<Search size={18} />}
            sx={{ textTransform: 'none', minWidth: 120 }}
          >
            {searching ? 'Searching...' : 'Search'}
          </Button>
        </Stack>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Search Results:
            </Typography>
            <Stack spacing={1}>
              {searchResults.map((place) => (
                <Card 
                  key={place.placeId} 
                  elevation={0}
                  sx={{ 
                    border: 1, 
                    borderColor: 'divider',
                    cursor: 'pointer',
                    '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' }
                  }}
                  onClick={() => handlePlaceSelect(place)}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {getPlaceName(place.name)}
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                          <MapPin size={14} color="#93968B" />
                          <Typography variant="body2" color="text.secondary">
                            {place.address}
                          </Typography>
                        </Stack>
                      </Box>
                      {place.rating && (
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Rating value={place.rating} readOnly size="small" precision={0.1} />
                          <Typography variant="body2" color="text.secondary">
                            ({place.totalRatings || 0})
                          </Typography>
                        </Stack>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Box>
        )}
      </Paper>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </Stack>
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Stack spacing={2} alignItems="center">
            <LinearProgress sx={{ width: '100%', maxWidth: 200 }} />
            <Typography variant="body2" color="text.secondary">
              Loading Google reviews...
            </Typography>
          </Stack>
        </Card>
      )}

      {/* Place Information */}
      {placeData && !loading && (
        <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: 1, borderColor: 'divider' }}>
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                  {getPlaceName(placeData.name)}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <MapPin size={16} color="#93968B" />
                  <Typography variant="body2" color="text.secondary">
                    {placeData.address}
                  </Typography>
                </Stack>
              </Box>
              <Stack alignItems="flex-end" spacing={1}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Rating value={placeData.rating} readOnly precision={0.1} />
                  <Chip 
                    label={`${placeData.rating}/5`}
                    color={getRatingColor(placeData.rating)}
                    size="small"
                    variant="filled"
                  />
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {placeData.totalRatings} reviews
                </Typography>
              </Stack>
            </Stack>
          </Stack>
        </Paper>
      )}

      {/* Reviews List */}
      {reviews.length > 0 && !loading && (
        <Box>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Recent Reviews ({reviews.length})
          </Typography>
          <Stack spacing={2}>
            {reviews.map((review, index) => (
              <Card 
                key={index}
                elevation={0}
                sx={{ 
                  border: 1, 
                  borderColor: 'divider',
                  borderRadius: 2,
                  '&:hover': { boxShadow: 2 }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Stack spacing={2}>
                    {/* Review Header */}
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.light' }}>
                          <User size={20} />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {review.guestName}
                          </Typography>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Calendar size={14} color="#93968B" />
                            <Typography variant="body2" color="text.secondary">
                              {formatDate(review.submittedAt)}
                            </Typography>
                          </Stack>
                        </Box>
                      </Stack>
                      
                      <Stack alignItems="flex-end" spacing={1}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Rating value={review.rating / 2} readOnly size="small" precision={0.1} />
                          <Chip 
                            label={`${review.rating}/10`}
                            color={getRatingColor(review.rating / 2)}
                            size="small"
                            variant="filled"
                          />
                        </Stack>
                        <Chip 
                          label={review.channel}
                          size="small"
                          variant="outlined"
                        />
                      </Stack>
                    </Stack>
                    
                    <Divider />
                    
                    {/* Review Content */}
                    <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                      {review.publicReview}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Box>
      )}

      {/* No Reviews State */}
      {!loading && !error && reviews.length === 0 && selectedPlaceId && (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Stack spacing={2} alignItems="center">
            <Star size={48} color="#93968B" />
            <Typography variant="h6" color="text.secondary">
              No reviews found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This place doesn't have any reviews yet, or reviews are not available.
            </Typography>
          </Stack>
        </Card>
      )}
    </Stack>
  );
};

export default GoogleReviewsList;

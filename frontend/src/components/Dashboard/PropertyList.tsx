import React from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Stack,
  Chip,
  Avatar,
  LinearProgress,
  Divider
} from '@mui/material';
import { Property } from '../../services/api';
import {
  Star,
  MapPin,
  Bed,
  Bath,
  Users,
  MessageSquare,
  Eye,
  TrendingUp
} from 'lucide-react';
import './PropertyList.css';

interface PropertyListProps {
  properties: Property[];
  loading: boolean;
}

const PropertyList: React.FC<PropertyListProps> = ({ properties, loading }) => {
  if (loading) {
    return (
      <Card sx={{ p: 4, textAlign: 'center' }}>
        <Stack spacing={2} alignItems="center">
          <LinearProgress sx={{ width: '100%', maxWidth: 200 }} />
          <Typography variant="body2" color="text.secondary">
            Loading properties...
          </Typography>
        </Stack>
      </Card>
    );
  }

  if (properties.length === 0) {
    return (
      <Card sx={{ p: 4, textAlign: 'center' }}>
        <Stack spacing={2} alignItems="center">
          <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.light' }}>
            <TrendingUp size={32} />
          </Avatar>
          <Typography variant="h6" color="text.secondary">
            No properties found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            There are no properties to display at the moment.
          </Typography>
        </Stack>
      </Card>
    );
  }

  return (
    <Box>
      {/* Enhanced Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          Properties ({properties.length})
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Click on any property to view detailed analytics and reviews
        </Typography>
      </Box>

      {/* Properties Grid */}
      <Grid container spacing={3}>
        {properties.map((property) => (
          <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={property._id}>
            <Card
              component={Link}
              to={`/property/${property.externalId}`}
              elevation={0}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                textDecoration: 'none',
                border: 1,
                borderColor: 'divider',
                borderRadius: 3,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  boxShadow: 6,
                  transform: 'translateY(-4px)',
                  borderColor: 'primary.main'
                }
              }}
            >
              {/* Property Image */}
              <Box sx={{ position: 'relative' }}>
                <CardMedia
                  component="img"
                  height={200}
                  image={property.imageUrl || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688'}
                  alt={property.name}
                  sx={{ borderRadius: '12px 12px 0 0' }}
                />

                {/* Property Type Badge */}
                <Chip
                  label={property.type}
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    bgcolor: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    fontWeight: 600
                  }}
                />

                {/* Rating Badge */}
                {property.avgRating && (
                  <Chip
                    icon={<Star size={12} fill="currentColor" />}
                    label={property.avgRating.toFixed(1)}
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      bgcolor: 'warning.main',
                      color: 'white',
                      fontWeight: 600
                    }}
                  />
                )}
              </Box>

              {/* Property Content */}
              <CardContent sx={{ flexGrow: 1, p: 3 }}>
                <Stack spacing={2}>
                  {/* Property Header */}
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                      {property.name}
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <MapPin size={14} color="#93968B" />
                      <Typography variant="body2" color="text.secondary">
                        {property.address}
                      </Typography>
                    </Stack>
                  </Box>

                  {/* Property Features */}
                  <Stack direction="row" spacing={3}>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Bed size={16} color="#93968B" />
                      <Typography variant="body2" color="text.secondary">
                        {property.bedrooms}
                      </Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Bath size={16} color="#93968B" />
                      <Typography variant="body2" color="text.secondary">
                        {property.bathrooms}
                      </Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Users size={16} color="#93968B" />
                      <Typography variant="body2" color="text.secondary">
                        {property.maxGuests}
                      </Typography>
                    </Stack>
                  </Stack>

                  {/* Description */}
                  {property.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                      {property.description.length > 100
                        ? `${property.description.substring(0, 100)}...`
                        : property.description
                      }
                    </Typography>
                  )}

                  {/* Property Stats */}
                  <Stack direction="row" spacing={2}>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <MessageSquare size={14} color="#93968B" />
                      <Typography variant="body2" color="text.secondary">
                        {property.totalReviews || 0} reviews
                      </Typography>
                    </Stack>
                    {property.avgRating && (
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <TrendingUp size={14} color="#93968B" />
                        <Typography variant="body2" color="text.secondary">
                          {property.avgRating.toFixed(1)}/10 rating
                        </Typography>
                      </Stack>
                    )}
                  </Stack>

                  {/* Amenities Preview */}
                  {property.amenities && property.amenities.length > 0 && (
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {property.amenities.slice(0, 3).map((amenity, index) => (
                        <Chip
                          key={index}
                          label={amenity}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.75rem' }}
                        />
                      ))}
                      {property.amenities.length > 3 && (
                        <Chip
                          label={`+${property.amenities.length - 3} more`}
                          size="small"
                          variant="filled"
                          color="primary"
                          sx={{ fontSize: '0.75rem' }}
                        />
                      )}
                    </Stack>
                  )}
                </Stack>
              </CardContent>

              {/* Property Footer */}
              <Box sx={{ p: 2, pt: 0 }}>
                <Divider sx={{ mb: 2 }} />
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Chip
                    label={property.isActive ? 'Active' : 'Inactive'}
                    size="small"
                    color={property.isActive ? 'success' : 'default'}
                    variant="filled"
                  />
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Typography variant="body2" color="primary.main" sx={{ fontWeight: 600 }}>
                      View Details
                    </Typography>
                    <Eye size={14} color="#1976d2" />
                  </Stack>
                </Stack>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default PropertyList;

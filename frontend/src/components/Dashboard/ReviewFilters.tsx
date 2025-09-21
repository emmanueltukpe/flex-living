import React from 'react';
import {
  Paper,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Stack,
  Chip,
  Box,
  Collapse
} from '@mui/material';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Property } from '../../services/api';
import './ReviewFilters.css';

interface ReviewFiltersProps {
  filters: any;
  onFilterChange: (filters: any) => void;
  properties: Property[];
  selectedProperty: string;
  onPropertyChange: (propertyId: string) => void;
}

const ReviewFilters: React.FC<ReviewFiltersProps> = ({
  filters,
  onFilterChange,
  properties,
  selectedProperty,
  onPropertyChange,
}) => {
  const [expanded, setExpanded] = React.useState(false);

  const handleFilterChange = (key: string, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFilterChange({
      channel: '',
      rating: '',
      status: '',
      showOnWebsite: '',
      startDate: '',
      endDate: ''
    });
    onPropertyChange('');
  };

  const hasActiveFilters = Object.values(filters).some(v => v) || selectedProperty;

  const getActiveFiltersCount = () => {
    let count = 0;
    if (selectedProperty) count++;
    Object.values(filters).forEach(v => v && count++);
    return count;
  };

  return (
    <Paper elevation={0} sx={{ mb: 3, borderRadius: 2, border: 1, borderColor: 'divider' }}>
      {/* Enhanced Filters Header */}
      <Box sx={{ p: 2, borderBottom: expanded ? 1 : 0, borderColor: 'divider' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" alignItems="center" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<Filter size={18} />}
              endIcon={expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              onClick={() => setExpanded(!expanded)}
              sx={{
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Filters
              {getActiveFiltersCount() > 0 && (
                <Chip
                  label={getActiveFiltersCount()}
                  size="small"
                  color="primary"
                  sx={{ ml: 1, minWidth: 20, height: 20 }}
                />
              )}
            </Button>

            {hasActiveFilters && (
              <Button
                variant="text"
                startIcon={<X size={16} />}
                onClick={clearFilters}
                size="small"
                sx={{
                  textTransform: 'none',
                  color: 'text.secondary'
                }}
              >
                Clear All
              </Button>
            )}
          </Stack>
        </Stack>
      </Box>

      {/* Collapsible Filters Grid */}
      <Collapse in={expanded}>
        <Box sx={{ p: 3 }}>
          <Grid container spacing={3}>
            {/* Property Filter */}
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Property</InputLabel>
                <Select
                  value={selectedProperty}
                  label="Property"
                  onChange={(e) => onPropertyChange(e.target.value)}
                >
                  <MenuItem value="">All Properties</MenuItem>
                  {properties.map(property => (
                    <MenuItem key={property._id} value={property.externalId}>
                      {property.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Channel Filter */}
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Channel</InputLabel>
                <Select
                  value={filters.channel}
                  label="Channel"
                  onChange={(e) => handleFilterChange('channel', e.target.value)}
                >
                  <MenuItem value="">All Channels</MenuItem>
                  <MenuItem value="Airbnb">Airbnb</MenuItem>
                  <MenuItem value="Booking.com">Booking.com</MenuItem>
                  <MenuItem value="Direct">Direct</MenuItem>
                  <MenuItem value="Vrbo">Vrbo</MenuItem>
                  <MenuItem value="Expedia">Expedia</MenuItem>
                  <MenuItem value="Google">Google</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Rating Filter */}
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Min Rating</InputLabel>
                <Select
                  value={filters.rating}
                  label="Min Rating"
                  onChange={(e) => handleFilterChange('rating', e.target.value)}
                >
                  <MenuItem value="">All Ratings</MenuItem>
                  <MenuItem value="9">9+ Excellent</MenuItem>
                  <MenuItem value="7">7+ Good</MenuItem>
                  <MenuItem value="5">5+ Average</MenuItem>
                  <MenuItem value="3">3+ Below Average</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Status Filter */}
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="published">Published</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Website Display Filter */}
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Website Display</InputLabel>
                <Select
                  value={filters.showOnWebsite}
                  label="Website Display"
                  onChange={(e) => handleFilterChange('showOnWebsite', e.target.value)}
                >
                  <MenuItem value="">All Reviews</MenuItem>
                  <MenuItem value="true">Shown on Website</MenuItem>
                  <MenuItem value="false">Hidden from Website</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Start Date Filter */}
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="Start Date"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* End Date Filter */}
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="End Date"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default ReviewFilters;
import React from 'react';
import { Property } from '../../services/api';
import { Filter, X } from 'lucide-react';
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

  return (
    <div className="review-filters">
      <div className="filters-header">
        <h3>
          <Filter size={18} />
          Filters
        </h3>
        {hasActiveFilters && (
          <button className="clear-filters" onClick={clearFilters}>
            <X size={16} />
            Clear All
          </button>
        )}
      </div>
      
      <div className="filters-grid">
        <div className="filter-group">
          <label>Property</label>
          <select value={selectedProperty} onChange={(e) => onPropertyChange(e.target.value)}>
            <option value="">All Properties</option>
            {properties.map(property => (
              <option key={property._id} value={property.externalId}>
                {property.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label>Channel</label>
          <select value={filters.channel} onChange={(e) => handleFilterChange('channel', e.target.value)}>
            <option value="">All Channels</option>
            <option value="Airbnb">Airbnb</option>
            <option value="Booking.com">Booking.com</option>
            <option value="Direct">Direct</option>
            <option value="Vrbo">Vrbo</option>
            <option value="Expedia">Expedia</option>
            <option value="Google">Google</option>
            <option value="Other">Other</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Min Rating</label>
          <select value={filters.rating} onChange={(e) => handleFilterChange('rating', e.target.value)}>
            <option value="">All Ratings</option>
            <option value="9">9+ Excellent</option>
            <option value="7">7+ Good</option>
            <option value="5">5+ Average</option>
            <option value="3">3+ Below Average</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Status</label>
          <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
            <option value="">All Status</option>
            <option value="published">Published</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Website Display</label>
          <select value={filters.showOnWebsite} onChange={(e) => handleFilterChange('showOnWebsite', e.target.value)}>
            <option value="">All Reviews</option>
            <option value="true">Shown on Website</option>
            <option value="false">Hidden from Website</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Start Date</label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
          />
        </div>
        
        <div className="filter-group">
          <label>End Date</label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default ReviewFilters;
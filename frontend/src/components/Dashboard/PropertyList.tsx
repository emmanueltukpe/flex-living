import React from 'react';
import { Link } from 'react-router-dom';
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
      <div className="property-list-loading">
        <div className="spinner"></div>
        <p>Loading properties...</p>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="no-properties">
        <h3>No properties found</h3>
        <p>There are no properties to display at the moment.</p>
      </div>
    );
  }

  return (
    <div className="property-list">
      <div className="property-list-header">
        <h3>Properties ({properties.length})</h3>
        <p className="subtitle">Click on any property to view detailed analytics and reviews</p>
      </div>
      
      <div className="properties-grid">
        {properties.map((property) => (
          <Link 
            key={property._id} 
            to={`/property/${property.externalId}`}
            className="property-card-link"
          >
            <div className="property-card">
              {/* Property Image */}
              <div className="property-image">
                <img 
                  src={property.imageUrl || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688'} 
                  alt={property.name}
                />
                <div className="property-type-badge">
                  {property.type}
                </div>
                {property.avgRating && (
                  <div className="property-rating-badge">
                    <Star size={12} fill="currentColor" />
                    <span>{property.avgRating.toFixed(1)}</span>
                  </div>
                )}
              </div>
              
              {/* Property Content */}
              <div className="property-content">
                <div className="property-header">
                  <h4 className="property-name">{property.name}</h4>
                  <div className="property-location">
                    <MapPin size={14} />
                    <span>{property.address}</span>
                  </div>
                </div>
                
                <div className="property-features">
                  <div className="feature">
                    <Bed size={14} />
                    <span>{property.bedrooms}</span>
                  </div>
                  <div className="feature">
                    <Bath size={14} />
                    <span>{property.bathrooms}</span>
                  </div>
                  <div className="feature">
                    <Users size={14} />
                    <span>{property.maxGuests}</span>
                  </div>
                </div>
                
                {property.description && (
                  <p className="property-description">
                    {property.description.length > 100 
                      ? `${property.description.substring(0, 100)}...` 
                      : property.description
                    }
                  </p>
                )}
                
                {/* Property Stats */}
                <div className="property-stats">
                  <div className="stat">
                    <MessageSquare size={14} />
                    <span>{property.totalReviews || 0} reviews</span>
                  </div>
                  {property.avgRating && (
                    <div className="stat">
                      <TrendingUp size={14} />
                      <span>{property.avgRating.toFixed(1)}/10 rating</span>
                    </div>
                  )}
                </div>
                
                {/* Amenities Preview */}
                {property.amenities && property.amenities.length > 0 && (
                  <div className="property-amenities-preview">
                    <div className="amenities-tags">
                      {property.amenities.slice(0, 3).map((amenity, index) => (
                        <span key={index} className="amenity-tag">
                          {amenity}
                        </span>
                      ))}
                      {property.amenities.length > 3 && (
                        <span className="amenity-tag more">
                          +{property.amenities.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Property Footer */}
              <div className="property-footer">
                <div className="property-status">
                  <span className={`status-indicator ${property.isActive ? 'active' : 'inactive'}`}>
                    {property.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="view-details">
                  <span>View Details</span>
                  <Eye size={14} />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default PropertyList;

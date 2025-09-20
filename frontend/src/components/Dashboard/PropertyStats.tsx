import React from 'react';
import { Property, ReviewStatistics } from '../../services/api';
import { Home, Star, MessageSquare, Eye } from 'lucide-react';
import './PropertyStats.css';

interface PropertyStatsProps {
  properties: Property[];
  statistics: ReviewStatistics | null;
}

const PropertyStats: React.FC<PropertyStatsProps> = ({ properties, statistics }) => {
  const stats = statistics?.overview || {
    avgRating: 0,
    totalReviews: 0,
    publishedReviews: 0,
    websiteReviews: 0
  };

  return (
    <div className="property-stats">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Home />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Properties</p>
            <p className="stat-value">{properties.length}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <Star />
          </div>
          <div className="stat-content">
            <p className="stat-label">Average Rating</p>
            <p className="stat-value">{stats.avgRating.toFixed(1)}/10</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <MessageSquare />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Reviews</p>
            <p className="stat-value">{stats.totalReviews}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <Eye />
          </div>
          <div className="stat-content">
            <p className="stat-label">Website Reviews</p>
            <p className="stat-value">{stats.websiteReviews}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyStats;
import React, { useState, useEffect } from 'react';
import { reviewsApi, propertiesApi, hostawayApi, Review, Property, ReviewStatistics } from '../../services/api';
import ReviewsList from './ReviewsList';
import PropertyStats from './PropertyStats';
import ReviewFilters from './ReviewFilters';
import Analytics from './Analytics';
import './Dashboard.css';
import { RefreshCw, Download, Upload } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'reviews' | 'analytics'>('reviews');

  useEffect(() => {
    loadData();
  }, [filters, selectedProperty]);

  const loadData = async () => {
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
  };

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
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>FlexLiving Reviews Dashboard</h1>
          <p className="subtitle">Manage and analyze guest reviews across all properties</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={handleSync}>
            <RefreshCw size={16} />
            Sync Data
          </button>
          <button className="btn btn-secondary" onClick={handleExport}>
            <Download size={16} />
            Export CSV
          </button>
          <button className="btn btn-primary">
            <Upload size={16} />
            Import Reviews
          </button>
        </div>
      </div>

      <PropertyStats properties={properties} statistics={statistics} />

      <div className="dashboard-content">
        <div className="content-header">
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'reviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              Reviews Management
            </button>
            <button
              className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              Analytics & Insights
            </button>
          </div>
        </div>

        {activeTab === 'reviews' ? (
          <div className="reviews-section">
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
          </div>
        ) : (
          <Analytics
            statistics={statistics}
            reviews={reviews}
            selectedProperty={selectedProperty}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
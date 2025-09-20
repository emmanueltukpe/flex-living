import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { ReviewStatistics, Review } from '../../services/api';
import './Analytics.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface AnalyticsProps {
  statistics: ReviewStatistics | null;
  reviews: Review[];
  selectedProperty: string;
}

const Analytics: React.FC<AnalyticsProps> = ({ statistics, reviews, selectedProperty }) => {
  if (!statistics) {
    return <div className="analytics-empty">No data available for analysis</div>;
  }

  // Prepare monthly trend data
  const monthlyData = statistics.monthlyTrend.map(item => ({
    label: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
    reviews: item.count,
    rating: item.avgRating
  }));

  const trendChartData = {
    labels: monthlyData.map(d => d.label),
    datasets: [
      {
        label: 'Number of Reviews',
        data: monthlyData.map(d => d.reviews),
        borderColor: '#D4F872',
        backgroundColor: 'rgba(212, 248, 114, 0.1)',
        yAxisID: 'y',
      },
      {
        label: 'Average Rating',
        data: monthlyData.map(d => d.rating),
        borderColor: '#323927',
        backgroundColor: 'rgba(50, 57, 39, 0.1)',
        yAxisID: 'y1',
      }
    ]
  };

  // Category breakdown chart
  const categoryChartData = {
    labels: statistics.categoryBreakdown.map(c => c._id.replace(/_/g, ' ')),
    datasets: [{
      label: 'Average Rating',
      data: statistics.categoryBreakdown.map(c => c.avgRating),
      backgroundColor: '#D4F872',
      borderColor: '#323927',
      borderWidth: 1
    }]
  };

  // Channel distribution chart
  const channelChartData = {
    labels: statistics.channelBreakdown.map(c => c._id),
    datasets: [{
      data: statistics.channelBreakdown.map(c => c.count),
      backgroundColor: ['#D4F872', '#323927', '#93968B', '#F5F3EF', '#CECEC7'],
      borderWidth: 0
    }]
  };

  return (
    <div className="analytics">
      <div className="analytics-grid">
        <div className="analytics-card">
          <h3>Review Trends</h3>
          <Line 
            data={trendChartData}
            options={{
              responsive: true,
              interaction: {
                mode: 'index',
                intersect: false,
              },
              scales: {
                y: {
                  type: 'linear',
                  display: true,
                  position: 'left',
                },
                y1: {
                  type: 'linear',
                  display: true,
                  position: 'right',
                  max: 10,
                  grid: {
                    drawOnChartArea: false,
                  },
                },
              },
            }}
          />
        </div>

        <div className="analytics-card">
          <h3>Category Performance</h3>
          <Bar 
            data={categoryChartData}
            options={{
              responsive: true,
              scales: {
                y: {
                  beginAtZero: true,
                  max: 10
                }
              }
            }}
          />
        </div>

        <div className="analytics-card small">
          <h3>Channel Distribution</h3>
          <Doughnut 
            data={channelChartData}
            options={{
              responsive: true,
              maintainAspectRatio: true
            }}
          />
        </div>

        <div className="analytics-card small">
          <h3>Key Metrics</h3>
          <div className="metrics-list">
            <div className="metric">
              <span className="metric-label">Average Rating</span>
              <span className="metric-value">{statistics.overview.avgRating.toFixed(1)}/10</span>
            </div>
            <div className="metric">
              <span className="metric-label">Response Rate</span>
              <span className="metric-value">
                {reviews.filter(r => r.responseText).length}/{reviews.length}
              </span>
            </div>
            <div className="metric">
              <span className="metric-label">Website Display Rate</span>
              <span className="metric-value">
                {((statistics.overview.websiteReviews / statistics.overview.totalReviews) * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="insights-section">
        <h3>Insights & Recommendations</h3>
        <div className="insights-grid">
          {statistics.categoryBreakdown
            .filter(c => c.avgRating < 7)
            .map((category, idx) => (
              <div key={idx} className="insight-card warning">
                <p>⚠️ <strong>{category._id.replace(/_/g, ' ')}</strong> needs improvement (avg: {category.avgRating.toFixed(1)}/10)</p>
              </div>
            ))}
          {statistics.channelBreakdown
            .sort((a, b) => b.avgRating - a.avgRating)
            .slice(0, 1)
            .map((channel, idx) => (
              <div key={idx} className="insight-card success">
                <p>✅ Best performing channel: <strong>{channel._id}</strong> ({channel.avgRating.toFixed(1)}/10)</p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
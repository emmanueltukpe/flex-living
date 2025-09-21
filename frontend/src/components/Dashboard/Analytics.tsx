import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Stack,
  Avatar
} from '@mui/material';
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
import { BarChart3 } from 'lucide-react';
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
    return (
      <Card sx={{ p: 4, textAlign: 'center' }}>
        <Stack spacing={2} alignItems="center">
          <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.light' }}>
            <BarChart3 size={32} />
          </Avatar>
          <Typography variant="h6" color="text.secondary">
            No data available for analysis
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Analytics will appear here once review data is available.
          </Typography>
        </Stack>
      </Card>
    );
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
    <Box>
      <Grid container spacing={3}>
        {/* Review Trends Chart */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                Review Trends
              </Typography>
              <Box sx={{ height: 300 }}>
                <Line
                  data={trendChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
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
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Key Metrics */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 3, height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                Key Metrics
              </Typography>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Average Rating
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {statistics.overview.avgRating.toFixed(1)}/10
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Response Rate
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    {reviews.filter(r => r.responseText).length}/{reviews.length}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Website Display Rate
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    {((statistics.overview.websiteReviews / statistics.overview.totalReviews) * 100).toFixed(0)}%
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Category Performance */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                Category Performance
              </Typography>
              <Box sx={{ height: 300 }}>
                <Bar
                  data={categoryChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 10
                      }
                    }
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Channel Distribution */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 3, height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                Channel Distribution
              </Typography>
              <Box sx={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Doughnut
                  data={channelChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Insights & Recommendations */}
        <Grid size={{ xs: 12 }}>
          <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                Insights & Recommendations
              </Typography>
              <Grid container spacing={2}>
                {statistics.categoryBreakdown
                  .filter(c => c.avgRating < 7)
                  .map((category, idx) => (
                    <Grid size={{ xs: 12, md: 6 }} key={idx}>
                      <Card elevation={0} sx={{ bgcolor: 'warning.light', border: 1, borderColor: 'warning.main' }}>
                        <CardContent sx={{ p: 2 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            ⚠️ <strong>{category._id.replace(/_/g, ' ')}</strong> needs improvement (avg: {category.avgRating.toFixed(1)}/10)
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                {statistics.channelBreakdown
                  .sort((a, b) => b.avgRating - a.avgRating)
                  .slice(0, 1)
                  .map((channel, idx) => (
                    <Grid size={{ xs: 12, md: 6 }} key={idx}>
                      <Card elevation={0} sx={{ bgcolor: 'success.light', border: 1, borderColor: 'success.main' }}>
                        <CardContent sx={{ p: 2 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            ✅ Best performing channel: <strong>{channel._id}</strong> ({channel.avgRating.toFixed(1)}/10)
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Analytics;
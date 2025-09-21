import React from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Stack,
  Avatar
} from '@mui/material';
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

  const statCards = [
    {
      label: 'Total Properties',
      value: properties.length,
      icon: Home,
      color: 'primary.main'
    },
    {
      label: 'Average Rating',
      value: `${stats.avgRating.toFixed(1)}/10`,
      icon: Star,
      color: 'warning.main'
    },
    {
      label: 'Total Reviews',
      value: stats.totalReviews,
      icon: MessageSquare,
      color: 'info.main'
    },
    {
      label: 'Website Reviews',
      value: stats.websiteReviews,
      icon: Eye,
      color: 'success.main'
    }
  ];

  return (
    <Box sx={{ bgcolor: 'background.default', py: 3 }}>
      <Container maxWidth="xl">
        <Grid container spacing={3}>
          {statCards.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    borderRadius: 3,
                    border: 1,
                    borderColor: 'divider',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      boxShadow: 4,
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Avatar
                        sx={{
                          bgcolor: stat.color,
                          width: 56,
                          height: 56
                        }}
                      >
                        <IconComponent size={24} color="white" />
                      </Avatar>
                      <Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 0.5, fontWeight: 500 }}
                        >
                          {stat.label}
                        </Typography>
                        <Typography
                          variant="h4"
                          sx={{
                            fontWeight: 700,
                            color: 'text.primary'
                          }}
                        >
                          {stat.value}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Container>
    </Box>
  );
};

export default PropertyStats;
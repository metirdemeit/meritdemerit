import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  IconButton,
  Button,
} from '@mui/material';
import { Leaderboard, ArrowBack, Refresh } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useCommonStore } from '../../store/commonStore';
import CommonRankingTable from '../components/CommonRankingTable';

export function RankingPage() {
  const navigate = useNavigate();
  const {
    rankings,
    fetchRankings,
    fetchStudents,
    fetchClassRankings,
  } = useCommonStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchRankings(),
        fetchStudents(),
        fetchClassRankings ? fetchClassRankings() : Promise.resolve(),
      ]);
    } catch (err) {
      if (import.meta.env.DEV) console.error('Failed to load rankings:', err);
      setError('Failed to load ranking data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', pb: 10 }}>
      {/* Header Section */}
      <Box sx={styles.headerSection}>
        <Container maxWidth="lg">
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
            <Box display="flex" alignItems="center">
              <IconButton
                onClick={() => navigate('/admin/dashboard')}
                sx={{
                  color: '#F4F4FF',
                  mr: 1,
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.16)',
                  },
                }}
                size="small"
              >
                <ArrowBack />
              </IconButton>
              <Leaderboard sx={styles.icon} />
              <Box>
                <Typography variant="h5" sx={{ color: 'white', fontWeight: 600 }}>
                  School Rankings
                </Typography>
                <Typography variant="body2" sx={{ color: '#b3b3b3' }}>
                  Leaderboard & Class Rankings (Admin Only)
                </Typography>
              </Box>
            </Box>

            <Button
              variant="outlined"
              size="small"
              startIcon={<Refresh />}
              onClick={loadData}
              disabled={loading}
              sx={{
                color: '#F4F4FF',
                borderColor: 'rgba(146, 102, 255, 0.4)',
                textTransform: 'none',
                '&:hover': {
                  borderColor: '#9266FF',
                  backgroundColor: 'rgba(146, 102, 255, 0.1)',
                },
              }}
            >
              Refresh
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ px: 2, mt: 3 }}>
        <Card sx={styles.contentCard}>
          <CardContent sx={{ p: 2 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress sx={{ color: '#9266FF' }} />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            ) : Array.isArray(rankings) && rankings.length > 0 ? (
              <CommonRankingTable rankings={rankings} />
            ) : (
              <Alert
                severity="info"
                sx={{
                  backgroundColor: 'rgba(146, 102, 255, 0.1)',
                  border: '1px solid rgba(146, 102, 255, 0.3)',
                  color: '#F4F4FF',
                }}
              >
                No rankings found.
              </Alert>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

const styles = {
  headerSection: {
    pt: 'calc(var(--tg-safe-area-inset-top, 0px) + 80px)',
    mt: 0,
    pb: 3,
    px: 2,
    background: 'linear-gradient(135deg, #4a1d63 0%, #343355 50%, #4a1d63 100%)',
    boxShadow: '0 20px 100px #4a1d63',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  icon: {
    color: '#9266FF',
    fontSize: 32,
    mr: 2,
  },
  contentCard: {
    background: 'linear-gradient(135deg, #0C0B21 0%, #1A1932 50%, #0E0D2A 100%)',
    borderRadius: 2,
    border: '1px solid rgba(146, 102, 255, 0.2)',
  },
};

export default RankingPage;

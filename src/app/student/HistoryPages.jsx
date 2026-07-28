import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Alert,
  CircularProgress,
} from '@mui/material';
import { History as HistoryIcon } from '@mui/icons-material';
import { useStudentStore } from '../../store/studentStore';
import AssignmentTable from '../components/AssignmentTable';

export function HistoryPages() {
  const { history, fetchHistory } = useStudentStore();
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      setError(null);
      const data = await fetchHistory({ page, size: pageSize });
      if (!data) {
        setError('Failed to load history');
      }
      setLoading(false);
    };

    loadHistory();
  }, [fetchHistory, page]);


  return (
    <Box sx={{ minHeight: '100vh', pb: 2 }}>
      {/* Header Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #4a1d63 0%, #343355 50%, #4a1d63 100%)',
          backdropFilter: 'blur(50px)',
          boxShadow: '0 20px 100px #4a1d63',
          p: 2,
          my: 2,
        }}
      >
        <Container maxWidth="sm">
          <Box display="flex" alignItems="center" mb={3}>
            <HistoryIcon sx={{ fontSize: 32, color: '#9266FF', mr: 2 }} />
            <Box>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 400 }}>
                Points History
              </Typography>
              <Typography variant="body2" sx={{ color: '#5A5984' }}>
                Track your points changes over time
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="sm" sx={{ px: 2 }}>

        {/* Point History Section */}
        <Card sx={{ 
          background: 'linear-gradient(135deg, #0C0B21 0%, #1A1932 50%, #0E0D2A 100%)',
          borderRadius: 2,
          border: '1px solid rgba(146, 102, 255, 0.2)',
        }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ color: '#F4F4FF', flexGrow: 1, fontWeight: 400 }}>
              Recent Activity
            </Typography>
          </Box>

          {loading && (!Array.isArray(history) || history.length === 0) ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress sx={{ color: '#9266FF' }} />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
          ) : (!Array.isArray(history) || history.length === 0) ? (
            <Alert 
              severity="info" 
              sx={{ 
                backgroundColor: 'rgba(146, 102, 255, 0.1)',
                border: '1px solid rgba(146, 102, 255, 0.3)',
                color: '#F4F4FF'
              }}
            >
              No point history found. Points will appear here when teachers assign them.
            </Alert>
          ) : (
            <AssignmentTable assignments={history} isLoading={loading} />
          )}
        </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

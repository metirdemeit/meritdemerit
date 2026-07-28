import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Button,
  Grid,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  Delete,
  Settings,
  Assessment,
  History,
  TrendingUp,
  Person,
  School,
} from '@mui/icons-material';
import { useAuthStore } from '../../store/authStore';
import { useAdminStore } from '../../store/adminStore';
import toast from 'react-hot-toast';
import DeleteConfirmationDialog from '../components/dialogs/DeleteConfirmationDialog';
import AssignmentTable from '../components/AssignmentTable';
import TeachersStatTable from '../components/TeachersStatTable';
import CommonRankingTable from '../components/CommonRankingTable';

export function SettingsPages() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuthStore();
  const {
    history,
    fetchHistory,
    deleteHistoryRecord,
    rankings,
    fetchAdminRanking,
    teacherStats,
    fetchTeacherStats,
  } = useAdminStore();

  const [activeTab, setActiveTab] = useState('moderation');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [errorHistory, setErrorHistory] = useState(null);
  const [errorStats, setErrorStats] = useState(null);

  useEffect(() => {
    const loadHistory = async () => {
      setLoadingHistory(true);
      setErrorHistory(null);
      const data = await fetchHistory();
      if (!data) {
        setErrorHistory('Failed to load history');
      }
      setLoadingHistory(false);
    };
    loadHistory();
  }, [fetchHistory]);

  const handleModeration = async () => {
    setActiveTab('moderation');
    setLoadingHistory(true);
    setErrorHistory(null);
    const data = await fetchHistory();
    if (!data) {
      setErrorHistory('Failed to load history');
    }
    setLoadingHistory(false);
  };

  const handleStatistics = async () => {
    setActiveTab('statistics');
    setLoadingStats(true);
    setErrorStats(null);
    const [stats, ranks] = await Promise.all([
      fetchTeacherStats(),
      fetchAdminRanking(),
    ]);
    if (!stats) {
      setErrorStats('Failed to load teacher statistics');
    } else if (!ranks) {
      setErrorStats('Failed to load rankings');
    }
    setLoadingStats(false);
  };

  const handleDeleteRecord = (record) => {
    setSelectedRecord(record);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedRecord) {
      try {
        await deleteHistoryRecord(selectedRecord.id);
        toast.success('Record deleted');
        // После успешного удаления обновляем данные
        const data = await fetchHistory();
        if (!data) {
          setErrorHistory('Failed to reload history');
        }
      } catch {
        toast.error('Failed to delete record');
      } finally {
        setDeleteDialogOpen(false);
        setSelectedRecord(null);
      }
    }
  };

  
 
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
            <Settings sx={{ fontSize: 32, color: '#9c27b0', mr: 2 }} />
            <Box>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 600 }}>
                Settings & Analytics
              </Typography>
              <Typography variant="body2" sx={{ color: '#b3b3b3' }}>
                Moderation and statistics management
              </Typography>
            </Box>
          </Box>

          {/* Tab Buttons */}
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant={activeTab === 'moderation' ? 'contained' : 'outlined'}
                startIcon={<History />}
                onClick={() => handleModeration()}
                sx={{
                  height: 50,
                  borderRadius: 2,
                  ...(activeTab === 'moderation' ? {
                    background: 'linear-gradient(135deg, #673ab7 0%, #9c27b0 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5e35b1 0%, #8e24aa 100%)',
                    },
                  } : {
                    borderColor: '#9c27b0',
                    color: '#9c27b0',
                    '&:hover': {
                      borderColor: '#ba68c8',
                      backgroundColor: 'rgba(156, 39, 176, 0.1)',
                    },
                  }),
                }}
              >
                Moderation
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant={activeTab === 'statistics' ? 'contained' : 'outlined'}
                startIcon={<Assessment />}
                onClick={() => handleStatistics()}
                sx={{
                  height: 50,
                  borderRadius: 2,
                  ...(activeTab === 'statistics' ? {
                    background: 'linear-gradient(135deg, #673ab7 0%, #9c27b0 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5e35b1 0%, #8e24aa 100%)',
                    },
                  } : {
                    borderColor: '#9c27b0',
                    color: '#9c27b0',
                    '&:hover': {
                      borderColor: '#ba68c8',
                      backgroundColor: 'rgba(156, 39, 176, 0.1)',
                    },
                  }),
                }}
              >
                Statistics
              </Button>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="sm" sx={{ px: 2 }}>
        {/* Moderation Tab */}
        {activeTab === 'moderation' && (
          <Card
            sx={{
              background: 'linear-gradient(135deg, #0C0B21 0%, #1A1932 50%, #0E0D2A 100%)',
              backdropFilter: 'blur(10px)',
              borderRadius: 2,
              border: '1px solid rgba(156, 39, 176, 0.2)',
              mt: 2,
            }}
          >
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, mb: 2 }}>
                Points History Moderation ({history?.length || 0})
              </Typography>
              {errorHistory && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {errorHistory}
                </Alert>
              )}
              {loadingHistory ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress sx={{ color: '#9c27b0' }} />
                </Box>
              ) : !history || history.length === 0 ? (
                <Box textAlign="center" py={3}>
                  <History sx={{ fontSize: 48, color: '#666', mb: 2 }} />
                  <Typography variant="body2" sx={{ color: '#b3b3b3' }}>
                    No history records found
                  </Typography>
                </Box>
              ) : (
                <AssignmentTable 
                  assignments={history} 
                  onDelete={handleDeleteRecord}
                  isLoading={loadingHistory}
                />
              )}
            </CardContent>
          </Card>
        )}

        {/* Statistics Tab */}
        {activeTab === 'statistics' && (
          <Box>
            {/* Teacher Statistics */}
            <Card
              sx={{
                background: 'linear-gradient(135deg, #0C0B21 0%, #1A1932 50%, #0E0D2A 100%)',
                backdropFilter: 'blur(10px)',
                borderRadius: 2,
                border: '1px solid rgba(156, 39, 176, 0.2)',
                mb: 3,
                mt: 2,
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, mb: 2 }}>
                  Teacher Statistics ({teacherStats?.length || 0})
                </Typography>
                {errorStats && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {errorStats}
                  </Alert>
                )}
                {loadingStats ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress sx={{ color: '#9c27b0' }} />
                  </Box>
                ) : !teacherStats || teacherStats.length === 0 ? (
                  <Box textAlign="center" py={3}>
                    <Person sx={{ fontSize: 48, color: '#666', mb: 2 }} />
                    <Typography variant="body2" sx={{ color: '#b3b3b3' }}>
                      Teacher statistics unavailable
                    </Typography>
                  </Box>
                ) : (
                  <TeachersStatTable teachersStats={teacherStats} />
                )}
              </CardContent>
            </Card>

            {/* Rankings */}
            <Card
              sx={{
                background: 'linear-gradient(135deg, #0C0B21 0%, #1A1932 50%, #0E0D2A 100%)',
                backdropFilter: 'blur(10px)',
                borderRadius: 2,
                border: '1px solid rgba(156, 39, 176, 0.2)',
                mb: 3,
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, mb: 2 }}>
                  Student Rankings ({rankings?.length || 0})
                </Typography>
                {loadingStats ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress sx={{ color: '#9c27b0' }} />
                  </Box>
                ) : !rankings || rankings.length === 0 ? (
                  <Box textAlign="center" py={3}>
                    <TrendingUp sx={{ fontSize: 48, color: '#666', mb: 2 }} />
                    <Typography variant="body2" sx={{ color: '#b3b3b3' }}>
                      Rankings unavailable
                    </Typography>
                  </Box>
                ) : (
                  <CommonRankingTable rankings={rankings} />
                )}
              </CardContent>
            </Card>
          </Box>
        )}
      </Container>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Record"
        message="Are you sure you want to delete this history record? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
    </Box>
  );
}

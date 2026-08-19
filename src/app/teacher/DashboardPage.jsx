// src/app/teacher/DashboardPage.jsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Button,
} from '@mui/material';
import { History as HistoryIcon } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { useTeacherStore } from '../../store/teacherStore';
import { useAuthStore } from '../../store/authStore';
import { useCommonStore } from '../../store/commonStore';
import DeleteConfirmationDialog from '../components/dialogs/DeleteConfirmationDialog';
import AssignmentTable from '../components/AssignmentTable';
import CommonRankingTable from '../components/CommonRankingTable';
import { School, WarningAmber } from '@mui/icons-material';

export function DashboardPage() {
  const { user } = useAuthStore();
  const { 
    profile,
    history,
    fetchHistory, 
    deleteHistoryRecord,
    fetchProfile,
  } = useTeacherStore();
  const { rankings, fetchRankings, students, fetchStudents } = useCommonStore();

  const homeroomClass = profile?.homeroom_class_name || user?.homeroom_class_name || '10-A';

  // Loading для каждой секции
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingRankings, setLoadingRankings] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const isClassMatch = (s, targetClass) => {
    const rawName = s.class_name || s.school_class?.name || s.class || '';
    const name = rawName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const target = (targetClass || '').toLowerCase().replace(/[^a-z0-9]/g, '').replace(/^class/, '');
    return name === target || name.replace(/^class/, '') === target;
  };

  // Студенты закрепленного класса
  const homeroomStudents = (students || []).filter((s) => isClassMatch(s, homeroomClass));
  const riskStudents = homeroomStudents.filter((s) => (s.points ?? 100) < 100);

  // Диалог удаления
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Загрузка секций
  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      await fetchHistory({ page: 1, size: 10 });
    } finally {
      setLoadingHistory(false);
    }
  };
 
  const loadRankings = async () => {
    setLoadingRankings(true);
    try {
      await fetchRankings();
      await fetchStudents();
    } finally {
      setLoadingRankings(false);
    }
  };
 
  const loadProfile = async () => {
    setLoadingProfile(true);
    try {
      await fetchProfile();
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    loadHistory();
    loadRankings();
    loadProfile();
  }, []);

  // Удаление
  const handleDeleteAssignment = (recordOrId) => {
    const id = typeof recordOrId === 'object' ? recordOrId?.id : recordOrId;
    setAssignmentToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!assignmentToDelete) return;

    const id = typeof assignmentToDelete === 'object' ? assignmentToDelete?.id : assignmentToDelete;
    setDeletingId(id);
    try {
      await deleteHistoryRecord(id);
      toast.success('Assignment deleted');
      await loadHistory(); // обновляем список после удаления
    } catch (e) {
      toast.error('Failed to delete assignment');
    } finally {
      setDeletingId(null);
      setDeleteDialogOpen(false);
      setAssignmentToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setAssignmentToDelete(null);
  };

  return (
    <Box sx={{ minHeight: '100vh', pb: 2 }}>
      {/* Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #4a1d63 0%, #343355 50%, #4a1d63 100%)',
          backdropFilter: 'blur(50px)',
          boxShadow: '0 20px 100px #4a1d63',
          p: 2,
          pt: 'calc(var(--tg-content-safe-area-inset-top, var(--tg-safe-area-inset-top, 0px)) + 60px)',
          pb: 2,
          mt: 0,
          mb: 2,
        }}
      >
        <Container maxWidth="sm">
          <Box display="flex" alignItems="center" mb={3}>
            <HistoryIcon sx={{ fontSize: 32, color: '#9266FF', mr: 2 }} />
            <Box>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 400 }}>
                Teacher Dashboard
              </Typography>
              <Typography variant="body2" sx={{ color: '#5A5984' }}>
                Welcome back, {user?.first_name} {user?.last_name}
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="sm" sx={{ px: 2 }}>
        {/* Homeroom Class Quick Status & Alert */}
        {riskStudents.length > 0 && (
          <Alert
            severity="warning"
            icon={<WarningAmber fontSize="inherit" />}
            sx={{
              mb: 3,
              backgroundColor: 'rgba(255, 152, 0, 0.12)',
              border: '1px solid rgba(255, 152, 0, 0.4)',
              color: '#FF9800',
              borderRadius: 2,
              '& .MuiAlert-icon': { color: '#FF9800' },
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Attention Homeroom Teacher ({homeroomClass})
            </Typography>
            <Typography variant="body2">
              {riskStudents.length} student(s) in your class currently have points below 100 (
              {riskStudents.map((s) => `${s.first_name || ''} ${s.last_name || s.username} (${s.points ?? 0} pts)`).join(', ')}
              ).
            </Typography>
          </Alert>
        )}

        {/* Points History */}
        <Card sx={{ 
          background: 'linear-gradient(135deg, #0C0B21 0%, #1A1932 50%, #0E0D2A 100%)',
          borderRadius: 2,
          border: '1px solid rgba(146, 102, 255, 0.2)',
          mb: 3,
        }}>
          <CardContent>
            <Box display="flex" alignItems="center" mb={3}>
              <Typography variant="h6" sx={{ color: '#F4F4FF', flexGrow: 1, fontWeight: 400 }}>
                Points Assignment History
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={loadHistory}
                disabled={loadingHistory}
                sx={{
                  borderColor: 'rgba(146, 102, 255, 0.5)',
                  color: '#9266FF',
                  '&:hover': {
                    borderColor: '#9266FF',
                    background: 'rgba(146, 102, 255, 0.1)'
                  }
                }}
              >
                Refresh
              </Button>
            </Box>

            {loadingHistory ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress sx={{ color: '#9266FF' }} />
              </Box>
            ) : !Array.isArray(history) || history.length === 0 ? (
              <Alert severity="info" sx={{ backgroundColor: 'rgba(146, 102, 255, 0.1)', border: '1px solid rgba(146, 102, 255, 0.3)', color: '#F4F4FF' }}>
                No point assignments found. Start assigning points to students to see your history here.
              </Alert>
            ) : (
              <AssignmentTable
                assignments={history}
                onDelete={handleDeleteAssignment}
                isLoading={deletingId !== null}
              />
            )}
          </CardContent>
        </Card>

        {/* Rankings */}
        <Card sx={{ 
          background: 'linear-gradient(135deg, #0C0B21 0%, #1A1932 50%, #0E0D2A 100%)',
          borderRadius: 2,
          border: '1px solid rgba(146, 102, 255, 0.2)',
        }}>
          <CardContent>
            <Typography variant="h6" sx={{ color: '#F4F4FF', mb: 2 }}>
              Rankings
            </Typography>

            {loadingRankings ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress sx={{ color: '#9266FF' }} />
              </Box>
            ) : !Array.isArray(rankings) || rankings.length === 0 ? (
              <Alert severity="info" sx={{ mb: 3 }}>
                No rankings found.
              </Alert>
            ) : (
              <CommonRankingTable rankings={rankings} />
            )}
          </CardContent>
        </Card>
      </Container>

      {/* Delete Confirmation */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Assignment"
        message="Are you sure you want to delete this assignment? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
    </Box>
  );
}

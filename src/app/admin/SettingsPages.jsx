import React, { useState, useEffect, useMemo } from 'react';
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
  TextField,
  IconButton,
  Chip,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  InputAdornment,
} from '@mui/material';
import {
  Delete,
  Settings,
  Assessment,
  History,
  TrendingUp,
  Person,
  FilterList,
  FilterListOff,
  Search,
  CalendarToday,
  Clear,
  Timer,
  NotificationsActive,
  Report,
} from '@mui/icons-material';
import { useAuthStore } from '../../store/authStore';
import { useAdminStore } from '../../store/adminStore';
import toast from 'react-hot-toast';
import DetentionManager from './components/DetentionManager';
import InterventionsManager from './components/InterventionsManager';
import RiskRegistryPage from './RiskRegistryPage';
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

  // Фильтры истории
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    student: '',
    teacher: '',
    rule: '',
    type: 'all', // 'all', 'merit', 'demerit'
  });

  const resetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      student: '',
      teacher: '',
      rule: '',
      type: 'all',
    });
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.startDate) count++;
    if (filters.endDate) count++;
    if (filters.student.trim()) count++;
    if (filters.teacher.trim()) count++;
    if (filters.rule.trim()) count++;
    if (filters.type !== 'all') count++;
    return count;
  }, [filters]);

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

  // Фильтрация истории
  const filteredHistory = useMemo(() => {
    if (!Array.isArray(history)) return [];
    return history.filter((item) => {
      // 1. Поиск по студенту
      if (filters.student.trim() && !item.student_name?.toLowerCase().includes(filters.student.trim().toLowerCase())) {
        return false;
      }
      // 2. Поиск по учителю
      if (filters.teacher.trim() && !item.teacher_name?.toLowerCase().includes(filters.teacher.trim().toLowerCase())) {
        return false;
      }
      // 3. Поиск по правилу
      if (filters.rule.trim() && !item.rule_description?.toLowerCase().includes(filters.rule.trim().toLowerCase())) {
        return false;
      }
      // 4. Поиск по дате (от)
      if (filters.startDate) {
        const itemDate = new Date(item.created_at);
        const start = new Date(filters.startDate);
        start.setHours(0, 0, 0, 0);
        if (itemDate < start) return false;
      }
      // 5. Поиск по дате (до)
      if (filters.endDate) {
        const itemDate = new Date(item.created_at);
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        if (itemDate > end) return false;
      }
      // 6. Тип (Merit / Demerit)
      if (filters.type === 'merit' && item.points_changed <= 0) return false;
      if (filters.type === 'demerit' && item.points_changed >= 0) return false;

      return true;
    });
  }, [history, filters]);

  // Модульные кнопки настроек
  const navTabs = [
    { id: 'moderation', label: 'Moderation', icon: <History />, action: handleModeration },
    { id: 'statistics', label: 'Statistics', icon: <Assessment />, action: handleStatistics },
    { id: 'detention', label: 'Detention Management', icon: <Timer />, action: () => setActiveTab('detention') },
    { id: 'interventions', label: 'Interventions & Alerts', icon: <NotificationsActive />, action: () => setActiveTab('interventions') },
    { id: 'risk', label: 'Risk Registry & Re-enrollment', icon: <Report />, action: () => setActiveTab('risk') },
  ];

  return (
    <Box sx={{ minHeight: '100vh', pb: 4 }}>
      {/* Header Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #4a1d63 0%, #343355 50%, #4a1d63 100%)',
          backdropFilter: 'blur(50px)',
          boxShadow: '0 20px 100px #4a1d63',
        position: 'sticky',
        top: 0,
        zIndex: 100,
          p: 2,
          pt: 'calc(var(--tg-safe-area-inset-top, 0px) + 24px)',
          pb: 2,
          mt: 0,
          mb: 2,
        }}
      >
        <Container maxWidth="sm">
          <Box display="flex" alignItems="center" mb={2}>
            <Settings sx={{ fontSize: 32, color: '#9266FF', mr: 2 }} />
            <Box>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 600 }}>
                Settings & Analytics
              </Typography>
              <Typography variant="body2" sx={{ color: '#5A5984' }}>
                Moderation, stats and administrative tools
              </Typography>
            </Box>
          </Box>

          {/* Модульные вкладки навигации (вертикальный стек) */}
          <Grid container spacing={1.5} direction="column" sx={{ mt: 1 }}>
            {navTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <Grid item xs={12} key={tab.id}>
                  <Button
                    fullWidth
                    variant={isActive ? 'contained' : 'outlined'}
                    startIcon={tab.icon}
                    onClick={tab.action}
                    sx={{
                      height: 50,
                      borderRadius: 2,
                      fontWeight: 600,
                      textTransform: 'none',
                      justifyContent: 'flex-start',
                      px: 2.5,
                      ...(isActive
                        ? {
                            background: 'linear-gradient(135deg, #9266FF 0%, #6932EB 100%)',
                            color: '#FFFFFF',
                            boxShadow: '0 4px 14px rgba(146, 102, 255, 0.4)',
                            '&:hover': {
                              background: 'linear-gradient(135deg, #8152FF 0%, #5824DB 100%)',
                            },
                          }
                        : {
                            borderColor: 'rgba(146, 102, 255, 0.4)',
                            color: '#F4F4FF',
                            backgroundColor: 'rgba(146, 102, 255, 0.05)',
                            '&:hover': {
                              borderColor: '#9266FF',
                              backgroundColor: 'rgba(146, 102, 255, 0.15)',
                            },
                          }),
                    }}
                  >
                    {tab.label}
                  </Button>
                </Grid>
              );
            })}
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
              border: '1px solid rgba(146, 102, 255, 0.2)',
              mt: 2,
            }}
          >
            <CardContent sx={{ p: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                  Points History Moderation ({filteredHistory.length} / {history?.length || 0})
                </Typography>
                <Button
                  size="small"
                  startIcon={<FilterList />}
                  onClick={() => setShowFilters(!showFilters)}
                  sx={{
                    color: activeFilterCount > 0 ? '#00D377' : '#9266FF',
                    borderColor: activeFilterCount > 0 ? 'rgba(0,211,119,0.4)' : 'rgba(146,102,255,0.4)',
                    textTransform: 'none',
                  }}
                  variant="outlined"
                >
                  Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
                </Button>
              </Box>

              {/* Панель интерактивных фильтров */}
              <Collapse in={showFilters}>
                <Box
                  sx={{
                    p: 2,
                    mb: 3,
                    borderRadius: 2,
                    backgroundColor: 'rgba(146, 102, 255, 0.06)',
                    border: '1px solid rgba(146, 102, 255, 0.18)',
                  }}
                >
                  <Grid container spacing={1.5}>
                    {/* Фильтр по студенту */}
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Student Name"
                        value={filters.student}
                        onChange={(e) => setFilters({ ...filters, student: e.target.value })}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Search sx={{ color: '#5A5984', fontSize: 18 }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={filterFieldStyle}
                      />
                    </Grid>

                    {/* Фильтр по учителю */}
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Teacher / Admin"
                        value={filters.teacher}
                        onChange={(e) => setFilters({ ...filters, teacher: e.target.value })}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Search sx={{ color: '#5A5984', fontSize: 18 }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={filterFieldStyle}
                      />
                    </Grid>

                    {/* Фильтр по правилу */}
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Rule Description"
                        value={filters.rule}
                        onChange={(e) => setFilters({ ...filters, rule: e.target.value })}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Search sx={{ color: '#5A5984', fontSize: 18 }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={filterFieldStyle}
                      />
                    </Grid>

                    {/* Тип баллов */}
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel sx={{ color: '#5A5984' }}>Type</InputLabel>
                        <Select
                          value={filters.type}
                          label="Type"
                          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                          sx={{
                            color: '#F4F4FF',
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(146, 102, 255, 0.3)' },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(146, 102, 255, 0.5)' },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#9266FF' },
                          }}
                        >
                          <MenuItem value="all">All Types</MenuItem>
                          <MenuItem value="merit">Merit (+ Points)</MenuItem>
                          <MenuItem value="demerit">Demerit (- Points)</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Дата От */}
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        size="small"
                        type="date"
                        label="From Date"
                        InputLabelProps={{ shrink: true }}
                        value={filters.startDate}
                        onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                        sx={filterFieldStyle}
                      />
                    </Grid>

                    {/* Дата До */}
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        size="small"
                        type="date"
                        label="To Date"
                        InputLabelProps={{ shrink: true }}
                        value={filters.endDate}
                        onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                        sx={filterFieldStyle}
                      />
                    </Grid>
                  </Grid>

                  {/* Кнопка сброса */}
                  {activeFilterCount > 0 && (
                    <Box display="flex" justifyContent="flex-end" mt={1.5}>
                      <Button
                        size="small"
                        startIcon={<Clear />}
                        onClick={resetFilters}
                        sx={{ color: '#EB2B4B', textTransform: 'none' }}
                      >
                        Reset Filters
                      </Button>
                    </Box>
                  )}
                </Box>
              </Collapse>

              {errorHistory && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {errorHistory}
                </Alert>
              )}

              {loadingHistory ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress sx={{ color: '#9266FF' }} />
                </Box>
              ) : !filteredHistory || filteredHistory.length === 0 ? (
                <Box textAlign="center" py={3}>
                  <History sx={{ fontSize: 48, color: '#666', mb: 2 }} />
                  <Typography variant="body2" sx={{ color: '#b3b3b3' }}>
                    {activeFilterCount > 0 ? 'No records match selected filters' : 'No history records found'}
                  </Typography>
                </Box>
              ) : (
                <AssignmentTable 
                  assignments={filteredHistory} 
                  onDelete={handleDeleteRecord}
                  isLoading={loadingHistory}
                />
              )}
            </CardContent>
          </Card>
        )}

        {/* Statistics Tab */}
        {activeTab === 'statistics' && (
          <Box sx={{ mt: 2 }}>
            {/* Teacher Statistics */}
            <Card
              sx={{
                background: 'linear-gradient(135deg, #0C0B21 0%, #1A1932 50%, #0E0D2A 100%)',
                backdropFilter: 'blur(10px)',
                borderRadius: 2,
                border: '1px solid rgba(146, 102, 255, 0.2)',
                mb: 3,
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
                    <CircularProgress sx={{ color: '#9266FF' }} />
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
                border: '1px solid rgba(146, 102, 255, 0.2)',
                mb: 3,
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, mb: 2 }}>
                  Student Rankings ({rankings?.length || 0})
                </Typography>
                {loadingStats ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress sx={{ color: '#9266FF' }} />
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

        {/* Detention Management Tab */}
        {activeTab === 'detention' && <DetentionManager />}

        {/* Interventions & Alerts Tab */}
        {activeTab === 'interventions' && <InterventionsManager />}

        {/* Risk Registry & Re-enrollment Tab */}
        {activeTab === 'risk' && <RiskRegistryPage />}
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

const filterFieldStyle = {
  '& .MuiOutlinedInput-root': {
    color: '#F4F4FF',
    '& fieldset': {
      borderColor: 'rgba(146, 102, 255, 0.3)',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(146, 102, 255, 0.5)',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#9266FF',
    },
  },
  '& .MuiInputLabel-root': {
    color: '#5A5984',
  },
};

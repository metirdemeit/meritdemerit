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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  InputAdornment,
  Autocomplete,
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
  FileDownload,
  Timer,
  NotificationsActive,
  Report,
} from '@mui/icons-material';
import { useAuthStore } from '../../store/authStore';
import { useAdminStore } from '../../store/adminStore';
import { useCommonStore } from '../../store/commonStore';
import toast from 'react-hot-toast';
import DetentionManager from './components/DetentionManager';
import InterventionsManager from './components/InterventionsManager';
import RiskRegistryPage from './RiskRegistryPage';
import DeleteConfirmationDialog from '../components/dialogs/DeleteConfirmationDialog';
import AssignmentTable from '../components/AssignmentTable';
import TeachersStatTable from '../components/TeachersStatTable';
import CommonRankingTable from '../components/CommonRankingTable';

const parseFilterDate = (value, endOfDay = false) => {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setHours(endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
  return date;
};

export function SettingsPages() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuthStore();
  const {
    history,
    loadingHistoryFull,
    totalHistoryCount,
    fetchHistory,
    deleteHistoryRecord,
    downloadHistoryHtml,
    downloadHistoryCsv,
    rankings,
    fetchAdminRanking,
    teacherStats,
    fetchTeacherStats,
    teachers,
    fetchTeachers,
  } = useAdminStore();
  const { students, fetchStudents, classes, fetchClasses } = useCommonStore();

  useEffect(() => {
    fetchTeachers();
    fetchStudents();
    fetchClasses();
  }, [fetchTeachers, fetchStudents, fetchClasses]);

  const studentOptions = useMemo(() => {
    const set = new Set();
    (history || []).forEach((item) => {
      if (item.student_name) set.add(item.student_name);
    });
    (students || []).forEach((s) => {
      const name = `${s.first_name || ''} ${s.last_name || ''}`.trim();
      if (name) set.add(name);
    });
    return Array.from(set).sort();
  }, [history, students]);

  const teacherOptions = useMemo(() => {
    const set = new Set();
    (history || []).forEach((item) => {
      if (item.teacher_name) set.add(item.teacher_name);
    });
    (teachers || []).forEach((t) => {
      const name = `${t.first_name || ''} ${t.last_name || ''}`.trim();
      if (name) set.add(name);
    });
    return Array.from(set).sort();
  }, [history, teachers]);

  const classOptions = useMemo(() => {
    const set = new Set();
    (history || []).forEach((item) => {
      const cls = item.student_class || item.class_name;
      if (cls) set.add(cls);
    });
    (classes || []).forEach((c) => {
      if (c.name) set.add(c.name);
    });
    return Array.from(set).sort();
  }, [history, classes]);

  const [activeTab, setActiveTab] = useState('moderation');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const [loadingHistory, setLoadingHistory] = useState(false);
  const [exportingHistory, setExportingHistory] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [errorHistory, setErrorHistory] = useState(null);
  const [errorStats, setErrorStats] = useState(null);

  // Фильтры истории
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    student: '',
    schoolClass: '',
    teacher: '',
    rule: '',
    type: 'all', // 'all', 'merit', 'demerit'
  });
  const [exportFilters, setExportFilters] = useState(filters);

  const resetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      student: '',
      schoolClass: '',
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
    if (filters.schoolClass.trim()) count++;
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

  const openExportDialog = () => {
    setExportFilters(filters);
    setExportDialogOpen(true);
  };

  const resetExportFilters = () => {
    setExportFilters({
      startDate: '',
      endDate: '',
      student: '',
      schoolClass: '',
      teacher: '',
      rule: '',
      type: 'all',
    });
  };

  const handleDownloadHistoryHtml = async () => {
    setExportingHistory(true);
    try {
      const blob = await downloadHistoryHtml(exportFilters);
      if (!(blob instanceof Blob)) {
        throw new Error('Invalid export response');
      }

      const filename = `students-points-history-${new Date().toISOString().slice(0, 10)}.html`;
      const file = new File([blob], filename, { type: blob.type || 'text/html' });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Students Points History',
        });
        toast.success('Choose where to save or share HTML');
        setExportDialogOpen(false);
        return;
      }

      const url = URL.createObjectURL(blob);
      const isDesktopWebView = /Electron|WebView|Telegram|TWA|desktop/i.test(navigator.userAgent || '') || !!window?.ReactNativeWebView;

      if (isDesktopWebView) {
        const newTab = window.open('', '_blank', 'noopener,noreferrer');
        if (newTab) {
          newTab.location.href = url;
        } else {
          window.location.href = url;
        }
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.rel = 'noopener';
        link.style.display = 'none';
        document.body.appendChild(link);

        try {
          link.click();
        } catch {
          window.open(url, '_blank', 'noopener,noreferrer');
        }

        link.remove();
      }

      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
      toast.success('HTML download started');
      setExportDialogOpen(false);
    } catch {
      toast.error('Failed to download history');
    } finally {
      setExportingHistory(false);
    }
  };

  const getItemDateString = (dateVal) => {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const filterHistoryItems = (items = [], criteria = {}) => {
    if (!Array.isArray(items)) return [];
    return items.filter((item) => {
      if (criteria.student?.trim() && !item.student_name?.toLowerCase().includes(criteria.student.trim().toLowerCase())) {
        return false;
      }
      if (criteria.schoolClass?.trim()) {
        const className = (item.student_class || item.class_name || '').toLowerCase();
        if (!className.includes(criteria.schoolClass.trim().toLowerCase())) return false;
      }
      if (criteria.teacher?.trim() && !item.teacher_name?.toLowerCase().includes(criteria.teacher.trim().toLowerCase())) {
        return false;
      }
      if (criteria.rule?.trim() && !item.rule_description?.toLowerCase().includes(criteria.rule.trim().toLowerCase())) {
        return false;
      }
      if (criteria.startDate) {
        const itemDateStr = getItemDateString(item.created_at);
        if (itemDateStr && itemDateStr < criteria.startDate) return false;
      }
      if (criteria.endDate) {
        const itemDateStr = getItemDateString(item.created_at);
        if (itemDateStr && itemDateStr > criteria.endDate) return false;
      }
      if (criteria.type === 'merit' && item.points_changed <= 0) return false;
      if (criteria.type === 'demerit' && item.points_changed >= 0) return false;

      return true;
    });
  };

  const handleDownloadHistoryCsv = async (customFilters = exportFilters) => {
    setExportingHistory(true);
    try {
      let blob = null;
      try {
        blob = await downloadHistoryCsv(customFilters);
      } catch (e) {
        if (import.meta.env.DEV) console.warn('Backend CSV export endpoint fallback', e);
      }

      if (!(blob instanceof Blob)) {
        const headers = ['ID', 'Date', 'Student', 'Class', 'Teacher/Admin', 'Type', 'Points', 'Rule', 'Comment'];
        const itemsToExport = filterHistoryItems(history || [], customFilters);
        const rows = (itemsToExport || []).map((item) => [
          item.id,
          item.created_at ? new Date(item.created_at).toLocaleString('ru-RU') : '',
          `"${(item.student_name || '').replace(/"/g, '""')}"`,
          `"${(item.student_class || item.class_name || '').replace(/"/g, '""')}"`,
          `"${(item.teacher_name || '').replace(/"/g, '""')}"`,
          item.points_changed > 0 ? 'Merit' : item.points_changed < 0 ? 'Demerit' : 'Neutral',
          item.points_changed,
          `"${(item.rule_description || '').replace(/"/g, '""')}"`,
          `"${(item.comment || '').replace(/"/g, '""')}"`,
        ]);

        const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
        blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      }

      const filename = `students-points-history-${new Date().toISOString().slice(0, 10)}.csv`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.rel = 'noopener';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);

      toast.success('CSV file download started');
      setExportDialogOpen(false);
    } catch {
      toast.error('Failed to download CSV');
    } finally {
      setExportingHistory(false);
    }
  };

  // Фильтрация истории
  const filteredHistory = useMemo(() => {
    return filterHistoryItems(history, filters);
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
          pt: 'calc(var(--tg-safe-area-inset-top, 0px) + 80px)',
          pb: 2,
          mt: 0,
          mb: 2,
        }}
      >
        <Container maxWidth="sm">
          <Box display="flex" alignItems="center">
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
        </Container>
      </Box>

      <Container maxWidth="sm" sx={{ px: 2 }}>
        {/* Модульные вкладки навигации (вертикальный стек) */}
        <Grid container spacing={1.5} direction="column" sx={{ mb: 2 }}>
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
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                    Points History Moderation ({filteredHistory.length} / {totalHistoryCount || history?.length || 0})
                  </Typography>
                  {loadingHistoryFull && (
                    <Chip
                      size="small"
                      icon={<CircularProgress size={12} sx={{ color: '#9266FF' }} />}
                      label="Loading full history..."
                      sx={{
                        backgroundColor: 'rgba(146, 102, 255, 0.15)',
                        color: '#C7C6E2',
                        border: '1px solid rgba(146, 102, 255, 0.3)',
                        fontSize: '0.75rem',
                      }}
                    />
                  )}
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    startIcon={<FileDownload />}
                    onClick={() => handleDownloadHistoryCsv(filters)}
                    disabled={exportingHistory}
                    sx={{
                      color: '#00D377',
                      borderColor: 'rgba(0,211,119,0.4)',
                      textTransform: 'none',
                      minWidth: 80,
                    }}
                    variant="outlined"
                  >
                    CSV
                  </Button>
                  <Button
                    size="small"
                    startIcon={<FileDownload />}
                    onClick={openExportDialog}
                    disabled={exportingHistory}
                    sx={{
                      color: '#9266FF',
                      borderColor: 'rgba(146,102,255,0.4)',
                      textTransform: 'none',
                      minWidth: 80,
                    }}
                    variant="outlined"
                  >
                    HTML
                  </Button>
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
                </Stack>
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
                      <Autocomplete
                        freeSolo
                        options={studentOptions}
                        value={filters.student}
                        onChange={(e, newValue) => setFilters({ ...filters, student: newValue || '' })}
                        onInputChange={(e, newValue) => setFilters({ ...filters, student: newValue || '' })}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            fullWidth
                            size="small"
                            label="Student Name"
                            InputProps={{
                              ...params.InputProps,
                              startAdornment: (
                                <InputAdornment position="start">
                                  <Search sx={{ color: '#5A5984', fontSize: 18 }} />
                                </InputAdornment>
                              ),
                            }}
                            sx={filterFieldStyle}
                          />
                        )}
                      />
                    </Grid>

                    {/* Фильтр по классу */}
                    <Grid item xs={12} sm={6}>
                      <Autocomplete
                        freeSolo
                        options={classOptions}
                        value={filters.schoolClass}
                        onChange={(e, newValue) => setFilters({ ...filters, schoolClass: newValue || '' })}
                        onInputChange={(e, newValue) => setFilters({ ...filters, schoolClass: newValue || '' })}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            fullWidth
                            size="small"
                            label="Class / Grade (e.g. 9A)"
                            InputProps={{
                              ...params.InputProps,
                              startAdornment: (
                                <InputAdornment position="start">
                                  <Search sx={{ color: '#5A5984', fontSize: 18 }} />
                                </InputAdornment>
                              ),
                            }}
                            sx={filterFieldStyle}
                          />
                        )}
                      />
                    </Grid>

                    {/* Фильтр по учителю */}
                    <Grid item xs={12} sm={6}>
                      <Autocomplete
                        freeSolo
                        options={teacherOptions}
                        value={filters.teacher}
                        onChange={(e, newValue) => setFilters({ ...filters, teacher: newValue || '' })}
                        onInputChange={(e, newValue) => setFilters({ ...filters, teacher: newValue || '' })}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            fullWidth
                            size="small"
                            label="Teacher / Admin"
                            InputProps={{
                              ...params.InputProps,
                              startAdornment: (
                                <InputAdornment position="start">
                                  <Search sx={{ color: '#5A5984', fontSize: 18 }} />
                                </InputAdornment>
                              ),
                            }}
                            sx={filterFieldStyle}
                          />
                        )}
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

      <Dialog
        open={exportDialogOpen}
        onClose={() => !exportingHistory && setExportDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, #0C0B21 0%, #1A1932 100%)',
            border: '1px solid rgba(146, 102, 255, 0.25)',
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle sx={{ color: '#FFFFFF', fontWeight: 700, pb: 1 }}>
          Export History Data
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Grid container spacing={1.5} sx={{ mt: 0 }}>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                freeSolo
                options={studentOptions}
                value={exportFilters.student}
                onChange={(e, newValue) => setExportFilters({ ...exportFilters, student: newValue || '' })}
                onInputChange={(e, newValue) => setExportFilters({ ...exportFilters, student: newValue || '' })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    size="small"
                    label="Student Name"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search sx={{ color: '#5A5984', fontSize: 18 }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={filterFieldStyle}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                freeSolo
                options={classOptions}
                value={exportFilters.schoolClass || ''}
                onChange={(e, newValue) => setExportFilters({ ...exportFilters, schoolClass: newValue || '' })}
                onInputChange={(e, newValue) => setExportFilters({ ...exportFilters, schoolClass: newValue || '' })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    size="small"
                    label="Class / Grade (e.g. 9A)"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search sx={{ color: '#5A5984', fontSize: 18 }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={filterFieldStyle}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                freeSolo
                options={teacherOptions}
                value={exportFilters.teacher}
                onChange={(e, newValue) => setExportFilters({ ...exportFilters, teacher: newValue || '' })}
                onInputChange={(e, newValue) => setExportFilters({ ...exportFilters, teacher: newValue || '' })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    size="small"
                    label="Teacher / Admin"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search sx={{ color: '#5A5984', fontSize: 18 }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={filterFieldStyle}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Rule Description"
                value={exportFilters.rule}
                onChange={(e) => setExportFilters({ ...exportFilters, rule: e.target.value })}
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
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: '#5A5984' }}>Type</InputLabel>
                <Select
                  value={exportFilters.type}
                  label="Type"
                  onChange={(e) => setExportFilters({ ...exportFilters, type: e.target.value })}
                  sx={selectFieldStyle}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="merit">Merit (+ Points)</MenuItem>
                  <MenuItem value="demerit">Demerit (- Points)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="From Date"
                InputLabelProps={{ shrink: true }}
                value={exportFilters.startDate}
                onChange={(e) => setExportFilters({ ...exportFilters, startDate: e.target.value })}
                sx={filterFieldStyle}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="To Date"
                InputLabelProps={{ shrink: true }}
                value={exportFilters.endDate}
                onChange={(e) => setExportFilters({ ...exportFilters, endDate: e.target.value })}
                sx={filterFieldStyle}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 0, gap: 1 }}>
          <Button
            onClick={resetExportFilters}
            disabled={exportingHistory}
            sx={{ color: '#EB2B4B', textTransform: 'none', mr: 'auto' }}
          >
            Reset
          </Button>
          <Button
            onClick={() => setExportDialogOpen(false)}
            disabled={exportingHistory}
            sx={{ color: '#B8B7D9', textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleDownloadHistoryCsv(exportFilters)}
            disabled={exportingHistory}
            startIcon={exportingHistory ? <CircularProgress size={16} color="inherit" /> : <FileDownload />}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #00D377 0%, #00A85F 100%)',
              color: '#06170F',
              fontWeight: 700,
              textTransform: 'none',
              '&:hover': {
                background: 'linear-gradient(135deg, #15E58B 0%, #00B86B 100%)',
              },
            }}
          >
            Download CSV
          </Button>
          <Button
            onClick={handleDownloadHistoryHtml}
            disabled={exportingHistory}
            startIcon={exportingHistory ? <CircularProgress size={16} color="inherit" /> : <FileDownload />}
            variant="outlined"
            sx={{
              borderColor: 'rgba(146, 102, 255, 0.5)',
              color: '#9266FF',
              fontWeight: 700,
              textTransform: 'none',
              '&:hover': {
                borderColor: '#9266FF',
                backgroundColor: 'rgba(146, 102, 255, 0.1)',
              },
            }}
          >
            Download HTML
          </Button>
        </DialogActions>
      </Dialog>

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

const selectFieldStyle = {
  color: '#F4F4FF',
  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(146, 102, 255, 0.3)' },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(146, 102, 255, 0.5)' },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#9266FF' },
};

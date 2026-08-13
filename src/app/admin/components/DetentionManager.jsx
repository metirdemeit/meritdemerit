import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Alert,
  Tooltip,
  Stack,
} from '@mui/material';
import {
  Add,
  EventBusy,
  CheckCircle,
  Timer,
  Warning,
  Delete,
  Edit,
  CalendarMonth,
  Schedule,
} from '@mui/icons-material';
import { useDetentionStore } from '../../../store/detentionStore';
import { useAdminStore } from '../../../store/adminStore';
import { useCommonStore } from '../../../store/commonStore';
import toast from 'react-hot-toast';

export default function DetentionManager() {
  const {
    detentions,
    examWeeks,
    fetchDetentions,
    fetchExamWeeks,
    addDetention,
    updateDetentionStatus,
    deleteDetention,
    addExamWeek,
    deleteExamWeek,
    getStudentDetentionCount,
  } = useDetentionStore();

  const { students, fetchStudents } = useAdminStore();
  const { classes, fetchClasses } = useCommonStore();

  React.useEffect(() => {
    fetchStudents();
    fetchClasses();
    fetchDetentions();
    fetchExamWeeks();
  }, [fetchStudents, fetchClasses, fetchDetentions, fetchExamWeeks]);

  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openExamDialog, setOpenExamDialog] = useState(false);

  // Двухшаговый выбор: класс → ученик
  const [selectedClass, setSelectedClass] = useState('');

  const studentsInClass = selectedClass
    ? students.filter((s) => (s.school_class?.name || s.class_name || s.class || '') === selectedClass)
    : [];

  // Form State
  const defaultForm = {
    student_name: '',
    student_id: null,
    class_name: '',
    current_points: 0,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    notes: '',
  };
  const [formData, setFormData] = useState(defaultForm);

  const [examForm, setExamForm] = useState({
    title: '',
    start_date: '',
    end_date: '',
  });

  const handleCreateDetention = async () => {
    if (!formData.student_id) {
      toast.error('Select a student');
      return;
    }
    try {
      const created = await addDetention({
        student_id: formData.student_id,
        start_date: formData.start_date,
        end_date: formData.end_date,
        notes: formData.notes,
      });
      toast.success(`Detention assigned for ${created?.student_name || 'student'}`);
      setOpenAddDialog(false);
      setSelectedClass('');
      setFormData(defaultForm);
    } catch (err) {
      toast.error('Failed to assign detention');
    }
  };

  const handleCreateExamWeek = async () => {
    if (!examForm.title || !examForm.start_date || !examForm.end_date) {
      toast.error('Fill in all exam week fields');
      return;
    }
    try {
      await addExamWeek(examForm);
      toast.success(`Exam Week "${examForm.title}" added`);
      setExamForm({ title: '', start_date: '', end_date: '' });
    } catch (err) {
      toast.error('Failed to add exam week');
    }
  };

  // Студенты с 3+ детеншнами
  const criticalStudents = Array.from(
    new Set(detentions.map((d) => d.student_name))
  ).filter((name) => {
    const first = detentions.find((d) => d.student_name === name);
    return first && getStudentDetentionCount(first.student_id || name) >= 3;
  });

  return (
    <Box sx={{ mt: 1 }}>
      {/* Критическое предупреждение при 3-х детеншнах */}
      {criticalStudents.length > 0 && (
        <Alert
          severity="error"
          icon={<Warning fontSize="inherit" />}
          sx={{
            mb: 3,
            backgroundColor: 'rgba(211, 47, 47, 0.15)',
            border: '1px solid rgba(211, 47, 47, 0.5)',
            color: '#FF8A80',
          }}
        >
          <Typography variant="subtitle2" fontWeight={700}>
            Re-enrollment Review Required!
          </Typography>
          Students with 3+ detentions this year: {criticalStudents.join(', ')}. Administration review required!
        </Alert>
      )}

      {/* Панель управления и экшены */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
          Detention Management ({detentions.length})
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<CalendarMonth />}
            onClick={() => setOpenExamDialog(true)}
            sx={{
              color: '#9266FF',
              borderColor: 'rgba(146, 102, 255, 0.4)',
              textTransform: 'none',
            }}
          >
            Exam Weeks ({examWeeks.length})
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenAddDialog(true)}
            sx={{
              background: 'linear-gradient(135deg, #9266FF 0%, #6932EB 100%)',
              textTransform: 'none',
            }}
          >
            Assign Detention
          </Button>
        </Box>
      </Box>

      {/* Таблица детеншнов */}
      <Card
        sx={{
          background: 'linear-gradient(135deg, #0C0B21 0%, #1A1932 50%, #0E0D2A 100%)',
          borderRadius: 2,
          border: '1px solid rgba(146, 102, 255, 0.2)',
        }}
      >
        <CardContent sx={{ p: 0 }}>
          <TableContainer component={Paper} sx={{ backgroundColor: 'transparent', boxShadow: 'none' }}>
            <Table size="small">
              <TableHead sx={{ backgroundColor: 'rgba(146, 102, 255, 0.1)' }}>
                <TableRow>
                  <TableCell sx={{ color: '#9266FF', fontWeight: 600 }}>Student / Class</TableCell>
                  <TableCell sx={{ color: '#9266FF', fontWeight: 600 }}>Points</TableCell>
                  <TableCell sx={{ color: '#9266FF', fontWeight: 600 }}>Detention Period</TableCell>
                  <TableCell sx={{ color: '#9266FF', fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ color: '#9266FF', fontWeight: 600 }}>Probation (2w)</TableCell>
                  <TableCell align="right" sx={{ color: '#9266FF', fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {detentions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3, color: '#b3b3b3' }}>
                      No detentions assigned.
                    </TableCell>
                  </TableRow>
                ) : (
                  detentions.map((item) => {
                    const count = getStudentDetentionCount(item.student_id || item.student_name);
                    return (
                      <TableRow key={item.id} sx={{ '&:hover': { backgroundColor: 'rgba(146, 102, 255, 0.05)' } }}>
                        <TableCell sx={{ color: 'white' }}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body2" fontWeight={600}>
                              {item.student_name} ({item.class_name})
                            </Typography>
                            {count >= 3 && (
                              <Tooltip title="3+ Detentions: Re-enrollment Review Required!">
                                <Chip label={`${count} Detentions`} size="small" color="error" sx={{ height: 18, fontSize: '0.65rem' }} />
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ color: '#FF5252', fontWeight: 700 }}>
                          {item.current_points} pts
                        </TableCell>
                        <TableCell sx={{ color: '#F4F4FF' }}>
                          <Typography variant="caption" display="block">
                            {item.start_date} → {item.end_date}
                          </Typography>
                          {item.notes && (
                            <Typography variant="caption" sx={{ color: '#5A5984' }}>
                              {item.notes}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.status === 'active' && (
                            <Chip label="Active (1 Week)" size="small" sx={{ backgroundColor: 'rgba(255, 193, 7, 0.2)', color: '#FFC107', border: '1px solid #FFC107' }} />
                          )}
                          {item.status === 'completed' && (
                            <Chip label="Completed" size="small" sx={{ backgroundColor: 'rgba(0, 211, 119, 0.2)', color: '#00D377', border: '1px solid #00D377' }} />
                          )}
                          {item.status === 'deferred' && (
                            <Chip label="Exam Bypass (Deferred)" size="small" sx={{ backgroundColor: 'rgba(146, 102, 255, 0.2)', color: '#9266FF', border: '1px solid #9266FF' }} />
                          )}
                          {item.status === 'cancelled' && (
                            <Chip label="Cancelled by Admin" size="small" sx={{ backgroundColor: 'rgba(100, 100, 100, 0.2)', color: '#b3b3b3' }} />
                          )}
                        </TableCell>
                        <TableCell sx={{ color: '#b3b3b3' }}>
                          {item.probation_end_date ? (
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <Timer sx={{ fontSize: 16, color: '#00D377' }} />
                              <Typography variant="caption" sx={{ color: '#00D377' }}>
                                Until {item.probation_end_date}
                              </Typography>
                            </Box>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {item.status === 'active' && (
                            <IconButton
                              size="small"
                              onClick={() => updateDetentionStatus(item.id, { status: 'completed' })}
                              sx={{ color: '#00D377' }}
                              title="Mark Completed & Start 2w Probation"
                            >
                              <CheckCircle fontSize="small" />
                            </IconButton>
                          )}
                          <IconButton
                            size="small"
                            onClick={() => deleteDetention(item.id)}
                            sx={{ color: '#EB2B4B' }}
                            title="Cancel / Delete Detention"
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Диалог назначения детеншна */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#0E0D2A', color: 'white' }}>
          Assign Detention Period
        </DialogTitle>
        <DialogContent sx={{ backgroundColor: '#0E0D2A', pt: 2 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {/* Шаг 1: Выбор класса */}
            <FormControl fullWidth size="small" sx={fieldStyle}>
              <InputLabel sx={{ color: '#5A5984' }}>Step 1: Select Class</InputLabel>
              <Select
                value={selectedClass}
                label="Step 1: Select Class"
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setFormData({ ...defaultForm, class_name: e.target.value });
                }}
              >
                {(classes || []).map((c) => (
                  <MenuItem key={c.id} value={c.name}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Шаг 2: Выбор ученика из выбранного класса */}
            <FormControl fullWidth size="small" sx={fieldStyle} disabled={!selectedClass}>
              <InputLabel sx={{ color: selectedClass ? '#5A5984' : '#3A3A5A' }}>
                Step 2: Select Student {!selectedClass && '(select class first)'}
              </InputLabel>
              <Select
                value={formData.student_name}
                label="Step 2: Select Student (select class first)"
                onChange={(e) => {
                  const sel = studentsInClass.find(
                    (s) => `${s.first_name || ''} ${s.last_name || ''}`.trim() === e.target.value || s.username === e.target.value
                  );
                  setFormData({
                    ...formData,
                    student_name: e.target.value,
                    student_id: sel?.id,
                    current_points: sel?.points !== undefined ? sel.points : 0,
                  });
                }}
              >
                {studentsInClass.length === 0 ? (
                  <MenuItem disabled value="">No students in this class</MenuItem>
                ) : (
                  studentsInClass.map((s) => {
                    const name = `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.username;
                    return (
                      <MenuItem key={s.id} value={name}>
                        {name} — {s.points ?? 0} pts
                      </MenuItem>
                    );
                  })
                )}
              </Select>
            </FormControl>

            <Grid container spacing={1}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Start Date"
                  InputLabelProps={{ shrink: true }}
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  sx={fieldStyle}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="End Date"
                  InputLabelProps={{ shrink: true }}
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  sx={fieldStyle}
                />
              </Grid>
            </Grid>
            <TextField
              fullWidth
              size="small"
              label="Notes / Reason"
              multiline
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              sx={fieldStyle}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ backgroundColor: '#0E0D2A', p: 2 }}>
          <Button onClick={() => setOpenAddDialog(false)} sx={{ color: '#5A5984' }}>
            Cancel
          </Button>
          <Button onClick={handleCreateDetention} variant="contained" sx={{ background: 'linear-gradient(135deg, #9266FF 0%, #6932EB 100%)' }}>
            Assign Detention
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог экзаменационных недель (Exam Weeks Calendar) */}
      <Dialog open={openExamDialog} onClose={() => setOpenExamDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#0E0D2A', color: 'white' }}>
          Exam Weeks Calendar (Auto-Bypass)
        </DialogTitle>
        <DialogContent sx={{ backgroundColor: '#0E0D2A', pt: 2 }}>
          <Typography variant="body2" sx={{ color: '#b3b3b3', mb: 2 }}>
            If a detention falls into an Exam Week, detention is automatically deferred to the next trimester/semester.
          </Typography>

          <Grid container spacing={1} sx={{ mb: 2 }}>
            <Grid item xs={5}>
              <TextField
                fullWidth
                size="small"
                label="Exam Title"
                value={examForm.title}
                onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                sx={fieldStyle}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Start"
                InputLabelProps={{ shrink: true }}
                value={examForm.start_date}
                onChange={(e) => setExamForm({ ...examForm, start_date: e.target.value })}
                sx={fieldStyle}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="End"
                InputLabelProps={{ shrink: true }}
                value={examForm.end_date}
                onChange={(e) => setExamForm({ ...examForm, end_date: e.target.value })}
                sx={fieldStyle}
              />
            </Grid>
            <Grid item xs={1}>
              <IconButton onClick={handleCreateExamWeek} sx={{ color: '#00D377', mt: 0.5 }}>
                <Add />
              </IconButton>
            </Grid>
          </Grid>

          {/* Список уже добавленных экзаменов */}
          <Box display="flex" flexDirection="column" gap={1}>
            {examWeeks.map((exam) => (
              <Box
                key={exam.id}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  backgroundColor: 'rgba(146, 102, 255, 0.1)',
                  border: '1px solid rgba(146, 102, 255, 0.2)',
                }}
              >
                <Box>
                  <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
                    {exam.title}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#5A5984' }}>
                    {exam.start_date} — {exam.end_date}
                  </Typography>
                </Box>
                <IconButton size="small" onClick={() => deleteExamWeek(exam.id)} sx={{ color: '#EB2B4B' }}>
                  <Delete fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ backgroundColor: '#0E0D2A', p: 2 }}>
          <Button onClick={() => setOpenExamDialog(false)} sx={{ color: '#5A5984' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

const fieldStyle = {
  '& .MuiOutlinedInput-root': {
    color: '#F4F4FF',
    '& fieldset': { borderColor: 'rgba(146, 102, 255, 0.3)' },
    '&:hover fieldset': { borderColor: 'rgba(146, 102, 255, 0.5)' },
    '&.Mui-focused fieldset': { borderColor: '#9266FF' },
  },
  '& .MuiInputLabel-root': { color: '#5A5984' },
};

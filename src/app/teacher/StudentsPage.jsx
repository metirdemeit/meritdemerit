import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Button,
  ButtonGroup,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Stack,
} from '@mui/material';
import { Person, ArrowBack, School, Dashboard, History as HistoryIcon } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { useTeacherStore } from '../../store/teacherStore';
import { useCommonStore } from '../../store/commonStore';
import UserCard from '../../components/UserCard';
import ClassCard from '../../components/ClassCard';
import SearchBar from '../../components/layouts/SearchBar';
import { AssignRulesDrawer } from '../components/dialogs/AssignRulesDrawer';
import { HomeroomStatsWidget } from './components/HomeroomStatsWidget';

export function StudentsPage() {
  const { assignPoints, profile, fetchProfile, history: teacherHistory, fetchHistory: fetchTeacherHistory } = useTeacherStore();
  const {
    students,
    classes,
    rules,
    fetchStudents,
    fetchClasses,
    fetchStudentsByClass,
    fetchRules,
    searchStudents,
  } = useCommonStore();

  // Режим просмотра: 'all' | 'homeroom'
  const [viewMode, setViewMode] = useState('all');

  // Закрепленный класс учителя (из профиля бэкенда или переключенный временно)
  const [selectedHomeroomClass, setSelectedHomeroomClass] = useState(null);
  const homeroomClass = selectedHomeroomClass || profile?.homeroom_class_name || '10-A';

  const [showRiskOnly, setShowRiskOnly] = useState(false);

  const [selectedClassId, setSelectedClassId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isInSearchMode, setIsInSearchMode] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [selectedRuleIds, setSelectedRuleIds] = useState([]);
  const [assignComment, setAssignComment] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState(null);

  // Loading и ошибки по секциям
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [errorClasses, setErrorClasses] = useState(null);
  const [errorStudents, setErrorStudents] = useState(null);
  const [errorSearch, setErrorSearch] = useState(null);

  const sortStudentsAlphabetically = (list = []) => {
    return [...list].sort((a, b) => {
      const nameA = `${a?.first_name || ''} ${a?.last_name || a?.username || ''}`.trim().toLowerCase();
      const nameB = `${b?.first_name || ''} ${b?.last_name || b?.username || ''}`.trim().toLowerCase();
      return nameA.localeCompare(nameB);
    });
  };

  const normalizeStudentName = (value) => `${value || ''}`.trim().toLowerCase().replace(/\s+/g, ' ');

  // Initial load
  useEffect(() => {
    const loadClasses = async () => {
      setLoadingClasses(true);
      setErrorClasses(null);
      const data = await fetchClasses();
      if (!data) {
        setErrorClasses('Failed to load classes');
      }
      setLoadingClasses(false);
    };

    const loadStudents = async () => {
      setLoadingStudents(true);
      setErrorStudents(null);
      const data = await fetchStudents();
      if (!data) {
        setErrorStudents('Failed to load students');
      }
      setLoadingStudents(false);
    };

    const loadTeacherHistory = async () => {
      await fetchTeacherHistory({ page: 1, size: 100 });
    };

    loadClasses();
    loadStudents();
    loadTeacherHistory();
  }, [fetchClasses, fetchStudents, fetchTeacherHistory]);

  // Load students by class
  useEffect(() => {
    if (!selectedClassId) return;
    const loadClassStudents = async () => {
      setLoadingStudents(true);
      setErrorStudents(null);
      const data = await fetchStudentsByClass(selectedClassId);
      if (!data) {
        setErrorStudents('Failed to load students for class');
      }
      setLoadingStudents(false);
    };
    loadClassStudents();
  }, [selectedClassId, fetchStudentsByClass]);

  // Load rules for drawer
  useEffect(() => {
    if (rulesOpen && (!rules || rules.length === 0)) {
      fetchRules();
    }
  }, [rulesOpen, fetchRules, rules]);

  // Search students with debounce
  useEffect(() => {
    const delay = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setIsInSearchMode(true);
        setLoadingSearch(true);
        setErrorSearch(null);
        const result = await searchStudents(searchQuery);
        if (!result) {
          setErrorSearch('Failed to search students');
          setSearchResults([]);
        } else {
          setSearchResults(sortStudentsAlphabetically(result || []));
        }
        setLoadingSearch(false);
      } else {
        setIsInSearchMode(false);
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delay);
  }, [searchQuery, searchStudents]);

  const openStudentHistory = async (student) => {
    setSelectedStudentForHistory(student);

    const loadedHistory = teacherHistory?.length ? teacherHistory : await fetchTeacherHistory({ page: 1, size: 100 });
    const historyItems = Array.isArray(loadedHistory) ? loadedHistory : (loadedHistory?.items || []);
    if (historyItems.length > 0) {
      const historyMatches = historyItems.filter((entry) => {
        const entryStudentId = entry?.student_id ?? entry?.student?.id ?? entry?.user_id ?? entry?.studentId;
        const entryName = normalizeStudentName(entry?.student_name || `${entry?.student?.first_name || ''} ${entry?.student?.last_name || ''}`);
        const studentFullName = normalizeStudentName(`${student?.first_name || ''} ${student?.last_name || ''}`);
        const studentUsername = normalizeStudentName(student?.username);
        const entryUsername = normalizeStudentName(entry?.student_username || entry?.username || entry?.student?.username);

        return (
          String(entryStudentId) === String(student?.id) ||
          entryName.includes(studentFullName) ||
          studentFullName.includes(entryName) ||
          entryUsername === studentUsername ||
          entryUsername.includes(studentUsername) ||
          studentUsername.includes(entryUsername)
        );
      });

      if (historyMatches.length > 0) {
        setHistoryDialogOpen(true);
        return;
      }
    }

    setHistoryDialogOpen(true);
  };

  const handleStudentClick = (studentId) => {
    const student = (students || []).find((item) => item.id === studentId) || (searchResults || []).find((item) => item.id === studentId);
    if (student) {
      openStudentHistory(student);
      return;
    }
    setSelectedStudentIds([studentId]);
    setSelectedRuleIds([]);
    setAssignComment('');
    setRulesOpen(true);
  };

  const handleAssignFromHistory = (studentId) => {
    setHistoryDialogOpen(false);
    setSelectedStudentIds([studentId]);
    setSelectedRuleIds([]);
    setAssignComment('');
    setRulesOpen(true);
  };

  const handleToggleRule = (ruleId) => {
    setSelectedRuleIds(prev =>
      prev.includes(ruleId) ? prev.filter(id => id !== ruleId) : [...prev, ruleId]
    );
  };

  const handleAssignSubmit = async () => {
    if (!selectedStudentIds.length || !selectedRuleIds.length) return;
    if (!assignComment || !assignComment.trim()) {
      toast.error('Комментарий обязателен при выставлении баллов');
      return;
    }
    setIsAssigning(true);
    try {
      await assignPoints({
        student_ids: selectedStudentIds,
        rule_ids: selectedRuleIds,
        comment: assignComment.trim(),
      });
      toast.success('Points assigned');
      handleCloseRulesDrawer();
      if (selectedClassId) {
        await fetchStudentsByClass(selectedClassId);
      } else {
        await fetchStudents(true);
      }
      await fetchTeacherHistory({ page: 1, size: 100 });
    } catch (e) {
      toast.error('Failed to assign points');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleCloseRulesDrawer = () => {
    setRulesOpen(false);
    setSelectedStudentIds([]);
    setSelectedRuleIds([]);
    setAssignComment('');
  };

  const handleClassSelect = (classId) => {
    setSelectedClassId(classId);
    setIsInSearchMode(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleBackToClasses = () => {
    setSelectedClassId(null);
    setIsInSearchMode(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const studentsToShow = sortStudentsAlphabetically(isInSearchMode ? searchResults : students);

  const selectedStudentName = useMemo(() => {
    if (selectedStudentIds.length === 1) {
      const student = students.find(s => s.id === selectedStudentIds[0]);
      return student ? `${student.first_name} ${student.last_name}` : '';
    }
    if (selectedStudentIds.length > 1) {
      return `${selectedStudentIds.length} students`;
    }
    return '';
  }, [selectedStudentIds, students]);

  const isClassMatch = (s, targetClass) => {
    const rawName = s.class_name || s.school_class?.name || s.class || '';
    const name = rawName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const target = (targetClass || '').toLowerCase().replace(/[^a-z0-9]/g, '').replace(/^class/, '');
    return name === target || name.replace(/^class/, '') === target;
  };

  const homeroomStudents = useMemo(() => {
    let list = sortStudentsAlphabetically(students.filter((s) => isClassMatch(s, homeroomClass)));
    if (showRiskOnly) {
      list = list.filter((s) => (s.points ?? 100) < 100);
    }
    return list;
  }, [students, homeroomClass, showRiskOnly]);

  const selectedStudentHistory = useMemo(() => {
    if (!selectedStudentForHistory) return [];
    const studentId = selectedStudentForHistory.id;
    const studentName = normalizeStudentName(`${selectedStudentForHistory.first_name || ''} ${selectedStudentForHistory.last_name || ''}`);
    const studentUsername = normalizeStudentName(selectedStudentForHistory.username);
    const historyItems = Array.isArray(teacherHistory) ? teacherHistory : (teacherHistory?.items || []);

    return historyItems
      .filter((entry) => {
        const matchesId = String(entry?.student_id ?? entry?.student?.id ?? entry?.user_id ?? entry?.studentId) === String(studentId);
        const entryName = normalizeStudentName(entry?.student_name || `${entry?.student?.first_name || ''} ${entry?.student?.last_name || ''}`);
        const entryUsername = normalizeStudentName(entry?.student_username || entry?.username || entry?.student?.username);
        const matchesName = !!studentName && (entryName.includes(studentName) || studentName.includes(entryName));
        const matchesUsername = !!studentUsername && (entryUsername === studentUsername || entryUsername.includes(studentUsername) || studentUsername.includes(entryUsername));
        return matchesId || matchesName || matchesUsername;
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 8);
  }, [selectedStudentForHistory, teacherHistory]);

  const handleHomeroomClassChange = (newClass) => {
    setSelectedHomeroomClass(newClass);
    toast.success(`Homeroom class set to ${newClass}`);
  };

  return (
    <Box sx={{ minHeight: '100vh', pb: 2 }}>
      {/* Header */}
      <Box sx={{
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
      }}>
        <Container maxWidth="sm">
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box display="flex" alignItems="center">
              <School sx={{ fontSize: 32, color: '#9266FF', mr: 2 }} />
              <Box>
                <Typography variant="h5" sx={{ color: 'white', fontWeight: 600 }}>
                  Students Management
                </Typography>
                <Typography variant="body2" sx={{ color: '#b3b3b3' }}>
                  {viewMode === 'homeroom'
                    ? `Homeroom Dashboard (${homeroomClass})`
                    : selectedClassId ? 'Select students to assign points' : 'Select a class to view students'}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Toggle buttons: All Classes / My Homeroom Class */}
          <ButtonGroup fullWidth size="small" variant="contained" sx={{ mt: 1 }}>
            <Button
              startIcon={<Dashboard />}
              variant={viewMode === 'all' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('all')}
              sx={{
                py: 1,
                fontWeight: 600,
                color: viewMode === 'all' ? '#F4F4FF' : '#5A5984',
                background: viewMode === 'all' ? 'linear-gradient(135deg, #9266FF 0%, #6932EB 100%)' : 'transparent',
                borderColor: 'rgba(146, 102, 255, 0.3)',
              }}
            >
              All Classes
            </Button>
            <Button
              startIcon={<School />}
              variant={viewMode === 'homeroom' ? 'contained' : 'outlined'}
              onClick={() => {
                setViewMode('homeroom');
                setSelectedClassId(null);
                setIsInSearchMode(false);
              }}
              sx={{
                py: 1,
                fontWeight: 600,
                color: viewMode === 'homeroom' ? '#F4F4FF' : '#5A5984',
                background: viewMode === 'homeroom' ? 'linear-gradient(135deg, #9266FF 0%, #6932EB 100%)' : 'transparent',
                borderColor: 'rgba(146, 102, 255, 0.3)',
              }}
            >
              My Class ({homeroomClass})
            </Button>
          </ButtonGroup>
        </Container>
      </Box>

      <Container maxWidth="sm" sx={{ px: 2 }}>
        {/* Error Alerts */}
        {(errorClasses || errorStudents || errorSearch) && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errorClasses || errorStudents || errorSearch}
          </Alert>
        )}

        {/* РЕЖИМ 1: МОЙ КЛАСС (HOMEROOM DASHBOARD) */}
        {viewMode === 'homeroom' ? (
          <>
            {/* Виджет статистики закрепленного класса */}
            <HomeroomStatsWidget
              className={homeroomClass}
              classes={classes}
              students={students.filter((s) => isClassMatch(s, homeroomClass))}
              onSelectClass={handleHomeroomClassChange}
              showRiskOnly={showRiskOnly}
              onToggleRiskFilter={() => setShowRiskOnly(!showRiskOnly)}
            />

            <Card sx={{
              background: 'linear-gradient(135deg, #0C0B21 0%, #1A1932 50%, #0E0D2A 100%)',
              borderRadius: 2,
              border: '1px solid rgba(146, 102, 255, 0.2)',
            }}>
              <CardContent sx={{ p: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                    Class {homeroomClass} Students ({homeroomStudents.length})
                  </Typography>
                </Box>

                {loadingStudents ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress sx={{ color: '#9266FF' }} />
                  </Box>
                ) : homeroomStudents.length === 0 ? (
                  <Alert severity="info" sx={{ backgroundColor: 'rgba(146, 102, 255, 0.1)', border: '1px solid rgba(146, 102, 255, 0.3)', color: '#F4F4FF' }}>
                    {showRiskOnly ? 'No students in Demerit risk zone for this class!' : `No students found for class ${homeroomClass}. Use the dropdown above to select another class.`}
                  </Alert>
                ) : (
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 1.5 }}>
                    {homeroomStudents.map((student) => (
                      <UserCard
                        key={student.id}
                        user={student}
                        type="student"
                        onClick={() => handleStudentClick(student.id)}
                        showActions={false}
                      />
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          /* РЕЖИМ 2: ВСЕ КЛАССЫ И ПОИСК */
          <>
            {!selectedClassId && (
              <Box sx={{ mb: 3 }}>
                <SearchBar placeholder="Search students..." value={searchQuery} onChange={setSearchQuery} />
              </Box>
            )}

            <Card sx={{
              background: 'linear-gradient(135deg, #0C0B21 0%, #1A1932 50%, #0E0D2A 100%)',
              borderRadius: 2,
              border: '1px solid rgba(146, 102, 255, 0.2)',
            }}>
              <CardContent>
                {(loadingClasses || loadingStudents || loadingSearch) ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress sx={{ color: '#9266FF' }} />
                  </Box>
                ) : selectedClassId ? (
                  <>
                    <Box sx={{ mb: 3 }}>
                      <Button
                        startIcon={<ArrowBack />}
                        onClick={handleBackToClasses}
                        sx={{ color: '#9266FF', '&:hover': { backgroundColor: 'rgba(146, 102, 255, 0.1)' } }}
                      >
                        Back to Classes
                      </Button>
                    </Box>
                    {studentsToShow.length === 0 ? (
                      <Alert severity="info" sx={{ backgroundColor: 'rgba(146, 102, 255, 0.1)', border: '1px solid rgba(146, 102, 255, 0.3)', color: '#F4F4FF' }}>
                        No students found.
                      </Alert>
                    ) : (
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
                        {studentsToShow.map(student => (
                          <UserCard key={student.id} user={student} type="student" onClick={() => handleStudentClick(student.id)} showActions={false} />
                        ))}
                      </Box>
                    )}
                  </>
                ) : isInSearchMode ? (
                  <>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ color: '#5A5984' }}>
                        Search results for "{searchQuery}"
                      </Typography>
                    </Box>
                    {studentsToShow.length === 0 ? (
                      <Alert severity="info" sx={{ backgroundColor: 'rgba(146, 102, 255, 0.1)', border: '1px solid rgba(146, 102, 255, 0.3)', color: '#F4F4FF' }}>
                        No students found matching your search.
                      </Alert>
                    ) : (
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
                        {studentsToShow.map(student => (
                          <UserCard key={student.id} user={student} type="student" onClick={() => handleStudentClick(student.id)} showActions={false} />
                        ))}
                      </Box>
                    )}
                  </>
                ) : (
                  <>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" sx={{ color: '#5A5984' }}>
                        Select a class to view students
                      </Typography>
                    </Box>
                    {classes.length === 0 ? (
                      <Alert severity="info" sx={{ backgroundColor: 'rgba(146, 102, 255, 0.1)', border: '1px solid rgba(146, 102, 255, 0.3)', color: '#F4F4FF' }}>
                        No classes found.
                      </Alert>
                    ) : (
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1.5, mt: 1 }}>
                        {classes.map(classItem => (
                          <ClassCard key={classItem.id} classItem={classItem} onClick={() => handleClassSelect(classItem.id)} />
                        ))}
                      </Box>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </Container>

      <Dialog
        open={historyDialogOpen}
        onClose={() => setHistoryDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, #0C0B21 0%, #1A1932 50%, #0E0D2A 100%)',
            border: '1px solid rgba(146, 102, 255, 0.25)',
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle sx={{ color: '#F4F4FF', pb: 1 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <HistoryIcon sx={{ color: '#9266FF' }} />
            {selectedStudentForHistory ? `${selectedStudentForHistory.first_name || ''} ${selectedStudentForHistory.last_name || ''}`.trim() || selectedStudentForHistory.username : 'Student history'}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          {selectedStudentHistory.length === 0 ? (
            <Alert severity="info" sx={{ backgroundColor: 'rgba(146, 102, 255, 0.1)', border: '1px solid rgba(146, 102, 255, 0.3)', color: '#F4F4FF' }}>
              No points history found for this student yet.
            </Alert>
          ) : (
            <Stack spacing={1.25}>
              {selectedStudentHistory.map((entry) => (
                <Box key={entry.id} sx={{ p: 1.5, borderRadius: 2, backgroundColor: 'rgba(146, 102, 255, 0.06)', border: '1px solid rgba(146, 102, 255, 0.15)' }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" gap={1}>
                    <Typography sx={{ color: '#F4F4FF', fontWeight: 600 }}>
                      {entry.rule_description || 'Point assignment'}
                    </Typography>
                    <Chip
                      label={`${entry.points_changed > 0 ? '+' : ''}${entry.points_changed} pts`}
                      size="small"
                      sx={{
                        backgroundColor: entry.points_changed >= 0 ? 'rgba(0, 211, 119, 0.2)' : 'rgba(235, 43, 75, 0.2)',
                        color: entry.points_changed >= 0 ? '#00D377' : '#FF5A6A',
                        border: `1px solid ${entry.points_changed >= 0 ? 'rgba(0, 211, 119, 0.3)' : 'rgba(235, 43, 75, 0.3)'}`,
                      }}
                    />
                  </Box>
                  <Typography variant="caption" sx={{ color: '#5A5984', display: 'block', mt: 0.75 }}>
                    {new Date(entry.created_at).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#C7C6E2', mt: 0.5 }}>
                    {entry.comment || 'No comment'}
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
          <Button
            onClick={() => setHistoryDialogOpen(false)}
            sx={{ color: '#5A5984' }}
          >
            Close
          </Button>
          {selectedStudentForHistory && (
            <Button
              variant="contained"
              onClick={() => handleAssignFromHistory(selectedStudentForHistory.id)}
              sx={{
                background: 'linear-gradient(135deg, #9266FF 0%, #6932EB 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #6932EB 0%, #5A2980 100%)',
                },
              }}
            >
              Assign points
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <AssignRulesDrawer
        open={rulesOpen}
        onClose={handleCloseRulesDrawer}
        rules={rules}
        selectedRuleIds={selectedRuleIds}
        onToggleRule={handleToggleRule}
        assignComment={assignComment}
        onCommentChange={setAssignComment}
        onSubmit={handleAssignSubmit}
        isSubmitting={isAssigning}
        selectedStudentName={selectedStudentName}
      />
    </Box>
  );
}

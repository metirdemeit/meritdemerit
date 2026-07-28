import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Person, ArrowBack } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { useTeacherStore } from '../../store/teacherStore';
import { useCommonStore } from '../../store/commonStore';
import UserCard from '../../components/UserCard';
import ClassCard from '../../components/ClassCard';
import SearchBar from '../../components/layouts/SearchBar';
import { AssignRulesDrawer } from '../components/dialogs/AssignRulesDrawer';

export function StudentsPage() {
  const { assignPoints } = useTeacherStore();
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

  const [selectedClassId, setSelectedClassId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isInSearchMode, setIsInSearchMode] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [selectedRuleIds, setSelectedRuleIds] = useState([]);
  const [assignComment, setAssignComment] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Loading и ошибки по секциям
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [errorClasses, setErrorClasses] = useState(null);
  const [errorStudents, setErrorStudents] = useState(null);
  const [errorSearch, setErrorSearch] = useState(null);

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

    loadClasses();
    loadStudents();
  }, [fetchClasses, fetchStudents]);

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
          setSearchResults(result || []);
        }
        setLoadingSearch(false);
      } else {
        setIsInSearchMode(false);
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delay);
  }, [searchQuery, searchStudents]);

  // Assign points
  const handleStudentClick = (studentId) => {
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
    setIsAssigning(true);
    try {
      await assignPoints({
        student_ids: selectedStudentIds,
        rule_ids: selectedRuleIds,
        comment: assignComment,
      });
      toast.success('Points assigned');
      handleCloseRulesDrawer();
      if (selectedClassId) {
        await fetchStudentsByClass(selectedClassId);
      } else {
        await fetchStudents();
      }
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

  const studentsToShow = isInSearchMode ? searchResults : students;

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

  return (
    <Box sx={{ minHeight: '100vh', pb: 2 }}>
      {/* Header */}
      <Box sx={{
        background: 'linear-gradient(135deg, #4a1d63 0%, #343355 50%, #4a1d63 100%)',
        backdropFilter: 'blur(50px)',
        boxShadow: '0 20px 100px #4a1d63',
        p: 2,
        my: 2,
      }}>
        <Container maxWidth="sm">
          <Box display="flex" alignItems="center" mb={3}>
            <Person sx={{ fontSize: 32, color: '#9266FF', mr: 2 }} />
            <Box>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 400 }}>
                Students Management
              </Typography>
              <Typography variant="body2" sx={{ color: '#5A5984' }}>
                {selectedClassId ? 'Select students to assign points' : 'Select a class to view students'}
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="sm" sx={{ px: 2 }}>
        {/* Error Alerts */}
        {(errorClasses || errorStudents || errorSearch) && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errorClasses || errorStudents || errorSearch}
          </Alert>
        )}

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
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 2 }}>
                    {classes.map(classItem => (
                      <ClassCard key={classItem.id} classItem={classItem} onClick={() => handleClassSelect(classItem.id)} />
                    ))}
                  </Box>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </Container>

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

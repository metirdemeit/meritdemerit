import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  List,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Rule as RuleIcon } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { useTeacherStore } from '../../store/teacherStore';
import { useCommonStore } from '../../store/commonStore';
import SearchBar from '../../components/layouts/SearchBar';
import CodeCard from '../../components/CodeCard';
import AssignStudentsDrawer from '../components/dialogs/AssignStudentsDrawer';

export function RulesPage() {
  const { assignPoints } = useTeacherStore();
  const {
    rules,
    classes,
    students,
    fetchRules,
    fetchClasses,
    fetchStudentsByClass,
  } = useCommonStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [studentsOpen, setStudentsOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  const [isAssigning, setIsAssigning] = useState(false);

  // Loading и ошибки по секциям
  const [loadingRules, setLoadingRules] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [errorRules, setErrorRules] = useState(null);
  const [errorClasses, setErrorClasses] = useState(null);

  // Загружаем правила и классы при монтировании
  useEffect(() => {
    const loadRules = async () => {
      setLoadingRules(true);
      setErrorRules(null);
      const data = await fetchRules();
      if (!data) {
        setErrorRules('Failed to load rules');
      }
      setLoadingRules(false);
    };
 
    const loadClasses = async () => {
      setLoadingClasses(true);
      setErrorClasses(null);
      const data = await fetchClasses();
      if (!data) {
        setErrorClasses('Failed to load classes');
      }
      setLoadingClasses(false);
    };

    loadRules();
    loadClasses();
  }, [fetchRules, fetchClasses]);

  // Фильтруем правила
  const filteredRules = useMemo(() => {
    if (!Array.isArray(rules)) return [];
    if (!searchQuery.trim()) return rules;
    return rules.filter(rule =>
      rule.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [rules, searchQuery]);

  // Assign points
  const handleRuleSelect = (rule) => {
    setSelectedRule(rule);
    setStudentsOpen(true);
  };

  const handleCloseStudentsDrawer = () => {
    setStudentsOpen(false);
    setSelectedRule(null);
  };

  const handleAssignToStudents = async ({ student_ids, rule_ids, comment }) => {
    if (!rule_ids?.length || !student_ids?.length) return;

    setIsAssigning(true);
    try {
      await assignPoints({ student_ids, rule_ids, comment });
      toast.success('Points assigned');
      setStudentsOpen(false);
      setSelectedRule(null);
    } catch (e) {
      toast.error('Failed to assign points');
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', pb: 2 }}>
      {/* Header */}
      <Box sx={{
        background: 'linear-gradient(135deg, #4a1d63 0%, #343355 50%, #4a1d63 100%)',
        backdropFilter: 'blur(50px)',
        boxShadow: '0 20px 100px #4a1d63',
        p: 2,
        pt: 3,
        mt: 2,
        mb: 2,
      }}>
        <Container maxWidth="sm">
          <Box display="flex" alignItems="center" mb={3}>
            <RuleIcon sx={{ fontSize: 32, color: '#9266FF', mr: 2 }} />
            <Box>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 400 }}>
                Rules Management
              </Typography>
              <Typography variant="body2" sx={{ color: '#5A5984' }}>
                Select a rule to assign points to students
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="sm" sx={{ px: 2 }}>
        {(errorRules || errorClasses) && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errorRules || errorClasses}
          </Alert>
        )}

        {/* Search */}
        <Box sx={{ mb: 3 }}>
          <SearchBar placeholder="Search rules..." value={searchQuery} onChange={setSearchQuery} />
        </Box>

        {/* Rules List */}
        <Card sx={{
          background: 'linear-gradient(135deg, #0C0B21 0%, #1A1932 50%, #0E0D2A 100%)',
          borderRadius: 2,
          border: '1px solid rgba(146, 102, 255, 0.2)',
        }}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ color: '#F4F4FF', fontWeight: 400, mb: 2 }}>
              Discipline Rules ({filteredRules.length})
            </Typography>

            {loadingRules ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress sx={{ color: '#9266FF' }} />
              </Box>
            ) : filteredRules.length === 0 ? (
              <Box textAlign="center" py={3}>
                <RuleIcon sx={{ fontSize: 48, color: '#5A5984', mb: 2 }} />
                <Typography variant="body2" sx={{ color: '#5A5984' }}>No rules found</Typography>
              </Box>
            ) : (
              <List>
                {filteredRules.map(rule => (
                  <li key={rule.id} style={{ listStyle: 'none' }}>
                    <CodeCard rule={rule} onSelect={() => handleRuleSelect(rule)} showActions={false} />
                  </li>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Container>

      {/* Assign Students Drawer */}
      <AssignStudentsDrawer
        open={studentsOpen}
        onClose={handleCloseStudentsDrawer}
        rule={selectedRule}
        classes={classes}
        students={students}
        onLoadClasses={fetchClasses}
        onLoadClassStudents={fetchStudentsByClass}
        onSubmit={handleAssignToStudents}
        isSubmitting={isAssigning}
      />
    </Box>
  );
}

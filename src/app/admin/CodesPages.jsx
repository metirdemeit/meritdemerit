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
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Code,
  Rule,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { useAdminStore } from '../../store/adminStore';
import { useCommonStore } from '../../store/commonStore';
import CodeCard from '../../components/CodeCard';
import AddRuleDialog from '../components/dialogs/AddRuleDialog';
import AssignStudentsDrawer from '../components/dialogs/AssignStudentsDrawer';
import DeleteConfirmationDialog from '../components/dialogs/DeleteConfirmationDialog';

export function CodesPages() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuthStore();
  const {
    assignPoints,
    createRule,
    updateRule,
    deleteRule,
  } = useAdminStore();
  
  const {
    rules,
    classes,
    students,
    fetchRules,
    fetchClasses,
    fetchStudentsByClass,
  } = useCommonStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [formData, setFormData] = useState({
    type: '',
    description: '',
    points: '',
    category: '',
  });

  // Диалог подтверждения удаления
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState(null);

  const [loadingPage, setLoadingPage] = useState(false);
  const [errorPage, setErrorPage] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoadingPage(true);
      setErrorPage(null);
      const [rulesData, classesData] = await Promise.all([
        fetchRules(),
        fetchClasses(),
      ]);
      if (!rulesData || !classesData) {
        setErrorPage('Failed to load rules or classes');
      }
      setLoadingPage(false);
    };
    load();
  }, [fetchRules, fetchClasses]);

  const handleOpenDialog = (rule = null) => {
    // Закрываем другие drawer'ы перед открытием нового
    if (deleteDialogOpen) setDeleteDialogOpen(false);
    
    if (rule) {
      setEditingRule(rule);
      setFormData({
        type: rule.type || '',
        description: rule.description || '',
        points: rule.points || '',
        category: rule.category || '',
      });
    } else {
      setEditingRule(null);
      setFormData({
        type: '',
        description: '',
        points: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingRule(null);
    setFormData({
      type: '',
      description: '',
      points: '',
    });
  };

  const handleSubmit = async () => {
    try {
      if (editingRule) {
        await updateRule(editingRule.id, formData);
        toast.success('Rule updated');
      } else {
        await createRule(formData);
        toast.success('Rule created');
      }

      handleCloseDialog();
      await fetchRules();
    } catch {
      toast.error('Failed to save rule');
    }
  };

  const handleDelete = (ruleId) => {
    // Закрываем другие drawer'ы перед открытием нового
    if (dialogOpen) setDialogOpen(false);
    
    setRuleToDelete(ruleId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!ruleToDelete) return;
    try {
      await deleteRule(ruleToDelete);
      toast.success('Rule deleted');
      await fetchRules();
    } catch {
      toast.error('Failed to delete rule');
    } finally {
      setDeleteDialogOpen(false);
      setRuleToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setRuleToDelete(null);
  };

  const [studentsOpen, setStudentsOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  const [isAssigning, setIsAssigning] = useState(false);

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
    } catch {
      toast.error('Failed to assign points');
    } finally {
      setIsAssigning(false);
    }
  };

  if (loadingPage) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '50vh',
        }}
      >
        <CircularProgress sx={{ color: '#9c27b0' }} />
      </Box>
    );
  }

  if (errorPage) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="error">{errorPage}</Alert>
      </Container>
    );
  }

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
            <Code sx={{ fontSize: 32, color: '#9c27b0', mr: 2 }} />
            <Box>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 600 }}>
                Rules Management
              </Typography>
              <Typography variant="body2" sx={{ color: '#b3b3b3' }}>
                Manage discipline rules and point codes
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="sm" sx={{ px: 2 }}>
        {/* Add Rule Button */}
        <Button
          fullWidth
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          sx={{
            height: 60,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #673ab7 0%, #9c27b0 100%)',
            mb: 3,
            mt: 2,
            '&:hover': {
              background: 'linear-gradient(135deg, #5e35b1 0%, #8e24aa 100%)',
            },
          }}
        >
          Add New Rule
        </Button>

        {/* Rules List */}
        <Card
          sx={{
            background: 'linear-gradient(135deg, #0C0B21 0%, #1A1932 50%, #0E0D2A 100%)',
          backdropFilter: 'blur(10px)',
            borderRadius: 2,
            border: '1px solid rgba(156, 39, 176, 0.2)',
          }}
        >
          <CardContent sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, mb: 2 }}>
              Discipline Rules ({rules.length})
            </Typography>
            {rules.length === 0 ? (
              <Box textAlign="center" py={3}>
                <Rule sx={{ fontSize: 48, color: '#666', mb: 2 }} />
                <Typography variant="body2" sx={{ color: '#b3b3b3' }}>
                  No rules created yet
                </Typography>
              </Box>
            ) : (
              <List>
                {rules.map((rule) => (
                  <li key={rule.id} style={{ listStyle: 'none' }}>
                    <CodeCard
                      rule={rule}
                      onSelect={() => handleRuleSelect(rule)}  
                      onEdit={() => handleOpenDialog(rule)}
                      onDelete={() => handleDelete(rule.id)}
                    />
                  </li>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Container>

      {/* Add/Edit Rule Dialog */}
      <AddRuleDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        editingRule={editingRule}
        formData={formData}
        setFormData={setFormData}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Rule"
        message="Are you sure you want to delete this rule? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
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

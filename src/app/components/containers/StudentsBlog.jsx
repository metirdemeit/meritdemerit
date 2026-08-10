import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Button,
  List,
  CircularProgress,
} from '@mui/material';
import { Person, ArrowBack, Add } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { useAdminStore } from '../../../store/adminStore';
import { useCommonStore } from '../../../store/commonStore';
import UserCard from '../../../components/UserCard';
import ClassCard from '../../../components/ClassCard';
import SearchBar from '../../../components/layouts/SearchBar';
import AddUserDialog from '../../components/dialogs/AddUserDialog';
import { AssignRulesDrawer } from '../../components/dialogs/AssignRulesDrawer';
import DeleteConfirmationDialog from '../../components/dialogs/DeleteConfirmationDialog';

export function StudentsBlog() {
  const {
    createStudent,
    updateStudent,
    deleteStudent,
    assignPoints,
  } = useAdminStore();
  
  const {
    students,
    classes,
    rules,
    fetchClasses,
    fetchStudentsByClass,
    fetchRules,
    searchStudents,
  } = useCommonStore();

  const [selectedClassId, setSelectedClassId] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [userType, setUserType] = useState('student');
  
  // Локальное состояние для поиска
  const [searchQuery, setSearchQuery] = useState('');
  const [isInSearchMode, setIsInSearchMode] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    password: '',
    class_name: '',
  });

  // Диалог выбора правил для начисления баллов
  const [rulesOpen, setRulesOpen] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [selectedRuleIds, setSelectedRuleIds] = useState([]);
  const [assignComment, setAssignComment] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Диалог подтверждения удаления
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    fetchClasses();
    setSelectedClassId(null);
  }, [fetchClasses]);

  // Загружаем правила один раз при открытии диалога
  useEffect(() => {
    if (rulesOpen && (!rules || rules.length === 0)) {
      fetchRules();
    }
  }, [rulesOpen, fetchRules, rules]);

  useEffect(() => {
    if (selectedClassId) {
      fetchStudentsByClass(selectedClassId);
    }
  }, [selectedClassId, fetchStudentsByClass]);

  // useEffect для поиска студентов с дебаунсом
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        setIsInSearchMode(true);
        searchStudents(searchQuery.trim());
      } else if (searchQuery.trim().length === 0) {
        setIsInSearchMode(false);
        // clearSearchResults не нужен, так как students обновляется автоматически
      }
    }, 500); // Дебаунс 500мс

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchStudents]);

  const handleOpenDialog = (user = null, type = 'student') => {
    // Закрываем другие drawer'ы перед открытием нового
    if (rulesOpen) setRulesOpen(false);
    if (deleteDialogOpen) setDeleteDialogOpen(false);
    
    setUserType(type);
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        password: '',
        class_name: user.class_name || user.school_class?.name || '',
      });
    } else {
      setEditingUser(null);
      const currentClass = classes.find((c) => c.id === selectedClassId);
      setFormData({
        username: '',
        first_name: '',
        last_name: '',
        password: '',
        class_name: currentClass?.name || '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingUser(null);
    setFormData({
      username: '',
      first_name: '',
      last_name: '',
      password: '',
      class_name: '',
    });
  };

  const handleSubmit = async () => {
    try {
      if (editingUser) {
        await updateStudent(editingUser.id, formData);
        toast.success('Student updated');
      } else {
        await createStudent(formData);
        toast.success('Student created');
      }

      handleCloseDialog();

      if (selectedClassId) {
        await fetchStudentsByClass(selectedClassId);
      }
    } catch {
      toast.error('Failed to save student');
    }
  };

  const handleDelete = (userId, type) => {
    // Закрываем другие drawer'ы перед открытием нового
    if (dialogOpen) setDialogOpen(false);
    if (rulesOpen) setRulesOpen(false);
    
    setUserToDelete({ id: userId, type });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (userToDelete && userToDelete.type === 'student') {
      try {
        await deleteStudent(userToDelete.id);
        toast.success('Student deleted');
        if (selectedClassId) {
          await fetchStudentsByClass(selectedClassId);
        }
      } catch {
        toast.error('Failed to delete student');
      }
    }
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const openAssignDialogForStudent = (studentId) => {
    // Закрываем другие drawer'ы перед открытием нового
    if (dialogOpen) setDialogOpen(false);
    if (deleteDialogOpen) setDeleteDialogOpen(false);
    
    setSelectedStudentIds([studentId]);
    setSelectedRuleIds([]);
    setAssignComment('');
    setRulesOpen(true);
  };

  const handleToggleRule = (ruleId) => {
    setSelectedRuleIds(prev => prev.includes(ruleId) ? prev.filter(id => id !== ruleId) : [...prev, ruleId]);
  };

  const handleAssignSubmit = async () => {
    if (selectedStudentIds.length === 0 || selectedRuleIds.length === 0) return;
    
    setIsAssigning(true);
    try {
      await assignPoints({ student_ids: selectedStudentIds, rule_ids: selectedRuleIds, comment: assignComment });
      toast.success('Points assigned');
      handleCloseRulesDrawer();
    } catch {
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

  // Определяем какие студенты показывать: результаты поиска или локальная фильтрация
  const studentsToShow = isInSearchMode ? students : students;
  return (
    <>
      {/* Search Bar */}
      <Box sx={{ mb: 3 }}>
        <SearchBar
          placeholder="Search students"
          value={searchQuery}
          onChange={setSearchQuery}
        />
      </Box>

      <Card sx={styles.card}>
        <CardContent sx={{ p: 2 }}>
         {isInSearchMode ? (
           <>
             <Typography variant="h6" sx={{ color: '#F4F4FF', mb: 2 }}>
               Search Results ({studentsToShow.length})
             </Typography>
             {studentsToShow.length === 0 ? (
               <Box textAlign="center" py={3}>
                 <Person sx={styles.noStudentsIcon} />
                 <Typography variant="body2" sx={{ color: '#b3b3b3' }}>
                   No students found
                 </Typography>
               </Box>
             ) : (
               <List>
                 {studentsToShow.map((student) => (
                   <li key={student.id} style={{ listStyle: 'none' }}>
                     <UserCard
                       user={student}
                       type="student"
                       onClick={() => openAssignDialogForStudent(student.id)}
                       onEdit={() => handleOpenDialog(student, 'student')}
                       onDelete={() => handleDelete(student.id, 'student')}
                     />
                   </li>
                 ))}
               </List>
             )}
           </>
         ) : !selectedClassId ? (
           <>
             <Typography variant="h6">
               Classes
             </Typography>
             <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1.5, mt: 1 }}>
               {classes.map((c) => (
                 <ClassCard key={c.id} classItem={c} onClick={() => setSelectedClassId(c.id)} />
               ))}
             </Box>
           </>
         ) : null}

         {/* Условие 2: Класс выбран - показываем студентов */}
         {selectedClassId && (
           <>
             <Box display="flex" justifyContent="space-between" width="100%" mb={2}>
               <Button variant="text" startIcon={<ArrowBack />} sx={{ color: '#b3b3b3' }} onClick={() => setSelectedClassId(null)}>
                 Back to classes
               </Button>
               <Button
                 variant="contained"
                 startIcon={<Add />}
                 onClick={() => handleOpenDialog(null, 'student')}
                 sx={styles.addStudentButton}
               >
                 Add Student
               </Button>
             </Box>
            {false ? (
               <Box textAlign="center" py={3}>
                 <CircularProgress sx={{ color: '#9266FF' }} />
               </Box>
             ) : (
               studentsToShow.length === 0 ? (
               <Box textAlign="center" py={3}>
                 <Person sx={styles.noStudentsIcon} />
                 <Typography variant="body2" >
                   No students found
                 </Typography>
               </Box>
             ) : (
               <List>
                 {studentsToShow.map((student) => (
                   <li key={student.id} style={{ listStyle: 'none' }}>
                     <UserCard
                       user={student}
                       type="student"
                       onClick={() => openAssignDialogForStudent(student.id)}
                       onEdit={() => handleOpenDialog(student, 'student')}
                       onDelete={() => handleDelete(student.id, 'student')}
                     />
                   </li>
                 ))}
               </List>
             ))}
           </>
         )}
      </CardContent>
    </Card>

    {/* Add/Edit Student Dialog */}
    <AddUserDialog
      open={dialogOpen}
      onClose={handleCloseDialog}
      onSubmit={handleSubmit}
      editingUser={editingUser}
      userType={userType}
      formData={formData}
      setFormData={setFormData}
    />

     {/* Assign Rules Drawer */}
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
       selectedStudentIds={selectedStudentIds}
       isLoading={isAssigning}
     />

     {/* Delete Confirmation Dialog */}
     <DeleteConfirmationDialog
       open={deleteDialogOpen}
       onClose={handleCancelDelete}
       onConfirm={handleConfirmDelete}
       title="Delete Student"
       message={`Are you sure you want to delete this student? This action cannot be undone.`}
       confirmText="Delete"
       cancelText="Cancel"
     />
     </>
   );
 }

 const styles = {
  card: {
    background: 'linear-gradient(135deg, #0C0B21 0%, #1A1932 50%, #0E0D2A 100%)',
    borderRadius: 2,
    border: '1px solid rgba(156, 39, 176, 0.2)',
  },
  classesBox: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 2,
    justifyContent: 'space-around',
    my: 2,
  },
  addStudentButton: {
    borderRadius: 2,
    background: 'linear-gradient(135deg, #673ab7 0%, #9c27b0 100%)',
    '&:hover': { background: 'linear-gradient(135deg, #5e35b1 0%, #8e24aa 100%)' },
  },
  noStudentsIcon: {
    fontSize: 48,
    color: '#666',
    mb: 2,
  },
 }
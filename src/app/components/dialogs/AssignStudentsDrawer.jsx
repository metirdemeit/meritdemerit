import { useState, useEffect } from 'react';
import { Box, Typography, Button, Divider, TextField } from '@mui/material';
import Drawer from '../../../components/layouts/Drawer';
import ClassTab from '../../../components/ClassTab';
import ClassStudentsSection from '../../../components/ClassStudentsSection';

const AssignStudentsDrawer = ({
  open,
  onClose,
  rule,
  classes = [],
  students = [],
  onLoadClasses,
  onLoadClassStudents,
  onSubmit,
  isSubmitting,
}) => {
  const [activeClassId, setActiveClassId] = useState(null);
  const [selectedByClass, setSelectedByClass] = useState({}); // { [classId]: Set(studentId) }
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (open) {
      setActiveClassId(null);
      setSelectedByClass({});
      setComment('');
      onLoadClasses && onLoadClasses();
    }
  }, [open, onLoadClasses]);

  useEffect(() => {
    if (activeClassId) {
      onLoadClassStudents && onLoadClassStudents(activeClassId);
    }
  }, [activeClassId, onLoadClassStudents]);

  const handleToggleStudent = (studentId) => {
    setSelectedByClass((prev) => {
      const current = new Set(prev[activeClassId] || []);
      if (current.has(studentId)) current.delete(studentId); else current.add(studentId);
      return { ...prev, [activeClassId]: current };
    });
  };

  const getSelectedCount = (classId) => (selectedByClass[classId]?.size || 0);

  const handleSubmit = () => {
    const allSelectedIds = Object.values(selectedByClass)
      .reduce((acc, setIds) => acc.concat(Array.from(setIds)), []);
    if (allSelectedIds.length === 0 || !rule?.id) return;
    onSubmit && onSubmit({ student_ids: allSelectedIds, rule_ids: [rule.id], comment });
  };

  return (
    <Drawer open={open} onClose={onClose} title="Assign Merits/Demerits" maxHeight="100vh">
      <>
        {/* Rule info */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ color: '#5A5984' }}>Selected rule</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
            <Typography variant="body1" sx={{ color: '#F4F4FF' }}>
              {rule?.description}
            </Typography>
            <Box sx={{}}> 
              <Typography variant="body1" sx={{ 
                color: rule?.type === 'Merit' ? '#00D377' : rule?.type === 'Demerit' ? '#EB2B4B' : '#9266FF',
                fontWeight: 600,
              }}>
                {rule?.type === 'Merit' ? '+' : rule?.type === 'Demerit' ? '-' : ''}{rule?.points}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ borderColor: 'rgba(146,102,255,0.2)', mb: 2 }} />

        {/* Classes tabs list */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
          {classes.map((cls) => (
            <ClassTab
              key={cls.id}
              classItem={cls}
              isOpen={activeClassId === cls.id}
              selectedCount={getSelectedCount(cls.id)}
              onToggle={() => setActiveClassId(activeClassId === cls.id ? null : cls.id)}
            >
              {activeClassId === cls.id && (
                <ClassStudentsSection
                  students={students}
                  selectedIds={Array.from(selectedByClass[cls.id] || [])}
                  onToggle={handleToggleStudent}
                />
              )}
            </ClassTab>
          ))}
        </Box>

        {/* Comment and submit */}
        <Box sx={{ mt: 2, pb: 3 }}>
          <TextField
            fullWidth
            multiline
            rows={2}
            placeholder="Comment (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: '#F4F4FF',
                '& fieldset': { borderColor: 'rgba(146, 102, 255, 0.3)' },
                '&:hover fieldset': { borderColor: 'rgba(146, 102, 255, 0.5)' },
                '&.Mui-focused fieldset': { borderColor: '#9266FF' },
              },
              '& .MuiInputLabel-root': { color: '#5A5984', '&.Mui-focused': { color: '#9266FF' } },
            }}
          />

          <Button
            fullWidth
            variant="contained"
            disabled={isSubmitting}
            onClick={handleSubmit}
            sx={{
              mt: 2,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #9266FF 0%, #6932EB 100%)',
              '&:hover': { background: 'linear-gradient(135deg, #6932EB 0%, #5A2980 100%)' }
            }}
          >
            {isSubmitting ? 'Assigning...' : `Assign merits/demerits (${getSelectedCount(activeClassId)} students)`}
          </Button>
        </Box>
      </>
    </Drawer>
  );
};

export default AssignStudentsDrawer;



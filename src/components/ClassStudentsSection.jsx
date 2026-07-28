import { List, ListItem, Checkbox, Box, Typography } from '@mui/material';

const ClassStudentsSection = ({ students = [], selectedIds = [], onToggle }) => {
  return (
    <List>
      {students.map((student) => (
        <ListItem key={student.id} sx={{ p: 0 }}>
          <Checkbox
            checked={selectedIds.includes(student.id)}
            onChange={() => onToggle(student.id)}
            sx={{ color: '#9266FF',}}
          />
          <Box
            onClick={() => onToggle(student.id)}
            sx={{
              flexGrow: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
            }}
          >
            <Typography variant="body1" sx={{ color: '#F4F4FF' }}>
              {student.first_name} {student.last_name}
            </Typography>
            <Typography variant="body2" sx={{ color: '#5A5984' }}>
              {student.points ?? 0} pts
            </Typography>
          </Box>
        </ListItem>
      ))}
    </List>
  );
};

export default ClassStudentsSection;



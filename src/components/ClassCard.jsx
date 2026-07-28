import { Card, CardContent, Typography, Box } from '@mui/material';

const ClassCard = ({ classItem, onClick }) => {
  return (
    <Card
      onClick={onClick}
      sx={{
        width: 80,
        height: 80,
        borderRadius: 2,
        background: 'linear-gradient(135deg, #0C0B21 0%, #1A1932 50%, #0E0D2A 100%)',
        border: '1px solid rgba(146, 102, 255, 0.2)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer'
      }}
    >
      <CardContent>
        <Box textAlign="center">
          <Typography variant="h5">
            {classItem.name}
          </Typography>
          {classItem.studentsCount && (
            <Typography variant="body2" sx={{ color: '#5A5984', mt: 1 }}>
              {classItem.studentsCount} students
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ClassCard;


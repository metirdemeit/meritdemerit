import { Card, CardContent, Typography, Box } from '@mui/material';
import { School } from '@mui/icons-material';

const ClassCard = ({ classItem, onClick }) => {
  return (
    <Card
      onClick={onClick}
      sx={{
        borderRadius: 2,
        background: 'linear-gradient(135deg, #1A1932 0%, #0E0D2A 100%)',
        border: '1px solid rgba(146, 102, 255, 0.25)',
        color: 'white',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          border: '1px solid rgba(146, 102, 255, 0.7)',
          boxShadow: '0 4px 20px rgba(146, 102, 255, 0.25)',
          transform: 'translateY(-2px)',
        },
        '&:active': {
          transform: 'scale(0.98)',
        },
      }}
    >
      <CardContent sx={{ p: '14px !important', display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #9266FF 0%, #6932EB 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <School sx={{ fontSize: 22, color: 'white' }} />
        </Box>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography
            variant="h6"
            sx={{ color: '#F4F4FF', fontWeight: 600, lineHeight: 1.2 }}
          >
            {classItem.name}
          </Typography>
          {classItem.studentsCount != null && (
            <Typography variant="caption" sx={{ color: '#5A5984' }}>
              {classItem.studentsCount} students
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ClassCard;


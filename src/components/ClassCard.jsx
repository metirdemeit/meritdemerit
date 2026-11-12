import { Card, Typography, Box } from '@mui/material';
import { clickableProps } from '../utils/a11y';

const ClassCard = ({ classItem, onClick }) => {
  return (
    <Card
      {...clickableProps(onClick, classItem?.name ? `Class ${classItem.name}` : undefined)}
      sx={{
        aspectRatio: '1 / 1',
        borderRadius: '14px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(146, 102, 255, 0.2)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        boxShadow: 'none',
        '&:hover': {
          border: '1px solid rgba(146, 102, 255, 0.6)',
          background: 'rgba(146, 102, 255, 0.08)',
        },
        '&:focus-visible': { outline: '2px solid #9266FF', outlineOffset: 2 },
        '&:active': {
          transform: 'scale(0.96)',
        },
      }}
    >
      <Typography
        variant="h6"
        sx={{ color: '#E0DFFF', fontWeight: 500, fontSize: '1.1rem' }}
      >
        {classItem.name}
      </Typography>
    </Card>
  );
};

export default ClassCard;



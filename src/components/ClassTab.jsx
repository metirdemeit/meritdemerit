import { Box, Typography, Collapse } from '@mui/material';
import { ExpandMore } from '@mui/icons-material';

const ClassTab = ({ classItem, isOpen, onToggle, selectedCount = 0, children }) => {
  return (
    <Box
      sx={{
        border: '1px solid rgba(146, 102, 255, 0.2)',
        borderRadius: 2,
        background: 'linear-gradient(135deg, #0C0B21 0%, #1A1932 50%, #0E0D2A 100%)',
      }}
    >
      <Box
        onClick={onToggle}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 1.5,
          cursor: 'pointer',
        }}
      >
        <Typography variant="body1" sx={{ color: '#F4F4FF' }}>
          {classItem.name}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" sx={{ color: '#5A5984' }}>
            {selectedCount}
          </Typography>
          <ExpandMore
            sx={{
              color: '#5A5984',
              transition: 'transform 200ms ease',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
            }}
          />
        </Box>
      </Box>

      {/* Плавное открытие/закрытие содержимого */}
      <Collapse in={isOpen} timeout={300} unmountOnExit>
        <Box sx={{ p: 1.5, pt: 0 }}>
          {children}
        </Box>
      </Collapse>
    </Box>
  );
};

export default ClassTab;



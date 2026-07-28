import { Drawer as MUIDrawer, Box, Typography, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

const Drawer = ({
  open,
  onClose,
  title,
  children,
  maxHeight = '90vh',
}) => {
  return (
    <MUIDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          background: 'linear-gradient(135deg, #0C0B21 0%, #1A1932 50%, #0E0D2A 100%)',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          maxHeight,
          zIndex: 1300, // Высокий z-index для правильного наложения
        },
      }}
      sx={{
        zIndex: 1300, // Убеждаемся, что drawer всегда сверху
      }}
    >
      <Box sx={{ p: 3, pt: 2, pb: 2, width: '100%', maxWidth: '500px', mx: 'auto' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ color: '#F4F4FF', fontWeight: 400 }}>
            {title}
          </Typography>
          <IconButton onClick={onClose} sx={{ color: '#5A5984' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Content */}
        <Box sx={{ maxHeight: `calc(${maxHeight} - 120px)`}}>
          {children}
        </Box>
      </Box>
    </MUIDrawer>
  );
};

export default Drawer;


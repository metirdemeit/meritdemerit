import { Drawer as MUIDrawer, Box, Typography, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

const Drawer = ({
  open,
  onClose,
  title,
  children,
  maxHeight = '85vh',
}) => {
  return (
    <MUIDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          background: 'linear-gradient(135deg, #0C0B21 0%, #1A1932 50%, #0E0D2A 100%)',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          maxHeight: 'calc(100vh - 65px)',
          marginTop: '65px',
          zIndex: 1300, // Высокий z-index для правильного наложения
        },
      }}
      sx={{
        zIndex: 1300, // Убеждаемся, что drawer всегда сверху
      }}
    >
      <Box sx={{ p: 3, pt: 3, pb: 2, width: '100%', maxWidth: '500px', mx: 'auto' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, pt: 1 }}>
          <Typography variant="h6" sx={{ color: '#F4F4FF', fontWeight: 500 }}>
            {title}
          </Typography>
          <IconButton
            onClick={onClose}
            sx={{
              color: '#5A5984',
              backgroundColor: 'rgba(146, 102, 255, 0.1)',
              p: 1,
              '&:hover': {
                backgroundColor: 'rgba(146, 102, 255, 0.2)',
                color: '#ffffff',
              },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Content */}
        <Box sx={{ maxHeight: `calc(${maxHeight} - 100px)`, overflowY: 'auto' }}>
          {children}
        </Box>
      </Box>
    </MUIDrawer>
  );
};

export default Drawer;


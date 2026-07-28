import { Box, Button, Typography } from '@mui/material';
import Drawer from '../../../components/layouts/Drawer';

const DeleteConfirmationDialog = ({
  open,
  onClose,
  onConfirm,
  title = "Delete Record",
  message = "Are you sure you want to delete this record? This action cannot be undone.",
  confirmText = "Delete",
  cancelText = "Cancel",
}) => {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={title}
    >
      <>
        <Typography sx={{ color: '#5A5984', mb: 4, lineHeight: 1.6 }}>
          {message}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            onClick={onClose} 
            variant="outlined"
            sx={{ 
              color: '#5A5984',
              borderColor: 'rgba(146, 102, 255, 0.3)',
              '&:hover': {
                borderColor: 'rgba(146, 102, 255, 0.5)',
              }
            }}
            fullWidth
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #EB2B4B 0%, #C71A3A 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #C71A3A 0%, #A3152A 100%)',
              },
            }}
            fullWidth
          >
            {confirmText}
          </Button>
        </Box>
      </>
    </Drawer>
  );
};

export default DeleteConfirmationDialog;


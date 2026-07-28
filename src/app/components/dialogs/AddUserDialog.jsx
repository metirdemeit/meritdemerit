import {Box, TextField, Button, Grid, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { CLASS_NAMES } from '../../../utils/constants';
import Drawer from '../../../components/layouts/Drawer';

const AddUserDialog = ({
  open,
  onClose,
  onSubmit,
  editingUser,
  userType,
  formData,
  setFormData,
}) => {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={editingUser ? 'Edit User' : 'Add New User'}
    >
      <>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="First Name"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#F4F4FF',
                  '& fieldset': {
                    borderColor: 'rgba(146, 102, 255, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(146, 102, 255, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#9266FF',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#5A5984',
                },
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Last Name"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#F4F4FF',
                  '& fieldset': {
                    borderColor: 'rgba(146, 102, 255, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(146, 102, 255, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#9266FF',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#5A5984',
                },
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#F4F4FF',
                  '& fieldset': {
                    borderColor: 'rgba(146, 102, 255, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(146, 102, 255, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#9266FF',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#5A5984',
                },
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#F4F4FF',
                  '& fieldset': {
                    borderColor: 'rgba(146, 102, 255, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(146, 102, 255, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#9266FF',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#5A5984',
                },
              }}
            />
          </Grid>
          {userType === 'student' && (
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#5A5984' }}>Class</InputLabel>
                <Select
                  value={formData.class_name}
                  label="Class"
                  onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                  sx={{
                    color: '#F4F4FF',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(146, 102, 255, 0.3)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(146, 102, 255, 0.5)' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#9266FF' },
                  }}
                >
                  {CLASS_NAMES.map((name) => (
                    <MenuItem key={name} value={name}>{name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
        </Grid>
        <Box sx={{ display: 'flex', gap: 2, mt: 3, pt: 3, borderTop: '1px solid rgba(146, 102, 255, 0.2)' }}>
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
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #9266FF 0%, #6932EB 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #6932EB 0%, #5A2980 100%)',
              },
            }}
            fullWidth
          >
            {editingUser ? 'Update' : 'Create'}
          </Button>
        </Box>
      </>
    </Drawer>
  );
};

export default AddUserDialog;


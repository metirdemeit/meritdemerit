import {Box, TextField, Button, Grid, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import Drawer from '../../../components/layouts/Drawer';

const AddRuleDialog = ({
  open,
  onClose,
  onSubmit,
  editingRule,
  formData,
  setFormData,
}) => {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={editingRule ? 'Edit Rule' : 'Add New Rule'}
    >
      <>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sx={{ display: 'flex', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel sx={{ color: '#5A5984' }}>Type</InputLabel>
              <Select
                value={formData.type || ''}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                sx={{
                  color: '#F4F4FF',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(146, 102, 255, 0.3)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(146, 102, 255, 0.5)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#9266FF',
                  },
                  '& .MuiSvgIcon-root': {
                    color: '#5A5984',
                  },
                }}
              >
                <MenuItem value="merit" sx={{ color: '#F4F4FF' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #00D377 0%, #00B865 100%)',
                      }}
                    />
                    Merit (+)
                  </Box>
                </MenuItem>
                <MenuItem value="demerit" sx={{ color: '#F4F4FF' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #EB2B4B 0%, #C71A3A 100%)',
                      }}
                    />
                    Demerit (-)
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Points"
              type="number"
              value={formData.points}
              onChange={(e) => setFormData({ ...formData, points: e.target.value })}
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
              label="Description"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
            {editingRule ? 'Update' : 'Create'}
          </Button>
        </Box>
      </>
    </Drawer>
  );
};

export default AddRuleDialog;


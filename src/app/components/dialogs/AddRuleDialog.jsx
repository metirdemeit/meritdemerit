import React from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Typography,
  Divider,
} from '@mui/material';
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
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel sx={{ color: '#5A5984' }}>Type</InputLabel>
              <Select
                value={formData.type || 'merit'}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                label="Type"
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
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Points"
              type="number"
              value={formData.points ?? ''}
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
            <FormControl fullWidth>
              <InputLabel sx={{ color: '#5A5984' }}>Access Level (Доступ)</InputLabel>
              <Select
                value={formData.access_level || 'all'}
                onChange={(e) => setFormData({ ...formData, access_level: e.target.value })}
                label="Access Level (Доступ)"
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
                <MenuItem value="all" sx={{ color: '#F4F4FF' }}>🌐 Все пользователи (Default)</MenuItem>
                <MenuItem value="teacher" sx={{ color: '#F4F4FF' }}>👨‍🏫 Учителя и Админы</MenuItem>
                <MenuItem value="admin" sx={{ color: '#F4F4FF' }}>🔒 Только Админы</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={2}
              value={formData.description ?? ''}
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

          {/* Section: Rule Usage Limits (LimitMD) */}
          <Grid item xs={12}>
            <Divider sx={{ my: 1, borderColor: 'rgba(146, 102, 255, 0.2)' }} />
            <FormControlLabel
              control={
                <Checkbox
                  checked={!!formData.hasLimit}
                  onChange={(e) => setFormData({ ...formData, hasLimit: e.target.checked })}
                  sx={{ color: '#9266FF', '&.Mui-checked': { color: '#00D377' } }}
                />
              }
              label={
                <Typography variant="body2" sx={{ color: '#F4F4FF', fontWeight: 600 }}>
                  Установить лимит использования (LimitMD)
                </Typography>
              }
            />
          </Grid>

          {formData.hasLimit && (
            <>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Макс. применений (Max Uses)"
                  type="number"
                  value={formData.max_uses ?? 1}
                  onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: '#F4F4FF',
                      '& fieldset': { borderColor: 'rgba(146, 102, 255, 0.3)' },
                    },
                    '& .MuiInputLabel-root': { color: '#5A5984' },
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: '#5A5984' }}>Тип сброса</InputLabel>
                  <Select
                    value={formData.reset_type || 'period'}
                    onChange={(e) => setFormData({ ...formData, reset_type: e.target.value })}
                    label="Тип сброса"
                    sx={{ color: '#F4F4FF' }}
                  >
                    <MenuItem value="period" sx={{ color: '#F4F4FF' }}>Периодически</MenuItem>
                    <MenuItem value="until_date" sx={{ color: '#F4F4FF' }}>До даты</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {formData.reset_type === 'period' && (
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ color: '#5A5984' }}>Период сброса</InputLabel>
                    <Select
                      value={formData.reset_period || 'weekly'}
                      onChange={(e) => setFormData({ ...formData, reset_period: e.target.value })}
                      label="Период сброса"
                      sx={{ color: '#F4F4FF' }}
                    >
                      <MenuItem value="daily" sx={{ color: '#F4F4FF' }}>Ежедневно</MenuItem>
                      <MenuItem value="weekly" sx={{ color: '#F4F4FF' }}>Еженедельно</MenuItem>
                      <MenuItem value="monthly" sx={{ color: '#F4F4FF' }}>Ежемесячно</MenuItem>
                      <MenuItem value="none" sx={{ color: '#F4F4FF' }}>Без авто-сброса</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}

              {formData.reset_type === 'until_date' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Дата истечения лимита"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={formData.reset_date || ''}
                    onChange={(e) => setFormData({ ...formData, reset_date: e.target.value })}
                    sx={{
                      '& .MuiOutlinedInput-root': { color: '#F4F4FF' },
                      '& .MuiInputLabel-root': { color: '#5A5984' },
                    }}
                  />
                </Grid>
              )}
            </>
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
            {editingRule ? 'Update' : 'Create'}
          </Button>
        </Box>
      </>
    </Drawer>
  );
};

export default AddRuleDialog;

import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  IconButton,
  Chip,
  Typography,
} from '@mui/material';
import { Visibility, VisibilityOff, AutoFixHigh } from '@mui/icons-material';
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
  const [showPassword, setShowPassword] = useState(false);

  // Формула автоподсказки username: первая буква имени + "_" + фамилия (все строчными)
  const getRecommendedUsername = (firstName, lastName) => {
    if (!firstName && !lastName) return '';
    const f = (firstName || '').trim()[0] || '';
    const l = (lastName || '').trim().replace(/\s+/g, '');
    if (!f && !l) return '';
    if (!f) return l.toLowerCase();
    if (!l) return f.toLowerCase();
    return `${f}_${l}`.toLowerCase();
  };

  const recommendedUser = getRecommendedUsername(formData.first_name, formData.last_name);

  const handleFirstNameChange = (val) => {
    const prevRec = getRecommendedUsername(formData.first_name, formData.last_name);
    const newRec = getRecommendedUsername(val, formData.last_name);
    const updated = { ...formData, first_name: val };
    if (!formData.username || formData.username === prevRec) {
      updated.username = newRec;
    }
    setFormData(updated);
  };

  const handleLastNameChange = (val) => {
    const prevRec = getRecommendedUsername(formData.first_name, formData.last_name);
    const newRec = getRecommendedUsername(formData.first_name, val);
    const updated = { ...formData, last_name: val };
    if (!formData.username || formData.username === prevRec) {
      updated.username = newRec;
    }
    setFormData(updated);
  };

  // Генерация 8-значного пароля (заглавные, строчные, цифры, спецсимволы)
  const generate8CharPassword = () => {
    const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lowers = 'abcdefghijkmnopqrstuvwxyz';
    const digits = '23456789';
    const symbols = '!@#$%^&*';

    // Гарантируем минимум по 1 символу каждой категории
    const p1 = uppers[Math.floor(Math.random() * uppers.length)];
    const p2 = lowers[Math.floor(Math.random() * lowers.length)];
    const p3 = digits[Math.floor(Math.random() * digits.length)];
    const p4 = symbols[Math.floor(Math.random() * symbols.length)];

    const all = uppers + lowers + digits + symbols;
    let remaining = '';
    for (let i = 0; i < 4; i++) {
      remaining += all[Math.floor(Math.random() * all.length)];
    }

    const combined = (p1 + p2 + p3 + p4 + remaining).split('');
    // Перемешиваем
    for (let i = combined.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [combined[i], combined[j]] = [combined[j], combined[i]];
    }

    return combined.join('');
  };

  const handleGeneratePassword = () => {
    const pass = generate8CharPassword();
    setFormData({ ...formData, password: pass });
    setShowPassword(true);
  };

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
              value={formData.first_name || ''}
              onChange={(e) => handleFirstNameChange(e.target.value)}
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
              value={formData.last_name || ''}
              onChange={(e) => handleLastNameChange(e.target.value)}
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
              value={formData.username || ''}
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
            {recommendedUser && formData.username !== recommendedUser && (
              <Box sx={{ mt: 1 }}>
                <Chip
                  label={`Suggestion: ${recommendedUser}`}
                  size="small"
                  onClick={() => setFormData({ ...formData, username: recommendedUser })}
                  sx={{
                    backgroundColor: 'rgba(146, 102, 255, 0.15)',
                    color: '#9266FF',
                    border: '1px solid rgba(146, 102, 255, 0.3)',
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'rgba(146, 102, 255, 0.3)',
                    },
                  }}
                />
              </Box>
            )}
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password || ''}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Button
                      size="small"
                      startIcon={<AutoFixHigh sx={{ fontSize: 16 }} />}
                      onClick={handleGeneratePassword}
                      sx={{
                        color: '#00D377',
                        borderColor: 'rgba(0, 211, 119, 0.4)',
                        textTransform: 'none',
                        fontSize: '0.75rem',
                        py: 0.5,
                        px: 1,
                        mr: 0.5,
                        '&:hover': {
                          backgroundColor: 'rgba(0, 211, 119, 0.15)',
                          borderColor: '#00D377',
                        },
                      }}
                      variant="outlined"
                    >
                      Generate
                    </Button>
                    <IconButton
                      size="small"
                      onClick={() => setShowPassword(!showPassword)}
                      sx={{ color: '#5A5984' }}
                    >
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
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
                  value={formData.class_name || ''}
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

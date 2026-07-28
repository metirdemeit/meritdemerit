import React from 'react';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';

// Простой переиспользуемый выпадающий список (Dropdown)
// Принимает: label, value, onChange, options (массив строк или { label, value })
// Опционально: placeholder (элемент со значением "")
const Dropdown = ({
  label,
  value,
  onChange,
  options = [],
  placeholder,
  sx,
}) => {
  const toOption = (option) => {
    if (typeof option === 'string') {
      return { label: option, value: option };
    }
    return option;
  };

  const normalizedOptions = options.map(toOption);

  return (
    <FormControl fullWidth sx={{ mb: 2, ...sx }}>
      <InputLabel sx={{ color: '#b3b3b3' }}>{label}</InputLabel>
      <Select
        value={value}
        onChange={onChange}
        label={label}
        sx={{
          color: 'white',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(156, 39, 176, 0.3)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(156, 39, 176, 0.5)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#9c27b0',
          },
        }}
      >
        {typeof placeholder !== 'undefined' && (
          <MenuItem value="">
            <em>{placeholder}</em>
          </MenuItem>
        )}

        {normalizedOptions.map((opt) => (
          <MenuItem key={String(opt.value)} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default Dropdown;



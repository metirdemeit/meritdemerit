import { TextField } from '@mui/material';
import { Search } from '@mui/icons-material';

const SearchBar = ({ 
  placeholder = 'Search...', 
  value, 
  onChange,
  fullWidth = true 
}) => {
  return (
    <TextField
      fullWidth={fullWidth}
      variant="outlined"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      InputProps={{ 
        startAdornment: (<Search sx={{ mr: 1, color: '#5A5984' }} />) 
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          color: 'white',
          '& fieldset': { borderColor: 'rgba(146, 102, 255, 0.3)' },
          '&:hover fieldset': { borderColor: 'rgba(146, 102, 255, 0.5)' },
          '&.Mui-focused fieldset': { borderColor: '#9266FF' },
        },
        '& .MuiInputLabel-root': { color: '#5A5984' },
      }}
    />
  );
};

export default SearchBar;

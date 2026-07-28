import {
  Box,
  Typography,
  Button, 
  FormControlLabel,
  Checkbox,
  TextField,
  CircularProgress,
  Alert,
} from '@mui/material';
import Drawer from '../../../components/layouts/Drawer';

export function AssignRulesDrawer({
  open,
  onClose,
  rules = [],
  selectedRuleIds = [],
  onToggleRule,
  assignComment = '',
  onCommentChange,
  onSubmit,
  isSubmitting = false,
  selectedStudentName = ''
}) {
  const handleSubmit = () => {
    if (selectedRuleIds.length === 0) {
      return;
    }
    onSubmit();
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Assign Merits/Demerits"
      maxHeight="100vh"
    >
      <Box sx={{pb: 3}}>

        {/* Selected Students Info */}
        {selectedStudentName && (
           <Alert severity="info" sx={{ mb: 2, backgroundColor: 'rgba(33, 150, 243, 0.1)', border: '1px solid rgba(33, 150, 243, 0.3)' }}>
             Selected student: {selectedStudentName}
           </Alert>
        )}

        {/* Rules Selection */}
         <Typography variant="body2" sx={{ mb: 2, color: '#5A5984' }}>
           Select rules:
         </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3, overflowY: 'auto' }}>
          {rules.length === 0 ? (
            <Typography variant="body2" sx={{ color: '#5A5984', textAlign: 'center', py: 2 }}>
              Loading rules...
            </Typography>
          ) : (
            rules.map(rule => (
              <FormControlLabel
                key={rule.id}
                control={ 
                  <Checkbox 
                    checked={selectedRuleIds.includes(rule.id)} 
                    onChange={() => onToggleRule(rule.id)}
                    sx={{ 
                      color: '# 9266FF',
                      '&.Mui-checked': { color: '#00D377' }
                    }}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ color: '#F4F4FF' }}>
                      {rule.description}
                    </Typography>
                     <Typography variant="caption" sx={{ color: rule.type === 'Merit' ? '#00D377' : rule.type === 'Demerit' ? '#EB2B4B' : '#9266FF' }}>
                       {rule.points} points
                     </Typography>
                  </Box>
                }
                sx={{ 
                  mx: 0,
                  alignItems: 'flex-start',
                  '& .MuiFormControlLabel-label': { mx : 1 }
                }}
              />
            ))
          )}
        </Box>

        {/* Comment Field */}
        <TextField
          fullWidth
          multiline
          rows={3}
           label="Comment (optional)"
          value={assignComment}
          onChange={(e) => onCommentChange(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              color: '#F4F4FF',
              '& fieldset': { borderColor: '#373758' },
              '&:hover fieldset': { borderColor: '#8483AE' },
              '&.Mui-focused fieldset': { borderColor: '#00D377' }
            },
            '& .MuiInputLabel-root': {
              color: '#5A5984',
              '&.Mui-focused': { color: '#00D377' }
            }
          }}
        />

        {/* Submit Button */}
        <Button
          fullWidth
          variant="contained"
          onClick={handleSubmit}
          disabled={selectedRuleIds.length === 0 || isSubmitting}
          sx={{
            background: selectedRuleIds.length === 0 
              ? 'linear-gradient(135deg, #626290 0%, #373758 100%)' 
              : 'linear-gradient(135deg, #9266FF 0%, #6932EB 100%)',
            color: '#F4F4FF',
            mt: 2,
            fontWeight: 400,
            '&:hover': {
              background: selectedRuleIds.length === 0 
                ? 'linear-gradient(135deg, #626290 0%, #373758 100%)' 
                : 'linear-gradient(135deg, #6932EB 0%, #5A2980 100%)'
            },
            '&:disabled': {
              background: 'linear-gradient(135deg, #626290 0%, #373758 100%)',
              color: '#5A5984'
            }
          }}
        >
          {isSubmitting ? (
            <CircularProgress size={20} sx={{ color: '#F4F4FF' }} />
          ) : (
             `Assign ${selectedRuleIds.length > 0 ? `(${selectedRuleIds.length} merits/demerits)` : ''}`
          )}
        </Button>
      </Box>
    </Drawer>
  );
}

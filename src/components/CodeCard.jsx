import {
  Card,
  CardContent,
  Box,
  Typography,
  IconButton
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';

export default function CodeCard({
  rule,
  onEdit,
  onDelete,
  onSelect,
  showActions = true,
}) {
  const isMerit = rule.type === 'Merit';
  const isDemerit = rule.type === 'Demerit';
  return (
    <Card
      onClick={onSelect}
      sx={{
        mb: 1.5,
        background: 'linear-gradient(135deg, #0C0B21 0%, #1A1932 50%, #0E0D2A 100%)',
        border: isMerit 
          ? '1px solid rgba(0, 211, 119, 0.18)'
          : isDemerit 
            ? '1px solid rgba(235, 43, 75, 0.18)'
            : '1px solid rgba(146, 102, 255, 0.18)',
        borderRadius: 2,
        cursor: onSelect ? 'pointer' : 'default',
        '&:hover': onSelect ? {
          border: isMerit 
            ? '1px solid rgba(0, 211, 119, 0.5)'
            : isDemerit 
              ? '1px solid rgba(235, 43, 75, 0.5)'
              : '1px solid rgba(146, 102, 255, 0.5)',
          transform: 'translateY(-2px)',
          transition: 'all 0.2s ease-in-out',
        } : {},
      }}
    >
      <CardContent sx={{ p: 2.0 }}>
        <Box display="flex" alignItems="center" gap={2}>
          {/* Points Circle Icon */}
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: isMerit 
                ? 'linear-gradient(135deg, #00D377 0%, #00B865 100%)'
                : isDemerit 
                  ? 'linear-gradient(135deg, #EB2B4B 0%, #C71A3A 100%)'
                  : 'linear-gradient(135deg, #9266FF 0%, #6932EB 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#F4F4FF',
              flexShrink: 0,
              position: 'relative',
            }}
          >
            {isMerit ? '+' : isDemerit ? '-' : ''}{rule.points}
          </Box>
          <Box flexGrow={1} overflow="hidden">
            <Typography variant="body1" sx={{ color: '#F4F4FF', fontWeight: 500 }} noWrap>
              {rule.description}
            </Typography>
            <Typography variant="caption" sx={{ color: '#777' }} noWrap>
              {rule.type} • {rule.category || 'General'}
            </Typography>
          </Box>

          {showActions && (
            <Box display="flex" alignItems="center" gap={1} ml={2}>
            <IconButton 
              aria-label="edit" 
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }} 
              sx={{ color: '#9266FF' }}
            >
              <Edit />
            </IconButton>
            <IconButton 
              aria-label="delete" 
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }} 
              sx={{ color: '#EB2B4B' }}
            >
              <Delete />
              </IconButton>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

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
  const isMerit = rule.type?.toLowerCase() === 'merit' || rule.points > 0;
  const isDemerit = rule.type?.toLowerCase() === 'demerit' || rule.points < 0;
  return (
    <Card
      onClick={onSelect}
      sx={{
        mb: 1.5,
        background: 'linear-gradient(135deg, #0C0B21 0%, #1A1932 50%, #0E0D2A 100%)',
        border: isMerit 
          ? '1px solid rgba(0, 211, 119, 0.3)'
          : isDemerit 
            ? '1px solid rgba(235, 43, 75, 0.3)'
            : '1px solid rgba(146, 102, 255, 0.3)',
        borderRadius: 2,
        cursor: onSelect ? 'pointer' : 'default',
        '&:hover': onSelect ? {
          border: isMerit 
            ? '1px solid rgba(0, 211, 119, 0.6)'
            : isDemerit 
              ? '1px solid rgba(235, 43, 75, 0.6)'
              : '1px solid rgba(146, 102, 255, 0.6)',
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
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '1rem',
              boxShadow: isMerit
                ? '0 4px 12px rgba(0, 211, 119, 0.35)'
                : isDemerit
                  ? '0 4px 12px rgba(235, 43, 75, 0.35)'
                  : '0 4px 12px rgba(146, 102, 255, 0.35)',
              flexShrink: 0,
              position: 'relative',
            }}
          >
            {isMerit ? '+' : ''}{rule.points}
          </Box>
          <Box flexGrow={1} overflow="hidden">
            <Typography variant="body1" sx={{ color: '#F4F4FF', fontWeight: 500 }} noWrap>
              {rule.description}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.8, alignItems: 'center', mt: 0.5, flexWrap: 'wrap' }}>
              <Typography variant="caption" sx={{ color: '#777' }}>
                {rule.type}
              </Typography>
              {rule.access_level && rule.access_level !== 'all' && (
                <Typography
                  variant="caption"
                  sx={{
                    px: 0.8,
                    py: 0.2,
                    borderRadius: 1,
                    backgroundColor: rule.access_level === 'admin' ? 'rgba(235, 43, 75, 0.2)' : 'rgba(146, 102, 255, 0.2)',
                    color: rule.access_level === 'admin' ? '#EB2B4B' : '#9266FF',
                    fontWeight: 600,
                    fontSize: '0.7rem',
                  }}
                >
                  {rule.access_level === 'admin' ? '🔒 Admin Only' : '👨‍🏫 Teacher Only'}
                </Typography>
              )}
              {rule.limit && (
                <Typography
                  variant="caption"
                  sx={{
                    px: 0.8,
                    py: 0.2,
                    borderRadius: 1,
                    backgroundColor: 'rgba(255, 152, 0, 0.2)',
                    color: '#FF9800',
                    fontWeight: 600,
                    fontSize: '0.7rem',
                  }}
                >
                  ⏱ Limit: {rule.limit.max_uses}x ({rule.limit.reset_type === 'until_date' ? `until ${rule.limit.reset_date}` : rule.limit.reset_period})
                </Typography>
              )}
            </Box>
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

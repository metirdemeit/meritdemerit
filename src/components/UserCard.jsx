import {
  Card,
  CardContent,
  Box,
  Typography,
  Avatar,
  IconButton
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';

export default function UserCard({ user, onEdit, onDelete, onClick, showActions = true }) {
  const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`;

  return (
    <Card
      onClick={onClick}
      sx={{
        mb: 1.5,
        background: 'linear-gradient(135deg, #0C0B21 0%, #1A1932 50%, #0E0D2A 100%)',
        border: '1px solid rgba(146, 102, 255, 0.18)',
        borderRadius: 2,
        cursor: 'pointer'
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Box display="flex" alignItems="center">
          <Avatar
            sx={{
              width: 40,
              height: 40,
              mr: 2,
              background: user.points
                ? 'linear-gradient(135deg, #00D377 0%, #00B865 100%)'
                : 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
            }}
          >
            {initials}
          </Avatar>

          <Box flexGrow={1} overflow="hidden">
            <Typography variant="body1" sx={{ color: 'white' }} noWrap>
              {user.first_name} {user.last_name}
            </Typography>
            <Typography variant="body2" sx={{ color: '#5A5984' }} noWrap>
              @{user.username}
              { user.points ? ` • ${user.points || 0} points` : ' • Teacher'}
            </Typography>
          </Box>

          {showActions && (
            <Box display="flex" gap={1}>
              {onEdit && (
                <IconButton 
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }} 
                  sx={{ color: '#9266FF' }}
                >
                  <Edit />
                </IconButton>
              )}
              {onDelete && (
                <IconButton 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }} 
                  sx={{ color: '#EB2B4B' }}
                >
                  <Delete />
                </IconButton>
              )}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}



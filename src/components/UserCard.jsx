import {
  Card,
  CardContent,
  Box,
  Typography,
  Avatar,
  IconButton,
  Chip,
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { getStudentLevel } from '../utils/studentLevels';

export default function UserCard({ user, onEdit, onDelete, onClick, showActions = true }) {
  const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`;
  const isStudent = user.points !== undefined && user.points !== null;
  const level = isStudent ? getStudentLevel(user.points) : null;

  return (
    <Card
      onClick={onClick}
      sx={{
        mb: 1.5,
        background: 'linear-gradient(135deg, #0C0B21 0%, #1A1932 50%, #0E0D2A 100%)',
        border: level ? `1px solid ${level.border}` : '1px solid rgba(146, 102, 255, 0.18)',
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
              background: level 
                ? level.color 
                : 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
              color: '#FFFFFF',
              fontWeight: 700,
            }}
          >
            {initials}
          </Avatar>

          <Box flexGrow={1} overflow="hidden">
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="body1" sx={{ color: 'white', fontWeight: 600 }} noWrap>
                {user.first_name} {user.last_name}
              </Typography>
              {level && (
                <Chip
                  label={level.name}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    backgroundColor: level.bg,
                    color: level.color,
                    border: `1px solid ${level.border}`,
                  }}
                />
              )}
            </Box>
            <Typography variant="body2" sx={{ color: '#5A5984' }} noWrap>
              @{user.username}
              { isStudent ? ` • ${user.points || 0} points` : ' • Teacher'}
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



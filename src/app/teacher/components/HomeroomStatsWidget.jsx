import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Grid,
  Chip,
  Button,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
} from '@mui/material';
import {
  Groups,
  Star,
  WarningAmber,
  CheckCircle,
  School,
  Tune,
} from '@mui/icons-material';

export function HomeroomStatsWidget({
  className,
  classes = [],
  students = [],
  onSelectClass,
  showRiskOnly = false,
  onToggleRiskFilter,
}) {
  const totalStudents = students.length;
  
  // Вычисление ключевых показателей
  const avgPoints = totalStudents > 0
    ? Math.round(students.reduce((acc, s) => acc + (s.points ?? 100), 0) / totalStudents)
    : 0;

  const meritCount = students.filter((s) => (s.points ?? 100) >= 131).length;
  const standardCount = students.filter((s) => (s.points ?? 100) >= 100 && (s.points ?? 100) <= 130).length;
  const demeritCount = students.filter((s) => (s.points ?? 100) < 100).length;

  return (
    <Card
      sx={{
        mb: 3,
        background: 'linear-gradient(135deg, #0E0D2A 0%, #1A1932 50%, #151438 100%)',
        border: '1px solid rgba(146, 102, 255, 0.3)',
        borderRadius: 3,
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        {/* Верхняя строка: Заголовок и выбор класса */}
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1.5} mb={2}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <School sx={{ color: '#9266FF', fontSize: 32 }} />
            <Box>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, lineHeight: 1.2 }}>
                My Homeroom Class {className ? `(${className})` : ''}
              </Typography>
              <Typography variant="caption" sx={{ color: '#b3b3b3' }}>
                Classroom discipline & performance overview
              </Typography>
            </Box>
          </Box>

          {/* Селектор выбора закрепленного класса */}
          {onSelectClass && (
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel sx={{ color: '#5A5984' }}>Homeroom Class</InputLabel>
              <Select
                value={className || ''}
                label="Homeroom Class"
                onChange={(e) => onSelectClass(e.target.value)}
                sx={{
                  color: 'white',
                  '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(146, 102, 255, 0.4)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#9266FF' },
                  '.MuiSvgIcon-root': { color: '#9266FF' },
                }}
              >
                {classes.map((c) => (
                  <MenuItem key={c.id || c.name} value={c.name}>
                    Class {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>

        {/* Сетка метрик */}
        <Grid container spacing={1.5} mb={2}>
          {/* Всего студентов */}
          <Grid item xs={6} sm={3}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                textAlign: 'center',
              }}
            >
              <Groups sx={{ color: '#9266FF', fontSize: 22, mb: 0.5 }} />
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>
                {totalStudents}
              </Typography>
              <Typography variant="caption" sx={{ color: '#5A5984', fontWeight: 600 }}>
                Total Students
              </Typography>
            </Box>
          </Grid>

          {/* Средний балл */}
          <Grid item xs={6} sm={3}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                textAlign: 'center',
              }}
            >
              <Star sx={{ color: avgPoints >= 100 ? '#00D377' : '#FF9800', fontSize: 22, mb: 0.5 }} />
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>
                {avgPoints}
              </Typography>
              <Typography variant="caption" sx={{ color: '#5A5984', fontWeight: 600 }}>
                Average Points
              </Typography>
            </Box>
          </Grid>

          {/* Отличники (Merit) */}
          <Grid item xs={6} sm={3}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                backgroundColor: 'rgba(0, 211, 119, 0.08)',
                border: '1px solid rgba(0, 211, 119, 0.2)',
                textAlign: 'center',
              }}
            >
              <CheckCircle sx={{ color: '#00D377', fontSize: 22, mb: 0.5 }} />
              <Typography variant="h5" sx={{ color: '#00D377', fontWeight: 700 }}>
                {meritCount}
              </Typography>
              <Typography variant="caption" sx={{ color: '#b3b3b3' }}>
                Merit Zone (131+)
              </Typography>
            </Box>
          </Grid>

          {/* Нуждаются в внимании (Demerit) */}
          <Grid item xs={6} sm={3}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                backgroundColor: demeritCount > 0 ? 'rgba(255, 82, 82, 0.12)' : 'rgba(255, 193, 7, 0.08)',
                border: demeritCount > 0 ? '1px solid rgba(255, 82, 82, 0.3)' : '1px solid rgba(255, 193, 7, 0.2)',
                textAlign: 'center',
              }}
            >
              <WarningAmber sx={{ color: demeritCount > 0 ? '#FF5252' : '#FFC107', fontSize: 22, mb: 0.5 }} />
              <Typography variant="h5" sx={{ color: demeritCount > 0 ? '#FF5252' : '#FFC107', fontWeight: 700 }}>
                {demeritCount}
              </Typography>
              <Typography variant="caption" sx={{ color: '#b3b3b3' }}>
                Demerit Risk (&lt;100)
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Быстрые фильтры */}
        {onToggleRiskFilter && (
          <Box display="flex" justifyContent="space-between" alignItems="center" pt={1.5} borderTop="1px solid rgba(255, 255, 255, 0.08)">
            <Typography variant="body2" sx={{ color: '#b3b3b3' }}>
              {showRiskOnly ? 'Showing only students requiring attention (<100 pts)' : 'Showing all class students'}
            </Typography>
            <Button
              size="small"
              variant={showRiskOnly ? 'contained' : 'outlined'}
              color={showRiskOnly ? 'error' : 'primary'}
              startIcon={<Tune />}
              onClick={onToggleRiskFilter}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '0.8rem',
              }}
            >
              {showRiskOnly ? 'Show All Students' : 'Filter Demerit Risk'}
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

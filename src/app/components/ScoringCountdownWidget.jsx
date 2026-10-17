// src/app/components/ScoringCountdownWidget.jsx
import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Chip,
  Paper,
  Stack,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  TimerOutlined,
  CheckCircleOutline,
  LockOutlined,
  HourglassEmpty,
} from '@mui/icons-material';
import { useScoringStore } from '../../store/scoringStore';

export default function ScoringCountdownWidget({ variant = 'default', sx = {} }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { isOpen, deadline, closedReason, fetchStatus, updateStatus } = useScoringStore();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    fetchStatus();
    // Fetch periodically every 30 seconds to stay in sync with other clients/admin
    const syncInterval = setInterval(() => {
      fetchStatus();
    }, 30000);
    return () => clearInterval(syncInterval);
  }, [fetchStatus]);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timeDiff = useMemo(() => {
    if (!deadline || !isOpen) return null;
    const target = new Date(deadline).getTime();
    const diff = target - now;
    return diff > 0 ? diff : 0;
  }, [deadline, isOpen, now]);

  // If deadline reached while open, trigger auto-close locally
  useEffect(() => {
    if (isOpen && deadline && timeDiff === 0) {
      updateStatus({ isOpen: false, deadline: null, closedReason: 'timer_expired' });
    }
  }, [isOpen, deadline, timeDiff, updateStatus]);

  const formattedTime = useMemo(() => {
    if (timeDiff === null) return null;
    const totalSeconds = Math.floor(timeDiff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return {
      days,
      hours: String(hours).padStart(2, '0'),
      minutes: String(minutes).padStart(2, '0'),
      seconds: String(seconds).padStart(2, '0'),
    };
  }, [timeDiff]);

  // State 1: Closed
  if (!isOpen) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2.5,
          borderRadius: 2.5,
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(185, 28, 28, 0.05) 100%)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1.5,
          ...sx,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              color: '#F87171',
            }}
          >
            <LockOutlined />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ color: '#F87171', fontWeight: 700, lineHeight: 1.2 }}>
              Приём баллов закрыт
            </Typography>
            <Typography variant="caption" sx={{ color: '#FCA5A5' }}>
              {closedReason === 'timer_expired'
                ? 'Время выставления баллов истекло по таймеру'
                : 'Выставление баллов приостановлено администратором'}
            </Typography>
          </Box>
        </Stack>
        <Chip
          label="Заблокировано"
          size="small"
          sx={{
            backgroundColor: 'rgba(239, 68, 68, 0.25)',
            color: '#FCA5A5',
            fontWeight: 700,
            border: '1px solid rgba(239, 68, 68, 0.4)',
          }}
        />
      </Paper>
    );
  }

  // State 2: Open with active countdown timer
  if (isOpen && deadline && formattedTime) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2.5,
          borderRadius: 2.5,
          background: 'linear-gradient(135deg, rgba(146, 102, 255, 0.15) 0%, rgba(74, 29, 99, 0.25) 100%)',
          border: '1px solid rgba(146, 102, 255, 0.4)',
          boxShadow: '0 8px 32px rgba(146, 102, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          ...sx,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(146, 102, 255, 0.25)',
              color: '#B794FF',
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%': { transform: 'scale(1)', opacity: 1 },
                '50%': { transform: 'scale(1.05)', opacity: 0.8 },
                '100%': { transform: 'scale(1)', opacity: 1 },
              },
            }}
          >
            <TimerOutlined />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ color: '#F4F4FF', fontWeight: 700, lineHeight: 1.2 }}>
              Приём баллов активен
            </Typography>
            <Typography variant="caption" sx={{ color: '#A5A4C4' }}>
              До окончания срока выставления баллов:
            </Typography>
          </Box>
        </Stack>

        {/* Countdown units */}
        <Stack direction="row" spacing={1} alignItems="center">
          {formattedTime.days > 0 && (
            <CountdownBox value={formattedTime.days} label="дн" />
          )}
          <CountdownBox value={formattedTime.hours} label="час" />
          <Typography sx={{ color: '#9266FF', fontWeight: 800, fontSize: '1.2rem' }}>:</Typography>
          <CountdownBox value={formattedTime.minutes} label="мин" />
          <Typography sx={{ color: '#9266FF', fontWeight: 800, fontSize: '1.2rem' }}>:</Typography>
          <CountdownBox value={formattedTime.seconds} label="сек" isHighlight />
        </Stack>
      </Paper>
    );
  }

  // State 3: Open indefinitely (no deadline set)
  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        px: 2,
        mb: 2.5,
        borderRadius: 2.5,
        background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(16, 185, 129, 0.03) 100%)',
        border: '1px solid rgba(34, 197, 94, 0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 1.5,
        ...sx,
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(34, 197, 94, 0.2)',
            color: '#4ADE80',
          }}
        >
          <CheckCircleOutline sx={{ fontSize: 20 }} />
        </Box>
        <Box>
          <Typography variant="body2" sx={{ color: '#4ADE80', fontWeight: 700 }}>
            Приём баллов открыт
          </Typography>
          <Typography variant="caption" sx={{ color: '#86EFAC' }}>
            Таймер не установлен (бессрочно)
          </Typography>
        </Box>
      </Stack>
      <Chip
        label="Активно"
        size="small"
        sx={{
          backgroundColor: 'rgba(34, 197, 94, 0.2)',
          color: '#86EFAC',
          fontWeight: 600,
        }}
      />
    </Paper>
  );
}

function CountdownBox({ value, label, isHighlight = false }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minWidth: 42,
        p: 0.5,
        borderRadius: 1.5,
        backgroundColor: isHighlight ? 'rgba(146, 102, 255, 0.25)' : 'rgba(255, 255, 255, 0.06)',
        border: isHighlight ? '1px solid rgba(146, 102, 255, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <Typography
        sx={{
          color: isHighlight ? '#C4A8FF' : '#FFFFFF',
          fontWeight: 800,
          fontSize: '1.1rem',
          fontFamily: 'monospace',
          lineHeight: 1.1,
        }}
      >
        {value}
      </Typography>
      <Typography
        sx={{
          color: '#8C8AA8',
          fontSize: '0.65rem',
          fontWeight: 600,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

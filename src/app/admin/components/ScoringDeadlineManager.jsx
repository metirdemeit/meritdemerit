// src/app/admin/components/ScoringDeadlineManager.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Stack,
  TextField,
  Chip,
  Grid,
  Alert,
  Divider,
} from '@mui/material';
import {
  Timer,
  Lock,
  LockOpen,
  Schedule,
  CheckCircle,
  WarningAmber,
  AlarmOn,
  HourglassEmpty,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { useScoringStore } from '../../../store/scoringStore';

export default function ScoringDeadlineManager() {
  const {
    isOpen,
    deadline,
    closedReason,
    fetchStatus,
    setTimerDeadline,
    closeImmediately,
    openIndefinitely,
    loading,
  } = useScoringStore();

  const [inputDate, setInputDate] = useState('');
  const [inputTime, setInputTime] = useState('');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Keep live time ticking for preview
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Prepopulate datetime inputs when deadline changes
  useEffect(() => {
    if (deadline) {
      const d = new Date(deadline);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      setInputDate(`${yyyy}-${mm}-${dd}`);
      setInputTime(`${hh}:${min}`);
    } else {
      // Default to today 23:59
      const d = new Date();
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      setInputDate(`${yyyy}-${mm}-${dd}`);
      setInputTime('23:59');
    }
  }, [deadline]);

  // Quick preset helper
  const applyPresetHours = (hours) => {
    const target = new Date(Date.now() + hours * 60 * 60 * 1000);
    const yyyy = target.getFullYear();
    const mm = String(target.getMonth() + 1).padStart(2, '0');
    const dd = String(target.getDate()).padStart(2, '0');
    const hh = String(target.getHours()).padStart(2, '0');
    const min = String(target.getMinutes()).padStart(2, '0');
    setInputDate(`${yyyy}-${mm}-${dd}`);
    setInputTime(`${hh}:${min}`);
  };

  const applyPresetEndOfDay = () => {
    const target = new Date();
    const yyyy = target.getFullYear();
    const mm = String(target.getMonth() + 1).padStart(2, '0');
    const dd = String(target.getDate()).padStart(2, '0');
    setInputDate(`${yyyy}-${mm}-${dd}`);
    setInputTime('23:59');
  };

  const handleSaveTimer = async () => {
    if (!inputDate || !inputTime) {
      toast.error('Пожалуйста, укажите дату и время');
      return;
    }
    const [year, month, day] = inputDate.split('-').map(Number);
    const [hours, minutes] = inputTime.split(':').map(Number);
    const selectedDate = new Date(year, month - 1, day, hours, minutes, 0, 0);

    if (selectedDate.getTime() <= Date.now()) {
      toast.error('Время дедлайна должно быть в будущем!');
      return;
    }

    try {
      await setTimerDeadline(selectedDate);
      toast.success('Таймер приёма баллов успешно запущен!');
    } catch {
      toast.error('Не удалось сохранить таймер');
    }
  };

  const handleCloseNow = async () => {
    try {
      await closeImmediately('manual');
      toast.success('Приём баллов мгновенно закрыт!');
    } catch {
      toast.error('Не удалось закрыть приём баллов');
    }
  };

  const handleOpenIndefinitely = async () => {
    try {
      await openIndefinitely();
      toast.success('Приём баллов открыт бессрочно!');
    } catch {
      toast.error('Не удалось открыть приём баллов');
    }
  };

  // Remaining time calculation
  const remaining = useMemo(() => {
    if (!deadline || !isOpen) return null;
    const diff = new Date(deadline).getTime() - now;
    if (diff <= 0) return 'Время истекло';
    const totalSec = Math.floor(diff / 1000);
    const d = Math.floor(totalSec / 86400);
    const h = Math.floor((totalSec % 86400) / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const parts = [];
    if (d > 0) parts.push(`${d} дн.`);
    parts.push(`${h} ч.`);
    parts.push(`${m} мин.`);
    parts.push(`${s} сек.`);
    return parts.join(' ');
  }, [deadline, isOpen, now]);

  return (
    <Card
      sx={{
        background: 'linear-gradient(135deg, #0C0B21 0%, #1A1932 50%, #0E0D2A 100%)',
        backdropFilter: 'blur(10px)',
        borderRadius: 2.5,
        border: '1px solid rgba(146, 102, 255, 0.25)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        mt: 2,
        overflow: 'hidden',
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Title & Current Status Badge */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
          flexWrap="wrap"
          gap={1.5}
          mb={3}
        >
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #9266FF 0%, #6932EB 100%)',
                color: '#fff',
                boxShadow: '0 4px 14px rgba(146, 102, 255, 0.4)',
              }}
            >
              <Timer sx={{ fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
                Управление таймером приёма баллов
              </Typography>
              <Typography variant="body2" sx={{ color: '#8C8AA8' }}>
                Ограничение срока выставления баллов учителями по всей школе
              </Typography>
            </Box>
          </Box>

          {/* Status Badge */}
          {isOpen ? (
            deadline ? (
              <Chip
                icon={<HourglassEmpty sx={{ '&&': { color: '#FCD34D' } }} />}
                label="Активен таймер"
                sx={{
                  backgroundColor: 'rgba(245, 158, 11, 0.2)',
                  color: '#FCD34D',
                  fontWeight: 700,
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  px: 1,
                }}
              />
            ) : (
              <Chip
                icon={<CheckCircle sx={{ '&&': { color: '#4ADE80' } }} />}
                label="Открыт (Бессрочно)"
                sx={{
                  backgroundColor: 'rgba(34, 197, 94, 0.2)',
                  color: '#4ADE80',
                  fontWeight: 700,
                  border: '1px solid rgba(34, 197, 94, 0.4)',
                  px: 1,
                }}
              />
            )
          ) : (
            <Chip
              icon={<Lock sx={{ '&&': { color: '#F87171' } }} />}
              label="Приём закрыт"
              sx={{
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                color: '#F87171',
                fontWeight: 700,
                border: '1px solid rgba(239, 68, 68, 0.4)',
                px: 1,
              }}
            />
          )}
        </Box>

        {/* Current State Info Banner */}
        <Box
          sx={{
            p: 2,
            mb: 3,
            borderRadius: 2,
            backgroundColor: isOpen
              ? deadline
                ? 'rgba(146, 102, 255, 0.08)'
                : 'rgba(34, 197, 94, 0.08)'
              : 'rgba(239, 68, 68, 0.08)',
            border: `1px solid ${
              isOpen
                ? deadline
                  ? 'rgba(146, 102, 255, 0.25)'
                  : 'rgba(34, 197, 94, 0.25)'
                : 'rgba(239, 68, 68, 0.25)'
            }`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1.5,
          }}
        >
          <Box>
            <Typography variant="body2" sx={{ color: '#C4A8FF', fontWeight: 600 }}>
              {isOpen
                ? deadline
                  ? `Дедлайн: ${new Date(deadline).toLocaleString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}`
                  : 'Приём баллов активен без ограничения по времени'
                : 'Выставление баллов заблокировано для всех учителей'}
            </Typography>
            {isOpen && deadline && (
              <Typography variant="caption" sx={{ color: '#F4F4FF' }}>
                Осталось времени:{' '}
                <strong style={{ color: '#FCD34D', fontSize: '0.95rem' }}>{remaining}</strong>
              </Typography>
            )}
            {!isOpen && (
              <Typography variant="caption" sx={{ color: '#FCA5A5' }}>
                Причина закрытия:{' '}
                {closedReason === 'timer_expired'
                  ? 'Истёк срок по таймеру'
                  : 'Приостановлено администратором вручную'}
              </Typography>
            )}
          </Box>

          {/* Quick Immediate Action Button */}
          {isOpen ? (
            <Button
              variant="contained"
              color="error"
              size="small"
              startIcon={<Lock />}
              onClick={handleCloseNow}
              disabled={loading}
              sx={{
                borderRadius: 1.5,
                fontWeight: 700,
                textTransform: 'none',
                boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)',
              }}
            >
              Закрыть приём прямо сейчас
            </Button>
          ) : (
            <Button
              variant="contained"
              color="success"
              size="small"
              startIcon={<LockOpen />}
              onClick={handleOpenIndefinitely}
              disabled={loading}
              sx={{
                borderRadius: 1.5,
                fontWeight: 700,
                textTransform: 'none',
                boxShadow: '0 4px 14px rgba(34, 197, 94, 0.3)',
              }}
            >
              Открыть приём бессрочно
            </Button>
          )}
        </Box>

        <Divider sx={{ borderColor: 'rgba(146, 102, 255, 0.15)', mb: 3 }} />

        {/* Form to Configure New Deadline */}
        <Typography variant="subtitle2" sx={{ color: '#FFFFFF', fontWeight: 700, mb: 1 }}>
          Настройка нового таймера (дедлайна)
        </Typography>
        <Typography variant="caption" sx={{ color: '#8C8AA8', display: 'block', mb: 2 }}>
          Укажите точную дату и время или воспользуйтесь быстрыми кнопками ниже:
        </Typography>

        {/* Quick presets */}
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2.5 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={applyPresetEndOfDay}
            sx={presetBtnStyle}
          >
            Сегодня до 23:59
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => applyPresetHours(2)}
            sx={presetBtnStyle}
          >
            +2 часа
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => applyPresetHours(6)}
            sx={presetBtnStyle}
          >
            +6 часов
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => applyPresetHours(24)}
            sx={presetBtnStyle}
          >
            +24 часа
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => applyPresetHours(48)}
            sx={presetBtnStyle}
          >
            +2 дня
          </Button>
        </Stack>

        {/* Inputs */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="date"
              label="Дата дедлайна"
              InputLabelProps={{ shrink: true }}
              value={inputDate}
              onChange={(e) => setInputDate(e.target.value)}
              sx={fieldStyle}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="time"
              label="Время окончания"
              InputLabelProps={{ shrink: true }}
              value={inputTime}
              onChange={(e) => setInputTime(e.target.value)}
              sx={fieldStyle}
            />
          </Grid>
        </Grid>

        {/* Action Controls */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Button
            variant="contained"
            startIcon={<AlarmOn />}
            onClick={handleSaveTimer}
            disabled={loading}
            sx={{
              flex: 1,
              height: 48,
              borderRadius: 2,
              fontWeight: 700,
              textTransform: 'none',
              background: 'linear-gradient(135deg, #9266FF 0%, #6932EB 100%)',
              boxShadow: '0 4px 16px rgba(146, 102, 255, 0.4)',
              '&:hover': {
                background: 'linear-gradient(135deg, #8152FF 0%, #5824DB 100%)',
              },
            }}
          >
            Запустить таймер приёма баллов
          </Button>

          <Button
            variant="outlined"
            startIcon={<LockOpen />}
            onClick={handleOpenIndefinitely}
            disabled={loading}
            sx={{
              height: 48,
              borderRadius: 2,
              fontWeight: 600,
              textTransform: 'none',
              borderColor: 'rgba(146, 102, 255, 0.4)',
              color: '#F4F4FF',
              '&:hover': {
                borderColor: '#9266FF',
                backgroundColor: 'rgba(146, 102, 255, 0.1)',
              },
            }}
          >
            Открыть без таймера
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

const presetBtnStyle = {
  borderColor: 'rgba(146, 102, 255, 0.3)',
  color: '#C4A8FF',
  borderRadius: 1.5,
  fontSize: '0.8rem',
  textTransform: 'none',
  fontWeight: 600,
  '&:hover': {
    borderColor: '#9266FF',
    backgroundColor: 'rgba(146, 102, 255, 0.15)',
    color: '#FFFFFF',
  },
};

const fieldStyle = {
  '& .MuiOutlinedInput-root': {
    color: '#F4F4FF',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 2,
    '& fieldset': {
      borderColor: 'rgba(146, 102, 255, 0.3)',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(146, 102, 255, 0.6)',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#9266FF',
    },
  },
  '& .MuiInputLabel-root': {
    color: '#8C8AA8',
    '&.Mui-focused': {
      color: '#9266FF',
    },
  },
};

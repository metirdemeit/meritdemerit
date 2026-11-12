import { useMemo } from 'react';
import { Box, Card, CardContent, LinearProgress, Typography } from '@mui/material';
import { TrendingUp } from '@mui/icons-material';
import { getStudentLevel, STUDENT_LEVELS } from '../../../utils/studentLevels';
import { pointsSeries } from '../../../utils/progress';

// Levels from lowest to highest, by their minimum points.
const LADDER = Object.values(STUDENT_LEVELS)
  .map((l) => ({ ...l, min: Number.isFinite(l.min) ? l.min : -Infinity }))
  .sort((a, b) => a.min - b.min);

function Sparkline({ series, color }) {
  const W = 300;
  const H = 70;
  const PAD = 6;
  const values = series.map((p) => p.value);
  const min = Math.min(...values, 100);
  const max = Math.max(...values, 100);
  const span = Math.max(max - min, 1);
  const x = (i) => PAD + (i * (W - PAD * 2)) / Math.max(series.length - 1, 1);
  const y = (v) => PAD + (H - PAD * 2) * (1 - (v - min) / span);
  const line = series.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  const area = `${line} L${x(series.length - 1).toFixed(1)},${H - PAD} L${x(0).toFixed(1)},${H - PAD} Z`;
  const last = series[series.length - 1];
  const y100 = y(100);

  return (
    <Box
      component="svg"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={`Points went from ${series[0].value} to ${last.value}`}
      sx={{ width: '100%', height: 70, display: 'block' }}
    >
      <defs>
        <linearGradient id="spark-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* 100 = start of the Standard level */}
      <line x1={PAD} x2={W - PAD} y1={y100} y2={y100} stroke="rgba(255,255,255,0.18)" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
      <path d={area} fill="url(#spark-fill)" />
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <circle cx={x(series.length - 1)} cy={y(last.value)} r="4" fill={color} stroke="#0C0B21" strokeWidth="2" />
    </Box>
  );
}

export default function StudentProgress({ points, history }) {
  const level = getStudentLevel(points);
  const idx = LADDER.findIndex((l) => l.key === level.key);
  const next = LADDER[idx + 1];
  const series = useMemo(() => pointsSeries(points, history), [points, history]);

  const merits = (history || []).filter((h) => h.points_changed > 0).reduce((s, h) => s + h.points_changed, 0);
  const demerits = (history || []).filter((h) => h.points_changed < 0).reduce((s, h) => s + h.points_changed, 0);

  const floor = Number.isFinite(level.min) ? level.min : Math.min(points, 0);
  const progress = next ? Math.max(0, Math.min(100, ((points - floor) / (next.min - floor)) * 100)) : 100;
  const toStandard = points < 100 ? 100 - points : 0;

  return (
    <Card
      data-tour="student-progress"
      sx={{
        background: 'linear-gradient(135deg, #0C0B21 0%, #1A1932 50%, #0E0D2A 100%)',
        borderRadius: 2,
        border: '1px solid rgba(146, 102, 255, 0.2)',
        mb: 3,
      }}
    >
      <CardContent sx={{ display: 'grid', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrendingUp sx={{ color: '#9266FF' }} />
          <Typography variant="h6" sx={{ color: '#F4F4FF', fontWeight: 500 }}>Your progress</Typography>
        </Box>

        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 1, mb: 1 }}>
            <Typography sx={{ color: '#F4F4FF', fontWeight: 600 }}>
              {next ? (
                <>
                  <Box component="span" sx={{ color: next.color }}>{next.min - points}</Box> points to {next.name}
                </>
              ) : (
                'Top level reached 🎉'
              )}
            </Typography>
            <Typography variant="caption" sx={{ color: '#8E8DAA', whiteSpace: 'nowrap' }}>
              {level.name}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            aria-label={next ? `Progress to ${next.name}` : 'Top level'}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: 'rgba(255,255,255,0.08)',
              '& .MuiLinearProgress-bar': { backgroundColor: level.color, borderRadius: 4 },
            }}
          />
          {toStandard > 0 && next?.key !== 'standard' && (
            <Typography variant="body2" sx={{ color: '#A9A7C8', mt: 1 }}>
              {toStandard} points to get back to the Standard level.
            </Typography>
          )}
        </Box>

        {series.length > 1 && (
          <Box>
            <Sparkline series={series} color={level.color} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#7D7BA0', fontSize: '0.75rem', mt: 0.5, fontVariantNumeric: 'tabular-nums' }}>
              <span>{series[0].value}</span>
              <span>dashed line = 100</span>
              <span>{series[series.length - 1].value}</span>
            </Box>
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Box sx={{ flex: 1, p: 1.25, borderRadius: 1.5, background: 'rgba(0, 211, 119, 0.08)', border: '1px solid rgba(0, 211, 119, 0.25)' }}>
            <Typography variant="caption" sx={{ color: '#8E8DAA' }}>Merits this term</Typography>
            <Typography sx={{ color: '#00D377', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>+{merits}</Typography>
          </Box>
          <Box sx={{ flex: 1, p: 1.25, borderRadius: 1.5, background: 'rgba(235, 43, 75, 0.08)', border: '1px solid rgba(235, 43, 75, 0.25)' }}>
            <Typography variant="caption" sx={{ color: '#8E8DAA' }}>Demerits this term</Typography>
            <Typography sx={{ color: '#FF5A6A', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{demerits}</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

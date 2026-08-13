import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Grid,
  IconButton,
  Tooltip,
  Alert,
  Checkbox,
  FormControlLabel,
  CircularProgress,
} from '@mui/material';
import {
  WarningAmber,
  School,
  Psychology,
  CheckCircle,
  Delete,
  NotificationsActive,
} from '@mui/icons-material';
import { useInterventionStore } from '../../../store/interventionStore';
import { useAdminStore } from '../../../store/adminStore';
import toast from 'react-hot-toast';

// Определить уровень вмешательства по баллам
function getInterventionLevel(points) {
  if (points >= 21 && points <= 30) return 'counselor';
  if (points >= 31 && points <= 40) return 'homeroom';
  if (points >= 41 && points <= 50) return 'warning';
  return null;
}

function getInterventionMeta(level) {
  if (level === 'warning') return {
    label: '41-50 pts: Formal Written Warning',
    desc: 'Student points dropped into 41-50 range. A formal written warning and explanation are required.',
    badgeBg: 'rgba(255, 152, 0, 0.2)', badgeColor: '#FF9800', borderColor: 'rgba(255, 152, 0, 0.5)',
    Icon: WarningAmber,
  };
  if (level === 'homeroom') return {
    label: '31-40 pts: Homeroom Intervention',
    desc: 'Student points dropped into 31-40 range. Homeroom teacher action required: cause analysis, parent notification log, corrective plan.',
    badgeBg: 'rgba(146, 102, 255, 0.2)', badgeColor: '#9266FF', borderColor: 'rgba(146, 102, 255, 0.5)',
    Icon: School,
  };
  return {
    label: '21-30 pts: Counselor Intervention',
    desc: 'Student points dropped into 21-30 range. Mandatory counselor meeting with parents required.',
    badgeBg: 'rgba(235, 43, 75, 0.2)', badgeColor: '#FF5252', borderColor: 'rgba(235, 43, 75, 0.6)',
    Icon: Psychology,
  };
}

export default function InterventionsManager() {
  const { interventions, fetchInterventions, addIntervention, toggleParentNotified, resolveIntervention, deleteIntervention } = useInterventionStore();
  const { students, fetchStudents } = useAdminStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchStudents(true), fetchInterventions()]);
      setLoading(false);
    };
    load();
  }, [fetchStudents, fetchInterventions]);

  // Автоматически создаём алерты для студентов с баллами 21-50
  // Не дублируем: проверяем по student_id
  useEffect(() => {
    if (!students || students.length === 0) return;
    students.forEach((s) => {
      const pts = s.points ?? 100;
      const level = getInterventionLevel(pts);
      if (!level) return;
      const name = `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.username;
      // Проверяем: нет ли уже pending алерта для этого студента этого уровня
      const already = interventions.find(
        (i) => String(i.student_id) === String(s.id) && i.level === level && i.status === 'pending'
      );
      if (!already) {
        const meta = getInterventionMeta(level);
        addIntervention({
          student_id: s.id,
          student_name: name,
          class_name: s.class_name || 'N/A',
          points: pts,
          level,
          title: meta.label,
          description: meta.desc,
        });
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students]);

  const allAlerts = interventions;
  const pendingList = allAlerts.filter((i) => i.status === 'pending');

  return (
    <Box sx={{ mt: 1 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
          Interventions & Alerts ({pendingList.length} active)
        </Typography>
        <Chip
          icon={<NotificationsActive sx={{ color: '#FF9800 !important' }} />}
          label={`${pendingList.length} Active`}
          sx={{ backgroundColor: 'rgba(255, 152, 0, 0.15)', color: '#FF9800', border: '1px solid rgba(255, 152, 0, 0.4)' }}
        />
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress sx={{ color: '#9266FF' }} />
        </Box>
      ) : allAlerts.length === 0 ? (
        <Card sx={{ background: 'linear-gradient(135deg, #0C0B21 0%, #1A1932 50%, #0E0D2A 100%)', p: 3, textAlign: 'center' }}>
          <CheckCircle sx={{ fontSize: 48, color: '#00D377', mb: 1 }} />
          <Typography variant="body1" sx={{ color: 'white', fontWeight: 600 }}>No intervention alerts!</Typography>
          <Typography variant="body2" sx={{ color: '#b3b3b3' }}>
            All students are above 50 points. Alerts appear automatically when a student's points drop below 50.
          </Typography>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {allAlerts.map((item) => {
            const meta = getInterventionMeta(item.level);
            const IconComp = meta.Icon;
            return (
              <Grid item xs={12} key={item.id}>
                <Card sx={{
                  background: 'linear-gradient(135deg, #0C0B21 0%, #1A1932 50%, #0E0D2A 100%)',
                  border: `1px solid ${meta.borderColor}`,
                  borderRadius: 2,
                  opacity: item.status === 'resolved' ? 0.55 : 1,
                }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                        <IconComp sx={{ color: meta.badgeColor, fontSize: 28 }} />
                        <Box>
                          <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 600 }}>
                            {item.student_name} ({item.class_name}) — {item.points} pts
                          </Typography>
                          <Chip
                            label={meta.label}
                            size="small"
                            sx={{ backgroundColor: meta.badgeBg, color: meta.badgeColor, border: `1px solid ${meta.badgeColor}`, mt: 0.5, height: 20, fontSize: '0.7rem' }}
                          />
                        </Box>
                      </Box>
                      <Box display="flex" gap={0.5}>
                        {item.status === 'pending' ? (
                          <Button size="small" variant="outlined" startIcon={<CheckCircle />}
                            onClick={() => { resolveIntervention(item.id); toast.success('Alert resolved'); }}
                            sx={{ color: '#00D377', borderColor: 'rgba(0,211,119,0.4)', textTransform: 'none', py: 0.2 }}>
                            Resolve
                          </Button>
                        ) : (
                          <Chip label="Resolved" size="small" color="success" />
                        )}
                        <IconButton size="small" onClick={() => deleteIntervention(item.id)} sx={{ color: '#EB2B4B' }}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#b3b3b3', mt: 1 }}>{item.description}</Typography>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mt={2} pt={1} borderTop="1px solid rgba(255,255,255,0.08)">
                      <FormControlLabel
                        control={
                          <Checkbox checked={item.parent_notified} onChange={() => { toggleParentNotified(item.id); toast.success('Parent notification status updated'); }}
                            sx={{ color: '#9266FF', '&.Mui-checked': { color: '#00D377' } }} />
                        }
                        label={<Typography variant="caption" sx={{ color: item.parent_notified ? '#00D377' : '#b3b3b3' }}>Parents Notified ({item.parent_notified ? 'Yes' : 'No'})</Typography>}
                      />
                      <Typography variant="caption" sx={{ color: '#5A5984' }}>
                        Alerted: {new Date(item.created_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}

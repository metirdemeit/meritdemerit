import React from 'react';
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
} from '@mui/material';
import {
  WarningAmber,
  School,
  Psychology,
  CheckCircle,
  Delete,
  NotificationsActive,
  MarkEmailRead,
} from '@mui/icons-material';
import { useInterventionStore } from '../../../store/interventionStore';
import toast from 'react-hot-toast';

export default function InterventionsManager() {
  const {
    interventions,
    toggleParentNotified,
    resolveIntervention,
    deleteIntervention,
  } = useInterventionStore();

  const pendingList = interventions.filter((i) => i.status === 'pending');

  return (
    <Box sx={{ mt: 1 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
          Interventions & Alerts ({pendingList.length} active)
        </Typography>
        <Chip
          icon={<NotificationsActive sx={{ color: '#FF9800 !important' }} />}
          label={`${pendingList.length} Notifications`}
          sx={{ backgroundColor: 'rgba(255, 152, 0, 0.15)', color: '#FF9800', border: '1px solid rgba(255, 152, 0, 0.4)' }}
        />
      </Box>

      {interventions.length === 0 ? (
        <Card sx={{ background: 'linear-gradient(135deg, #0C0B21 0%, #1A1932 50%, #0E0D2A 100%)', p: 3, textAlign: 'center' }}>
          <CheckCircle sx={{ fontSize: 48, color: '#00D377', mb: 1 }} />
          <Typography variant="body2" sx={{ color: '#b3b3b3' }}>
            No pending intervention alerts.
          </Typography>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {interventions.map((item) => {
            const isWarning = item.level === 'warning';
            const isHomeroom = item.level === 'homeroom';
            const isCounselor = item.level === 'counselor';

            const borderColor = isWarning
              ? 'rgba(255, 152, 0, 0.5)'
              : isHomeroom
              ? 'rgba(146, 102, 255, 0.5)'
              : 'rgba(235, 43, 75, 0.6)';

            const badgeBg = isWarning
              ? 'rgba(255, 152, 0, 0.2)'
              : isHomeroom
              ? 'rgba(146, 102, 255, 0.2)'
              : 'rgba(235, 43, 75, 0.2)';

            const badgeColor = isWarning ? '#FF9800' : isHomeroom ? '#9266FF' : '#FF5252';

            const IconComp = isWarning ? WarningAmber : isHomeroom ? School : Psychology;

            return (
              <Grid item xs={12} key={item.id}>
                <Card
                  sx={{
                    background: 'linear-gradient(135deg, #0C0B21 0%, #1A1932 50%, #0E0D2A 100%)',
                    border: `1px solid ${borderColor}`,
                    borderRadius: 2,
                    opacity: item.status === 'resolved' ? 0.6 : 1,
                  }}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                        <IconComp sx={{ color: badgeColor, fontSize: 28 }} />
                        <Box>
                          <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 600 }}>
                            {item.student_name} ({item.class_name}) — {item.points} pts
                          </Typography>
                          <Chip
                            label={
                              isWarning
                                ? '41-50 pts: Formal Written Warning'
                                : isHomeroom
                                ? '31-40 pts: Homeroom Intervention'
                                : '21-30 pts: Counselor Intervention'
                            }
                            size="small"
                            sx={{ backgroundColor: badgeBg, color: badgeColor, border: `1px solid ${badgeColor}`, mt: 0.5, height: 20, fontSize: '0.7rem' }}
                          />
                        </Box>
                      </Box>

                      <Box display="flex" gap={0.5}>
                        {item.status === 'pending' ? (
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<CheckCircle />}
                            onClick={() => {
                              resolveIntervention(item.id);
                              toast.success('Alert resolved');
                            }}
                            sx={{ color: '#00D377', borderColor: 'rgba(0,211,119,0.4)', textTransform: 'none', py: 0.2 }}
                          >
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

                    <Typography variant="body2" sx={{ color: '#b3b3b3', mt: 1 }}>
                      {item.description}
                    </Typography>

                    {/* Галочка "Parents Notified" для админа/классрука */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mt={2} pt={1} borderTop="1px solid rgba(255,255,255,0.08)">
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={item.parent_notified}
                            onChange={() => {
                              toggleParentNotified(item.id);
                              toast.success('Parent notification status updated');
                            }}
                            sx={{ color: '#9266FF', '&.Mui-checked': { color: '#00D377' } }}
                          />
                        }
                        label={
                          <Typography variant="caption" sx={{ color: item.parent_notified ? '#00D377' : '#b3b3b3' }}>
                            Parents Notified ({item.parent_notified ? 'Yes' : 'No'})
                          </Typography>
                        }
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

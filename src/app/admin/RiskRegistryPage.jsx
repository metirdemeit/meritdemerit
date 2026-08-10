import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Avatar,
  CircularProgress,
} from '@mui/material';
import { Report, CheckCircle } from '@mui/icons-material';
import { useDetentionStore } from '../../store/detentionStore';
import { useInterventionStore } from '../../store/interventionStore';
import { useAdminStore } from '../../store/adminStore';
import { getStudentLevel } from '../../utils/studentLevels';

export default function RiskRegistryPage() {
  const { detentions, getStudentDetentionCount } = useDetentionStore();
  const { interventions } = useInterventionStore();
  const { students, fetchStudents } = useAdminStore();

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchStudents();
      setLoading(false);
    };
    load();
  }, [fetchStudents]);

  // Фильтруем РЕАЛЬНЫХ студентов в группе риска (< 100 баллов или с детеншнами)
  const riskStudents = (students || [])
    .map((s) => {
      const studentName = `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.username;
      const pts = s.points !== undefined && s.points !== null ? s.points : 100;
      const detCount = getStudentDetentionCount(s.id) || getStudentDetentionCount(studentName);
      const studentInterventions = interventions.filter(
        (i) => String(i.student_id) === String(s.id) || i.student_name === studentName
      );
      return {
        id: s.id,
        name: studentName,
        class: s.class_name || s.class || 'N/A',
        points: pts,
        detentions: detCount,
        warningsCount: studentInterventions.filter((i) => i.level === 'warning').length,
        interventionsCount: studentInterventions.filter((i) => i.level !== 'warning').length,
      };
    })
    .filter((s) => s.points < 100 || s.detentions > 0 || s.warningsCount > 0 || s.interventionsCount > 0);

  // Студенты на перезачисление (≥ 3 детеншнов)
  const reenrollmentList = riskStudents.filter((s) => s.detentions >= 3);

  return (
    <Box sx={{ mt: 1 }}>
      {/* 1. Отчет для Перезачисления (End of Academic Year Report) */}
      <Card
        sx={{
          mb: 3,
          background: 'linear-gradient(135deg, #2A091A 0%, #1A0D2A 100%)',
          border: '1px solid rgba(235, 43, 75, 0.4)',
          borderRadius: 2,
        }}
      >
        <CardContent sx={{ p: 2.5 }}>
          <Box display="flex" alignItems="center" gap={1.5} mb={1}>
            <Report sx={{ color: '#FF5252', fontSize: 32 }} />
            <Box>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
                End of Academic Year Report (Re-enrollment Review)
              </Typography>
              <Typography variant="body2" sx={{ color: '#b3b3b3' }}>
                Students with 3+ detentions during the academic year requiring administrative decision.
              </Typography>
            </Box>
          </Box>

          {reenrollmentList.length === 0 ? (
            <Alert severity="success" sx={{ mt: 1, backgroundColor: 'rgba(0, 211, 119, 0.1)', color: '#00D377' }}>
              No students currently flagged for re-enrollment review (0 students with 3+ detentions).
            </Alert>
          ) : (
            <Box sx={{ mt: 2 }}>
              {reenrollmentList.map((s) => (
                <Box
                  key={s.id}
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{
                    p: 1.5,
                    mb: 1,
                    borderRadius: 1,
                    backgroundColor: 'rgba(211, 47, 47, 0.2)',
                    border: '1px solid #D32F2F',
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Avatar sx={{ bgcolor: '#D32F2F', width: 36, height: 36 }}>
                      {s.name[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 700 }}>
                        {s.name} ({s.class})
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#FF8A80' }}>
                        Current Points: {s.points} | Detentions: {s.detentions}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    label="Re-enrollment Review Required"
                    size="small"
                    color="error"
                    sx={{ fontWeight: 700 }}
                  />
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* 2. Risk Registry (Реестр группы риска) */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
          Risk Registry ({riskStudents.length} students)
        </Typography>
      </Box>

      <Card
        sx={{
          background: 'linear-gradient(135deg, #0C0B21 0%, #1A1932 50%, #0E0D2A 100%)',
          borderRadius: 2,
          border: '1px solid rgba(146, 102, 255, 0.2)',
          mb: 3,
        }}
      >
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress sx={{ color: '#9266FF' }} />
            </Box>
          ) : riskStudents.length === 0 ? (
            <Box textAlign="center" py={4}>
              <CheckCircle sx={{ fontSize: 48, color: '#00D377', mb: 1 }} />
              <Typography variant="body1" sx={{ color: 'white', fontWeight: 600 }}>
                No students in risk zone!
              </Typography>
              <Typography variant="body2" sx={{ color: '#b3b3b3' }}>
                All registered students are currently above 100 points.
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} sx={{ backgroundColor: 'transparent', boxShadow: 'none' }}>
              <Table size="small">
                <TableHead sx={{ backgroundColor: 'rgba(146, 102, 255, 0.1)' }}>
                  <TableRow>
                    <TableCell sx={{ color: '#9266FF', fontWeight: 600 }}>Student / Class</TableCell>
                    <TableCell sx={{ color: '#9266FF', fontWeight: 600 }}>Level & Status</TableCell>
                    <TableCell sx={{ color: '#9266FF', fontWeight: 600 }}>Detentions</TableCell>
                    <TableCell sx={{ color: '#9266FF', fontWeight: 600 }}>Active Alerts</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {riskStudents.map((s) => {
                    const lvl = getStudentLevel(s.points);
                    return (
                      <TableRow key={s.id} sx={{ '&:hover': { backgroundColor: 'rgba(146, 102, 255, 0.05)' } }}>
                        <TableCell sx={{ color: 'white' }}>
                          <Typography variant="body2" fontWeight={600}>
                            {s.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#5A5984' }}>
                            Class: {s.class}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={`${lvl.name} (${s.points} pts)`}
                            size="small"
                            sx={{
                              backgroundColor: lvl.bg,
                              color: lvl.color,
                              border: `1px solid ${lvl.border}`,
                              fontWeight: 700,
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: '#FF5252', fontWeight: 700 }}>
                          {s.detentions} detentions
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={`${s.warningsCount} warnings / ${s.interventionsCount} interventions`}
                            size="small"
                            sx={{ backgroundColor: 'rgba(255, 152, 0, 0.15)', color: '#FF9800' }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

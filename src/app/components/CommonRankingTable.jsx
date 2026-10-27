import React, { useState, useEffect, useMemo } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  TableFooter, 
  Button,
  ButtonGroup,
  Box,
  Typography,
  Chip,
  Paper,
  Stack,
  Tooltip,
} from '@mui/material';
import { 
  Visibility, 
  Groups, 
  School, 
  EmojiEvents, 
  TrackChanges,
  Stars,
} from '@mui/icons-material';
import { useCommonStore } from '../../store/commonStore';
import { useAuthStore } from '../../store/authStore';

/**
 * Determine grade group from ranking item.
 * Class IDs 1-6 → grades 6,7,8 (group "6-8")
 * Class IDs 7+  → grades 9,10,11,12 (group "9-12")
 * Falls back to parsing class name string.
 */
function getGradeGroup(ranking) {
  if (!ranking) return '6-8';

  // Try by class name string first (most reliable)
  const possibleNames = [
    ranking.class_name,
    typeof ranking.school_class === 'string' ? ranking.school_class : ranking.school_class?.name,
    ranking.school_class_name,
    ranking.student?.class_name,
    typeof ranking.student?.school_class === 'string'
      ? ranking.student.school_class
      : ranking.student?.school_class?.name,
  ];

  for (const name of possibleNames) {
    if (!name) continue;
    const match = String(name).trim().match(/\d+/);
    if (match) {
      const num = parseInt(match[0], 10);
      if (num >= 9 && num <= 12) return '9-12';
      if (num >= 6 && num <= 8)  return '6-8';
    }
  }

  // Fallback by DB class ID: 1-6 = 6A..8B, 7+ = 9A..12B
  const classId =
    ranking.class_id ||
    ranking.school_class_id ||
    (typeof ranking.school_class === 'number' ? ranking.school_class : ranking.school_class?.id) ||
    (typeof ranking.student?.school_class === 'number'
      ? ranking.student.school_class
      : ranking.student?.school_class?.id);

  if (typeof classId === 'number' && classId > 0) {
    return classId >= 7 ? '9-12' : '6-8';
  }

  return '6-8';
}

export default function CommonRankingTable({ rankings = [] }) {
  const [showFull, setShowFull] = useState(false);
  const [activeGroup, setActiveGroup] = useState('6-8');
  const { user } = useAuthStore();
  const { allStudents, fetchAllStudents, students, classRankings, fetchClassRankings } = useCommonStore();

  useEffect(() => {
    if (!allStudents || allStudents.length < 50) {
      fetchAllStudents();
    }
    if (!classRankings || classRankings.length === 0) {
      fetchClassRankings();
    }
  }, [fetchAllStudents, fetchClassRankings, allStudents, classRankings]);

  const rankingsList = Array.isArray(rankings) ? rankings : [];

  // Merge full student roster with rankings to guarantee every student is included with latest points
  const fullRoster = (Array.isArray(allStudents) && allStudents.length > 0)
    ? allStudents
    : (Array.isArray(students) ? students : []);

  const studentMap = new Map();
  fullRoster.forEach((s) => {
    if (s?.id) studentMap.set(s.id, { ...s });
  });

  rankingsList.forEach((r) => {
    const id = r?.id || r?.student_id || r?.student?.id;
    if (id && studentMap.has(id)) {
      const existing = studentMap.get(id);
      studentMap.set(id, {
        ...existing,
        ...r,
        points: r.total_points ?? r.points ?? existing.points,
      });
    } else if (id) {
      studentMap.set(id, { ...r });
    }
  });

  const allStudentsList = studentMap.size > 0 ? Array.from(studentMap.values()) : rankingsList;

  const sortByPoints = (list) =>
    [...list].sort((a, b) => {
      const ptsA = Number(a?.total_points ?? a?.points ?? 0);
      const ptsB = Number(b?.total_points ?? b?.points ?? 0);
      if (ptsB !== ptsA) return ptsB - ptsA;
      return Number(a?.id || 0) - Number(b?.id || 0);
    });

  const group6to8  = useMemo(() => sortByPoints(allStudentsList.filter((s) => getGradeGroup(s) === '6-8')), [allStudentsList]);
  const group9to12 = useMemo(() => sortByPoints(allStudentsList.filter((s) => getGradeGroup(s) === '9-12')), [allStudentsList]);
  const classesList = Array.isArray(classRankings) ? classRankings : [];

  const isClassesTab = activeGroup === 'classes';
  const currentList = isClassesTab
    ? classesList
    : activeGroup === '6-8'
    ? group6to8
    : group9to12;

  // Auto-switch group tab to student's own group if student logged in
  useEffect(() => {
    if (user?.role === 'student') {
      const userGroup = getGradeGroup(user);
      if (userGroup && (userGroup === '6-8' || userGroup === '9-12')) {
        setActiveGroup(userGroup);
      }
    }
  }, [user]);

  // Current logged in student rank computation
  const myRankInfo = useMemo(() => {
    if (!user || user.role !== 'student' || isClassesTab) return null;
    const currentId = user.id;
    const index = currentList.findIndex((item) => String(item.id) === String(currentId));
    if (index === -1) return null;

    const myItem = currentList[index];
    const myRank = index + 1;
    const prevItem = index > 0 ? currentList[index - 1] : null;

    let pointsToOvertake = null;
    let targetStudentName = null;
    if (prevItem) {
      const prevPoints = Number(prevItem?.total_points ?? prevItem?.points ?? 0);
      const myPoints = Number(myItem?.total_points ?? myItem?.points ?? 0);
      pointsToOvertake = (prevPoints - myPoints) + 1; // +1 point to overtake
      targetStudentName = `${prevItem.first_name || ''} ${prevItem.last_name || ''}`.trim() || 'лидера';
    }

    return {
      rank: myRank,
      points: Number(myItem?.total_points ?? myItem?.points ?? 0),
      prevItem,
      pointsToOvertake,
      targetStudentName,
      isTop10: myRank <= 10,
    };
  }, [user, currentList, isClassesTab]);

  const displayItems = showFull ? currentList : currentList.slice(0, 10);
  const hasMore      = currentList.length > 10;

  const btnSx = (active) => ({
    py: 1,
    fontSize: { xs: '0.75rem', sm: '0.85rem' },
    fontWeight: 600,
    color: active ? '#F4F4FF' : '#5A5984',
    background: active ? 'linear-gradient(135deg, #9266FF 0%, #6932EB 100%)' : 'transparent',
    borderColor: 'rgba(146, 102, 255, 0.3)',
  });

  return (
    <Box>
      {/* Category Toggle Tabs */}
      <ButtonGroup fullWidth size="small" variant="contained" sx={{ mb: 2 }}>
        <Button
          startIcon={<Groups />}
          variant={activeGroup === '6-8' ? 'contained' : 'outlined'}
          onClick={() => { setActiveGroup('6-8'); setShowFull(false); }}
          sx={btnSx(activeGroup === '6-8')}
        >
          6–8 классы
        </Button>
        <Button
          startIcon={<Groups />}
          variant={activeGroup === '9-12' ? 'contained' : 'outlined'}
          onClick={() => { setActiveGroup('9-12'); setShowFull(false); }}
          sx={btnSx(activeGroup === '9-12')}
        >
          9–12 классы
        </Button>
        <Button
          startIcon={<School />}
          variant={activeGroup === 'classes' ? 'contained' : 'outlined'}
          onClick={() => { setActiveGroup('classes'); setShowFull(false); }}
          sx={btnSx(activeGroup === 'classes')}
        >
          Рейтинг классов
        </Button>
      </ButtonGroup>

      {/* Sticky My Rank Banner with Target Distance for Students */}
      {myRankInfo && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2.5,
            borderRadius: 2.5,
            background: 'linear-gradient(135deg, rgba(146, 102, 255, 0.2) 0%, rgba(105, 50, 235, 0.1) 100%)',
            border: '1px solid rgba(146, 102, 255, 0.45)',
            boxShadow: '0 6px 24px rgba(146, 102, 255, 0.15)',
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1.5}>
            <Stack direction="row" spacing={1.5} alignItems="center">
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
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  boxShadow: '0 4px 12px rgba(146, 102, 255, 0.4)',
                }}
              >
                #{myRankInfo.rank}
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ color: '#F4F4FF', fontWeight: 700 }}>
                  Ваша позиция в рейтинге
                </Typography>
                <Typography variant="caption" sx={{ color: '#C4A8FF', display: 'block' }}>
                  Баллы: <strong style={{ color: '#FFFFFF' }}>{myRankInfo.points}</strong>
                  {myRankInfo.isTop10 && ' · Вы в Топ-10 школы! 🔥'}
                </Typography>
              </Box>
            </Stack>

            {/* Target Distance Indicator */}
            {myRankInfo.pointsToOvertake !== null && myRankInfo.pointsToOvertake > 0 && (
              <Box
                sx={{
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 2,
                  backgroundColor: 'rgba(0, 211, 119, 0.12)',
                  border: '1px solid rgba(0, 211, 119, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <TrackChanges sx={{ color: '#00D377', fontSize: 18 }} />
                <Typography variant="caption" sx={{ color: '#E4FBEF', fontWeight: 600 }}>
                  До #{myRankInfo.rank - 1} места ({myRankInfo.targetStudentName}):{' '}
                  <strong style={{ color: '#00D377', fontSize: '0.85rem' }}>+{myRankInfo.pointsToOvertake} б.</strong>
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>
      )}

      <TableContainer sx={{ background: 'transparent', boxShadow: 'none' }}>
        <Table size="small">
          <TableHead>
            {isClassesTab ? (
              <TableRow>
                <TableCell sx={{ color: '#b3b3b3', borderColor: 'rgba(255,255,255,0.1)', width: 48 }}>#</TableCell>
                <TableCell sx={{ color: '#b3b3b3', borderColor: 'rgba(255,255,255,0.1)' }}>Класс</TableCell>
                <TableCell sx={{ color: '#b3b3b3', borderColor: 'rgba(255,255,255,0.1)', width: 110, textAlign: 'right' }}>
                  Средний балл
                </TableCell>
              </TableRow>
            ) : (
              <TableRow>
                <TableCell sx={{ color: '#b3b3b3', borderColor: 'rgba(255,255,255,0.1)', width: 48 }}>#</TableCell>
                <TableCell sx={{ color: '#b3b3b3', borderColor: 'rgba(255,255,255,0.1)' }}>Ученик</TableCell>
                <TableCell sx={{ color: '#b3b3b3', borderColor: 'rgba(255,255,255,0.1)', width: 65 }}>Баллы</TableCell>
                <TableCell sx={{ color: '#b3b3b3', borderColor: 'rgba(255,255,255,0.1)', width: 56 }}>Класс</TableCell>
              </TableRow>
            )}
          </TableHead>
          <TableBody>
            {displayItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isClassesTab ? 3 : 4} sx={{ color: '#5A5984', textAlign: 'center', py: 4, border: 0 }}>
                  Нет данных
                </TableCell>
              </TableRow>
            ) : isClassesTab ? (
              displayItems.map((item, index) => {
                return (
                  <TableRow key={item.class_id || item.class_name || index}>
                    <TableCell sx={{ color: '#F4F4FF', fontWeight: 600, borderColor: 'rgba(255,255,255,0.06)' }}>
                      {index + 1}
                    </TableCell>
                    <TableCell sx={{ color: '#F4F4FF', fontWeight: 600, borderColor: 'rgba(255,255,255,0.06)' }}>
                      {item.class_name || '-'}
                    </TableCell>
                    <TableCell sx={{ color: '#00D377', fontWeight: 700, borderColor: 'rgba(255,255,255,0.06)', textAlign: 'right' }}>
                      {typeof item.average_points === 'number'
                        ? item.average_points.toFixed(1)
                        : (item.average_points || 0)}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              displayItems.map((ranking, index) => {
                const isMe = user?.id && String(ranking.id) === String(user.id);

                return (
                  <TableRow 
                    key={ranking.id || index}
                    sx={isMe ? {
                      backgroundColor: 'rgba(146, 102, 255, 0.12)',
                      outline: '1px solid rgba(146, 102, 255, 0.4)',
                    } : {}}
                  >
                    <TableCell sx={{ color: isMe ? '#C4A8FF' : '#F4F4FF', fontWeight: 700, borderColor: 'rgba(255,255,255,0.06)' }}>
                      {index + 1}
                    </TableCell>
                    <TableCell sx={{ color: isMe ? '#FFFFFF' : '#F4F4FF', fontWeight: isMe ? 700 : 400, borderColor: 'rgba(255,255,255,0.06)' }}>
                      {ranking?.first_name} {ranking?.last_name}
                      {isMe && (
                        <Chip
                          label="Вы"
                          size="small"
                          sx={{
                            ml: 1,
                            height: 18,
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            backgroundColor: 'rgba(146, 102, 255, 0.3)',
                            color: '#FFFFFF',
                            border: '1px solid rgba(146, 102, 255, 0.6)',
                          }}
                        />
                      )}
                    </TableCell>
                    <TableCell sx={{ color: '#9266FF', fontWeight: 700, borderColor: 'rgba(255,255,255,0.06)' }}>
                      {ranking?.total_points ?? ranking?.points ?? 0}
                    </TableCell>
                    <TableCell sx={{ color: '#b3b3b3', borderColor: 'rgba(255,255,255,0.06)' }}>
                      {ranking?.class_name ||
                        (typeof ranking?.school_class === 'string'
                          ? ranking.school_class
                          : ranking?.school_class?.name) ||
                        '-'}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
          {hasMore && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={isClassesTab ? 3 : 4} sx={{ border: 0, textAlign: 'center', py: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<Visibility />}
                    onClick={() => setShowFull(!showFull)}
                    sx={{
                      borderColor: 'rgba(146, 102, 255, 0.5)',
                      color: '#9266FF',
                      '&:hover': {
                        borderColor: '#9266FF',
                        backgroundColor: 'rgba(146, 102, 255, 0.1)',
                      },
                    }}
                  >
                    {showFull ? 'Свернуть' : 'Показать всех'}
                  </Button>
                </TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </TableContainer>
    </Box>
  );
}

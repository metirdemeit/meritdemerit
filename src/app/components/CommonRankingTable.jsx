import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import { Visibility, Groups, School } from '@mui/icons-material';
import { useCommonStore } from '../../store/commonStore';

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
  const { allStudents, fetchAllStudents, students, fetchStudents, classRankings, fetchClassRankings } = useCommonStore();

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
      return ptsB - ptsA;
    });

  const group6to8  = sortByPoints(allStudentsList.filter((s) => getGradeGroup(s) === '6-8'));
  const group9to12 = sortByPoints(allStudentsList.filter((s) => getGradeGroup(s) === '9-12'));
  const classesList = Array.isArray(classRankings) ? classRankings : [];

  const isClassesTab = activeGroup === 'classes';
  const currentList = isClassesTab
    ? classesList
    : activeGroup === '6-8'
    ? group6to8
    : group9to12;

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

      <TableContainer sx={{ background: 'transparent', boxShadow: 'none' }}>
        <Table size="small">
          <TableHead>
            {isClassesTab ? (
              <TableRow>
                <TableCell sx={{ color: '#b3b3b3', borderColor: 'rgba(255,255,255,0.1)', width: 40 }}>#</TableCell>
                <TableCell sx={{ color: '#b3b3b3', borderColor: 'rgba(255,255,255,0.1)' }}>Класс</TableCell>
                <TableCell sx={{ color: '#b3b3b3', borderColor: 'rgba(255,255,255,0.1)', width: 90, textAlign: 'right' }}>
                  Средний балл
                </TableCell>
              </TableRow>
            ) : (
              <TableRow>
                <TableCell sx={{ color: '#b3b3b3', borderColor: 'rgba(255,255,255,0.1)', width: 40 }}>#</TableCell>
                <TableCell sx={{ color: '#b3b3b3', borderColor: 'rgba(255,255,255,0.1)' }}>Ученик</TableCell>
                <TableCell sx={{ color: '#b3b3b3', borderColor: 'rgba(255,255,255,0.1)', width: 60 }}>Баллы</TableCell>
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
              displayItems.map((item, index) => (
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
              ))
            ) : (
              displayItems.map((ranking, index) => (
                <TableRow key={ranking.id || index}>
                  <TableCell sx={{ color: '#F4F4FF', fontWeight: 600, borderColor: 'rgba(255,255,255,0.06)' }}>
                    {index + 1}
                  </TableCell>
                  <TableCell sx={{ color: '#F4F4FF', borderColor: 'rgba(255,255,255,0.06)' }}>
                    {ranking?.first_name} {ranking?.last_name}
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
              ))
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

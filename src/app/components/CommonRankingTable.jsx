import React, { useState } from 'react';
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
import { Visibility, Groups } from '@mui/icons-material';
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
  const { students } = useCommonStore();

  const rankingsList = Array.isArray(rankings) ? rankings : [];

  let group6to8  = rankingsList.filter((item) => getGradeGroup(item) === '6-8');
  let group9to12 = rankingsList.filter((item) => getGradeGroup(item) === '9-12');

  // If a group is empty in the top-N list, fall back to full student list sorted by points
  const fallback = (group, label) => {
    if (group.length === 0 && Array.isArray(students) && students.length > 0) {
      return students
        .filter((s) => getGradeGroup(s) === label)
        .sort((a, b) => (b.points || b.total_points || 0) - (a.points || a.total_points || 0));
    }
    return group;
  };

  group6to8  = fallback(group6to8,  '6-8');
  group9to12 = fallback(group9to12, '9-12');

  const currentGroupList = activeGroup === '6-8' ? group6to8 : group9to12;
  const displayRankings  = showFull ? currentGroupList : currentGroupList.slice(0, 10);
  const hasMore          = currentGroupList.length > 10;

  const btnSx = (active) => ({
    py: 1,
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
      </ButtonGroup>

      <TableContainer sx={{ background: 'transparent', boxShadow: 'none' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: '#b3b3b3', borderColor: 'rgba(255,255,255,0.1)', width: 40 }}>#</TableCell>
              <TableCell sx={{ color: '#b3b3b3', borderColor: 'rgba(255,255,255,0.1)' }}>Ученик</TableCell>
              <TableCell sx={{ color: '#b3b3b3', borderColor: 'rgba(255,255,255,0.1)', width: 60 }}>Баллы</TableCell>
              <TableCell sx={{ color: '#b3b3b3', borderColor: 'rgba(255,255,255,0.1)', width: 56 }}>Класс</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayRankings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} sx={{ color: '#5A5984', textAlign: 'center', py: 4, border: 0 }}>
                  Нет данных
                </TableCell>
              </TableRow>
            ) : (
              displayRankings.map((ranking, index) => (
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
                <TableCell colSpan={4} sx={{ border: 0, textAlign: 'center', py: 2 }}>
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

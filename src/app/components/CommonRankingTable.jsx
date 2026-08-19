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
  Typography
} from '@mui/material';
import { Visibility, Groups } from '@mui/icons-material';
import { useCommonStore } from '../../store/commonStore';

function getGradeGroup(ranking) {
  if (!ranking) return '6-8';

  const possibleNames = [
    ranking.class_name,
    typeof ranking.school_class === 'string' ? ranking.school_class : ranking.school_class?.name,
    ranking.school_class_name,
    ranking.student?.class_name,
    typeof ranking.student?.school_class === 'string' ? ranking.student?.school_class : ranking.student?.school_class?.name,
    ranking.name,
  ];

  for (const name of possibleNames) {
    if (!name) continue;
    const str = String(name).trim();
    const match = str.match(/\d+/);
    if (match) {
      const num = parseInt(match[0], 10);
      if (num >= 9 && num <= 12) return '9-12';
      if (num >= 1 && num <= 8) return '6-8';
    }
  }

  const classId = ranking.class_id || 
                  ranking.school_class_id || 
                  (typeof ranking.school_class === 'number' ? ranking.school_class : ranking.school_class?.id) ||
                  (typeof ranking.student?.school_class === 'number' ? ranking.student?.school_class : ranking.student?.school_class?.id);

  if (typeof classId === 'number' && classId > 0) {
    if (classId >= 7) return '9-12';
    if (classId <= 6) return '6-8';
  }

  return '6-8';
}

export default function CommonRankingTable({ rankings = [] }) {
  const [showFull, setShowFull] = useState(false);
  const [activeGroup, setActiveGroup] = useState('6-8');
  const { students } = useCommonStore();
  
  const rankingsList = Array.isArray(rankings) ? rankings : [];

  let group6to8 = rankingsList.filter((item) => getGradeGroup(item) === '6-8');
  let group9to12 = rankingsList.filter((item) => getGradeGroup(item) === '9-12');

  // Fallback: If 9-12 is empty in top ranking list, pull from full student list
  if (group9to12.length === 0 && Array.isArray(students) && students.length > 0) {
    group9to12 = students
      .filter((item) => getGradeGroup(item) === '9-12')
      .sort((a, b) => (b.points || b.total_points || 0) - (a.points || a.total_points || 0));
  }

  // Fallback: If 6-8 is empty in top ranking list, pull from full student list
  if (group6to8.length === 0 && Array.isArray(students) && students.length > 0) {
    group6to8 = students
      .filter((item) => getGradeGroup(item) === '6-8')
      .sort((a, b) => (b.points || b.total_points || 0) - (a.points || a.total_points || 0));
  }

  const currentGroupList = activeGroup === '6-8' ? group6to8 : group9to12;
  const displayRankings = showFull ? currentGroupList : currentGroupList.slice(0, 10);
  const hasMore = currentGroupList.length > 10;

  return (
    <Box>
      {/* Category Toggle Tabs */}
      <ButtonGroup fullWidth size="small" variant="contained" sx={{ mb: 2 }}>
        <Button
          startIcon={<Groups />}
          variant={activeGroup === '6-8' ? 'contained' : 'outlined'}
          onClick={() => {
            setActiveGroup('6-8');
            setShowFull(false);
          }}
          sx={{
            py: 1,
            fontWeight: 600,
            color: activeGroup === '6-8' ? '#F4F4FF' : '#5A5984',
            background: activeGroup === '6-8' ? 'linear-gradient(135deg, #9266FF 0%, #6932EB 100%)' : 'transparent',
            borderColor: 'rgba(146, 102, 255, 0.3)',
          }}
        >
          6-8 классы ({group6to8.length})
        </Button>
        <Button
          startIcon={<Groups />}
          variant={activeGroup === '9-12' ? 'contained' : 'outlined'}
          onClick={() => {
            setActiveGroup('9-12');
            setShowFull(false);
          }}
          sx={{
            py: 1,
            fontWeight: 600,
            color: activeGroup === '9-12' ? '#F4F4FF' : '#5A5984',
            background: activeGroup === '9-12' ? 'linear-gradient(135deg, #9266FF 0%, #6932EB 100%)' : 'transparent',
            borderColor: 'rgba(146, 102, 255, 0.3)',
          }}
        >
          9-12 классы ({group9to12.length})
        </Button>
      </ButtonGroup>

      <TableContainer sx={{ background: 'transparent', boxShadow: 'none' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: '#b3b3b3', borderColor: 'rgba(255,255,255,0.1)' }}>
                Место
              </TableCell>
              <TableCell sx={{ color: '#b3b3b3', borderColor: 'rgba(255,255,255,0.1)' }}>
                Ученик
              </TableCell>
              <TableCell sx={{ color: '#b3b3b3', borderColor: 'rgba(255,255,255,0.1)' }}>
                Баллы
              </TableCell>
              <TableCell sx={{ color: '#b3b3b3', borderColor: 'rgba(255,255,255,0.1)' }}>
                Класс
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayRankings.map((ranking, index) => (
              <TableRow key={ranking.id || index}>
                <TableCell sx={{ color: '#F4F4FF', fontWeight: 600 }}>
                  {index + 1}
                </TableCell>
                <TableCell sx={{ color: '#F4F4FF' }}>
                  {ranking?.first_name} {ranking?.last_name}
                </TableCell>
                <TableCell sx={{ color: '#9266FF', fontWeight: 600 }}>
                  {ranking?.total_points ?? ranking?.points ?? 0}
                </TableCell>
                <TableCell sx={{ color: '#b3b3b3' }}>
                  {ranking?.class_name || (typeof ranking?.school_class === 'string' ? ranking?.school_class : ranking?.school_class?.name) || '-'}
                </TableCell>
              </TableRow>
            ))}
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
                        backgroundColor: 'rgba(146, 102, 255, 0.1)'
                      }
                    }}
                  >
                    {showFull ? 'Свернуть' : `Показать всех (${currentGroupList.length})`}
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

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
  Box
} from '@mui/material';
import { Visibility, Groups } from '@mui/icons-material';

function getGradeGroup(ranking) {
  const className = ranking?.class_name || ranking?.school_class?.name || '';
  const match = className.match(/\d+/);
  if (match) {
    const gradeNum = parseInt(match[0], 10);
    if (gradeNum >= 6 && gradeNum <= 8) return '6-8';
    if (gradeNum >= 9 && gradeNum <= 12) return '9-12';
  }
  return '6-8';
}

export default function CommonRankingTable({ rankings = [] }) {
  const [showFull, setShowFull] = useState(false);
  const [activeGroup, setActiveGroup] = useState('6-8');
  
  const rankingsList = Array.isArray(rankings) ? rankings : [];

  const group6to8 = rankingsList.filter((item) => getGradeGroup(item) === '6-8');
  const group9to12 = rankingsList.filter((item) => getGradeGroup(item) === '9-12');

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
                  {ranking?.class_name || ranking?.school_class?.name || '-'}
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

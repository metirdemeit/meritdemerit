import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  TableFooter, 
  Button,
  Box
} from '@mui/material';
import { Visibility } from '@mui/icons-material';

export default function CommonRankingTable({ rankings = [] }) {
  const [showFull, setShowFull] = useState(false);
  
  const displayRankings = showFull ? rankings : rankings.slice(0, 10);
  const hasMore = rankings.length > 10;

  return (
    <TableContainer sx={{ background: 'transparent', boxShadow: 'none' }}>
      <Table >
        <TableHead>
          <TableRow>
            <TableCell sx={{ color: '#b3b3b3', borderColor: 'rgba(255,255,255,0.1)' }}>
              Rank
            </TableCell>
            <TableCell sx={{ color: '#b3b3b3', borderColor: 'rgba(255,255,255,0.1)' }}>
              Student
            </TableCell>
            <TableCell sx={{ color: '#b3b3b3', borderColor: 'rgba(255,255,255,0.1)' }}>
              Points
            </TableCell>
            <TableCell sx={{ color: '#b3b3b3', borderColor: 'rgba(255,255,255,0.1)' }}>
              Class
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {displayRankings.map((ranking, index) => (
            <TableRow key={ranking.id}>
              <TableCell >
                {index + 1}
              </TableCell>
              <TableCell >
                {ranking?.first_name} {ranking?.last_name}
              </TableCell>
              <TableCell >
                {ranking?.total_points || ranking?.points}
              </TableCell>
              <TableCell >
                {ranking?.class_name || ranking?.school_class?.name}
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
                  {showFull ? 'Hide' : `Show All (${rankings.length})`}
                </Button>
              </TableCell>
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </TableContainer>
  );
}

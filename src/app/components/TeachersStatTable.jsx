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

export default function TeachersStatTable({ teachersStats = [] }) {
  const [showFull, setShowFull] = useState(false);
  
  const displayStats = showFull ? teachersStats : teachersStats.slice(0, 10);
  const hasMore = teachersStats.length > 10;

  return (
    <TableContainer sx={{ background: 'transparent', boxShadow: 'none' }}>
      <Table>
        <TableHead  >
          <TableRow >
            <TableCell sx={{ color: '#b3b3b3' , borderColor: 'rgba(255,255,255,0.1)' }}>
              Teacher ID
            </TableCell>
            <TableCell sx={{ color: '#b3b3b3' , borderColor: 'rgba(255,255,255,0.1)' }}>
              Teacher
            </TableCell>
            <TableCell sx={{ color: '#b3b3b3' , borderColor: 'rgba(255,255,255,0.1)' }}>
              Merits
            </TableCell>
            <TableCell sx={{ color: '#b3b3b3' , borderColor: 'rgba(255,255,255,0.1)' }}>
              Demerits
            </TableCell>
            <TableCell sx={{ color: '#b3b3b3' , borderColor: 'rgba(255,255,255,0.1)' }}>
              Total 
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {displayStats.map((teacherStat, index) => (
            <TableRow key={teacherStat.teacher_id}>
              <TableCell >
                {teacherStat.teacher_id}
              </TableCell>
              <TableCell >
                {`${teacherStat.first_name} ${teacherStat.last_name}`}
              </TableCell>
              <TableCell >
                {teacherStat.positive_assignments}
              </TableCell>
              <TableCell >
                {teacherStat.negative_assignments}
              </TableCell>
              <TableCell >
                {teacherStat.total_students_affected}
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
                  {showFull ? 'Hide' : `Show All (${teachersStats.length})`}
                </Button>
              </TableCell>
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </TableContainer>
  );
}

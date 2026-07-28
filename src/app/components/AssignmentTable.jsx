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
  TablePagination,
  IconButton,
  Box,
  Chip
} from '@mui/material';

import { Delete } from '@mui/icons-material';

export default function AssignmentTable({ 
  assignments = [], 
  onDelete,
  isLoading = false 
}) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPointsColor = (points) => {
    if (points > 0) return '#4caf50';
    if (points < 0) return '#f44336';
    return '#666';
  };

  const paginatedAssignments = assignments.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <TableContainer sx={{ background: 'transparent', boxShadow: 'none' }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ color: '#b3b3b3', borderColor: 'rgba(255,255,255,0.1)' }}>
              Student
            </TableCell>
            <TableCell sx={{ color: '#b3b3b3', borderColor: 'rgba(255,255,255,0.1)' }}>
              Teacher
            </TableCell>
            <TableCell sx={{ color: '#b3b3b3', borderColor: 'rgba(255,255,255,0.1)' }}>
              Rule
            </TableCell>
            <TableCell sx={{ color: '#b3b3b3', borderColor: 'rgba(255,255,255,0.1)' }}>
              Comment
            </TableCell>
            <TableCell sx={{ color: '#b3b3b3', borderColor: 'rgba(255,255,255,0.1)' }}>
              Points
            </TableCell>
            <TableCell sx={{ color: '#b3b3b3', borderColor: 'rgba(255,255,255,0.1)' }}>
              Date
            </TableCell>
            {onDelete && (
              <TableCell sx={{ color: '#b3b3b3', borderColor: 'rgba(255,255,255,0.1)' }}>
                Actions
              </TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedAssignments.map((assignment) => (
            <TableRow key={assignment.id}>
              <TableCell >
                {assignment.student_name}
              </TableCell>
              <TableCell >
                {assignment.teacher_name}
              </TableCell>
              <TableCell >
                {assignment.rule_description}
              </TableCell>
              <TableCell >
                {assignment.comment}
              </TableCell>
              <TableCell sx={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                <Chip
                  label={`${assignment.points_changed > 0 ? '+' : ''}${assignment.points_changed}`}
                  size="small"
                  sx={{
                    backgroundColor: getPointsColor(assignment.points_changed),
                    color: '#ffffff',
                    fontWeight: 500
                  }}
                />
              </TableCell>
              <TableCell sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.1)' }}>
                {formatDate(assignment.created_at)}
              </TableCell>
              {onDelete && (
                <TableCell sx={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                  <IconButton
                    size="small"
                    onClick={() => onDelete(assignment)}
                    sx={{ color: '#f44336' }}
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TablePagination
              rowsPerPageOptions={[10, 20, 50]}
              colSpan={onDelete ? 7 : 6}
              count={assignments.length}
              rowsPerPage={rowsPerPage}
              page={page}
              SelectProps={{
                inputProps: {
                  'aria-label': 'rows per page',
                },
                native: true,
              }}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{ 
                border: 0,
                color: '#b3b3b3',
                '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                  color: '#b3b3b3'
                }
              }}
            />
          </TableRow>
        </TableFooter>
      </Table>
    </TableContainer>
  );
}
import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Box,
  Chip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Delete } from '@mui/icons-material';

const BORDER = 'rgba(255,255,255,0.1)';
const headCell = { color: '#b3b3b3', borderColor: BORDER };
const bodyCell = { color: 'white', borderColor: BORDER };

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const pointsColor = (points) => {
  if (points > 0) return '#4caf50';
  if (points < 0) return '#f44336';
  return '#666';
};

function PointsChip({ points }) {
  return (
    <Chip
      label={`${points > 0 ? '+' : ''}${points}`}
      size="small"
      sx={{ backgroundColor: pointsColor(points), color: '#ffffff', fontWeight: 700, border: 0, flexShrink: 0 }}
    />
  );
}

/** One history entry as a card: used on phones instead of a wide table. */
function AssignmentCard({ assignment, showStudent, onDelete }) {
  const actor = assignment.teacher_name || assignment.role || '—';
  return (
    <Box
      component="li"
      sx={{
        listStyle: 'none',
        p: 1.75,
        borderRadius: 2,
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${BORDER}`,
        borderLeft: `3px solid ${pointsColor(assignment.points_changed)}`,
        display: 'grid',
        gap: 0.75,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          {showStudent && (
            <Typography sx={{ color: '#fff', fontWeight: 600, lineHeight: 1.3 }}>
              {assignment.student_name}
              {assignment.student_class && (
                <Typography component="span" sx={{ color: '#8E8DAA', fontSize: '0.85rem', ml: 0.75 }}>
                  {assignment.student_class}
                </Typography>
              )}
            </Typography>
          )}
          <Typography sx={{ color: showStudent ? '#C9C7E8' : '#fff', fontWeight: showStudent ? 400 : 600, lineHeight: 1.35 }}>
            {assignment.rule_description}
          </Typography>
        </Box>
        <PointsChip points={assignment.points_changed} />
      </Box>

      {assignment.comment && (
        <Typography sx={{ color: '#A9A7C8', fontSize: '0.9rem', lineHeight: 1.45, wordBreak: 'break-word' }}>
          “{assignment.comment}”
        </Typography>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#7D7BA0', fontSize: '0.8rem' }}>
        <Box component="span" sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {actor} · {formatDate(assignment.created_at)}
        </Box>
        {onDelete && (
          <IconButton
            size="small"
            aria-label={`Delete entry: ${assignment.rule_description}`}
            onClick={() => onDelete(assignment)}
            sx={{ color: '#f44336', ml: 'auto', mr: -0.75 }}
          >
            <Delete fontSize="small" />
          </IconButton>
        )}
      </Box>
    </Box>
  );
}

export default function AssignmentTable({ assignments = [], onDelete }) {
  const theme = useTheme();
  const compact = useMediaQuery(theme.breakpoints.down('md'));
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    setPage(0);
  }, [assignments]);

  const assignmentList = Array.isArray(assignments) ? assignments : (assignments?.items || []);

  // Teacher/admin views carry student_name; a student's own history does not.
  const hasStudentName = assignmentList.some((a) => a.student_name !== undefined && a.student_name !== null);

  const paginated = assignmentList.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const keyOf = (a) => `${a.source || 'teacher'}-${a.id}`;

  const pagination = (
    <TablePagination
      component="div"
      rowsPerPageOptions={compact ? [10, 25, 50] : [10, 25, 50, 100, 500]}
      count={assignmentList.length}
      rowsPerPage={rowsPerPage}
      page={page}
      labelRowsPerPage={compact ? 'Rows:' : 'Rows per page:'}
      SelectProps={{ inputProps: { 'aria-label': 'rows per page' }, native: true }}
      onPageChange={(_, p) => setPage(p)}
      onRowsPerPageChange={(e) => {
        setRowsPerPage(parseInt(e.target.value, 10));
        setPage(0);
      }}
      sx={{
        border: 0,
        color: '#b3b3b3',
        '& .MuiTablePagination-toolbar': { px: 0, flexWrap: 'wrap', justifyContent: 'flex-end' },
        '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': { color: '#b3b3b3' },
        '& .MuiTablePagination-actions button': { color: '#b3b3b3' },
      }}
    />
  );

  if (compact) {
    return (
      <Box>
        <Box component="ul" sx={{ m: 0, p: 0, display: 'grid', gap: 1.25 }}>
          {paginated.map((a) => (
            <AssignmentCard key={keyOf(a)} assignment={a} showStudent={hasStudentName} onDelete={onDelete} />
          ))}
        </Box>
        {assignmentList.length > 10 && pagination}
      </Box>
    );
  }

  return (
    <TableContainer sx={{ background: 'transparent', boxShadow: 'none' }}>
      <Table>
        <TableHead>
          <TableRow>
            {hasStudentName && <TableCell sx={headCell}>Student</TableCell>}
            <TableCell sx={headCell}>Teacher</TableCell>
            <TableCell sx={headCell}>Rule</TableCell>
            <TableCell sx={headCell}>Comment</TableCell>
            <TableCell sx={headCell}>Points</TableCell>
            <TableCell sx={headCell}>Date</TableCell>
            {onDelete && <TableCell sx={headCell}>Actions</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {paginated.map((a) => (
            <TableRow key={keyOf(a)}>
              {hasStudentName && <TableCell sx={bodyCell}>{a.student_name}</TableCell>}
              <TableCell sx={bodyCell}>{a.teacher_name || a.role || '—'}</TableCell>
              <TableCell sx={bodyCell}>{a.rule_description}</TableCell>
              <TableCell sx={bodyCell}>{a.comment}</TableCell>
              <TableCell sx={{ borderColor: BORDER }}><PointsChip points={a.points_changed} /></TableCell>
              <TableCell sx={bodyCell}>{formatDate(a.created_at)}</TableCell>
              {onDelete && (
                <TableCell sx={{ borderColor: BORDER }}>
                  <IconButton size="small" aria-label="Delete entry" onClick={() => onDelete(a)} sx={{ color: '#f44336' }}>
                    <Delete />
                  </IconButton>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {pagination}
    </TableContainer>
  );
}

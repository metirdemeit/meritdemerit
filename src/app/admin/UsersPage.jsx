import React, { useState } from 'react';
import {
  Box,
  Typography,
  Container,
  useTheme,
  useMediaQuery,
  Button,
  ButtonGroup,
} from '@mui/material';
import { Person } from '@mui/icons-material';
import { TeachersBlog} from '../components/containers/TeachersBlog';
import { StudentsBlog } from '../components/containers/StudentsBlog';

export function UsersPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mode, setMode] = useState('students'); // 'students' | 'teachers'

  return (
    <Box sx={{ minHeight: '100vh', pb: 2 }}>
      {/* Header Section */}
      <Box sx={styles.headerSection}>
        <Container maxWidth="sm">
          <Box display="flex" alignItems="center" mb={3}>
            <Person sx={styles.icon} />
            <Box>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 600 }}>
                Users Management
              </Typography>
              <Typography variant="body2" sx={{ color: '#b3b3b3' }}>
                Manage students and teachers
              </Typography>
            </Box>
          </Box>

          <Box display="flex" gap={2}>
            <ButtonGroup fullWidth variant="contained" aria-label="users mode toggle">
              <Button
                variant={mode === 'students' ? 'contained' : 'outlined'}
                onClick={() => setMode('students')}
                sx={styles.button(mode === 'students')}
              >
                Students
              </Button>
              <Button
                variant={mode === 'teachers' ? 'contained' : 'outlined'}
                onClick={() => setMode('teachers')}
                sx={styles.button(mode === 'teachers')}
              >
                Teachers
              </Button>
            </ButtonGroup>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="sm" sx={{ px: 2 }}>
        {/* Render appropriate page based on mode */}
        {mode === 'students' && <StudentsBlog />}
        {mode === 'teachers' && <TeachersBlog />}
      </Container>

    </Box>
  );
}

const styles = {
  headerSection: {
    pt: 3,
    pb: 4,
    px: 2,
  },
  icon: {
    fontSize: 32,
    color: '#9c27b0',
    mr: 2,
  },
  button: (active) => ({
    padding: 1,
    color: active ? '#F4F4FF' : '#5A5984',
    backgroundColor: active ? 'linear-gradient(135deg, #9266FF 0%, #6932EB 100%)' : 'transparent',
    borderColor: 'rgba(146, 102, 255, 0.3)',
    '&:hover': {
      backgroundColor: active ? 'linear-gradient(135deg, #6932EB 0%, #5A2980 100%)' : 'rgba(146, 102, 255, 0.1)',
      borderColor: 'rgba(146, 102, 255, 0.5)',
    } 
  }),
}
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
} from '@mui/material';
import {
  Home,
  Analytics,
  SwapHoriz,
  Settings,
  AdminPanelSettings,
  Person,
  Code,
} from '@mui/icons-material';
import { useAuthStore } from '../store/authStore';
import { useNavigate, useLocation } from 'react-router-dom';

const BottomNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  const getNavItems = () => {
    if (!user) return [];

    const items = {
      admin: [
        { label: 'Dashboard', value: '/admin/dashboard', icon: <AdminPanelSettings /> },
        { label: 'Users', value: '/admin/users', icon: <Person /> },
        { label: 'Codes', value: '/admin/codes', icon: <Code /> },
        { label: 'Settings', value: '/admin/settings', icon: <Settings /> }
      ],
      teacher: [
        { label: 'Dashboard', value: '/teacher/dashboard', icon: <Home /> },
        { label: 'Students', value: '/teacher/students', icon: <Person /> },
        { label: 'Rules', value: '/teacher/rules', icon: <Code /> }
      ],
      student: [
        { label: 'Dashboard', value: '/student/dashboard', icon: <Home /> },
        { label: 'History', value: '/student/history', icon: <SwapHoriz /> }
      ]
    };

    return items[user.role] || [];
  };

  const navItems = getNavItems();

  const handleChange = (event, newValue) => {
    navigate(newValue);
  };

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundImage: 'linear-gradient(135deg, #0C0B21 0%, #1A1932 50%, #0E0D2A 100%)',
        backgroundColor: 'linear-gradient(135deg, #0C0B21 0%, #1A1932 50%, #0E0D2A 100%)',
        borderTop: '1px solid rgba(146, 102, 255, 0.2)',
        borderRadius: 0,
      }}
      elevation={8}
    >
      <BottomNavigation
        value={location.pathname}
        onChange={handleChange}
        sx={{
          backgroundColor: 'transparent',
          height: '90px',
          '& .MuiBottomNavigationAction-root': {
            color: '#5A5984',
            '&.Mui-selected': {
              color: '#9266FF',
            },
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.75rem',
              fontWeight: 400,
            },
          },
        }}
      >
        {navItems.map((item) => (
          <BottomNavigationAction
            key={item.value}
            label={item.label}
            value={item.value}
            icon={item.icon}
            sx={{
              '&.Mui-selected': {
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '70%',
                  height: '2px',
                  backgroundColor: '#9266FF',
                  borderRadius: '1px',
                },
              },
            }}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
};

export default BottomNavbar;

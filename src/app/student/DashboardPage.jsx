import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button,
  Chip,
} from '@mui/material';
import { Person, History as HistoryIcon, ArrowForward } from '@mui/icons-material';
import { useAuthStore } from '../../store/authStore';
import { useStudentStore } from '../../store/studentStore';
import { useCommonStore } from '../../store/commonStore';
import CommonRankingTable from '../components/CommonRankingTable';
import { useNavigate } from 'react-router-dom';

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    profile,
    history,
    fetchProfile,
    fetchHistory,
  } = useStudentStore();
  const {
    rankings,
    fetchRankings,
  } = useCommonStore();

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingRankings, setLoadingRankings] = useState(false);
  const [errorProfile, setErrorProfile] = useState(null);
  const [errorRankings, setErrorRankings] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      setLoadingProfile(true);
      setErrorProfile(null);
      try {
        const data = await fetchProfile();
        if (!data && !user) {
          setErrorProfile('Failed to load profile');
        }
      } catch (err) {
        if (!user) {
          setErrorProfile('Failed to load profile');
        }
      } finally {
        setLoadingProfile(false);
      }
    };

    const loadRankings = async () => {
      setLoadingRankings(true);
      setErrorRankings(null);
      try {
        await Promise.all([
          fetchRankings(),
          useCommonStore.getState().fetchStudents()
        ]);
      } catch (err) {
        setErrorRankings('Failed to load rankings');
      } finally {
        setLoadingRankings(false);
      }
    };

    loadProfile();
    loadRankings();
    fetchHistory();
  }, [fetchProfile, fetchRankings, fetchHistory, user]);

  if (loadingProfile && !profile) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '50vh',
        }}
      >
        <CircularProgress sx={{ color: '#9266FF' }} />
      </Box>
    );
  }

  if (errorProfile) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{errorProfile}</Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', pb: 2 }}>
      {/* Header Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #4a1d63 0%, #343355 50%, #4a1d63 100%)',
          backdropFilter: 'blur(50px)',
          boxShadow: '0 20px 100px #4a1d63',
        position: 'sticky',
        top: 0,
        zIndex: 100,
          p: 2,
          pt: 'calc(var(--tg-safe-area-inset-top, 0px) + 80px)',
          pb: 2,
          mt: 0,
          mb: 2,
        }}
      >
        <Container maxWidth="lg">
          <Box display="flex" alignItems="center" mb={3}>
            <Person sx={{ fontSize: 32, color: '#9266FF', mr: 2 }} />
            <Box>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 400 }}>
                Student Dashboard
              </Typography>
              <Typography variant="body2" sx={{ color: '#5A5984' }}>
                Welcome back, {profile?.first_name || user?.first_name} {profile?.last_name || user?.last_name}
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ px: 2 }}>
        {/* Карточка профиля студента */}
        <Card sx={{ 
          background: 'linear-gradient(135deg, #0C0B21 0%, #1A1932 50%, #0E0D2A 100%)',
          borderRadius: 2,
          border: '1px solid rgba(146, 102, 255, 0.2)',
          mb: 3,
        }}>
          <CardContent>
            <Typography variant="h6" sx={{ color: '#F4F4FF', mb: 2, fontWeight: 400 }}>
              Your Profile
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Box sx={{
                p: 2,
                borderRadius: 2,
                background: 'linear-gradient(135deg, rgba(146,102,255,0.12) 0%, rgba(105,50,235,0.12) 100%)',
                border: '1px solid rgba(146,102,255,0.25)'
              }}>
                <Typography variant="caption" sx={{ color: '#5A5984' }}>Name</Typography>
                <Typography variant="body1" sx={{ color: '#F4F4FF', fontWeight: 500 }}>
                  {profile?.first_name} {profile?.last_name}
                </Typography>
                <Typography variant="caption" sx={{ color: '#5A5984' }}>Username</Typography>
                <Typography variant="body2" sx={{ color: '#b3b3b3' }}>@{profile?.username || user?.username}</Typography>
              </Box>

              <Box sx={{
                p: 2,
                borderRadius: 2,
                background: 'linear-gradient(135deg, rgba(0,211,119,0.10) 0%, rgba(0,184,101,0.10) 100%)',
                border: '1px solid rgba(0,211,119,0.25)'
              }}>
                <Typography variant="caption" sx={{ color: '#5A5984' }}>Points</Typography>
                <Typography variant="h5" sx={{ color: '#00D377', fontWeight: 700 }}>
                  {typeof profile?.points === 'number' ? profile.points : (profile?.total_points || 0)}
                </Typography>
                <Typography variant="caption" sx={{ color: '#5A5984' }}>Class</Typography>
                <Typography variant="body2" sx={{ color: '#b3b3b3' }}>
                  {profile?.school_class?.name || profile?.class_name || 'N/A'}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Recent History Section */}
        {Array.isArray(history) && history.length > 0 && (
          <Card sx={{ 
            background: 'linear-gradient(135deg, #0C0B21 0%, #1A1932 50%, #0E0D2A 100%)',
            borderRadius: 2,
            border: '1px solid rgba(146, 102, 255, 0.2)',
            mb: 3,
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HistoryIcon sx={{ color: '#9266FF', fontSize: 20 }} />
                  <Typography variant="h6" sx={{ color: '#F4F4FF', fontWeight: 400 }}>
                    Recent Activity
                  </Typography>
                </Box>
                <Button
                  size="small"
                  endIcon={<ArrowForward />}
                  onClick={() => navigate('/student/history')}
                  sx={{
                    color: '#9266FF',
                    textTransform: 'none',
                    fontSize: '0.8rem',
                    '&:hover': { color: '#b38bff' },
                  }}
                >
                  View All ({history.length})
                </Button>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {history.slice(0, 5).map((item) => (
                  <Box
                    key={item.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1.5,
                      borderRadius: 1.5,
                      background: item.points_changed > 0
                        ? 'rgba(0,211,119,0.07)'
                        : 'rgba(235,43,75,0.07)',
                      border: item.points_changed > 0
                        ? '1px solid rgba(0,211,119,0.15)'
                        : '1px solid rgba(235,43,75,0.15)',
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ color: '#F4F4FF', fontWeight: 500, mb: 0.25 }} noWrap>
                        {item.rule_description || 'Point assignment'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#5A5984' }}>
                        {item.teacher_name || 'Teacher'} · {new Date(item.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Box>
                    <Chip
                      label={`${item.points_changed > 0 ? '+' : ''}${item.points_changed}`}
                      size="small"
                      sx={{
                        ml: 1,
                        backgroundColor: item.points_changed > 0 ? 'rgba(0,211,119,0.2)' : 'rgba(235,43,75,0.2)',
                        color: item.points_changed > 0 ? '#00D377' : '#EB2B4B',
                        fontWeight: 700,
                        border: item.points_changed > 0 ? '1px solid rgba(0,211,119,0.4)' : '1px solid rgba(235,43,75,0.4)',
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        )}

          {/* Ranking Section */}
        <Card sx={{ 
          background: 'linear-gradient(135deg, #0C0B21 0%, #1A1932 50%, #0E0D2A 100%)',
          borderRadius: 2,
          border: '1px solid rgba(146, 102, 255, 0.2)',
          mt: 3,
        }}>
          <CardContent>
            <Typography variant="h6" sx={{ color: '#F4F4FF', mb: 2, fontWeight: 400 }}>
              Rankings
            </Typography>
              {loadingRankings ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress sx={{ color: '#9266FF' }} />
                </Box>
              ) : errorRankings ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {errorRankings}
                </Alert>
              ) : Array.isArray(rankings) && rankings.length > 0 ? (
                <CommonRankingTable rankings={rankings} />
              ) : (
                <Alert 
                  severity="info" 
                  sx={{ 
                    backgroundColor: 'rgba(146, 102, 255, 0.1)',
                    border: '1px solid rgba(146, 102, 255, 0.3)',
                    color: '#F4F4FF'
                  }}
                >
                  No rankings found.
                </Alert>
              )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

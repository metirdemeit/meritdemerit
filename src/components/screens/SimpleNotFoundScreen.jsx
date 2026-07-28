import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export function SimpleNotFoundScreen({ 
  title = "Page Not Found",
  message = "The page you're looking for doesn't exist or has been moved.",
  showHomeButton = true,
  homeButtonText = "Go Home"
}) {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0C0B21 0%, #1A1932 50%, #0E0D2A 100%)',
        zIndex: 9999,
        p: 3,
      }}
    >
      <Box
        sx={{
          width: 120,
          height: 120,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.1) 0%, rgba(255, 193, 7, 0.1) 100%)',
          border: '2px solid rgba(255, 152, 0, 0.3)',
          mb: 3,
          fontSize: '3rem',
          color: '#ff9800',
        }}
      >
        🔍
      </Box>

      <Typography
        variant="h4"
        sx={{
          color: '#ffffff',
          fontWeight: 400,
          textAlign: 'center',
          mb: 2,
          background: 'linear-gradient(135deg, #F4F4FF 0%, #9266FF 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        Merits and Demerits
      </Typography>

      <Typography
        variant="h6"
        sx={{
          color: '#ff9800',
          textAlign: 'center',
          mb: 2,
          fontWeight: 600,
        }}
      >
        {title}
      </Typography>

      <Typography
        variant="body1"
        sx={{
          color: '#B8B8CC',
          textAlign: 'center',
          mb: 4,
          maxWidth: 400,
          lineHeight: 1.6,
        }}
      >
        {message}
      </Typography>

      {showHomeButton && (
        <Button
          variant="contained"
          onClick={handleGoHome}
          sx={{
            background: 'linear-gradient(135deg, #9266FF 0%, #6932EB 100%)',
            color: '#F4F4FF',
            px: 4,
            py: 1.5,
            borderRadius: 2,
            textTransform: 'none',
            fontSize: '1rem',
            fontWeight: 600,
            '&:hover': {
              background: 'linear-gradient(135deg, #6932EB 0%, #5A2980 100%)',
              transform: 'translateY(-2px)',
            },
            transition: 'all 0.3s ease',
          }}
        >
          {homeButtonText}
        </Button>
      )}
    </Box>
  );
}

export default SimpleNotFoundScreen;

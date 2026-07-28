import { Box, Typography, CircularProgress } from '@mui/material';

export function SimpleLoadingScreen({ message = "Loading..." }) {
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
          background: 'linear-gradient(135deg, rgba(146, 102, 255, 0.1) 0%, rgba(105, 50, 235, 0.1) 100%)',
          border: '2px solid rgba(146, 102, 255, 0.3)',
          mb: 3,
          fontSize: '3rem',
          color: '#9266FF',
        }}
      >
        📚
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
        variant="body1"
        sx={{
          color: '#5A5984',
          textAlign: 'center',
          mb: 3,
        }}
      >
        {message}
      </Typography>

      <CircularProgress sx={{ color: '#9266FF' }} />
    </Box>
  );
}

export default SimpleLoadingScreen;

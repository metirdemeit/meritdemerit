import { Box, Typography, Button } from '@mui/material';

export function SimpleErrorScreen({ 
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  onRetry = null,
  retryText = "Try Again"
}) {
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
          background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.1) 0%, rgba(211, 47, 47, 0.1) 100%)',
          border: '2px solid rgba(244, 67, 54, 0.3)',
          mb: 3,
          fontSize: '3rem',
          color: '#f44336',
        }}
      >
        ⚠️
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
          color: '#f44336',
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

      {onRetry && (
        <Button
          variant="contained"
          onClick={onRetry}
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
          {retryText}
        </Button>
      )}
    </Box>
  );
}

export default SimpleErrorScreen;

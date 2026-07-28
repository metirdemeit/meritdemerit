import { Box, Typography, Container, Button } from '@mui/material';

/**
 * TelegramOnly component - Fallback UI когда Telegram SDK не инициализирован
 * 
 * @param {boolean} isReload - Если true, показываем сообщение о необходимости перезапуска mini app
 */
export function TelegramOnly({ isReload = false }) {
  const handleClose = () => {
    // Пытаемся закрыть mini app через Telegram API
    if (window.Telegram?.WebApp?.close) {
      window.Telegram.WebApp.close();
    }
  };

  return (
    <Container 
      maxWidth="sm" 
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        color: '#ffffff'
      }}
    >
      <Box sx={{ textAlign: 'center', maxWidth: 400, p: 3 }}>
        {/* Telegram Logo */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h1" sx={{ fontSize: '4rem', color: '#0088cc' }}>
            {isReload ? '🔄' : '📱'}
          </Typography>
        </Box>

        {/* Title */}
        <Typography
          variant="h4"
          sx={{
            fontWeight: 'bold',
            mb: 2,
            background: 'linear-gradient(135deg, #0088cc 0%, #9266FF 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          Merits and Demerits
        </Typography>

        <Typography
          variant="h6"
          sx={{ mb: 3, color: '#5A5984' }}
        >
          Mini App
        </Typography>

        {/* Message */}
        <Box sx={{ 
          p: 3, 
          borderRadius: 2, 
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          mb: 3
        }}>
          <Typography variant="h6" sx={{ mb: 2, color: '#ffffff' }}>
            {isReload ? '🔄 Please Reopen App' : '🔒 Access Restricted'}
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 2, color: '#B8B8CC' }}>
            {isReload 
              ? 'Telegram Mini Apps don\'t support page reload. Please close and reopen the app from Telegram.'
              : 'This application only works inside Telegram'
            }
          </Typography>
          
          <Typography variant="body2" sx={{ color: '#8483AE' }}>
            {isReload
              ? 'After reopening, your session will be restored automatically.'
              : 'Please open this app through Telegram Bot or Mini App'
            }
          </Typography>
        </Box>

        {/* Instructions */}
        <Box sx={{ 
          p: 2, 
          borderRadius: 1, 
          background: 'rgba(146, 102, 255, 0.1)',
          border: '1px solid rgba(146, 102, 255, 0.2)',
          mb: 2
        }}>
          <Typography variant="body2" sx={{ color: '#B8B8CC', mb: 2 }}>
            {isReload ? (
              <>
                💡 <strong>How to reopen:</strong><br/>
                1. Close this mini app<br/>
                2. Open the bot again in Telegram<br/>
                3. Click "Open Mini App" button
              </>
            ) : (
              <>
                💡 <strong>How to open:</strong><br/>
                1. Find the bot in Telegram<br/>
                2. Click "Open Mini App" button<br/>
                3. Or use direct link from Telegram
              </>
            )}
          </Typography>
        </Box>

        {/* Close Button (только если доступен Telegram API) */}
        {window.Telegram?.WebApp?.close && (
          <Button
            variant="contained"
            onClick={handleClose}
            sx={{
              background: 'linear-gradient(135deg, #9266FF 0%, #6932EB 100%)',
              color: '#ffffff',
              mt: 2,
              '&:hover': {
                background: 'linear-gradient(135deg, #6932EB 0%, #5A2980 100%)',
              },
            }}
          >
            Close App
          </Button>
        )}
      </Box>
    </Container>
  );
}

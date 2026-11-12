import { Box, Button } from '@mui/material';
import { HelpOutline } from '@mui/icons-material';
import { useGuideStore } from '../../store/guideStore';

/** Header button that replays the in-app guide for the current role. Icon-only on phones. */
export default function GuideButton() {
  const start = useGuideStore((s) => s.start);
  return (
    <Button
      variant="outlined"
      size="small"
      onClick={start}
      aria-label="Открыть гид по приложению"
      title="Гид по приложению"
      sx={{
        flexShrink: 0,
        minWidth: 0,
        gap: 0.75,
        px: { xs: 1, sm: 1.5 },
        color: '#F4F4FF',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        boxShadow: 'none',
        textTransform: 'none',
        '&:hover': { borderColor: '#F4F4FF', backgroundColor: 'rgba(255, 255, 255, 0.08)', boxShadow: 'none' },
      }}
    >
      <HelpOutline fontSize="small" />
      <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Гид</Box>
    </Button>
  );
}

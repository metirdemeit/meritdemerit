import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Button, IconButton, Typography } from '@mui/material';
import { Close } from '@mui/icons-material';
import { useAuthStore } from '../../store/authStore';
import { useGuideStore, isGuideDone } from '../../store/guideStore';
import { GUIDE_STEPS, roleKey } from './guideSteps';
import { openGuide } from '../../utils/openGuide';

const PAD = 8;          // spotlight padding around the target
const GAP = 14;         // distance between spotlight and card
const CARD_MAX = 380;
const ROLE_LABEL = { student: 'Student', teacher: 'Teacher', admin: 'Admin' };

const reduceMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Wait (up to ~2.5s) for a lazily rendered page to show the target element. */
function waitForTarget(name, signal) {
  return new Promise((resolve) => {
    if (!name) return resolve(null);
    const started = performance.now();
    const tick = () => {
      if (signal.cancelled) return resolve(null);
      const el = document.querySelector(`[data-tour="${name}"]`);
      if (el && el.getBoundingClientRect().height > 0) return resolve(el);
      if (performance.now() - started > 2500) return resolve(null);
      requestAnimationFrame(tick);
    };
    tick();
  });
}

export default function GuideTour() {
  const user = useAuthStore((s) => s.user);
  const { open, step, setStep, close, start } = useGuideStore();
  const navigate = useNavigate();
  const location = useLocation();
  const role = roleKey(user?.role);
  const steps = GUIDE_STEPS[role] || [];
  const current = steps[step];

  const [rect, setRect] = useState(null);
  const [cardHeight, setCardHeight] = useState(0);
  const targetRef = useRef(null);
  const targetName = useRef(null);
  const cardRef = useRef(null);
  const nextRef = useRef(null);

  // First visit for this user and role: start automatically once.
  useEffect(() => {
    if (!user || !steps.length || isGuideDone(user)) return undefined;
    const t = setTimeout(() => start(), 900);
    return () => clearTimeout(t);
  }, [user, steps.length, start]);

  const measure = useCallback(() => {
    let el = targetRef.current;
    // Pages re-render after their data loads; find the fresh element by name.
    if ((!el || !el.isConnected) && targetName.current) {
      el = document.querySelector(`[data-tour="${targetName.current}"]`);
      targetRef.current = el;
    }
    if (!el || el.getBoundingClientRect().height === 0) { setRect(null); return; }
    const r = el.getBoundingClientRect();
    const next = { top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 };
    setRect((prev) => (
      prev && Math.abs(prev.top - next.top) < 1 && Math.abs(prev.left - next.left) < 1
        && Math.abs(prev.width - next.width) < 1 && Math.abs(prev.height - next.height) < 1
        ? prev : next
    ));
  }, []);

  // Go to the step's page, find its target, scroll it into view.
  useEffect(() => {
    if (!open || !current) return undefined;
    const signal = { cancelled: false };
    targetRef.current = null;
    targetName.current = current.target || null;
    setRect(null);
    if (current.route && location.pathname !== current.route) {
      navigate(current.route);
      return () => { signal.cancelled = true; };
    }
    waitForTarget(current.target, signal).then((el) => {
      if (signal.cancelled) return;
      targetRef.current = el;
      if (el) {
        el.scrollIntoView({ block: 'center', behavior: reduceMotion() ? 'auto' : 'smooth' });
        setTimeout(measure, reduceMotion() ? 0 : 350);
      }
      measure();
    });
    return () => { signal.cancelled = true; };
  }, [open, step, current, location.pathname, navigate, measure]);

  // Keep the spotlight glued to the target while the page scrolls or resizes.
  useEffect(() => {
    if (!open) return undefined;
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    // Content loads and shifts layout without scroll/resize events.
    const poll = setInterval(measure, 300);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
      clearInterval(poll);
    };
  }, [open, measure]);

  useLayoutEffect(() => {
    if (cardRef.current) setCardHeight(cardRef.current.offsetHeight);
  });

  const finish = useCallback(() => close(user), [close, user]);
  const next = useCallback(() => (step < steps.length - 1 ? setStep(step + 1) : finish()), [step, steps.length, setStep, finish]);
  const prev = useCallback(() => step > 0 && setStep(step - 1), [step, setStep]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') finish();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, next, prev, finish]);

  useEffect(() => {
    if (open) nextRef.current?.focus({ preventScroll: true });
  }, [open, step]);

  if (!open || !current) return null;

  // Card position: under the target if it fits, otherwise above, otherwise centered.
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cardWidth = Math.min(CARD_MAX, vw - 32);
  let cardStyle;
  if (rect) {
    const left = Math.min(Math.max(16, rect.left + rect.width / 2 - cardWidth / 2), vw - cardWidth - 16);
    const below = rect.top + rect.height + GAP;
    const above = rect.top - GAP - cardHeight;
    if (below + cardHeight <= vh - 16) cardStyle = { top: below, left };
    else if (above >= 16) cardStyle = { top: above, left };
    else cardStyle = { bottom: 'calc(16px + var(--app-safe-bottom, 0px))', left };
  } else {
    cardStyle = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  }

  const isLast = step === steps.length - 1;
  const motion = reduceMotion() ? 'none' : 'top .25s ease, left .25s ease, width .25s ease, height .25s ease';

  return (
    <Box sx={{ position: 'fixed', inset: 0, zIndex: 2000 }}>
      {/* Blocks clicks on the page while the tour is open; the dimming itself comes from the spotlight shadow. */}
      <Box onClick={(e) => e.stopPropagation()} sx={{ position: 'absolute', inset: 0, background: rect ? 'transparent' : 'rgba(5, 4, 20, 0.72)' }} />

      {rect && (
        <Box
          aria-hidden="true"
          sx={{
            position: 'fixed',
            top: rect.top, left: rect.left, width: rect.width, height: rect.height,
            borderRadius: '16px',
            boxShadow: '0 0 0 9999px rgba(5, 4, 20, 0.72), 0 0 0 2px #9266FF, 0 0 24px 4px rgba(146, 102, 255, 0.55)',
            transition: motion,
            pointerEvents: 'none',
          }}
        />
      )}

      <Box
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-title"
        aria-describedby="guide-body"
        sx={{
          position: 'fixed',
          ...cardStyle,
          width: cardWidth,
          p: 2.5,
          borderRadius: '18px',
          background: '#16143A',
          border: '1px solid rgba(146, 102, 255, 0.45)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.55)',
          color: '#F4F4FF',
          transition: motion,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Typography sx={{ fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#A98BFF', fontWeight: 600 }}>
            {ROLE_LABEL[role]} · {step + 1} of {steps.length}
          </Typography>
          <IconButton aria-label="Close guide" onClick={finish} size="small" sx={{ ml: 'auto', color: '#8E8DAA', mr: -1 }}>
            <Close fontSize="small" />
          </IconButton>
        </Box>

        <Typography id="guide-title" sx={{ fontSize: '1.15rem', fontWeight: 700, mb: 0.75 }}>
          {current.title}
        </Typography>
        <Typography id="guide-body" sx={{ fontSize: '0.95rem', lineHeight: 1.55, color: '#C9C7E8' }}>
          {current.body}
        </Typography>

        <Box sx={{ display: 'flex', gap: 0.75, my: 2 }} aria-hidden="true">
          {steps.map((_, i) => (
            <Box
              key={i}
              sx={{
                height: 6, flex: i === step ? 2.5 : 1, borderRadius: 3,
                background: i <= step ? '#9266FF' : 'rgba(146, 102, 255, 0.22)',
                transition: reduceMotion() ? 'none' : 'flex .25s ease',
              }}
            />
          ))}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {!isLast ? (
            <Button onClick={finish} size="small" sx={{ color: '#8E8DAA', boxShadow: 'none', px: 1, minWidth: 0, '&:hover': { boxShadow: 'none' } }}>
              Skip
            </Button>
          ) : (
            <Button onClick={openGuide} size="small" sx={{ color: '#B9A4FF', boxShadow: 'none', px: 1, minWidth: 0, '&:hover': { boxShadow: 'none' } }}>
              Full guide
            </Button>
          )}
          <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
            <Button
              onClick={prev}
              disabled={step === 0}
              variant="outlined"
              sx={{ color: '#F4F4FF', borderColor: 'rgba(146, 102, 255, 0.45)', boxShadow: 'none', '&:hover': { boxShadow: 'none', borderColor: '#9266FF' } }}
            >
              Back
            </Button>
            <Button ref={nextRef} onClick={next} variant="contained" sx={{ px: 2.5 }}>
              {isLast ? 'Done' : 'Next'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

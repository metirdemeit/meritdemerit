/**
 * Props that make a clickable non-button element (a Card, a Box) usable with
 * keyboard and screen readers. Returns {} when there is no handler.
 */
export const clickableProps = (onClick, label) =>
  onClick
    ? {
        onClick,
        role: 'button',
        tabIndex: 0,
        ...(label ? { 'aria-label': label } : {}),
        onKeyDown: (e) => {
          if (e.target !== e.currentTarget) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick(e);
          }
        },
      }
    : {};

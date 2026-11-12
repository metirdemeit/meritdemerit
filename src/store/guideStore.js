import { create } from 'zustand';

const doneKey = (user) => `guide_done_${user?.role}_${user?.id}`;

export const useGuideStore = create((set) => ({
  open: false,
  step: 0,
  start: () => set({ open: true, step: 0 }),
  setStep: (step) => set({ step }),
  close: (user) => {
    try { localStorage.setItem(doneKey(user), '1'); } catch { /* private mode */ }
    set({ open: false, step: 0 });
  },
}));

export const isGuideDone = (user) => {
  try { return localStorage.getItem(doneKey(user)) === '1'; } catch { return true; }
};

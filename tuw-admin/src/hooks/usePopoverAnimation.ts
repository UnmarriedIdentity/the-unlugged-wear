'use client';

import React from 'react';

// Exit duration (ms) — must match the popoverOut animation in globals.css.
export const POPOVER_EXIT_MS = 150;

type PopoverPhase = 'open' | 'closing' | 'closed';

interface PopoverAnimation {
  phase: PopoverPhase;
  visible: boolean;
  requestClose: () => void;
  cancelClose: () => void;
}

// Shared open/close motion for popovers and dropdown menus (M1).
// Parent flips `open` false (or calls requestClose) to start the exit:
// popoverOut plays, then the tree unmounts and `onClosed` fires so the
// parent can sync its own state. Opening renders instantly with popoverIn.
// Under prefers-reduced-motion the exit collapses to instant.
export function usePopoverAnimation(open: boolean, onClosed?: () => void): PopoverAnimation {
  const [phase, setPhase] = React.useState<PopoverPhase>(open ? 'open' : 'closed');
  const phaseRef = React.useRef<PopoverPhase>(open ? 'open' : 'closed');
  const wasOpen = React.useRef(open);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const onClosedRef = React.useRef(onClosed);
  onClosedRef.current = onClosed;

  const clearTimer = () => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const setPhaseBoth = (next: PopoverPhase) => {
    phaseRef.current = next;
    setPhase(next);
  };

  const finishClose = React.useCallback(() => {
    timer.current = null;
    setPhaseBoth('closed');
    onClosedRef.current?.();
  }, []);

  const startExit = React.useCallback(() => {
    if (phaseRef.current === 'closed' || phaseRef.current === 'closing') return;
    const reduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setPhaseBoth('closed');
      onClosedRef.current?.();
      return;
    }
    setPhaseBoth('closing');
    clearTimer();
    timer.current = setTimeout(finishClose, POPOVER_EXIT_MS);
  }, [finishClose]);

  React.useEffect(() => clearTimer, []);

  React.useEffect(() => {
    if (open) {
      wasOpen.current = true;
      clearTimer();
      setPhaseBoth('open');
      return;
    }
    if (!wasOpen.current) return;
    wasOpen.current = false;
    startExit();
  }, [open, startExit]);

  return {
    phase,
    visible: phase !== 'closed',
    requestClose: startExit,
    cancelClose: () => {
      clearTimer();
      setPhaseBoth('open');
    },
  };
}

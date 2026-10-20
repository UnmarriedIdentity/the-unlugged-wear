export type TooltipSide = 'top' | 'bottom';

export interface TooltipTriggerRect {
  top: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
}

export interface TooltipPositionOptions {
  trigger: TooltipTriggerRect;
  tooltip: { width: number; height: number };
  viewport: { width: number; height: number };
  /** Preferred side; the helper flips when the preferred side does not fit. */
  preferred?: TooltipSide;
  /** Distance between trigger and tooltip. Default 8. */
  offset?: number;
  /** Minimum viewport edge margin. Default 8. */
  margin?: number;
}

export interface TooltipPosition {
  top: number;
  left: number;
  side: TooltipSide;
}

// Pure placement math for the shared Tooltip. Kept free of DOM access so the
// flip and clamp rules can be unit-tested with the native Node test runner.
export function computeTooltipPosition({
  trigger,
  tooltip,
  viewport,
  preferred = 'top',
  offset = 8,
  margin = 8,
}: TooltipPositionOptions): TooltipPosition {
  const order: TooltipSide[] = preferred === 'bottom' ? ['bottom', 'top'] : ['top', 'bottom'];
  let side = order[0];
  let top =
    side === 'top' ? trigger.top - tooltip.height - offset : trigger.bottom + offset;
  const fits =
    side === 'top'
      ? top >= margin
      : top + tooltip.height <= viewport.height - margin;

  if (!fits) {
    side = order[1];
    top =
      side === 'top' ? trigger.top - tooltip.height - offset : trigger.bottom + offset;
  }

  // Final guard for very small viewports or unusually tall content.
  top = Math.min(Math.max(top, margin), Math.max(margin, viewport.height - margin - tooltip.height));

  const centered = trigger.left + trigger.width / 2 - tooltip.width / 2;
  const maxLeft = Math.max(margin, viewport.width - margin - tooltip.width);
  const left = Math.min(Math.max(centered, margin), maxLeft);

  return { top, left, side };
}

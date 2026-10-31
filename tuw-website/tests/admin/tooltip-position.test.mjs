import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// ---------------------------------------------------------------
// Mirrors src/lib/tooltipPosition.ts (self-contained per this suite's
// convention). The shared tooltip must flip and clamp without DOM access.
// ---------------------------------------------------------------
const computeTooltipPosition = ({
  trigger,
  tooltip,
  viewport,
  preferred = 'top',
  offset = 8,
  margin = 8,
}) => {
  const order = preferred === 'bottom' ? ['bottom', 'top'] : ['top', 'bottom'];
  let side = order[0];
  let top = side === 'top' ? trigger.top - tooltip.height - offset : trigger.bottom + offset;
  const fits =
    side === 'top' ? top >= margin : top + tooltip.height <= viewport.height - margin;

  if (!fits) {
    side = order[1];
    top = side === 'top' ? trigger.top - tooltip.height - offset : trigger.bottom + offset;
  }

  top = Math.min(Math.max(top, margin), Math.max(margin, viewport.height - margin - tooltip.height));

  const centered = trigger.left + trigger.width / 2 - tooltip.width / 2;
  const maxLeft = Math.max(margin, viewport.width - margin - tooltip.width);
  const left = Math.min(Math.max(centered, margin), maxLeft);

  return { top, left, side };
};

const viewport = { width: 1024, height: 768 };
const tooltip = { width: 200, height: 40 };

describe('Tooltip position', () => {
  test('places above the trigger when there is room', () => {
    const result = computeTooltipPosition({
      trigger: { top: 300, bottom: 324, left: 400, width: 24, height: 24 },
      tooltip,
      viewport,
    });
    assert.equal(result.side, 'top');
    assert.equal(result.top, 252);
    assert.equal(result.left, 312);
  });

  test('flips below when the top edge is tight', () => {
    const result = computeTooltipPosition({
      trigger: { top: 20, bottom: 44, left: 400, width: 24, height: 24 },
      tooltip,
      viewport,
    });
    assert.equal(result.side, 'bottom');
    assert.equal(result.top, 52);
  });

  test('honours a bottom preference and flips above when the bottom is tight', () => {
    const bottom = computeTooltipPosition({
      trigger: { top: 300, bottom: 324, left: 400, width: 24, height: 24 },
      tooltip,
      viewport,
      preferred: 'bottom',
    });
    assert.equal(bottom.side, 'bottom');
    assert.equal(bottom.top, 332);

    const flipped = computeTooltipPosition({
      trigger: { top: 700, bottom: 724, left: 400, width: 24, height: 24 },
      tooltip,
      viewport,
      preferred: 'bottom',
    });
    assert.equal(flipped.side, 'top');
    assert.equal(flipped.top, 652);
  });

  test('clamps horizontally at both viewport edges', () => {
    const left = computeTooltipPosition({
      trigger: { top: 300, bottom: 324, left: 0, width: 24, height: 24 },
      tooltip,
      viewport,
    });
    assert.equal(left.left, 8);

    const right = computeTooltipPosition({
      trigger: { top: 300, bottom: 324, left: 1000, width: 24, height: 24 },
      tooltip,
      viewport,
    });
    assert.equal(right.left, 816);
  });

  test('keeps an oversized tooltip inside the viewport', () => {
    const result = computeTooltipPosition({
      trigger: { top: 400, bottom: 424, left: 400, width: 24, height: 24 },
      tooltip: { width: 200, height: 760 },
      viewport,
    });
    assert.equal(result.top, 8);
    assert.equal(result.left, 312);
  });
});

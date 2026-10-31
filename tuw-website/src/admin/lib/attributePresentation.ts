export type AttributeDisplayType = 'pill' | 'swatch' | 'radio';

/** Canonical showcase options for the attribute library. The library owns
 * this choice globally; products inherit it through their linked definition. */
export const ATTRIBUTE_DISPLAY_OPTIONS: ReadonlyArray<{
  value: AttributeDisplayType;
  label: string;
}> = [
  { value: 'pill', label: 'Pill' },
  { value: 'swatch', label: 'Color swatch' },
  { value: 'radio', label: 'Radio select' },
];

/** Persisted records may predate the global showcase setting or carry a
 * stale value; anything unrecognized falls back to the safe default. */
export function normalizeAttributeDisplayType(value: unknown): AttributeDisplayType {
  return value === 'swatch' || value === 'radio' ? value : 'pill';
}

export function attributeDisplayLabel(value: AttributeDisplayType): string {
  if (value === 'swatch') return 'Color swatch';
  if (value === 'radio') return 'Radio select';
  return 'Pill';
}

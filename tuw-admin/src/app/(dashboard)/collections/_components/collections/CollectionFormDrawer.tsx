'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button, Drawer, Input, SearchableMultiSelect, SearchableSelect, Textarea } from '@/components/ui';
import type { SearchableSelectOption } from '@/components/ui';
import type { CollectionItem, ProductItem } from '@/mocks/fixtures';
import {
  draftFromCollection,
  draftToPayload,
  emptyDraft,
  toProductOptions,
  validateDraft,
  withName,
  withSlug,
} from './collectionDraft';
import type { CollectionDraft, CollectionDraftErrors } from './collectionDraft';

const visibilityOptions: SearchableSelectOption[] = [
  { value: 'published', label: 'Published', description: 'Live in storefront navigation' },
  { value: 'scheduled', label: 'Scheduled', description: 'Queued for the drop date' },
  { value: 'draft', label: 'Draft', description: 'Editorial review only' },
];

export interface CollectionFormDrawerProps {
  isOpen: boolean;
  /** null = create mode; a collection = edit mode (prefilled). */
  collection: CollectionItem | null;
  onClose: () => void;
  /** Fired after a successful edit save with the collection id. */
  onSaved?: (id: string) => void;
  collections: CollectionItem[];
  products: ProductItem[];
  onSave: (id: string | undefined, payload: Omit<CollectionItem, 'id' | 'updatedAt'>) => Promise<CollectionSaveResult>;
}

export type CollectionSaveResult = { ok: true } | { ok: false; message: string; field?: string };

export default function CollectionFormDrawer({
  isOpen,
  collection,
  onClose,
  onSaved,
  collections,
  products,
  onSave,
}: CollectionFormDrawerProps) {
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [draft, setDraft] = useState<CollectionDraft>(emptyDraft);
  const [errors, setErrors] = useState<CollectionDraftErrors>({});

  useEffect(() => {
    if (!isOpen) return;
    setDraft(collection ? draftFromCollection(collection, products) : emptyDraft());
    setErrors({});
    setFormError(null);
  }, [isOpen, collection, products]);

  const productOptions = useMemo(() => toProductOptions(products), [products]);

  const clearError = (key: keyof CollectionDraftErrors) => {
    setErrors((previous) => {
      if (!(key in previous)) return previous;
      const next = { ...previous };
      delete next[key];
      return next;
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    const nextErrors = validateDraft(draft, collections, collection?.id);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const payload = draftToPayload(draft);
    // A refused save keeps this drawer open with every input preserved —
    // only a real success closes it.
    setSaving(true);
    const saved = await onSave(collection?.id, payload);
    setSaving(false);
    if (!saved.ok) {
      if (saved.field === 'slug' || saved.field === 'name' || saved.field === 'publishedAt') setErrors({ [saved.field]: saved.message });
      else setFormError(saved.message);
      return;
    }

    if (collection) onSaved?.(collection.id);
    onClose();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={collection ? 'Edit Collection' : 'New Collection'}
      subtitle={collection ? collection.name : 'Group catalog items into a seasonal release'}
      width="540px"
      footer={
        <>
          <Button variant="secondary" size="md" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="md" type="submit" form="collection-form" disabled={saving}>
            {saving ? 'Saving…' : collection ? 'Save Changes' : 'Create Collection'}
          </Button>
        </>
      }
    >
      <form
        id="collection-form"
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        <Input
          label="Collection Title"
          placeholder="e.g. Spring Minimalist Capsule"
          value={draft.name}
          onChange={(event) => {
            setDraft(withName(draft, event.target.value));
            clearError('name');
            if (!draft.slugTouched) clearError('slug');
          }}
          error={errors.name}
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <Input
            label="URL Slug"
            placeholder="spring-minimalist-capsule"
            value={draft.slug}
            onChange={(event) => {
              setDraft(withSlug(draft, event.target.value));
              clearError('slug');
            }}
            error={errors.slug}
            helperText={
              errors.slug
                ? undefined
                : draft.slugTouched
                  ? 'Lowercase letters, numbers, and dashes.'
                  : 'Auto-generated from the title until you edit it.'
            }
          />
          <Input
            label="Season / Year"
            placeholder="AW26"
            value={draft.season}
            onChange={(event) => {
              setDraft({ ...draft, season: event.target.value });
              clearError('season');
            }}
            error={errors.season}
            helperText={errors.season ? undefined : 'e.g. AW26, SS26, Perennial'}
          />
        </div>

        <SearchableSelect
          label="Visibility Status"
          options={visibilityOptions}
          value={draft.visibility}
          onChange={(value) =>
            setDraft({ ...draft, visibility: value as CollectionDraft['visibility'] })
          }
        />

        {draft.visibility === 'scheduled' && (
          <Input
            label="Drop date"
            type="datetime-local"
            value={draft.publishedAt}
            onChange={(event) => {
              setDraft({ ...draft, publishedAt: event.target.value });
              clearError('publishedAt');
            }}
            error={errors.publishedAt}
            helperText={errors.publishedAt ? undefined : 'The collection goes live at this time.'}
          />
        )}

        <Textarea
          label="Editorial Description"
          rows={3}
          placeholder="Describe the mood, materials, and styling of this release…"
          value={draft.description}
          onChange={(event) => setDraft({ ...draft, description: event.target.value })}
          helperText="Shown on the storefront collection page."
        />

        <SearchableMultiSelect
          label="Products in this Collection"
          options={productOptions}
          value={draft.productIds}
          onChange={(productIds) => setDraft({ ...draft, productIds })}
          searchable
          placeholder="Select products…"
          searchPlaceholder="Search by name or category…"
          emptyText="No products match your search."
          helperText="Selection order becomes the storefront display order."
        />

        {formError && (
          <p role="alert" style={{ margin: 0, fontSize: 13, color: 'var(--tuw-text-error, #C91818)' }}>
            {formError}
          </p>
        )}
      </form>
    </Drawer>
  );
}

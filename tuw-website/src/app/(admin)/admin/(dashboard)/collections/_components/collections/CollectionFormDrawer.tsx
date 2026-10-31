'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button, Drawer, Input, SearchableMultiSelect, SearchableSelect, Textarea } from '@admin/components/ui';
import type { SearchableSelectOption } from '@admin/components/ui';
import { useAdminState } from '@admin/mocks/state';
import type { CollectionItem } from '@admin/mocks/fixtures';
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
}

export default function CollectionFormDrawer({
  isOpen,
  collection,
  onClose,
  onSaved,
}: CollectionFormDrawerProps) {
  const { collections, products, createCollection, updateCollection } = useAdminState();
  const [draft, setDraft] = useState<CollectionDraft>(emptyDraft);
  const [errors, setErrors] = useState<CollectionDraftErrors>({});

  useEffect(() => {
    if (!isOpen) return;
    setDraft(collection ? draftFromCollection(collection, products) : emptyDraft());
    setErrors({});
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

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors = validateDraft(draft, collections, collection?.id);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const payload = draftToPayload(draft);
    // A refused mutation (demo role gate) keeps this drawer open with every
    // input preserved — only a real success closes it.
    const saved = collection ? updateCollection(collection.id, payload) : createCollection(payload);
    if (!saved) return;

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
          <Button variant="primary" size="md" type="submit" form="collection-form">
            {collection ? 'Save Changes' : 'Create Collection'}
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

        <p
          style={{
            margin: 0,
            fontSize: 12,
            color: 'var(--tuw-text-secondary, #5D6772)',
            fontFamily: 'var(--font-main)',
          }}
        >
          Demo workspace — changes are stored locally in this browser only.
        </p>
      </form>
    </Drawer>
  );
}

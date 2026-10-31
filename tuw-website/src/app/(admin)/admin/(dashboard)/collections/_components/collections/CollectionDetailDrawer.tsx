'use client';

import React from 'react';
import {
  Badge,
  Button,
  Drawer,
  DrawerSection,
  EmptyState,
  HeroCard,
  ImageWithFallback,
  ItemsRow,
  KeyValueList,
} from '@admin/components/ui';
import { Edit3, Layers } from 'lucide-react';
import type { CollectionItem, ProductItem } from '@admin/mocks/fixtures';
import { collectionCount, resolveCollectionProducts } from '@admin/lib/collections';

export interface CollectionDetailDrawerProps {
  collection: CollectionItem | null;
  products: ProductItem[];
  canEdit: boolean;
  onClose: () => void;
  onEdit: (id: string) => void;
}

function visibilityBadge(visibility: CollectionItem['visibility']) {
  if (visibility === 'published') return <Badge variant="success">Published</Badge>;
  if (visibility === 'scheduled') return <Badge variant="info">Scheduled</Badge>;
  return <Badge variant="neutral">Draft</Badge>;
}

export default function CollectionDetailDrawer({
  collection,
  products,
  canEdit,
  onClose,
  onEdit,
}: CollectionDetailDrawerProps) {
  const resolved = collection ? resolveCollectionProducts(collection, products) : [];

  return (
    <Drawer
      isOpen={Boolean(collection)}
      onClose={onClose}
      title={collection ? collection.name : 'Collection Detail'}
      subtitle={collection ? `${collection.season} · /${collection.slug}` : ''}
      footer={
        collection ? (
          <>
            <Button variant="secondary" size="md" onClick={onClose}>
              Close
            </Button>
            {canEdit && (
              <Button
                variant="primary"
                size="md"
                icon={<Edit3 size={16} />}
                onClick={() => onEdit(collection.id)}
              >
                Edit Collection
              </Button>
            )}
          </>
        ) : undefined
      }
    >
      {collection && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <HeroCard>
            <div>
              <div style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                Editorial Overview
              </div>
              {collection.description ? (
                <p
                  style={{
                    fontSize: 14,
                    color: 'var(--tuw-text-primary, #262626)',
                    marginTop: 4,
                    lineHeight: 1.5,
                  }}
                >
                  {collection.description}
                </p>
              ) : (
                <p
                  style={{
                    fontSize: 13,
                    color: 'var(--tuw-text-secondary, #5D6772)',
                    marginTop: 4,
                    lineHeight: 1.5,
                  }}
                >
                  No editorial description yet. Use Edit to add one.
                </p>
              )}
            </div>
          </HeroCard>

          <DrawerSection
            title={`Included Products (${collectionCount(collection)})`}
            titleGap={10}
          >
            {resolved.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {resolved.map((product, index) => (
                  <ItemsRow
                    key={product.id}
                    pad={10}
                    left={
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          minWidth: 0,
                        }}
                      >
                        <span
                          style={{
                            width: 20,
                            flexShrink: 0,
                            fontSize: 11,
                            fontVariantNumeric: 'tabular-nums',
                            color: 'var(--tuw-text-tertiary, #9CA3AF)',
                          }}
                        >
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            flexShrink: 0,
                            overflow: 'hidden',
                            borderRadius: 8,
                            border: '1px solid var(--tuw-border-subtle, #E5E7EB)',
                          }}
                        >
                          <ImageWithFallback
                            src={product.images[0]}
                            alt={product.name}
                            fallbackText=""
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              minHeight: 36,
                              padding: 0,
                            }}
                          />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                          <span
                            style={{
                              fontSize: 14,
                              fontWeight: 600,
                              color: 'var(--tuw-text-primary, #262626)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {product.name}
                          </span>
                          <span
                            style={{
                              fontSize: 12,
                              color: 'var(--tuw-text-secondary, #5D6772)',
                            }}
                          >
                            {product.category}
                          </span>
                        </div>
                      </div>
                    }
                    right={
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 14,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        ₹{product.price.toFixed(2)}
                      </div>
                    }
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Layers size={20} />}
                title="No products linked yet"
                description="Curate this collection by adding products from your catalog."
                actionText={canEdit ? 'Add Products' : undefined}
                onAction={canEdit ? () => onEdit(collection.id) : undefined}
                style={{ padding: '28px 16px' }}
              />
            )}
          </DrawerSection>

          <DrawerSection title="Collection Metadata" titleGap={10}>
            <KeyValueList
              divided
              items={[
                { label: 'Season', value: collection.season },
                {
                  label: 'Slug',
                  value: (
                    <span style={{ fontFamily: 'monospace' }}>/{collection.slug}</span>
                  ),
                },
                { label: 'Visibility', value: visibilityBadge(collection.visibility) },
                { label: 'Last updated', value: collection.updatedAt },
                { label: 'Products', value: `${collectionCount(collection)} items` },
              ]}
            />
          </DrawerSection>
        </div>
      )}
    </Drawer>
  );
}

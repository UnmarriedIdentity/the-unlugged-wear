'use client';

import React from 'react';
import { ImageWithFallback } from '@/components/ui';
import type {
  BlogContent,
  BlogInlineNode,
  BlogMediaAsset,
} from '@/lib/blog';

interface BlogContentPreviewProps {
  content: BlogContent;
  mediaAssets: BlogMediaAsset[];
}

const linkStyle: React.CSSProperties = {
  color: 'var(--tuw-action-primary, #7539FF)',
  fontWeight: 500,
};

function renderInline(node: BlogInlineNode, key: number): React.ReactNode {
  let node2: React.ReactNode = node.text;
  for (const mark of node.marks ?? []) {
    switch (mark.type) {
      case 'bold':
        node2 = <strong key={`mark-bold-${key}`}>{node2}</strong>;
        break;
      case 'italic':
        node2 = <em key={`mark-italic-${key}`}>{node2}</em>;
        break;
      case 'underline':
        node2 = <u key={`mark-underline-${key}`}>{node2}</u>;
        break;
      case 'strikethrough':
        node2 = <s key={`mark-strike-${key}`}>{node2}</s>;
        break;
      case 'link': {
        const href = mark.attrs?.href ?? '#';
        const isExternal = /^https?:\/\//i.test(href);
        node2 = (
          <a
            key={`mark-link-${key}`}
            href={href}
            style={linkStyle}
            {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer nofollow' } : {})}
          >
            {node2}
          </a>
        );
        break;
      }
      default:
        break;
    }
  }
  return <React.Fragment key={`text-${key}`}>{node2}</React.Fragment>;
}

function renderInlineList(nodes: BlogInlineNode[] | undefined) {
  return (nodes ?? []).map((node, index) => renderInline(node, index));
}

export default function BlogContentPreview({
  content,
  mediaAssets,
}: BlogContentPreviewProps) {
  const mediaById = new Map(mediaAssets.map((asset) => [asset.id, asset]));

  return (
    <article
      style={{
        color: 'var(--tuw-text-primary, #262626)',
        fontSize: 15,
        lineHeight: 1.7,
      }}
    >
      {content.length === 0 ? (
        <p style={{ color: 'var(--tuw-text-secondary, #5D6772)' }}>
          The article body is empty.
        </p>
      ) : (
        content.map((block, index) => {
          const key = `block-${index}`;
          switch (block.type) {
            case 'paragraph':
              return <p key={key}>{renderInlineList(block.content)}</p>;
            case 'heading':
              return block.attrs.level === 2 ? (
                <h2 key={key} style={{ fontSize: 22, fontWeight: 600, marginTop: 24, marginBottom: 12 }}>
                  {renderInlineList(block.content)}
                </h2>
              ) : (
                <h3 key={key} style={{ fontSize: 18, fontWeight: 600, marginTop: 20, marginBottom: 8 }}>
                  {renderInlineList(block.content)}
                </h3>
              );
            case 'bulletList':
              return (
                <ul key={key} style={{ margin: '16px 0', paddingLeft: 24 }}>
                  {(block.content ?? []).map((item, itemIndex) => (
                    <li key={`item-${itemIndex}`}>{renderInlineList(item.content)}</li>
                  ))}
                </ul>
              );
            case 'orderedList':
              return (
                <ol key={key} style={{ margin: '16px 0', paddingLeft: 24 }}>
                  {(block.content ?? []).map((item, itemIndex) => (
                    <li key={`item-${itemIndex}`}>{renderInlineList(item.content)}</li>
                  ))}
                </ol>
              );
            case 'blockquote':
              return (
                <blockquote
                  key={key}
                  style={{
                    margin: '16px 0',
                    paddingLeft: 16,
                    borderLeft: '4px solid var(--tuw-border-subtle, #E2E4E6)',
                    fontStyle: 'italic',
                    color: 'var(--tuw-text-secondary, #5D6772)',
                  }}
                >
                  {renderInlineList(block.content)}
                </blockquote>
              );
            case 'image': {
              const asset = mediaById.get(block.attrs.mediaId);
              if (!asset) return null;
              return (
                <figure key={key} style={{ margin: '20px 0' }}>
                  <ImageWithFallback
                    src={asset.url}
                    alt={block.attrs.alt}
                    width={900}
                    height={500}
                    style={{
                      width: '100%',
                      height: 'auto',
                      borderRadius: 12,
                      border: '1px solid var(--tuw-border-subtle, #E2E4E6)',
                    }}
                  />
                  {(block.attrs.caption || block.attrs.credit) && (
                    <figcaption
                      style={{
                        marginTop: 6,
                        fontSize: 12,
                        color: 'var(--tuw-text-secondary, #5D6772)',
                      }}
                    >
                      {block.attrs.caption}
                      {block.attrs.credit ? ` · ${block.attrs.credit}` : ''}
                    </figcaption>
                  )}
                </figure>
              );
            }
            case 'horizontalRule':
              return (
                <hr
                  key={key}
                  style={{
                    margin: '24px 0',
                    border: 'none',
                    borderTop: '1px solid var(--tuw-border-subtle, #E2E4E6)',
                  }}
                />
              );
            default:
              return null;
          }
        })
      )}
    </article>
  );
}

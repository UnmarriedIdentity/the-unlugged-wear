import React from 'react';
import type {
  JournalContent,
  JournalInlineNode,
  JournalMediaAsset,
} from '@/lib/blog';

interface JournalRichTextProps {
  content: JournalContent;
  media: JournalMediaAsset[];
}

interface RenderedInlineProps {
  node: JournalInlineNode;
}

const linkStyle = {
  color: 'var(--tuw-store-text-primary)',
  textDecoration: 'underline',
  textDecorationColor: 'var(--tuw-store-accent)',
  textDecorationThickness: '1px',
  textUnderlineOffset: '2px',
  transition: 'text-decoration-color 0.15s ease, color 0.15s ease',
} as const;

function renderInlineNodes(nodes: JournalInlineNode[] | undefined) {
  if (!nodes?.length) return null;

  return nodes.map((node, nodeIndex) => {
    let rendered: React.ReactNode = node.text;

    (node.marks ?? []).forEach((mark, markIndex) => {
      const key = `${nodeIndex}-${markIndex}`;
      switch (mark.type) {
        case 'bold':
          rendered = <strong key={key}>{rendered}</strong>;
          break;
        case 'italic':
          rendered = <em key={key}>{rendered}</em>;
          break;
        case 'underline':
          rendered = <u key={key}>{rendered}</u>;
          break;
        case 'strikethrough':
          rendered = <s key={key}>{rendered}</s>;
          break;
        case 'link': {
          const href = mark.attrs?.href ?? '#';
          const isExternal = /^https?:\/\//i.test(href);
          rendered = (
            <a
              key={key}
              href={href}
              style={linkStyle}
              {...(isExternal
                ? { target: '_blank', rel: 'noopener noreferrer nofollow' }
                : {})}
            >
              {rendered}
            </a>
          );
          break;
        }
        default:
          break;
      }
    });

    return <React.Fragment key={nodeIndex}>{rendered}</React.Fragment>;
  });
}

export default function JournalRichText({ content, media }: JournalRichTextProps) {
  const mediaById = new Map(media.map((asset) => [asset.id, asset]));

  return (
    <div className="tuw-journal-prose">
      {content.length === 0 ? (
        <p className="text-[#666]">This article does not have a body yet.</p>
      ) : (
        content.map((block, index) => {
          const key = `block-${index}`;
          switch (block.type) {
            case 'paragraph':
              return <p key={key}>{renderInlineNodes(block.content)}</p>;

            case 'heading':
              return block.attrs.level === 2 ? (
                <h2 key={key}>{renderInlineNodes(block.content)}</h2>
              ) : (
                <h3 key={key}>{renderInlineNodes(block.content)}</h3>
              );

            case 'bulletList':
              return (
                <ul key={key}>
                  {(block.content ?? []).map((item, itemIndex) => (
                    <li key={itemIndex}>{renderInlineNodes(item.content)}</li>
                  ))}
                </ul>
              );

            case 'orderedList':
              return (
                <ol key={key}>
                  {(block.content ?? []).map((item, itemIndex) => (
                    <li key={itemIndex}>{renderInlineNodes(item.content)}</li>
                  ))}
                </ol>
              );

            case 'blockquote':
              return (
                <blockquote key={key}>
                  {renderInlineNodes(block.content)}
                </blockquote>
              );

            case 'image': {
              const asset = mediaById.get(block.attrs.mediaId);
              if (!asset) return null;
              return (
                <figure key={key}>
                  <img
                    src={asset.url}
                    alt={block.attrs.alt}
                    loading="lazy"
                    decoding="async"
                  />
                  {(block.attrs.caption || block.attrs.credit) && (
                    <figcaption>
                      {block.attrs.caption}
                      {block.attrs.credit ? (
                        <span className="tuw-journal-prose-credit">
                          {' '}
                          · {block.attrs.credit}
                        </span>
                      ) : null}
                    </figcaption>
                  )}
                </figure>
              );
            }

            case 'horizontalRule':
              return <hr key={key} />;

            default:
              return null;
          }
        })
      )}
    </div>
  );
}

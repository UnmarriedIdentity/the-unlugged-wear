'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  useEditor,
  EditorContent,
  type JSONContent,
} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Minus,
  Undo2,
  Redo2,
  Link2,
  Image as ImageIcon,
  Heading2,
  Heading3,
  X,
} from 'lucide-react';
import { ImageWithFallback, Modal } from '@/components/ui';
import type {
  BlogBlockNode,
  BlogContent,
  BlogInlineMark,
  BlogInlineNode,
  BlogListItem,
  BlogMediaAsset,
} from '@/lib/blog';

const EditorImage = ImageExtension.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      mediaId: { default: null },
      caption: { default: null },
      credit: { default: null },
    };
  },
});

const MODEL_MARK_TYPES = new Set<BlogInlineMark['type']>([
  'bold',
  'italic',
  'underline',
  'strikethrough',
  'link',
]);

type TiptapMark = NonNullable<JSONContent['marks']>[number];

function markToTiptap(mark: BlogInlineMark): TiptapMark {
  return {
    type: mark.type === 'strikethrough' ? 'strike' : mark.type,
    ...(mark.attrs?.href ? { attrs: { href: mark.attrs.href } } : {}),
  };
}

function markFromTiptap(mark: TiptapMark): BlogInlineMark | null {
  const type = mark.type === 'strike' ? 'strikethrough' : mark.type;
  if (!type || !MODEL_MARK_TYPES.has(type as BlogInlineMark['type'])) return null;
  const href = typeof mark.attrs?.href === 'string' ? mark.attrs.href : undefined;
  return {
    type: type as BlogInlineMark['type'],
    ...(href ? { attrs: { href } } : {}),
  };
}

function inlineToTiptap(nodes: BlogInlineNode[] | undefined): JSONContent[] {
  return (nodes ?? []).map((node) => ({
    type: 'text',
    text: node.text,
    ...(node.marks?.length
      ? { marks: node.marks.map((mark) => markToTiptap(mark)) }
      : {}),
  }));
}

function inlineFromTiptap(nodes: JSONContent[] | undefined): BlogInlineNode[] {
  return (nodes ?? []).flatMap((node) => {
    if (node.type === 'hardBreak') {
      return [{ type: 'text', text: ' ' }];
    }
    if (node.type !== 'text') return [];
    const marks = (node.marks ?? [])
      .map((mark) => markFromTiptap(mark))
      .filter((mark): mark is BlogInlineMark => Boolean(mark));
    return [{
      type: 'text',
      text: node.text ?? '',
      ...(marks.length ? { marks } : {}),
    }];
  });
}

function listToTiptap(items: BlogListItem[] | undefined): JSONContent[] {
  return (items ?? []).map((item) => ({
    type: 'listItem',
    content: [{ type: 'paragraph', content: inlineToTiptap(item.content) }],
  }));
}

function listFromTiptap(nodes: JSONContent[] | undefined): BlogListItem[] {
  return (nodes ?? []).map((node) => {
    const paragraphs = (node.content ?? []).flatMap((child) =>
      child.type === 'paragraph' ? child.content ?? [] : []
    );
    return { type: 'listItem', content: inlineFromTiptap(paragraphs) };
  });
}

function blockToTiptap(block: BlogBlockNode, mediaById: Map<string, BlogMediaAsset>): JSONContent | null {
  switch (block.type) {
    case 'paragraph':
      return { type: 'paragraph', content: inlineToTiptap(block.content) };
    case 'heading':
      return {
        type: 'heading',
        attrs: { level: block.attrs.level },
        content: inlineToTiptap(block.content),
      };
    case 'bulletList':
      return { type: 'bulletList', content: listToTiptap(block.content) };
    case 'orderedList':
      return { type: 'orderedList', content: listToTiptap(block.content) };
    case 'blockquote':
      return {
        type: 'blockquote',
        content: [{ type: 'paragraph', content: inlineToTiptap(block.content) }],
      };
    case 'image': {
      const asset = mediaById.get(block.attrs.mediaId);
      return {
        type: 'image',
        attrs: {
          src: asset?.url ?? '',
          alt: block.attrs.alt,
          mediaId: block.attrs.mediaId,
          caption: block.attrs.caption ?? null,
          credit: block.attrs.credit ?? null,
        },
      };
    }
    case 'horizontalRule':
      return { type: 'horizontalRule' };
    default:
      return null;
  }
}

/**
 * Our persisted body is a compact block array. Tiptap expects a full
 * ProseMirror document (`{ type: 'doc', content: [...] }`), so convert at the
 * editor boundary and keep media URLs out of the stored JSON.
 */
function toTiptapDoc(content: BlogContent, mediaAssets: BlogMediaAsset[]): JSONContent {
  const mediaById = new Map(mediaAssets.map((asset) => [asset.id, asset]));
  return {
    type: 'doc',
    content: content
      .map((block) => blockToTiptap(block, mediaById))
      .filter((block): block is JSONContent => Boolean(block)),
  };
}

function toBlogContent(doc: JSONContent): BlogContent {
  return (doc.content ?? []).flatMap((node): BlogBlockNode[] => {
    switch (node.type) {
      case 'paragraph':
        return [{ type: 'paragraph', content: inlineFromTiptap(node.content) }];
      case 'heading': {
        const level = node.attrs?.level === 3 ? 3 : 2;
        return [{ type: 'heading', attrs: { level }, content: inlineFromTiptap(node.content) }];
      }
      case 'bulletList':
        return [{ type: 'bulletList', content: listFromTiptap(node.content) }];
      case 'orderedList':
        return [{ type: 'orderedList', content: listFromTiptap(node.content) }];
      case 'blockquote': {
        const paragraphs = (node.content ?? []).flatMap((child) =>
          child.type === 'paragraph' ? child.content ?? [] : []
        );
        return [{ type: 'blockquote', content: inlineFromTiptap(paragraphs) }];
      }
      case 'image': {
        const mediaId = typeof node.attrs?.mediaId === 'string' ? node.attrs.mediaId : '';
        if (!mediaId) return [];
        const alt = typeof node.attrs?.alt === 'string' ? node.attrs.alt : '';
        const caption = typeof node.attrs?.caption === 'string' ? node.attrs.caption : undefined;
        const credit = typeof node.attrs?.credit === 'string' ? node.attrs.credit : undefined;
        return [{
          type: 'image',
          attrs: {
            mediaId,
            alt,
            ...(caption ? { caption } : {}),
            ...(credit ? { credit } : {}),
          },
        }];
      }
      case 'horizontalRule':
        return [{ type: 'horizontalRule' }];
      default:
        return [];
    }
  });
}

interface RichTextEditorProps {
  content: BlogContent;
  mediaAssets: BlogMediaAsset[];
  onChange: (content: BlogContent) => void;
  placeholder?: string;
  disabled?: boolean;
}

const toolbarButtonStyle = (
  active: boolean,
  disabled = false
): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 32,
  height: 32,
  borderRadius: 8,
  border: 'none',
  cursor: disabled ? 'not-allowed' : 'pointer',
  backgroundColor: active
    ? 'var(--tuw-bg-selected, #F8F5FF)'
    : 'transparent',
  color: active
    ? 'var(--tuw-action-primary, #7539FF)'
    : 'var(--tuw-text-secondary, #5D6772)',
  opacity: disabled ? 0.4 : 1,
  transition: 'background-color 0.15s ease, color 0.15s ease',
});

export default function RichTextEditor({
  content,
  mediaAssets,
  onChange,
  placeholder = 'Write the editorial body…',
  disabled = false,
}: RichTextEditorProps) {
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkHref, setLinkHref] = useState('');

  const initialContent = useMemo(
    () => toTiptapDoc(content, mediaAssets),
    [content, mediaAssets]
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: {
            rel: 'noopener noreferrer nofollow',
            target: '_blank',
          },
        },
      }),
      EditorImage.configure({ inline: false }),
    ],
    content: initialContent,
    editable: !disabled,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        'aria-label': 'Article body editor',
        class:
          'blog-editor-content min-h-[360px] w-full bg-transparent px-5 py-4 text-[15px] leading-7 text-[var(--tuw-text-primary,#262626)] outline-none [&_a]:font-medium [&_a]:text-[var(--tuw-action-primary,#7539FF)] [&_a]:underline [&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-[var(--tuw-border-subtle,#E2E4E6)] [&_blockquote]:pl-4 [&_blockquote]:text-[16px] [&_blockquote]:italic [&_blockquote]:text-[var(--tuw-text-secondary,#5D6772)] [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:text-[22px] [&_h2]:font-semibold [&_h3]:mt-5 [&_h3]:mb-2 [&_h3]:text-[18px] [&_h3]:font-semibold [&_hr]:my-6 [&_hr]:border-0 [&_hr]:border-t [&_hr]:border-[var(--tuw-border-subtle,#E2E4E6)] [&_img]:my-4 [&_img]:w-full [&_img]:rounded-[12px] [&_img]:border [&_img]:border-[var(--tuw-border-subtle,#E2E4E6)] [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-3 [&_p.is-editor-empty:first-child::before]:float-left [&_p.is-editor-empty:first-child::before]:h-0 [&_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_p.is-editor-empty:first-child::before]:pointer-events-none [&_p.is-editor-empty:first-child::before]:text-[var(--tuw-text-tertiary,#9CA3AF)] [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6',
      },
    },
    onUpdate: ({ editor: nextEditor }) => {
      onChange(toBlogContent(nextEditor.getJSON()));
    },
  });

  useEffect(() => {
    if (!editor || disabled === editor.isEditable) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  useEffect(() => {
    if (!editor) return;
    if (JSON.stringify(editor.getJSON()) === JSON.stringify(initialContent)) return;
    editor.commands.setContent(initialContent, { emitUpdate: false });
  }, [initialContent, editor]);

  const insertMedia = (asset: BlogMediaAsset) => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .insertContent({
        type: 'image',
        attrs: {
          src: asset.url,
          alt: asset.alt,
          mediaId: asset.id,
          caption: asset.caption,
          credit: asset.credit,
        },
      })
      .run();
    setIsImagePickerOpen(false);
  };

  const openLinkDialog = () => {
    if (!editor) return;
    const existingHref = (editor.getAttributes('link').href as string | undefined) ?? '';
    setLinkHref(existingHref);
    setIsLinkDialogOpen(true);
  };

  const applyLink = () => {
    if (!editor) return;
    const href = linkHref.trim();
    if (!href) {
      editor.chain().focus().unsetLink().run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({
          href: /^https?:\/\//i.test(href)
            ? href
            : href.startsWith('/')
              ? href
              : `https://${href}`,
        })
        .run();
    }
    setIsLinkDialogOpen(false);
  };

  return (
    <div
      style={{
        border: '1px solid var(--tuw-border-subtle, #E2E4E6)',
        borderRadius: 'var(--tuw-radius-card, 16px)',
        backgroundColor: 'var(--tuw-bg-surface, #FFFFFF)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 4,
          padding: '10px 12px',
          borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)',
          backgroundColor: 'var(--tuw-bg-canvas, #F7F8F9)',
        }}
      >
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBold().run()}
          disabled={disabled}
          aria-label="Bold"
          style={toolbarButtonStyle(Boolean(editor?.isActive('bold')), disabled)}
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          disabled={disabled}
          aria-label="Italic"
          style={toolbarButtonStyle(Boolean(editor?.isActive('italic')), disabled)}
        >
          <Italic size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
          disabled={disabled}
          aria-label="Underline"
          style={toolbarButtonStyle(Boolean(editor?.isActive('underline')), disabled)}
        >
          <Underline size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleStrike().run()}
          disabled={disabled}
          aria-label="Strikethrough"
          style={toolbarButtonStyle(Boolean(editor?.isActive('strike')), disabled)}
        >
          <Strikethrough size={16} />
        </button>

        <span style={{ width: 1, height: 20, backgroundColor: 'var(--tuw-border-subtle, #E2E4E6)' }} />

        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          disabled={disabled}
          aria-label="Heading 2"
          style={toolbarButtonStyle(
            Boolean(editor?.isActive('heading', { level: 2 })),
            disabled
          )}
        >
          <Heading2 size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
          disabled={disabled}
          aria-label="Heading 3"
          style={toolbarButtonStyle(
            Boolean(editor?.isActive('heading', { level: 3 })),
            disabled
          )}
        >
          <Heading3 size={16} />
        </button>

        <span style={{ width: 1, height: 20, backgroundColor: 'var(--tuw-border-subtle, #E2E4E6)' }} />

        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          disabled={disabled}
          aria-label="Bullet list"
          style={toolbarButtonStyle(
            Boolean(editor?.isActive('bulletList')),
            disabled
          )}
        >
          <List size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          disabled={disabled}
          aria-label="Numbered list"
          style={toolbarButtonStyle(
            Boolean(editor?.isActive('orderedList')),
            disabled
          )}
        >
          <ListOrdered size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          disabled={disabled}
          aria-label="Blockquote"
          style={toolbarButtonStyle(
            Boolean(editor?.isActive('blockquote')),
            disabled
          )}
        >
          <Quote size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().setHorizontalRule().run()}
          disabled={disabled}
          aria-label="Divider"
          style={toolbarButtonStyle(false, disabled)}
        >
          <Minus size={16} />
        </button>

        <span style={{ width: 1, height: 20, backgroundColor: 'var(--tuw-border-subtle, #E2E4E6)' }} />

        <button
          type="button"
          onClick={openLinkDialog}
          disabled={disabled}
          aria-label="Add link"
          style={toolbarButtonStyle(Boolean(editor?.isActive('link')), disabled)}
        >
          <Link2 size={16} />
        </button>
        <button
          type="button"
          onClick={() => setIsImagePickerOpen(true)}
          disabled={disabled}
          aria-label="Insert image"
          style={toolbarButtonStyle(Boolean(editor?.isActive('image')), disabled)}
        >
          <ImageIcon size={16} />
        </button>

        <span style={{ width: 1, height: 20, backgroundColor: 'var(--tuw-border-subtle, #E2E4E6)' }} />

        <button
          type="button"
          onClick={() => editor?.chain().focus().undo().run()}
          disabled={disabled || !editor?.can().undo()}
          aria-label="Undo"
          style={toolbarButtonStyle(false, disabled || !editor?.can().undo())}
        >
          <Undo2 size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().redo().run()}
          disabled={disabled || !editor?.can().redo()}
          aria-label="Redo"
          style={toolbarButtonStyle(false, disabled || !editor?.can().redo())}
        >
          <Redo2 size={16} />
        </button>
      </div>

      <EditorContent editor={editor} />

      <Modal
        isOpen={isImagePickerOpen}
        onClose={() => setIsImagePickerOpen(false)}
        title="Insert editorial image"
        subtitle="Images reference the media library by id and always carry alt text."
        maxWidth="720px"
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {mediaAssets.map((asset) => (
            <button
              key={asset.id}
              type="button"
              onClick={() => insertMedia(asset)}
              style={{
                textAlign: 'left',
                border: '1px solid var(--tuw-border-subtle, #E2E4E6)',
                borderRadius: 12,
                overflow: 'hidden',
                backgroundColor: 'var(--tuw-bg-surface, #FFFFFF)',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <ImageWithFallback
                src={asset.url}
                alt={asset.alt}
                width={320}
                height={180}
                style={{ width: '100%', height: 140, objectFit: 'cover' }}
              />
              <div style={{ padding: '12px 14px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
                  {asset.alt}
                </div>
                {asset.caption && (
                  <div style={{ marginTop: 4, fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                    {asset.caption}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </Modal>

      <Modal
        isOpen={isLinkDialogOpen}
        onClose={() => setIsLinkDialogOpen(false)}
        title="Add link"
        subtitle="Use https:// for external links or / for an internal storefront path."
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
            Link URL
            <input
              value={linkHref}
              onChange={(event) => setLinkHref(event.target.value)}
              placeholder="https://theunpluggedwear.com/journal"
              style={{
                marginTop: 6,
                width: '100%',
                minHeight: 42,
                padding: '0 12px',
                border: '1px solid var(--tuw-border-control, #D1D5DB)',
                borderRadius: 8,
                backgroundColor: 'var(--tuw-bg-surface, #FFFFFF)',
                color: 'var(--tuw-text-primary, #262626)',
              }}
            />
          </label>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              type="button"
              onClick={() => setIsLinkDialogOpen(false)}
              style={{
                minHeight: 36,
                padding: '0 14px',
                borderRadius: 8,
                border: '1px solid var(--tuw-border-control, #D1D5DB)',
                backgroundColor: 'transparent',
                color: 'var(--tuw-text-primary, #262626)',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={applyLink}
              style={{
                minHeight: 36,
                padding: '0 14px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: 'var(--tuw-action-primary, #7539FF)',
                color: '#FFFFFF',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Apply link
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

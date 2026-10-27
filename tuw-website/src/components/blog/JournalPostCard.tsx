import Link from 'next/link';
import { ArrowRight, Clock } from 'lucide-react';
import type {
  JournalAuthor,
  JournalCategory,
  JournalPost,
  JournalTag,
} from '@/lib/blog';
import { formatJournalDate, formatReadingTime } from '@/lib/blog';

interface JournalPostCardProps {
  post: JournalPost;
  category?: JournalCategory;
  author?: JournalAuthor;
  tags: JournalTag[];
  mediaUrl?: string;
  priority?: boolean;
}

export default function JournalPostCard({
  post,
  category,
  author,
  tags,
  mediaUrl,
  priority = false,
}: JournalPostCardProps) {
  const coverUrl = mediaUrl ?? '/placeholder.svg';
  const coverAlt = post.coverMediaId ? `${post.title} cover image` : post.title;

  return (
    <Link
      href={`/journal/${post.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-[#E2DDCF] bg-white transition-colors hover:border-[#C8A96A] hover:shadow-[0_16px_40px_rgba(26,26,26,0.06)]"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-[#F4F1EA]">
        <img
          src={coverUrl}
          alt={coverAlt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        {category && (
          <span className="absolute left-4 top-4 rounded-full bg-[#1A1A1A]/85 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
            {category.name}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#8A8A8A]">
          <span>{formatJournalDate(post.publishedAt)}</span>
          <span aria-hidden="true">•</span>
          <span className="inline-flex items-center gap-1">
            <Clock size={12} />
            {formatReadingTime(post.readingTimeMinutes)}
          </span>
        </div>

        <h3 className="text-lg font-semibold leading-snug text-[#1A1A1A] group-hover:underline">
          {post.title}
        </h3>

        {post.subtitle && (
          <p className="mt-2 line-clamp-2 text-sm text-[#5D6772]">{post.subtitle}</p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {tags.slice(0, 3).map((tag) => (
            <span
              key={tag.id}
              className="rounded-full bg-[#F4F1EA] px-2.5 py-1 text-[11px] font-medium text-[#5A5A5A]"
            >
              {tag.name}
            </span>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-[#E2DDCF] pt-4 text-xs font-semibold text-[#1A1A1A]">
          <span>{author ? `By ${author.name}` : 'The Unplugged Wear'}</span>
          <span className="inline-flex items-center gap-1 transition-transform group-hover:translate-x-1">
            Read
            <ArrowRight size={14} />
          </span>
        </div>
      </div>
    </Link>
  );
}

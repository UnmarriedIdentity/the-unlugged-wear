import Link from 'next/link';
import { Search } from 'lucide-react';
import type {
  JournalAuthor,
  JournalCategory,
  JournalTag,
} from '@/lib/blog';

export type JournalSort = 'newest' | 'oldest' | 'featured';

export interface JournalFiltersProps {
  categories: JournalCategory[];
  authors: JournalAuthor[];
  tags: JournalTag[];
  activeCategory?: string;
  activeAuthor?: string;
  activeTag?: string;
  activeQuery?: string;
  activeSort?: JournalSort;
}

const sortOptions: Array<{ value: JournalSort; label: string }> = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'featured', label: 'Featured first' },
];

const pillStyle = 'px-4 py-2 rounded-full text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer whitespace-nowrap';

export default function JournalFilters({
  categories,
  authors,
  tags,
  activeCategory,
  activeAuthor,
  activeTag,
  activeQuery,
  activeSort = 'newest',
}: JournalFiltersProps) {
  const hasFilters = Boolean(
    activeCategory || activeAuthor || activeTag || activeQuery || activeSort !== 'newest'
  );

  return (
    <form
      action="/journal"
      method="get"
      className="rounded-3xl border border-[#E2DDCF] bg-white p-5 sm:p-6"
      aria-label="Filter journal articles"
    >
      <div className="flex flex-wrap items-center gap-2 pb-5 border-b border-[#E2DDCF]">
        <button
          type="submit"
          name="category"
          value=""
          className={`${pillStyle} ${
            !activeCategory
              ? 'bg-[#1A1A1A] text-white'
              : 'bg-[#F4F1EA] text-[#5A5A5A] hover:bg-[#EAE5D9]'
          }`}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            type="submit"
            name="category"
            value={category.slug}
            className={`${pillStyle} ${
              activeCategory === category.slug
                ? 'bg-[#1A1A1A] text-white'
                : 'bg-[#F4F1EA] text-[#5A5A5A] hover:bg-[#EAE5D9]'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-5">
        <div className="sm:col-span-2">
          <label
            htmlFor="journal-search"
            className="text-xs font-semibold uppercase tracking-wider text-[#5A5A5A]"
          >
            Search
          </label>
          <div className="relative mt-1.5">
            <input
              id="journal-search"
              type="search"
              name="q"
              defaultValue={activeQuery ?? ''}
              placeholder="Search cotton, slow living, POD…"
              className="w-full h-11 pl-10 pr-3 rounded-lg border border-[#E2DDCF] bg-white text-sm text-[#1A1A1A] placeholder:text-[#8A8A8A] focus:border-[#1A1A1A] focus:ring-2 focus:ring-[#1A1A1A]/10 outline-none transition-colors"
            />
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A8A8A] pointer-events-none"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="journal-author"
            className="text-xs font-semibold uppercase tracking-wider text-[#5A5A5A]"
          >
            Author
          </label>
          <select
            id="journal-author"
            name="author"
            defaultValue={activeAuthor ?? ''}
            className="mt-1.5 w-full h-11 px-3.5 rounded-lg border border-[#E2DDCF] bg-white text-sm text-[#1A1A1A] focus:border-[#1A1A1A] focus:ring-2 focus:ring-[#1A1A1A]/10 outline-none transition-colors cursor-pointer"
          >
            <option value="">All authors</option>
            {authors.map((author) => (
              <option key={author.id} value={author.slug}>
                {author.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="journal-tag"
            className="text-xs font-semibold uppercase tracking-wider text-[#5A5A5A]"
          >
            Tag
          </label>
          <select
            id="journal-tag"
            name="tag"
            defaultValue={activeTag ?? ''}
            className="mt-1.5 w-full h-11 px-3.5 rounded-lg border border-[#E2DDCF] bg-white text-sm text-[#1A1A1A] focus:border-[#1A1A1A] focus:ring-2 focus:ring-[#1A1A1A]/10 outline-none transition-colors cursor-pointer"
          >
            <option value="">All tags</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.slug}>
                {tag.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="journal-sort"
            className="text-xs font-semibold uppercase tracking-wider text-[#5A5A5A]"
          >
            Sort
          </label>
          <select
            id="journal-sort"
            name="sort"
            defaultValue={activeSort}
            className="mt-1.5 w-full h-11 px-3.5 rounded-lg border border-[#E2DDCF] bg-white text-sm text-[#1A1A1A] focus:border-[#1A1A1A] focus:ring-2 focus:ring-[#1A1A1A]/10 outline-none transition-colors cursor-pointer"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end gap-3">
          <button
            type="submit"
            className="h-11 px-5 rounded-lg bg-[#111111] text-white text-xs font-semibold uppercase tracking-wider hover:bg-black transition-colors"
          >
            Apply
          </button>
          {hasFilters && (
            <Link
              href="/journal"
              className="inline-flex h-11 items-center px-4 rounded-lg border border-[#E2DDCF] text-xs font-semibold uppercase tracking-wider text-[#5A5A5A] hover:text-[#1A1A1A] hover:bg-[#F4F1EA] transition-colors"
            >
              Clear
            </Link>
          )}
        </div>
      </div>
    </form>
  );
}

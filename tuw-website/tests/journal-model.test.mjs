import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  formatJournalDate,
  formatReadingTime,
  isPublishedJournalPost,
  relatedJournalPosts,
} from '../src/lib/blog.ts';

function makePost(overrides = {}) {
  return {
    id: 'JPOST-TEST',
    slug: 'test-post',
    title: 'Test post',
    authorId: 'JAUTH-TEST',
    content: [],
    contentSchemaVersion: 1,
    contentText: '',
    readingTimeMinutes: 3,
    status: 'published',
    isFeatured: false,
    publishedAt: '2026-01-01T00:00:00.000Z',
    tagIds: [],
    noindex: false,
    version: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('Storefront journal model', () => {
  test('formats reading time for minutes and hours', () => {
    assert.equal(formatReadingTime(0), '—');
    assert.equal(formatReadingTime(4), '4 min read');
    assert.equal(formatReadingTime(60), '1 hr read');
    assert.equal(formatReadingTime(75), '1 hr 15 min read');
  });

  test('formats dates in a stable UTC editorial style', () => {
    assert.equal(formatJournalDate('2026-09-24T08:00:00.000Z'), '24 September 2026');
    assert.equal(formatJournalDate(undefined), '—');
    assert.equal(formatJournalDate('not-a-date'), '—');
  });

  test('only exposes live published posts', () => {
    assert.equal(isPublishedJournalPost(makePost()), true);
    assert.equal(isPublishedJournalPost(makePost({ status: 'draft' })), false);
    assert.equal(isPublishedJournalPost(makePost({ status: 'scheduled' })), false);
    assert.equal(
      isPublishedJournalPost(makePost({ publishedAt: '2099-01-01T00:00:00.000Z' })),
      false,
    );
    assert.equal(isPublishedJournalPost(makePost({ publishedAt: 'invalid' })), false);
  });

  test('ranks related posts by category first, then shared tags', () => {
    const current = makePost({
      id: 'current',
      categoryId: 'JCAT-01',
      tagIds: ['JTAG-01', 'JTAG-02'],
    });
    const sameCategory = makePost({
      id: 'same-category',
      categoryId: 'JCAT-01',
      tagIds: [],
    });
    const sharedTags = makePost({
      id: 'shared-tags',
      categoryId: 'JCAT-02',
      tagIds: ['JTAG-01', 'JTAG-02'],
    });
    const noMatch = makePost({
      id: 'no-match',
      categoryId: 'JCAT-03',
      tagIds: ['JTAG-03'],
    });
    const draft = makePost({
      id: 'draft',
      status: 'draft',
      categoryId: 'JCAT-01',
    });

    const related = relatedJournalPosts(
      current,
      [noMatch, draft, sharedTags, sameCategory, current],
      3,
    );

    assert.deepEqual(
      related.map((post) => post.id),
      ['same-category', 'shared-tags', 'no-match'],
    );
    assert.equal(relatedJournalPosts(current, [sameCategory], 0).length, 0);
  });
});

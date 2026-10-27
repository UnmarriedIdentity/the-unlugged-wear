'use client';

import React from 'react';
import BlogEditor from '@/components/blog/BlogEditor';

export default function EditJournalPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = React.use(params);
  return <BlogEditor mode="edit" postId={resolvedParams.id} />;
}

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import DashboardShell from '@/components/layout/DashboardShell';
import { Button, ContentCard, Drawer, Input, PageHeader, Switch, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui';
import type { AdminCategory } from '@tuw/heart/modules/catalog';
import { deleteCategoryAction, saveCategoryAction } from '@/server/catalog-actions';

type Notice = { tone: 'ok' | 'warn' | 'error'; text: string };
const blank = { name: '', slug: '', sortOrder: '0' };

export default function CategoriesView({ initialCategories, canManage }: { initialCategories: AdminCategory[]; canManage: boolean }) {
  const [categories, setCategories] = useState(initialCategories);
  useEffect(() => setCategories(initialCategories), [initialCategories]);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<AdminCategory | 'new' | null>(null);
  const [form, setForm] = useState(blank);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const report = (storefront: { ok: true } | { ok: false; reason: string }, text: string) =>
    setNotice(storefront.ok ? { tone: 'ok', text: `${text} The storefront is up to date.` } : { tone: 'warn', text: `${text} ${storefront.reason} Shoppers will see it within the hour.` });

  const open = (c: AdminCategory | 'new') => {
    setEditing(c);
    setFieldErrors({});
    setForm(c === 'new' ? { ...blank, sortOrder: String(categories.length) } : { name: c.name, slug: c.slug, sortOrder: String(c.sortOrder) });
  };

  const toggle = async (c: AdminCategory, patch: Partial<Pick<AdminCategory, 'isActive' | 'showInNavbar' | 'showInMegamenu'>>) => {
    if (busy) return;
    setBusy(true);
    const result = await saveCategoryAction({ ...c, ...patch });
    setBusy(false);
    if (!result.ok) return setNotice({ tone: 'error', text: result.error.message });
    setCategories(result.data.categories);
    report(result.data.storefront, `"${c.name}" updated.`);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !editing) return;
    setBusy(true);
    const existing = editing === 'new' ? null : editing;
    const result = await saveCategoryAction({
      id: existing?.id, name: form.name, slug: form.slug, sortOrder: Number(form.sortOrder) || 0,
      isActive: existing?.isActive ?? true, showInNavbar: existing?.showInNavbar ?? false, showInMegamenu: existing?.showInMegamenu ?? true,
    });
    setBusy(false);
    if (!result.ok) {
      setFieldErrors(Object.fromEntries(result.error.details.filter((d) => d.field).map((d) => [d.field!, d.message])));
      if (!result.error.details.length) setNotice({ tone: 'error', text: result.error.message });
      return;
    }
    setCategories(result.data.categories);
    setEditing(null);
    report(result.data.storefront, `"${form.name}" saved.`);
  };

  const remove = async (c: AdminCategory) => {
    if (busy || !window.confirm(`Delete the category "${c.name}"?`)) return;
    setBusy(true);
    const result = await deleteCategoryAction({ id: c.id });
    setBusy(false);
    if (!result.ok) return setNotice({ tone: 'error', text: result.error.message });
    setCategories(result.data.categories);
    report(result.data.storefront, `"${c.name}" deleted.`);
  };

  return (
    <DashboardShell pageTitle="Categories" activeNav="products">
      <PageHeader
        title="Product Categories"
        eyebrow={<Link href="/products" style={{ color: 'var(--tuw-text-secondary, #5D6772)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}><ArrowLeft size={14} /> Back to Products</Link>}
        actions={canManage ? <Button variant="primary" size="md" icon={<Plus size={16} />} onClick={() => open('new')}>New Category</Button> : undefined}
      />
      {notice && (
        <div role={notice.tone === 'error' ? 'alert' : 'status'} style={{ padding: '12px 16px', borderRadius: 8, fontSize: 13, background: notice.tone === 'error' ? 'var(--tuw-bg-error, #FEF4F4)' : notice.tone === 'warn' ? 'var(--tuw-bg-warning, #FEFBF5)' : 'var(--tuw-bg-success, #F3FAF6)', color: notice.tone === 'error' ? 'var(--tuw-text-error, #C91818)' : notice.tone === 'warn' ? 'var(--tuw-text-warning, #856300)' : 'var(--tuw-text-success, #187343)' }}>
          {notice.text}
        </div>
      )}
      <ContentCard>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>In storefront menu</TableHead>
              <TableHead align="right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <div style={{ fontWeight: 600 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)' }}>/{c.slug}</div>
                </TableCell>
                <TableCell>{c.productCount}</TableCell>
                <TableCell>{c.sortOrder}</TableCell>
                <TableCell><Switch checked={c.isActive} disabled={!canManage || busy} ariaLabel={`${c.name} active`} onChange={(v) => void toggle(c, { isActive: v })} /></TableCell>
                <TableCell><Switch checked={c.showInMegamenu} disabled={!canManage || busy} ariaLabel={`Show ${c.name} in the storefront menu`} onChange={(v) => void toggle(c, { showInMegamenu: v })} /></TableCell>
                <TableCell align="right">
                  {canManage && (
                    <div style={{ display: 'inline-flex', gap: 8 }}>
                      <Button variant="secondary" size="sm" onClick={() => open(c)}>Edit</Button>
                      <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} aria-label={`Delete ${c.name}`} disabled={busy} onClick={() => void remove(c)} />
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ContentCard>
      <Drawer
        isOpen={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'New Category' : 'Edit Category'}
        width="440px"
        footer={<><Button variant="secondary" size="md" onClick={() => setEditing(null)}>Cancel</Button><Button variant="primary" size="md" type="submit" form="category-form" disabled={busy}>{busy ? 'Saving…' : 'Save'}</Button></>}
      >
        <form id="category-form" onSubmit={submit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="Name" value={form.name} required error={fieldErrors.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="URL slug" value={form.slug} error={fieldErrors.slug} helperText="Leave blank to build it from the name" onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          <Input label="Sort order" inputMode="numeric" value={form.sortOrder} error={fieldErrors.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />
        </form>
      </Drawer>
    </DashboardShell>
  );
}

'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { UserPlus, Download, Search, MapPin, Phone, Mail, Plus } from 'lucide-react';
import DashboardShell from '@/components/layout/DashboardShell';
import { StatCard, ContentCard, Button, Badge, Input, Drawer, Pagination, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, PageHeader, DrawerSection } from '@/components/ui';
import type { CustomerSummary, CustomerNote, Address, Household } from '@tuw/heart/modules/customers';
import { addCustomerNoteAction, createCustomerAction } from '@/server/customer-actions';

const styles = new Proxy<Record<string, string>>({}, { get: (_t, p) => 'sub-' + String(p) });

interface CustomersViewProps {
  list: { data: CustomerSummary[]; total: number; page: number; perPage: number };
  stats: { total: number; vip: number; lifetimeValuePaise: number; avgOrders: number };
  detail: { summary: CustomerSummary | null; addresses: Address[]; household: Household | null; notes: CustomerNote[] } | null;
  selectedId: string | null;
  query: string;
}

const inr = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const date = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { dateStyle: 'medium' });

// Customer directory on real data (TL-BE-03): the server page reads the
// list, stats and the open profile from the URL; this view renders them and
// calls the guarded actions, then refreshes.
export default function CustomersView({ list, stats, detail, selectedId, query }: CustomersViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isNavigating, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState(query);
  const [newNote, setNewNote] = useState('');
  const [noteError, setNoteError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [createKey, setCreateKey] = useState('');
  const [createMsg, setCreateMsg] = useState<{ tone: 'error' | 'ok'; text: string; link?: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({ name: '', email: '', phone: '', initialNote: '' });

  const setParams = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) if (v === null || v === '') next.delete(k); else next.set(k, v);
    startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  };

  // Debounced server-side search.
  useEffect(() => {
    if (searchTerm === query) return;
    const t = setTimeout(() => setParams({ q: searchTerm, page: null }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // The drawer opens on click with the row's summary; addresses, household
  // and notes stream in when the server render for ?customer= arrives.
  const [openId, setOpenId] = useState(selectedId);
  useEffect(() => setOpenId(selectedId), [selectedId]);
  const openProfile = (id: string | null) => { setOpenId(id); setParams({ customer: id }); };
  const ready = Boolean(openId) && detail?.summary?.profileId === openId;
  useEffect(() => setSavedNotes(null), [detail]); // fresh server data wins
  const selectedCustomer = (ready ? detail!.summary : null) ?? list.data.find((c) => c.profileId === openId) ?? null;
  const defaultAddress = ready ? (detail!.addresses.find((a) => a.isDefault) ?? detail!.addresses[0] ?? null) : null;
  // Notes saved here show at once from the action result (keyed by profile).
  const [savedNotes, setSavedNotes] = useState<{ profileId: string; notes: CustomerNote[] } | null>(null);
  const notes = savedNotes?.profileId === openId ? savedNotes.notes : ready ? detail!.notes : [];
  const totalPages = Math.max(1, Math.ceil(list.total / list.perPage));

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!openId || !newNote.trim() || pending) return;
    setPending(true);
    const result = await addCustomerNoteAction({ profileId: openId, note: newNote });
    setPending(false);
    if (!result.ok) return setNoteError(result.error.message);
    setNoteError(null);
    setNewNote('');
    setSavedNotes({ profileId: openId, notes: result.data });
  };

  const openCreate = () => {
    setCreateKey(crypto.randomUUID());
    setCreateMsg(null);
    setFieldErrors({});
    setIsAddModalOpen(true);
  };

  const handleCreateCustomer = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pending) return;
    setPending(true);
    const result = await createCustomerAction({ ...newCustomerForm, idempotencyKey: createKey });
    setPending(false);
    if (!result.ok) {
      // Drawer stays open and values are kept; each field shows its own error.
      setFieldErrors(Object.fromEntries(result.error.details.filter((d) => d.field).map((d) => [d.field!, d.message])));
      return setCreateMsg({ tone: 'error', text: result.error.message });
    }
    setFieldErrors({});
    setIsAddModalOpen(false);
    setCreateMsg({
      tone: 'ok',
      text: result.data.devLink ? `${newCustomerForm.email} was created. Email is not connected yet (development) — set-password link:` : `${newCustomerForm.email} was created and emailed a link to set a password.`,
      link: result.data.devLink ?? undefined,
    });
    setNewCustomerForm({ name: '', email: '', phone: '', initialNote: '' });
    router.refresh();
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Tier', 'Total Orders', 'Total Spent (INR)', 'City', 'Joined'];
    const rows = list.data.map((c) => [`"${c.name}"`, c.email ?? '', `"${c.phone ?? ''}"`, c.tier, c.orderCount, (c.totalSpentPaise / 100).toFixed(2), `"${c.city ?? ''}"`, c.joinedAt.slice(0, 10)]);
    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', `tuw_customers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardShell pageTitle="Customers" activeNav="customers">
      <PageHeader
        title="Customer Directory"
        actions={
          <>
            <Button variant="secondary" size="md" icon={<Download size={16} />} onClick={handleExportCSV}>
              <span>Export CSV</span>
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={<UserPlus size={16} />}
              onClick={openCreate}
            >
              <span>+ Add Customer</span>
            </Button>
          </>
        }
      />

      {createMsg?.tone === 'ok' && (
        <div role="status" style={{ padding: 12, borderRadius: 8, fontSize: 13, background: 'var(--tuw-bg-subtle, #F5F6F7)' }}>
          {createMsg.text}{' '}{createMsg.link && <a href={createMsg.link} style={{ fontWeight: 600, textDecoration: 'underline', wordBreak: 'break-all' }}>{createMsg.link}</a>}
        </div>
      )}

      <div className={styles.statGrid}>
        <StatCard label="Total Clients" value={String(stats.total)} trend="Customer accounts" trendType="up" hoverable />
        <StatCard label="VIP Clientele" value={String(stats.vip)} subtitle="₹25,000+ or 8+ orders" trendType="up" hoverable />
        <StatCard label="Total Customer LTV" value={inr(stats.lifetimeValuePaise)} trend="Paid orders, lifetime" trendType="up" hoverable />
        <StatCard label="Average Order Count" value={stats.avgOrders.toFixed(1)} subtitle="Orders per account" trendType="neutral" hoverable />
      </div>

      <ContentCard>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div style={{ maxWidth: 360, width: '100%' }}>
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              prefixIcon={<Search size={16} />}
            />
          </div>
          <span style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
            {isNavigating ? 'Searching…' : <>Showing <strong>{list.total}</strong> clients</>}
          </span>
        </div>

        <Table>
          <TableHeader>
            <TableRow hoverable={false}>
              <TableHead style={{ padding: '12px 16px' }}>Customer</TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Tier</TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Location</TableHead>
              <TableHead style={{ padding: '12px 16px', textAlign: 'center' }}>Orders</TableHead>
              <TableHead style={{ padding: '12px 16px', textAlign: 'right' }}>Total Spent</TableHead>
              <TableHead style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.data.length === 0 ? (
              <TableRow hoverable={false}>
                <TableCell colSpan={6} style={{ textAlign: 'center', padding: '48px 16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)', margin: 0 }}>
                      No customer records found
                    </p>
                    <p style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)', margin: 0 }}>
                      {query ? `No customers matched "${query}"` : 'Your customer directory is currently empty.'}
                    </p>
                    <Button variant="primary" size="md" icon={<UserPlus size={16} />} onClick={openCreate}>
                      <span>+ Add Customer</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              list.data.map((customer) => (
                <TableRow
                  key={customer.profileId}
                  onClick={() => openProfile(customer.profileId)}
                  style={{ cursor: 'pointer' }}
                >
                  <TableCell style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
                      {customer.name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                      {customer.email}
                    </div>
                  </TableCell>
                  <TableCell style={{ padding: '14px 16px' }}>
                    <Badge variant={customer.tier === 'VIP Customer' ? 'success' : 'info'}>
                      {customer.tier}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ padding: '14px 16px', fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                    {customer.city ?? '—'}
                  </TableCell>
                  <TableCell style={{ padding: '14px 16px', fontSize: 14, textAlign: 'center', color: 'var(--tuw-text-primary, #262626)' }}>
                    {customer.orderCount}
                  </TableCell>
                  <TableCell className="tuw-tabular-nums" style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)', textAlign: 'right' }}>
                    {inr(customer.totalSpentPaise)}
                  </TableCell>
                  <TableCell style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openProfile(customer.profileId); }}>
                      View Profile
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <Pagination
          currentPage={list.page}
          totalPages={totalPages}
          onPageChange={(p) => setParams({ page: String(p) })}
          totalItems={list.total}
          pageSize={list.perPage}
          pageSizeOptions={[5, 10, 20]}
          onPageSizeChange={(newSize) => setParams({ perPage: String(newSize), page: null })}
        />
      </ContentCard>

      {/* Customer Profile Drawer */}
      <Drawer
        isOpen={Boolean(openId)}
        onClose={() => openProfile(null)}
        title={selectedCustomer ? selectedCustomer.name : 'Customer Profile'}
        subtitle={selectedCustomer ? `${selectedCustomer.tier} · Member since ${date(selectedCustomer.joinedAt)}` : openId && !isNavigating ? 'Customer not found' : ''}
      >
        {selectedCustomer && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* LTV & Orders Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ padding: 14, backgroundColor: 'var(--tuw-bg-canvas, #F7F8F9)', borderRadius: 10 }}>
                <span style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)' }}>Total Spent</span>
                <div className="tuw-tabular-nums" style={{ fontSize: 20, fontWeight: 700, color: 'var(--tuw-text-primary, #262626)', marginTop: 2 }}>
                  {inr(selectedCustomer.totalSpentPaise)}
                </div>
              </div>
              <div style={{ padding: 14, backgroundColor: 'var(--tuw-bg-canvas, #F7F8F9)', borderRadius: 10 }}>
                <span style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)' }}>Orders Placed</span>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--tuw-text-primary, #262626)', marginTop: 2 }}>
                  {selectedCustomer.orderCount} orders
                </div>
              </div>
            </div>

            {/* Contact & Address */}
            <DrawerSection title="Contact & Shipping Details" titleGap={10}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Mail size={14} color="var(--tuw-action-primary, #7539FF)" />
                  <span>{selectedCustomer.email}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Phone size={14} color="var(--tuw-action-primary, #7539FF)" />
                  <span>{selectedCustomer.phone ?? 'No phone saved'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MapPin size={14} color="var(--tuw-action-primary, #7539FF)" />
                  <span>{!ready ? 'Loading…' : defaultAddress ? `${defaultAddress.line1}${defaultAddress.line2 ? `, ${defaultAddress.line2}` : ''}, ${defaultAddress.city} ${defaultAddress.postalCode}` : 'No saved address yet'}</span>
                </div>
                {ready && detail!.household && detail!.household.members.length > 1 && (
                  <div style={{ marginTop: 4 }}>Household: {detail!.household.members.map((m) => `${m.firstName}${m.role === 'manager' ? ' (manager)' : ''}`).join(', ')}</div>
                )}
              </div>
            </DrawerSection>

            {/* Purchase History — filled in when the orders module goes live (TL-BE-08) */}
            <DrawerSection title={`Recent Order History (${selectedCustomer.orderCount})`} titleGap={10}>
              <div style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)', padding: '12px 0' }}>
                {selectedCustomer.orderCount === 0 ? 'No orders yet.' : 'Order details appear here once the orders module is live.'}
              </div>
            </DrawerSection>

            {/* Internal Staff Notes */}
            <DrawerSection title="Internal Service Notes" titleGap={10}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                {notes.length === 0 && <div style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>{ready ? 'No notes yet.' : 'Loading…'}</div>}
                {notes.map((note) => (
                  <div
                    key={note.id}
                    style={{
                      padding: '10px 12px',
                      backgroundColor: 'var(--tuw-bg-selected, #F8F5FF)',
                      borderLeft: '3px solid var(--tuw-action-primary, #7539FF)',
                      borderRadius: 6,
                      fontSize: 13,
                      color: 'var(--tuw-text-primary, #262626)',
                    }}
                  >
                    {note.note}
                    <div style={{ fontSize: 11, color: 'var(--tuw-text-secondary, #5D6772)', marginTop: 4 }}>{note.authorName} · {date(note.createdAt)}</div>
                  </div>
                ))}
              </div>

              {noteError && <p role="alert" style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--tuw-text-error, #C91818)' }}>{noteError}</p>}
              <form onSubmit={handleAddNote} style={{ display: 'flex', gap: 8 }}>
                <Input
                  placeholder="Add a new service note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />
                <Button variant="secondary" size="md" icon={<Plus size={14} />} type="submit" disabled={pending}>
                  Save
                </Button>
              </form>
            </DrawerSection>
          </div>
        )}
      </Drawer>

      {/* Add Customer Drawer */}
      <Drawer
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Customer"
        subtitle="Creates the account and emails the customer a link to set their password."
        width="540px"
        footer={
          <>
            <Button variant="secondary" size="md" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit" form="customer-create-form" disabled={pending}>
              {pending ? 'Creating…' : 'Create Customer'}
            </Button>
          </>
        }
      >
        <form id="customer-create-form" onSubmit={handleCreateCustomer} style={{ display: 'flex', flexDirection: 'column', gap: 16 }} noValidate>
          {createMsg?.tone === 'error' && <p role="alert" style={{ margin: 0, fontSize: 13, color: 'var(--tuw-text-error, #C91818)' }}>{createMsg.text}</p>}
          <Input
            label="Full Name"
            placeholder="e.g. Maya Krishnan"
            value={newCustomerForm.name}
            onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
            error={fieldErrors.name}
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. maya@example.com"
              value={newCustomerForm.email}
              onChange={(e) => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
              error={fieldErrors.email}
              required
            />
            <Input
              label="Phone Number"
              placeholder="e.g. +91 98765 43210"
              value={newCustomerForm.phone}
              onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
              error={fieldErrors.phone}
            />
          </div>

          <Input
            label="Initial Staff Note (Optional)"
            placeholder="e.g. Inquired via slow luxury collection launch"
            value={newCustomerForm.initialNote}
            onChange={(e) => setNewCustomerForm({ ...newCustomerForm, initialNote: e.target.value })}
            error={fieldErrors.initialNote}
          />
        </form>
      </Drawer>
    </DashboardShell>
  );
}

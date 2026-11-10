'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardShell from '@/components/layout/DashboardShell';
import { ContentCard, StatCard, Badge, Button, Input, Select, Modal, Drawer, Pagination, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, PageHeader } from '@/components/ui';
import { UserPlus, Search, Trash2, AlertTriangle, RotateCcw } from 'lucide-react';
import { inviteStaffAction, revokeInviteAction, setStaffRoleAction, setStaffStatusAction } from '@/server/auth-actions';
import type { StaffMember, PendingInvite, StaffRole } from '@tuw/heart/modules/auth';

const ROLE_OPTIONS: { value: StaffRole; label: string }[] = [
  { value: 'admin', label: 'Admin — everything, including team and settings' },
  { value: 'support', label: 'Support — orders and customers, no refunds or prices' },
  { value: 'warehouse', label: 'Warehouse — orders and shipments only' },
];
const roleLabel = (role: string) => role.charAt(0).toUpperCase() + role.slice(1);
const AVATAR_BG = ['#7539FF', '#0F766E', '#B45309', '#1D4ED8', '#BE185D'];

type Row =
  | { kind: 'member'; id: string; name: string; email: string; role: string; status: 'active' | 'disabled'; lastActive: string }
  | { kind: 'invite'; id: string; name: string; email: string; role: string; status: 'invited'; lastActive: string };

interface TeamViewProps {
  members: StaffMember[];
  invites: PendingInvite[];
  currentUserId: string;
}

export default function TeamView({ members, invites, currentUserId }: TeamViewProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [rowToRemove, setRowToRemove] = useState<Row | null>(null);
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<StaffRole>('support');
  const [inviteKey, setInviteKey] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ tone: 'error' | 'info'; text: string; link?: string } | null>(null);

  const rows: Row[] = useMemo(
    () => [
      ...members.map((m): Row => ({
        kind: 'member', id: m.userId, name: m.name, email: m.email, role: m.roles[0] ?? 'support',
        status: m.status === 'disabled' ? 'disabled' : 'active',
        lastActive: m.lastLoginAt ? new Date(m.lastLoginAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Never signed in',
      })),
      ...invites.map((i): Row => ({
        kind: 'invite', id: i.id, name: i.email, email: i.email, role: i.role, status: 'invited',
        lastActive: `Invite expires ${new Date(i.expiresAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}`,
      })),
    ],
    [members, invites],
  );

  const filtered = rows.filter((r) => [r.name, r.email, r.role].some((v) => v.toLowerCase().includes(searchTerm.toLowerCase())));
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const run = async (work: () => Promise<{ ok: boolean; error?: { message: string } }>, success?: string) => {
    if (pending) return false;
    setPending(true);
    const result = await work();
    setPending(false);
    if (!result.ok) {
      setMessage({ tone: 'error', text: result.error?.message ?? 'Something went wrong.' });
      return false;
    }
    if (success) setMessage({ tone: 'info', text: success });
    router.refresh();
    return true;
  };

  const openInvite = () => {
    setInviteKey(crypto.randomUUID()); // one key per invite attempt: retries never send twice
    setMessage(null);
    setIsInviteOpen(true);
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    const result = await inviteStaffAction({ email: formEmail, role: formRole, idempotencyKey: inviteKey });
    setPending(false);
    if (!result.ok) {
      setMessage({ tone: 'error', text: result.error.message }); // drawer stays open, values kept
      return;
    }
    setIsInviteOpen(false);
    setFormEmail('');
    setMessage({
      tone: 'info',
      text: result.data.devLink ? `Invitation created for ${formEmail}. Email delivery is not connected yet (development):` : `Invitation sent to ${formEmail}.`,
      link: result.data.devLink ?? undefined,
    });
    router.refresh();
  };

  const handleConfirmRemoval = async () => {
    if (!rowToRemove) return;
    const ok = rowToRemove.kind === 'invite'
      ? await run(() => revokeInviteAction({ inviteId: rowToRemove.id }), `Invitation for ${rowToRemove.email} revoked.`)
      : await run(() => setStaffStatusAction({ userId: rowToRemove.id, status: 'disabled' }), `${rowToRemove.name} can no longer sign in.`);
    if (ok) setRowToRemove(null);
  };

  return (
    <DashboardShell pageTitle="Team & Permissions">
      <PageHeader
        title="Team & Permissions"
        actions={
          <Button variant="primary" size="md" icon={<UserPlus size={16} />} onClick={openInvite}>
            Invite Member
          </Button>
        }
      />

      {message && (
        <div role={message.tone === 'error' ? 'alert' : 'status'} style={{ padding: 12, borderRadius: 8, fontSize: 13, background: message.tone === 'error' ? 'var(--tuw-bg-error, #FEF4F4)' : 'var(--tuw-bg-subtle, #F5F6F7)', color: 'var(--tuw-text-primary, #262626)' }}>
          {message.text}{' '}
          {message.link && <a href={message.link} style={{ fontWeight: 600, textDecoration: 'underline', wordBreak: 'break-all' }}>{message.link}</a>}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <StatCard label="Total Staff" value={`${members.length} Members`} subtitle="Admin, support and warehouse roles" trendType="neutral" hoverable />
        <StatCard label="Active Accounts" value={String(members.filter((m) => m.status !== 'disabled').length)} trend="Can sign in" trendType="up" hoverable />
        <StatCard label="Pending Invites" value={String(invites.length)} subtitle="Awaiting acceptance" trendType="neutral" hoverable />
        <StatCard label="RBAC Policy" value="Enforced" trend="Checked on every action" trendType="up" hoverable />
      </div>

      <ContentCard>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div style={{ maxWidth: 360, width: '100%' }}>
            <Input
              placeholder="Search by name, email, or role..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              prefixIcon={<Search size={16} />}
            />
          </div>
        </div>

        <Table>
          <TableHeader style={{ borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)' }}>
            <TableRow hoverable={false}>
              <TableHead style={{ padding: '12px 16px' }}>Member</TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Role Scope</TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Status</TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Last Active</TableHead>
              <TableHead style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {page.length === 0 && (
              <TableRow hoverable={false}>
                <TableCell style={{ padding: '20px 16px', fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>No team members match your search.</TableCell>
              </TableRow>
            )}
            {page.map((row, index) => (
              <TableRow key={`${row.kind}-${row.id}`} hoverable={false} style={{ borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)' }}>
                <TableCell style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: AVATAR_BG[index % AVATAR_BG.length], color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600 }}>
                      {row.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>{row.name}{row.id === currentUserId ? ' (you)' : ''}</div>
                      <div style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>{row.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell style={{ padding: '14px 16px', fontSize: 14, fontWeight: 500 }}>
                  {row.kind === 'member' && row.status === 'active' && row.id !== currentUserId ? (
                    <Select
                      aria-label={`Role for ${row.name}`}
                      value={row.role}
                      onChange={(e) => void run(() => setStaffRoleAction({ userId: row.id, role: e.target.value as StaffRole }), `${row.name} is now ${roleLabel(e.target.value)}. The change applies at their next sign-in.`)}
                      options={ROLE_OPTIONS.map((o) => ({ value: o.value, label: roleLabel(o.value) }))}
                    />
                  ) : (
                    <Badge variant={row.role === 'admin' ? 'success' : row.role === 'support' ? 'info' : 'neutral'}>{roleLabel(row.role)}</Badge>
                  )}
                </TableCell>
                <TableCell style={{ padding: '14px 16px' }}>
                  {row.status === 'active' && <Badge variant="success">Active</Badge>}
                  {row.status === 'invited' && <Badge variant="warning">Invited</Badge>}
                  {row.status === 'disabled' && <Badge variant="neutral">Disabled</Badge>}
                </TableCell>
                <TableCell style={{ padding: '14px 16px', fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>{row.lastActive}</TableCell>
                <TableCell style={{ padding: '14px 16px', textAlign: 'right' }}>
                  {row.kind === 'member' && row.status === 'disabled' ? (
                    <Button variant="ghost" size="sm" icon={<RotateCcw size={14} />} disabled={pending}
                      onClick={() => void run(() => setStaffStatusAction({ userId: row.id, status: 'active' }), `${row.name} can sign in again.`)}>
                      Restore
                    </Button>
                  ) : row.id !== currentUserId ? (
                    <Button variant="ghost" size="sm" icon={<Trash2 size={14} color="var(--tuw-text-error, #C91818)" />} onClick={() => setRowToRemove(row)}>
                      {row.kind === 'invite' ? 'Revoke' : 'Remove'}
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filtered.length}
          pageSize={pageSize}
          pageSizeOptions={[5, 10, 20]}
          onPageSizeChange={(newSize) => { setPageSize(newSize); setCurrentPage(1); }}
        />
      </ContentCard>

      <Drawer
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        title="Invite New Staff Member"
        subtitle="They get a link to set their name and password"
        width="540px"
        footer={
          <>
            <Button variant="secondary" size="md" type="button" onClick={() => setIsInviteOpen(false)}>Cancel</Button>
            <Button variant="primary" size="md" type="submit" form="team-invite-form" disabled={pending}>
              {pending ? 'Sending…' : 'Send Invitation'}
            </Button>
          </>
        }
      >
        <form id="team-invite-form" onSubmit={handleInviteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {message?.tone === 'error' && <p role="alert" style={{ margin: 0, fontSize: 13, color: 'var(--tuw-text-error, #C91818)' }}>{message.text}</p>}
          <Input label="Staff Work Email" type="email" placeholder="e.g. tariq@theunpluggedwear.com" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} required />
          <Select label="Role Scope" value={formRole} onChange={(e) => setFormRole(e.target.value as StaffRole)} options={ROLE_OPTIONS} />
        </form>
      </Drawer>

      <Modal
        isOpen={Boolean(rowToRemove)}
        onClose={() => setRowToRemove(null)}
        title={rowToRemove?.kind === 'invite' ? 'Revoke Invitation' : 'Remove Staff Access'}
        subtitle={rowToRemove?.kind === 'invite' ? 'The invitation link stops working immediately' : 'Signs them out everywhere and blocks sign-in'}
        footer={
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="secondary" size="md" onClick={() => setRowToRemove(null)}>Cancel</Button>
            <Button variant="danger" size="md" onClick={() => void handleConfirmRemoval()} disabled={pending}>
              {rowToRemove?.kind === 'invite' ? 'Revoke Invitation' : 'Remove Access'}
            </Button>
          </div>
        }
      >
        {rowToRemove && (
          <div style={{ padding: 14, backgroundColor: 'var(--tuw-bg-error, #FEF4F4)', borderRadius: 8, display: 'flex', gap: 12 }}>
            <AlertTriangle size={20} color="var(--tuw-text-error, #C91818)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: 13, color: 'var(--tuw-text-primary, #262626)', lineHeight: 1.5 }}>
              {rowToRemove.kind === 'invite'
                ? <>Revoke the pending invitation for <strong>{rowToRemove.email}</strong>?</>
                : <>Remove access for <strong>{rowToRemove.name}</strong> ({rowToRemove.email})? Their account is kept (orders and history stay) and can be restored later.</>}
            </div>
          </div>
        )}
      </Modal>
    </DashboardShell>
  );
}

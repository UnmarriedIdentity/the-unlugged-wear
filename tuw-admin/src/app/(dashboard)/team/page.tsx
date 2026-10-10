'use client';

import React, { useState } from 'react';
import DashboardShell from '@/components/layout/DashboardShell';
import { ContentCard, StatCard, Badge, Button, Input, Modal, Pagination, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, PageHeader } from '@/components/ui';
import { UserPlus, Search, Filter, ShieldCheck, Mail, Trash2, AlertTriangle } from 'lucide-react';
import { useAdminState } from '@/mocks/state';
import { TeamMember, StaffRole } from '@/mocks/fixtures';

export default function TeamPage() {
  const { team, inviteTeamMember, removeTeamMember, canPerformAction } = useAdminState();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Modals
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<StaffRole>('Operations');

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredMembers = team.filter(
    (member) =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / pageSize));
  const paginatedMembers = filteredMembers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    inviteTeamMember({
      name: formName || 'New Team Member',
      email: formEmail || 'staff@theunpluggedwear.com',
      role: formRole,
      status: 'invited',
    });
    setIsInviteOpen(false);
    setFormName('');
    setFormEmail('');
  };

  const handleConfirmRemoval = () => {
    if (!memberToRemove) return;
    removeTeamMember(memberToRemove.id);
    setMemberToRemove(null);
  };

  return (
    <DashboardShell pageTitle="Team & Permissions">
      <PageHeader
        title="Team & Permissions"
        actions={
          <Button
            variant="primary"
            size="md"
            icon={<UserPlus size={16} />}
            onClick={() => {
              if (canPerformAction('team')) setIsInviteOpen(true);
            }}
          >
            Invite Member
          </Button>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <StatCard label="Total Staff" value={`${team.length} Members`} subtitle="Across 4 operational roles" trendType="neutral" hoverable />
        <StatCard label="Active Sessions" value={String(team.filter((m) => m.status === 'active').length)} trend="Online locally" trendType="up" hoverable />
        <StatCard label="Pending Invites" value={String(team.filter((m) => m.status === 'invited').length)} subtitle="Awaiting acceptance" trendType="neutral" hoverable />
        <StatCard label="RBAC Policy" value="Enforced" trend="Demo role isolation" trendType="up" hoverable />
      </div>

      <ContentCard>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div style={{ maxWidth: 360, width: '100%' }}>
            <Input
              placeholder="Search by name, email, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
            {paginatedMembers.map((member) => (
              <TableRow key={member.id} hoverable={false} style={{ borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)' }}>
                <TableCell style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        backgroundColor: member.avatarBg,
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        fontWeight: 600,
                      }}
                    >
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>{member.name}</div>
                      <div style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>{member.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell style={{ padding: '14px 16px', fontSize: 14, color: 'var(--tuw-text-primary, #262626)', fontWeight: 500 }}>
                  <Badge variant={member.role === 'Owner' ? 'success' : member.role === 'Operations' ? 'info' : 'neutral'}>
                    {member.role}
                  </Badge>
                </TableCell>
                <TableCell style={{ padding: '14px 16px' }}>
                  {member.status === 'active' && <Badge variant="success">Active</Badge>}
                  {member.status === 'invited' && <Badge variant="warning">Invited</Badge>}
                  {member.status === 'inactive' && <Badge variant="neutral">Inactive</Badge>}
                </TableCell>
                <TableCell style={{ padding: '14px 16px', fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                  {member.lastActive}
                </TableCell>
                <TableCell style={{ padding: '14px 16px', textAlign: 'right' }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 size={14} color="var(--tuw-text-error, #C91818)" />}
                    onClick={() => {
                      if (canPerformAction('team')) setMemberToRemove(member);
                    }}
                  >
                    Remove
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredMembers.length}
          pageSize={pageSize}
          pageSizeOptions={[5, 10, 20]}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
        />
      </ContentCard>

      {/* Invite Member Modal */}
      <Modal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        title="Invite New Staff Member"
        subtitle="Sends a simulated invitation link with designated role scope"
        footer={
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="secondary" size="md" onClick={() => setIsInviteOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" onClick={handleInviteSubmit}>
              Dispatch Invitation
            </Button>
          </div>
        }
      >
        <form onSubmit={handleInviteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input
            label="Full Name"
            placeholder="e.g. Tariq Mansoor"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            required
          />
          <Input
            label="Staff Work Email"
            type="email"
            placeholder="e.g. tariq@theunpluggedwear.com"
            value={formEmail}
            onChange={(e) => setFormEmail(e.target.value)}
            required
          />
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--tuw-text-primary, #262626)', display: 'block', marginBottom: 6 }}>
              Role Scope
            </label>
            <select
              value={formRole}
              onChange={(e) => setFormRole(e.target.value as StaffRole)}
              style={{ width: '100%', height: 40, borderRadius: 8, border: '1px solid var(--tuw-border-control, #90979F)', padding: '0 10px', fontSize: 13 }}
            >
              <option value="Owner">Owner — Full administrative authority</option>
              <option value="Operations">Operations — Fulfillment, Orders, Shipments & Refunds</option>
              <option value="Content">Content — Products, Collections, Media & CMS</option>
              <option value="Read-only">Read-only — View all data without mutation capabilities</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* Removal Confirmation Dialog */}
      <Modal
        isOpen={Boolean(memberToRemove)}
        onClose={() => setMemberToRemove(null)}
        title="Confirm Staff Member Removal"
        subtitle="This action will revoke all permissions immediately"
        footer={
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="secondary" size="md" onClick={() => setMemberToRemove(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="md" onClick={handleConfirmRemoval}>
              Revoke & Remove Staff
            </Button>
          </div>
        }
      >
        {memberToRemove && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ padding: 14, backgroundColor: 'var(--tuw-bg-error, #FEF4F4)', borderRadius: 8, display: 'flex', gap: 12 }}>
              <AlertTriangle size={20} color="var(--tuw-text-error, #C91818)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: 13, color: 'var(--tuw-text-primary, #262626)', lineHeight: 1.5 }}>
                Are you sure you want to remove <strong>{memberToRemove.name}</strong> ({memberToRemove.email})?
                They currently have active access under the <strong>{memberToRemove.role}</strong> role.
              </div>
            </div>
            <p style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)', margin: 0 }}>
              All simulated active sessions and API permissions will be terminated immediately.
            </p>
          </div>
        )}
      </Modal>
    </DashboardShell>
  );
}

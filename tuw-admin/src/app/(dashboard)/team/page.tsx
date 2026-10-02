'use client';

import React, { useState } from 'react';
import DashboardShell from '@/components/layout/DashboardShell';
import { ContentCard, StatCard, Badge, Button, Input } from '@/components/ui';
import { UserPlus, Search, Filter, ShieldCheck, Mail, MoreHorizontal } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Store Owner' | 'Inventory Lead' | 'Fulfillment Specialist' | 'Support Agent' | 'Designer';
  status: 'active' | 'invited' | 'inactive';
  lastActive: string;
  avatarBg: string;
}

const mockTeam: TeamMember[] = [
  {
    id: 'MEM-01',
    name: 'Ronan Vance',
    email: 'ronan@theunpluggedwear.com',
    role: 'Store Owner',
    status: 'active',
    lastActive: 'Just now',
    avatarBg: '#7539FF',
  },
  {
    id: 'MEM-02',
    name: 'Elena Rostova',
    email: 'elena.r@theunpluggedwear.com',
    role: 'Inventory Lead',
    status: 'active',
    lastActive: '12m ago',
    avatarBg: '#187343',
  },
  {
    id: 'MEM-03',
    name: 'Tariq Mansoor',
    email: 'tariq@theunpluggedwear.com',
    role: 'Fulfillment Specialist',
    status: 'active',
    lastActive: '1h ago',
    avatarBg: '#175CD3',
  },
  {
    id: 'MEM-04',
    name: 'Sora Tanaka',
    email: 'sora.t@theunpluggedwear.com',
    role: 'Designer',
    status: 'active',
    lastActive: '3h ago',
    avatarBg: '#856300',
  },
  {
    id: 'MEM-05',
    name: 'Jessica Miller',
    email: 'jessica.m@theunpluggedwear.com',
    role: 'Support Agent',
    status: 'invited',
    lastActive: 'Pending invite',
    avatarBg: '#90979F',
  },
];

export default function TeamPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMembers = mockTeam.filter(
    (member) =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardShell pageTitle="Team & Permissions">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
            Team & Permissions
          </h2>
          <p style={{ fontSize: 14, color: 'var(--tuw-text-secondary, #5D6772)' }}>
            Manage staff accounts, assign granular role-based access control, and review invitations.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button variant="primary" size="md" icon={<UserPlus size={16} />}>
            Invite Member
          </Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <StatCard label="Total Staff" value="5 Members" subtitle="Across 4 departments" trendType="neutral" />
        <StatCard label="Active Sessions" value="4 Online" trend="Normal workload" trendType="up" />
        <StatCard label="Pending Invites" value="1 Seat" subtitle="Awaiting acceptance" trendType="neutral" />
        <StatCard label="Security Compliance" value="100%" trend="2FA enforced on all" trendType="up" />
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
          <Button variant="secondary" size="sm" icon={<Filter size={14} />}>
            Filter Roles
          </Button>
        </div>

        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)' }}>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Member</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Role</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Last Active</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member) => (
                <tr key={member.id} style={{ borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)' }}>
                  <td style={{ padding: '14px 16px' }}>
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
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 14, color: 'var(--tuw-text-primary, #262626)', fontWeight: 500 }}>
                    {member.role}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {member.status === 'active' && <Badge variant="success">Active</Badge>}
                    {member.status === 'invited' && <Badge variant="warning">Invited</Badge>}
                    {member.status === 'inactive' && <Badge variant="neutral">Inactive</Badge>}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                    {member.lastActive}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ContentCard>
    </DashboardShell>
  );
}

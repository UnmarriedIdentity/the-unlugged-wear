'use client';

import React, { useState } from 'react';
import DashboardShell from '@/components/layout/DashboardShell';
import { ContentCard, StatCard, Badge, Button, Input } from '@/components/ui';
import { ShieldCheck, Search, Filter, Download, Terminal, Clock, AlertCircle } from 'lucide-react';

interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  resource: string;
  ipAddress: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'security';
}

const mockAuditLogs: AuditEntry[] = [
  {
    id: 'AUD-9012',
    actor: 'ronan@theunpluggedwear.com',
    action: 'Changed shipping rates for UK Region',
    resource: 'Settings / Shipping',
    ipAddress: '192.168.1.104',
    timestamp: 'Oct 01, 2026, 12:44 PM',
    severity: 'info',
  },
  {
    id: 'AUD-9011',
    actor: 'system',
    action: 'Webhook failed: 3 retries exhausted for print partner API',
    resource: 'Integrations / Webhooks',
    ipAddress: '10.0.4.12',
    timestamp: 'Oct 01, 2026, 11:20 AM',
    severity: 'warning',
  },
  {
    id: 'AUD-9010',
    actor: 'elena.r@theunpluggedwear.com',
    action: 'Batch updated stock inventory for 14 SKUs',
    resource: 'Products / Inventory',
    ipAddress: '82.165.197.1',
    timestamp: 'Oct 01, 2026, 10:15 AM',
    severity: 'info',
  },
  {
    id: 'AUD-9009',
    actor: 'auth_service',
    action: 'Failed login attempt (invalid 2FA code)',
    resource: 'Auth / Admin Portal',
    ipAddress: '45.134.22.90',
    timestamp: 'Sep 30, 2026, 09:02 PM',
    severity: 'security',
  },
];

export default function AuditLogPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = mockAuditLogs.filter(
    (log) =>
      log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ipAddress.includes(searchTerm)
  );

  return (
    <DashboardShell pageTitle="Audit Log">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
            System Audit Log
          </h2>
          <p style={{ fontSize: 14, color: 'var(--tuw-text-secondary, #5D6772)' }}>
            Immutable chronological record of administrative actions, API webhooks, and security events.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button variant="secondary" size="md" icon={<Download size={16} />}>
            Export CSV
          </Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <StatCard label="Recorded Events (30d)" value="1,840" subtitle="100% captured" trendType="neutral" />
        <StatCard label="Security Warnings" value="2 flagged" trend="Investigated and resolved" trendType="up" />
        <StatCard label="Admin Changes" value="48 edits" subtitle="Last 7 days" trendType="neutral" />
        <StatCard label="Log Retention" value="365 Days" subtitle="SOC2 compliant storage" trendType="up" />
      </div>

      <ContentCard>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div style={{ maxWidth: 360, width: '100%' }}>
            <Input
              placeholder="Filter by actor, action, IP, resource..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              prefixIcon={<Search size={16} />}
            />
          </div>
          <Button variant="secondary" size="sm" icon={<Filter size={14} />}>
            Filter Severity
          </Button>
        </div>

        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)' }}>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Timestamp</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Actor</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Action Details</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Resource</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>IP Address</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Severity</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)' }}>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                    {log.timestamp}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
                    {log.actor}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 14, color: 'var(--tuw-text-primary, #262626)' }}>
                    {log.action}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--tuw-action-primary, #7539FF)', fontWeight: 500 }}>
                    {log.resource}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 12, fontFamily: 'monospace', color: 'var(--tuw-text-secondary, #5D6772)' }}>
                    {log.ipAddress}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {log.severity === 'info' && <Badge variant="info">Info</Badge>}
                    {log.severity === 'warning' && <Badge variant="warning">Warning</Badge>}
                    {log.severity === 'security' && <Badge variant="error">Security Alert</Badge>}
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

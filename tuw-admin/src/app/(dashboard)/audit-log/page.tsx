'use client';

import React, { useState } from 'react';
import DashboardShell from '@/components/layout/DashboardShell';
import { ContentCard, StatCard, Badge, Button, Input, Pagination } from '@/components/ui';
import { ShieldCheck, Search, Filter, Download, Terminal, Clock, AlertCircle } from 'lucide-react';
import { useAdminState } from '@/mocks/state';
import { AuditEntry } from '@/mocks/fixtures';

export default function AuditLogPage() {
  const { auditLogs } = useAdminState();
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | AuditEntry['severity']>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, severityFilter]);

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleExportCSV = () => {
    const headers = ['Entry ID', 'Actor', 'Action', 'Resource', 'IP Address', 'Timestamp', 'Severity'];
    const rows = filteredLogs.map((l) => [
      l.id,
      `"${l.actor}"`,
      `"${l.action}"`,
      `"${l.resource}"`,
      l.ipAddress,
      `"${l.timestamp}"`,
      l.severity,
    ]);
    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', `tuw_audit_log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardShell pageTitle="Audit Log">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
            System Audit Log
          </h2>
          <p style={{ fontSize: 14, color: 'var(--tuw-text-secondary, #5D6772)' }}>
            Immutable trace of simulated admin mutations, permission changes, refunds, and integrations.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button variant="secondary" size="md" icon={<Download size={16} />} onClick={handleExportCSV}>
            Export Audit CSV
          </Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <StatCard label="Total Logged Events" value={`${auditLogs.length} Entries`} subtitle="Session mutation records" trendType="neutral" />
        <StatCard label="Security Warnings" value={String(auditLogs.filter((l) => l.severity === 'warning').length)} subtitle="Exceptions recorded" trendType="neutral" />
        <StatCard label="System Health" value="100% SLA" trend="Auditing active" trendType="up" />
        <StatCard label="Trace Retention" value="Session Lifetime" subtitle="Local storage mirrored" trendType="neutral" />
      </div>

      <ContentCard>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div style={{ maxWidth: 360, width: '100%' }}>
            <Input
              placeholder="Search by actor, action, or resource..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              prefixIcon={<Search size={16} />}
            />
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            {(['all', 'info', 'warning', 'security'] as const).map((sev) => (
              <button
                key={sev}
                type="button"
                onClick={() => setSeverityFilter(sev)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: severityFilter === sev ? 600 : 500,
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: severityFilter === sev ? 'var(--tuw-action-primary, #7539FF)' : 'var(--tuw-border-subtle, #E2E4E6)',
                  backgroundColor: severityFilter === sev ? 'var(--tuw-bg-selected, #F8F5FF)' : 'transparent',
                  color: severityFilter === sev ? 'var(--tuw-action-primary, #7539FF)' : 'var(--tuw-text-secondary, #5D6772)',
                }}
              >
                {sev.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)' }}>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Log ID</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Actor</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Action Performed</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Resource Target</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Timestamp</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Severity</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)' }}>
                  <td style={{ padding: '14px 16px', fontSize: 13, fontFamily: 'monospace', fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                    {log.id}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--tuw-action-primary, #7539FF)', fontWeight: 500 }}>
                    {log.actor}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 14, color: 'var(--tuw-text-primary, #262626)' }}>
                    {log.action}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                    {log.resource}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                    {log.timestamp}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {log.severity === 'info' && <Badge variant="info">Info</Badge>}
                    {log.severity === 'warning' && <Badge variant="warning">Warning</Badge>}
                    {log.severity === 'security' && <Badge variant="danger">Security</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredLogs.length}
          pageSize={pageSize}
          pageSizeOptions={[5, 10, 20]}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
        />
      </ContentCard>
    </DashboardShell>
  );
}

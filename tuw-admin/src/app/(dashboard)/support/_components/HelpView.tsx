'use client';

import React, { useState } from 'react';
import { HelpCircle, MessageSquare, Send, CheckCircle2, Clock, AlertCircle, Sparkles, ChevronRight, User, Download } from 'lucide-react';
import DashboardShell from '@/components/layout/DashboardShell';
import { ContentCard, StatCard, Badge, Button, Input, Drawer, Pagination, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, FilterPills, PageHeader, Checkbox } from '@/components/ui';
import { useAdminState } from '@/mocks/state';
import { SupportTicket } from '@/mocks/fixtures';

const styles = new Proxy<Record<string, string>>({}, { get: (_t, p) => 'sub-' + String(p) });

const cannedResponses = [
  {
    label: 'Tracking / Shipping Update',
    text: 'Hello, your order has been packaged and handed over to our carrier. You can review live telemetry via the tracking reference attached to your order receipt.',
  },
  {
    label: 'Return / RMA Authorization',
    text: 'Thank you for reaching out. We have authorized your return request. Please affix the pre-paid shipping manifest and return the garment in its original packaging.',
  },
  {
    label: 'Sizing & Garment Fit Guide',
    text: 'Our garments feature a relaxed streetwear cut engineered with drop shoulders. If you prefer a tailored silhouette, we recommend choosing one size smaller.',
  },
];

export default function HelpView() {
  const { supportTickets, sendSupportReply, canPerformAction, showToast } = useAdminState();
  const [statusFilter, setStatusFilter] = useState<'all' | SupportTicket['status']>('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [draftReply, setDraftReply] = useState('');
  // Row selection (multi-select; header checkbox tri-states over the page)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  const filteredTickets = supportTickets.filter((t) => statusFilter === 'all' || t.status === statusFilter);
  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / pageSize));
  const paginatedTickets = filteredTickets.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Row selection helpers (header checkbox tri-states over the page)
  const pageIds = paginatedTickets.map((t) => t.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const somePageSelected = pageIds.some((id) => selectedIds.has(id));
  const toggleId = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const togglePage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (pageIds.every((id) => next.has(id))) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const openTicketsCount = supportTickets.filter((t) => t.status === 'open').length;
  const resolvedCount = supportTickets.filter((t) => t.status === 'resolved').length;

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !draftReply.trim()) return;
    sendSupportReply(selectedTicket.id, draftReply.trim());
    setSelectedTicket({
      ...selectedTicket,
      status: 'resolved',
      messages: [
        ...selectedTicket.messages,
        {
          sender: 'staff',
          text: draftReply.trim(),
          time: 'Just now',
        },
      ],
    });
    setDraftReply('');
  };

  // Bulk actions (bar appears when rows are selected)
  const BULK_RESOLVE_NOTICE =
    'Hello, our support team has reviewed your request and applied a resolution. Please reply to this thread if you need anything further.';
  const clearSelection = () => setSelectedIds(new Set());

  const handleExportSelected = () => {
    const selected = supportTickets.filter((t) => selectedIds.has(t.id));
    if (selected.length === 0) return;
    const headers = ['Ticket ID', 'Customer', 'Email', 'Subject', 'Priority', 'Status'];
    const rows = selected.map((t) => [
      t.id,
      `"${t.customerName}"`,
      t.customerEmail,
      `"${t.subject}"`,
      t.priority,
      t.status,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `tuw_support_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast({
      type: 'success',
      title: 'Selected Tickets Exported',
      description: `${selected.length} ticket${selected.length === 1 ? '' : 's'} exported to CSV.`,
    });
    clearSelection();
  };

  const handleBulkResolve = () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    if (!canPerformAction('orders')) {
      showToast({
        type: 'warning',
        title: 'Action Restricted',
        description: 'Your demo role cannot resolve tickets.',
      });
      return;
    }
    ids.forEach((id) => sendSupportReply(id, BULK_RESOLVE_NOTICE, true));
    if (selectedTicket && selectedIds.has(selectedTicket.id)) {
      setSelectedTicket({
        ...selectedTicket,
        status: 'resolved',
        messages: [
          ...selectedTicket.messages,
          { sender: 'staff', text: BULK_RESOLVE_NOTICE, time: 'Just now' },
        ],
      });
    }
    setStatusFilter('all');
    setCurrentPage(1);
    showToast({
      type: 'success',
      title: 'Bulk Resolve Applied',
      description: `${ids.length} ticket${ids.length === 1 ? '' : 's'} resolved with canned notice.`,
    });
    clearSelection();
  };

  return (
    <DashboardShell pageTitle="Support" activeNav="help">
      <PageHeader title="Support Ticket Desk" />

      <div className={styles.statGrid}>
        <StatCard label="Total Tickets" value={String(supportTickets.length)} subtitle="Customer inquiries" trendType="neutral" hoverable />
        <StatCard label="Open / Actionable" value={String(openTicketsCount)} subtitle="Awaiting reply" trendType={openTicketsCount > 0 ? 'down' : 'up'} hoverable />
        <StatCard label="Resolved Tickets" value={String(resolvedCount)} trend="High satisfaction SLA" trendType="up" hoverable />
        <StatCard label="Avg. Response Time" value="18 mins" trend="Instant simulated triage" trendType="up" hoverable />
      </div>

      {/* Ticket Queue Card */}
      <ContentCard>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MessageSquare size={18} color="var(--tuw-action-primary, #7539FF)" />
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)', margin: 0 }}>
              Customer Ticket Queue ({filteredTickets.length})
            </h3>
          </div>

          <FilterPills
            variant="pills"
            ariaLabel="Ticket status filter"
            options={[
              { value: 'all', label: 'All' },
              { value: 'open', label: 'Open' },
              { value: 'pending', label: 'Pending' },
              { value: 'resolved', label: 'Resolved' },
            ]}
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as typeof statusFilter)}
          />
        </div>

        <Table>
          <TableHeader style={{ borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)' }}>
            <TableRow hoverable={false}>
              <TableHead style={{ padding: '12px 16px', width: 44 }}>
                <Checkbox
                  bare
                  aria-label="Select all tickets on this page"
                  checked={allPageSelected}
                  indeterminate={!allPageSelected && somePageSelected}
                  onChange={togglePage}
                />
              </TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Ticket</TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Customer</TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Subject</TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Priority</TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Status</TableHead>
              <TableHead style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTickets.map((ticket) => (
              <TableRow
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                style={{ borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)', cursor: 'pointer', backgroundColor: selectedIds.has(ticket.id) ? 'var(--tuw-bg-canvas, #F7F8F9)' : 'transparent' }}
              >
                <TableCell style={{ padding: '14px 16px' }}>
                  <Checkbox
                    bare
                    aria-label={`Select ticket ${ticket.id}`}
                    checked={selectedIds.has(ticket.id)}
                    onChange={() => toggleId(ticket.id)}
                  />
                </TableCell>
                <TableCell style={{ padding: '14px 16px', fontSize: 13, fontFamily: 'monospace', fontWeight: 600, color: 'var(--tuw-action-primary, #7539FF)' }}>
                  {ticket.id}
                </TableCell>
                <TableCell style={{ padding: '14px 16px' }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--tuw-text-primary, #262626)' }}>{ticket.customerName}</div>
                  <div style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)' }}>{ticket.customerEmail}</div>
                </TableCell>
                <TableCell style={{ padding: '14px 16px', fontSize: 13, color: 'var(--tuw-text-primary, #262626)' }}>
                  {ticket.subject}
                </TableCell>
                <TableCell style={{ padding: '14px 16px' }}>
                  <Badge variant={ticket.priority === 'high' ? 'danger' : ticket.priority === 'medium' ? 'warning' : 'neutral'}>
                    {ticket.priority}
                  </Badge>
                </TableCell>
                <TableCell style={{ padding: '14px 16px' }}>
                  <Badge variant={ticket.status === 'open' ? 'danger' : ticket.status === 'pending' ? 'warning' : 'success'}>
                    {ticket.status}
                  </Badge>
                </TableCell>
                <TableCell style={{ padding: '14px 16px', textAlign: 'right' }}>
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedTicket(ticket); }}>
                    Reply
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
          totalItems={filteredTickets.length}
          pageSize={pageSize}
          pageSizeOptions={[5, 10, 20]}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
        />
      </ContentCard>

      {/* Ticket Detail & Response Drawer */}
      <Drawer
        isOpen={Boolean(selectedTicket)}
        onClose={() => setSelectedTicket(null)}
        title={selectedTicket ? `Ticket ${selectedTicket.id}` : 'Ticket'}
        subtitle={selectedTicket ? `${selectedTicket.customerName} · ${selectedTicket.createdAt}` : ''}
        width="560px"
      >
        {selectedTicket && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ padding: 14, backgroundColor: 'var(--tuw-bg-canvas, #F7F8F9)', borderRadius: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
                {selectedTicket.subject}
              </div>
              <div style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)', marginTop: 4 }}>
                From: {selectedTicket.customerName} ({selectedTicket.customerEmail})
              </div>
            </div>

            {/* Conversation Thread */}
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)', marginBottom: 12 }}>
                Conversation Thread
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {selectedTicket.messages.map((msg, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 8,
                      backgroundColor: msg.sender === 'staff' ? 'var(--tuw-bg-selected, #F8F5FF)' : '#FFFFFF',
                      border: '1px solid',
                      borderColor: msg.sender === 'staff' ? 'rgba(117, 57, 255, 0.2)' : 'var(--tuw-border-subtle, #E2E4E6)',
                      alignSelf: msg.sender === 'staff' ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: msg.sender === 'staff' ? 'var(--tuw-action-primary, #7539FF)' : '#262626' }}>
                        {msg.sender === 'staff' ? 'Staff Response' : selectedTicket.customerName}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--tuw-text-secondary, #5D6772)' }}>{msg.time}</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--tuw-text-primary, #262626)', lineHeight: 1.5 }}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Response Drafting */}
            <form onSubmit={handleSendReply} style={{ borderTop: '1px solid var(--tuw-border-subtle, #E2E4E6)', paddingTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
                  Draft Response
                </span>
                <span style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                  Canned Templates:
                </span>
              </div>

              {/* Canned Response Chips */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                {cannedResponses.map((cr, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setDraftReply(cr.text)}
                    style={{
                      background: 'none',
                      border: '1px solid var(--tuw-border-control, #90979F)',
                      padding: '3px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      cursor: 'pointer',
                      color: 'var(--tuw-text-secondary, #5D6772)',
                    }}
                  >
                    {cr.label}
                  </button>
                ))}
              </div>

              <textarea
                rows={4}
                placeholder="Type your response to the customer..."
                value={draftReply}
                onChange={(e) => setDraftReply(e.target.value)}
                style={{
                  width: '100%',
                  borderRadius: 8,
                  border: '1px solid var(--tuw-border-control, #90979F)',
                  padding: '10px 12px',
                  fontSize: 13,
                  fontFamily: 'inherit',
                  marginBottom: 12,
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <Button
                  variant="primary"
                  size="md"
                  icon={<Send size={14} />}
                  onClick={handleSendReply}
                  disabled={!draftReply.trim()}
                >
                  Send Reply & Resolve Ticket
                </Button>
              </div>
            </form>
          </div>
        )}
      </Drawer>
    </DashboardShell>
  );
}

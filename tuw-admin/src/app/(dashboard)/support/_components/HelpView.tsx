'use client';

import React, { useState } from 'react';
import { HelpCircle, MessageSquare, Send, CheckCircle2, Clock, AlertCircle, Sparkles, ChevronRight, User } from 'lucide-react';
import DashboardShell from '@/components/layout/DashboardShell';
import { ContentCard, StatCard, Badge, Button, Input, Drawer } from '@/components/ui';
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
  const { supportTickets, sendSupportReply, canPerformAction } = useAdminState();
  const [statusFilter, setStatusFilter] = useState<'all' | SupportTicket['status']>('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [draftReply, setDraftReply] = useState('');

  const filteredTickets = supportTickets.filter((t) => statusFilter === 'all' || t.status === statusFilter);

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

  return (
    <DashboardShell pageTitle="Support" activeNav="help">
      <div className={styles.pageHeader}>
        <div className={styles.headingGroup}>
          <h2 className={styles.pageTitle}>Support Ticket Desk</h2>
          <p className={styles.pageSubtitle}>
            Manage inbound customer inquiries, resolve fulfillment disputes, and draft simulated responses.
          </p>
        </div>
      </div>

      <div className={styles.statGrid}>
        <StatCard label="Total Tickets" value={String(supportTickets.length)} subtitle="Customer inquiries" trendType="neutral" />
        <StatCard label="Open / Actionable" value={String(openTicketsCount)} subtitle="Awaiting reply" trendType={openTicketsCount > 0 ? 'down' : 'up'} />
        <StatCard label="Resolved Tickets" value={String(resolvedCount)} trend="High satisfaction SLA" trendType="up" />
        <StatCard label="Avg. Response Time" value="18 mins" trend="Instant simulated triage" trendType="up" />
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

          <div style={{ display: 'flex', gap: 6 }}>
            {(['all', 'open', 'pending', 'resolved'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: statusFilter === st ? 600 : 500,
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: statusFilter === st ? 'var(--tuw-action-primary, #7539FF)' : 'var(--tuw-border-subtle, #E2E4E6)',
                  backgroundColor: statusFilter === st ? 'var(--tuw-bg-selected, #F8F5FF)' : 'transparent',
                  color: statusFilter === st ? 'var(--tuw-action-primary, #7539FF)' : 'var(--tuw-text-secondary, #5D6772)',
                }}
              >
                {st.charAt(0).toUpperCase() + st.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)' }}>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Ticket</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Customer</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Subject</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Priority</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  style={{ borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)', cursor: 'pointer' }}
                >
                  <td style={{ padding: '14px 16px', fontSize: 13, fontFamily: 'monospace', fontWeight: 600, color: 'var(--tuw-action-primary, #7539FF)' }}>
                    {ticket.id}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--tuw-text-primary, #262626)' }}>{ticket.customerName}</div>
                    <div style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)' }}>{ticket.customerEmail}</div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--tuw-text-primary, #262626)' }}>
                    {ticket.subject}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <Badge variant={ticket.priority === 'high' ? 'danger' : ticket.priority === 'medium' ? 'warning' : 'neutral'}>
                      {ticket.priority}
                    </Badge>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <Badge variant={ticket.status === 'open' ? 'danger' : ticket.status === 'pending' ? 'warning' : 'success'}>
                      {ticket.status}
                    </Badge>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedTicket(ticket); }}>
                      Reply
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

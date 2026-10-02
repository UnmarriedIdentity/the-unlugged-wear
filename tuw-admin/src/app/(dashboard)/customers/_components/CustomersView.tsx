'use client';

import React, { useState } from 'react';
import { UserPlus, Download, Search, Eye, MapPin, Phone, Mail, Calendar, Plus, MessageSquare } from 'lucide-react';
import DashboardShell from '@/components/layout/DashboardShell';
import { StatCard, ContentCard, Button, Badge, Input, Drawer } from '@/components/ui';
import { useAdminState } from '@/mocks/state';
import { CustomerItem } from '@/mocks/fixtures';

const styles = new Proxy<Record<string, string>>({}, { get: (_t, p) => 'sub-' + String(p) });

export default function CustomersView() {
  const { customers, orders, addCustomerNote, canPerformAction } = useAdminState();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerItem | null>(null);
  const [newNote, setNewNote] = useState('');

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSpentAll = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const vipCount = customers.filter((c) => c.tier === 'VIP Customer').length;

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !newNote.trim()) return;
    addCustomerNote(selectedCustomer.id, newNote.trim());
    setSelectedCustomer({
      ...selectedCustomer,
      notes: [newNote.trim(), ...selectedCustomer.notes],
    });
    setNewNote('');
  };

  const handleExportCSV = () => {
    const headers = ['Customer ID', 'Name', 'Email', 'Phone', 'Tier', 'Total Orders', 'Total Spent', 'City', 'Country'];
    const rows = filteredCustomers.map((c) => [
      c.id,
      `"${c.name}"`,
      c.email,
      `"${c.phone}"`,
      c.tier,
      c.totalOrders,
      c.totalSpent.toFixed(2),
      `"${c.city}"`,
      `"${c.country}"`,
    ]);
    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', `tuw_customers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Find customer purchase history from orders
  const customerOrders = selectedCustomer
    ? orders.filter((o) => o.customerEmail.toLowerCase() === selectedCustomer.email.toLowerCase())
    : [];

  return (
    <DashboardShell pageTitle="Customers" activeNav="customers">
      <div className={styles.pageHeader}>
        <div className={styles.headingGroup}>
          <h2 className={styles.pageTitle}>Customer Directory</h2>
          <p className={styles.pageSubtitle}>
            Manage client profiles, lifetime value, delivery addresses, and internal service notes.
          </p>
        </div>

        <div className={styles.headerActions}>
          <Button variant="secondary" size="md" icon={<Download size={16} />} onClick={handleExportCSV}>
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      <div className={styles.statGrid}>
        <StatCard label="Total Clients" value={String(customers.length)} trend="Active buyer profiles" trendType="up" />
        <StatCard label="VIP Clientele" value={String(vipCount)} subtitle="Tier 1 high-value" trendType="up" />
        <StatCard label="Total Customer LTV" value={`$${totalSpentAll.toFixed(2)}`} trend="Combined lifetime spend" trendType="up" />
        <StatCard label="Average Order Count" value={(orders.length / Math.max(1, customers.length)).toFixed(1)} subtitle="Orders per account" trendType="neutral" />
      </div>

      <ContentCard>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div style={{ maxWidth: 360, width: '100%' }}>
            <Input
              placeholder="Search by name, email, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              prefixIcon={<Search size={16} />}
            />
          </div>
          <span style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
            Showing <strong>{filteredCustomers.length}</strong> clients
          </span>
        </div>

        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)' }}>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Customer</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Tier</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Location</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase', textAlign: 'center' }}>Orders</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase', textAlign: 'right' }}>Total Spent</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr
                  key={customer.id}
                  onClick={() => setSelectedCustomer(customer)}
                  style={{ borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)', cursor: 'pointer' }}
                >
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
                      {customer.name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                      {customer.email}
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <Badge variant={customer.tier === 'VIP Customer' ? 'success' : 'info'}>
                      {customer.tier}
                    </Badge>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                    {customer.city}, {customer.country}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 14, textAlign: 'center', color: 'var(--tuw-text-primary, #262626)' }}>
                    {customer.totalOrders}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)', textAlign: 'right' }}>
                    ${customer.totalSpent.toFixed(2)}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedCustomer(customer); }}>
                      View Profile
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ContentCard>

      {/* Customer Profile Drawer */}
      <Drawer
        isOpen={Boolean(selectedCustomer)}
        onClose={() => setSelectedCustomer(null)}
        title={selectedCustomer ? selectedCustomer.name : 'Customer Profile'}
        subtitle={selectedCustomer ? `${selectedCustomer.tier} · Member since ${selectedCustomer.joinedDate}` : ''}
      >
        {selectedCustomer && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* LTV & Orders Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ padding: 14, backgroundColor: 'var(--tuw-bg-canvas, #F7F8F9)', borderRadius: 10 }}>
                <span style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)' }}>Total Spent</span>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--tuw-text-primary, #262626)', marginTop: 2 }}>
                  ${selectedCustomer.totalSpent.toFixed(2)}
                </div>
              </div>
              <div style={{ padding: 14, backgroundColor: 'var(--tuw-bg-canvas, #F7F8F9)', borderRadius: 10 }}>
                <span style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)' }}>Orders Placed</span>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--tuw-text-primary, #262626)', marginTop: 2 }}>
                  {selectedCustomer.totalOrders} orders
                </div>
              </div>
            </div>

            {/* Contact & Address */}
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)', marginBottom: 10 }}>
                Contact & Shipping Details
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Mail size={14} color="var(--tuw-action-primary, #7539FF)" />
                  <span>{selectedCustomer.email}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Phone size={14} color="var(--tuw-action-primary, #7539FF)" />
                  <span>{selectedCustomer.phone}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MapPin size={14} color="var(--tuw-action-primary, #7539FF)" />
                  <span>{selectedCustomer.address}, {selectedCustomer.city}, {selectedCustomer.country}</span>
                </div>
              </div>
            </div>

            {/* Purchase History */}
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)', marginBottom: 10 }}>
                Recent Order History ({customerOrders.length})
              </h4>
              {customerOrders.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)', padding: '12px 0' }}>
                  No recent orders found under email {selectedCustomer.email}.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {customerOrders.map((ord) => (
                    <div
                      key={ord.id}
                      style={{
                        padding: 10,
                        backgroundColor: 'var(--tuw-bg-canvas, #F7F8F9)',
                        borderRadius: 8,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: 13,
                      }}
                    >
                      <div>
                        <strong>{ord.id}</strong> — {ord.date}
                        <div style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                          {ord.items.map((i) => i.productName).join(', ')}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 600 }}>${ord.total.toFixed(2)}</div>
                        <Badge variant={ord.paymentStatus === 'paid' ? 'success' : 'warning'}>
                          {ord.paymentStatus}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Internal Staff Notes */}
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)', marginBottom: 10 }}>
                Internal Service Notes
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                {selectedCustomer.notes.map((note, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '10px 12px',
                      backgroundColor: 'var(--tuw-bg-selected, #F8F5FF)',
                      borderLeft: '3px solid var(--tuw-action-primary, #7539FF)',
                      borderRadius: 6,
                      fontSize: 13,
                      color: 'var(--tuw-text-primary, #262626)',
                    }}
                  >
                    {note}
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddNote} style={{ display: 'flex', gap: 8 }}>
                <Input
                  placeholder="Add a new service note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />
                <Button variant="secondary" size="md" icon={<Plus size={14} />} onClick={handleAddNote}>
                  Save
                </Button>
              </form>
            </div>
          </div>
        )}
      </Drawer>
    </DashboardShell>
  );
}

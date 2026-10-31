'use client';

import React, { useState } from 'react';
import { UserPlus, Download, Search, Eye, MapPin, Phone, Mail, Calendar, Plus, MessageSquare } from 'lucide-react';
import DashboardShell from '@admin/components/layout/DashboardShell';
import { StatCard, ContentCard, Button, Badge, Input, Select, Drawer, Pagination, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, PageHeader, DrawerSection, ItemsRow } from '@admin/components/ui';
import { useAdminState } from '@admin/mocks/state';
import { CustomerItem } from '@admin/mocks/fixtures';

const styles = new Proxy<Record<string, string>>({}, { get: (_t, p) => 'sub-' + String(p) });

export default function CustomersView() {
  const { customers, orders, addCustomerNote, createCustomer, canPerformAction } = useAdminState();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerItem | null>(null);
  const [newNote, setNewNote] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    country: 'India',
    address: '',
    tier: 'New' as 'VIP Customer' | 'Active' | 'New',
    initialNote: '',
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));
  const paginatedCustomers = filteredCustomers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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

  const handleCreateCustomer = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newCustomerForm.name.trim() || !newCustomerForm.email.trim()) return;
    createCustomer({
      name: newCustomerForm.name.trim(),
      email: newCustomerForm.email.trim(),
      phone: newCustomerForm.phone.trim() || '+91 98450 12345',
      city: newCustomerForm.city.trim() || 'Bangalore',
      country: newCustomerForm.country.trim() || 'India',
      address: newCustomerForm.address.trim() || 'Indiranagar 100ft Rd',
      tier: newCustomerForm.tier,
      notes: newCustomerForm.initialNote.trim() ? [newCustomerForm.initialNote.trim()] : [],
    });
    setIsAddModalOpen(false);
    setNewCustomerForm({
      name: '',
      email: '',
      phone: '',
      city: '',
      country: 'India',
      address: '',
      tier: 'New',
      initialNote: '',
    });
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
              onClick={() => setIsAddModalOpen(true)}
            >
              <span>+ Add Customer</span>
            </Button>
          </>
        }
      />

      <div className={styles.statGrid}>
        <StatCard label="Total Clients" value={String(customers.length)} trend="Active buyer profiles" trendType="up" hoverable />
        <StatCard label="VIP Clientele" value={String(vipCount)} subtitle="Tier 1 high-value" trendType="up" hoverable />
        <StatCard label="Total Customer LTV" value={`₹${totalSpentAll.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} trend="Combined lifetime spend" trendType="up" hoverable />
        <StatCard label="Average Order Count" value={(orders.length / Math.max(1, customers.length)).toFixed(1)} subtitle="Orders per account" trendType="neutral" hoverable />
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
            {filteredCustomers.length === 0 ? (
              <TableRow hoverable={false}>
                <TableCell colSpan={6} style={{ textAlign: 'center', padding: '48px 16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)', margin: 0 }}>
                      No customer records found
                    </p>
                    <p style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)', margin: 0 }}>
                      {searchTerm ? `No customers matched "${searchTerm}"` : 'Your customer directory is currently empty.'}
                    </p>
                    <Button variant="primary" size="md" icon={<UserPlus size={16} />} onClick={() => setIsAddModalOpen(true)}>
                      <span>+ Add Customer</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedCustomers.map((customer) => (
                <TableRow
                  key={customer.id}
                  onClick={() => setSelectedCustomer(customer)}
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
                    {customer.city}, {customer.country}
                  </TableCell>
                  <TableCell style={{ padding: '14px 16px', fontSize: 14, textAlign: 'center', color: 'var(--tuw-text-primary, #262626)' }}>
                    {customer.totalOrders}
                  </TableCell>
                  <TableCell className="tuw-tabular-nums" style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)', textAlign: 'right' }}>
                    ₹{customer.totalSpent.toFixed(2)}
                  </TableCell>
                  <TableCell style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedCustomer(customer); }}>
                      View Profile
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredCustomers.length}
          pageSize={pageSize}
          pageSizeOptions={[5, 10, 20]}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
        />
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
                <div className="tuw-tabular-nums" style={{ fontSize: 20, fontWeight: 700, color: 'var(--tuw-text-primary, #262626)', marginTop: 2 }}>
                  ₹{selectedCustomer.totalSpent.toFixed(2)}
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
            <DrawerSection title="Contact & Shipping Details" titleGap={10}>
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
            </DrawerSection>

            {/* Purchase History */}
            <DrawerSection title={`Recent Order History (${customerOrders.length})`} titleGap={10}>
              {customerOrders.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)', padding: '12px 0' }}>
                  No recent orders found under email {selectedCustomer.email}.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {customerOrders.map((ord) => (
                    <ItemsRow
                      key={ord.id}
                      pad={10}
                      left={
                        <div>
                          <strong>{ord.id}</strong> — {ord.date}
                          <div style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                            {ord.items.map((i) => i.productName).join(', ')}
                          </div>
                        </div>
                      }
                      right={
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 600 }}>${ord.total.toFixed(2)}</div>
                          <Badge variant={ord.paymentStatus === 'paid' ? 'success' : 'warning'}>
                            {ord.paymentStatus}
                          </Badge>
                        </div>
                      }
                    />
                  ))}
                </div>
              )}
            </DrawerSection>

            {/* Internal Staff Notes */}
            <DrawerSection title="Internal Service Notes" titleGap={10}>
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
            </DrawerSection>
          </div>
        )}
      </Drawer>

      {/* Add Customer Drawer */}
      <Drawer
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Customer"
        subtitle="Create a verified customer profile with delivery location and tier."
        width="540px"
        footer={
          <>
            <Button variant="secondary" size="md" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit" form="customer-create-form">
              Create Customer
            </Button>
          </>
        }
      >
        <form id="customer-create-form" onSubmit={handleCreateCustomer} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input
            label="Full Name"
            placeholder="e.g. Maya Krishnan"
            value={newCustomerForm.name}
            onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. maya@example.com"
              value={newCustomerForm.email}
              onChange={(e) => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
              required
            />
            <Input
              label="Phone Number"
              placeholder="e.g. +91 98765 43210"
              value={newCustomerForm.phone}
              onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input
              label="City"
              placeholder="e.g. Bangalore"
              value={newCustomerForm.city}
              onChange={(e) => setNewCustomerForm({ ...newCustomerForm, city: e.target.value })}
            />
            <Select
              label="Customer Tier"
              value={newCustomerForm.tier}
              onChange={(e) => setNewCustomerForm({ ...newCustomerForm, tier: e.target.value as any })}
              options={[
                { value: 'New', label: 'New' },
                { value: 'Active', label: 'Active' },
                { value: 'VIP Customer', label: 'VIP Customer' },
              ]}
            />
          </div>

          <Input
            label="Street Address"
            placeholder="e.g. 42 Indiranagar 12th Main Road"
            value={newCustomerForm.address}
            onChange={(e) => setNewCustomerForm({ ...newCustomerForm, address: e.target.value })}
          />

          <Input
            label="Initial Staff Note (Optional)"
            placeholder="e.g. Inquired via slow luxury collection launch"
            value={newCustomerForm.initialNote}
            onChange={(e) => setNewCustomerForm({ ...newCustomerForm, initialNote: e.target.value })}
          />
        </form>
      </Drawer>
    </DashboardShell>
  );
}

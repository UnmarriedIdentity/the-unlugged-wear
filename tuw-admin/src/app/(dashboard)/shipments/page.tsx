'use client';

import React, { useState } from 'react';
import DashboardShell from '@/components/layout/DashboardShell';
import { ContentCard, StatCard, Badge, Button, Input, Select, SearchableSelect, Drawer, Pagination, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, FilterPills, PageHeader, HeroCard, DrawerSection } from '@/components/ui';
import { Truck, Search, Filter, Download, ExternalLink, Calendar, MapPin, Clock, Plus } from 'lucide-react';
import { useAdminState } from '@/mocks/state';
import { ShipmentItem } from '@/mocks/fixtures';

export default function ShipmentsPage() {
  const { shipments, createShipment, orders, canPerformAction } = useAdminState();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ShipmentItem['status']>('all');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  // Modals & Drawers
  const [selectedShipment, setSelectedShipment] = useState<ShipmentItem | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form State
  const [formOrderId, setFormOrderId] = useState(orders[0]?.id || '#ORD-8820');
  const [formCarrier, setFormCarrier] = useState('DHL Express Worldwide');
  const [formTracking, setFormTracking] = useState('DHL-' + Math.floor(100000000 + Math.random() * 900000000));
  const [formDestination, setFormDestination] = useState('New York, NY, USA');
  const [formPieces, setFormPieces] = useState('1');
  const [formEstDelivery, setFormEstDelivery] = useState('3 Days');

  const filteredShipments = shipments.filter((item) => {
    const matchesSearch =
      item.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.trackingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.carrier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredShipments.length / pageSize));
  const paginatedShipments = filteredShipments.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createShipment({
      trackingId: formTracking || `TRK-${Math.floor(10000000 + Math.random() * 90000000)}`,
      orderId: formOrderId,
      carrier: formCarrier,
      destination: formDestination,
      pieces: parseInt(formPieces, 10) || 1,
      estimatedDelivery: formEstDelivery || '3 Days',
      status: 'in_transit',
    });
    setIsCreateOpen(false);
  };

  const handleExportManifest = () => {
    const headers = ['Tracking ID', 'Order ID', 'Carrier', 'Destination', 'Pieces', 'Dispatch Date', 'Status'];
    const rows = filteredShipments.map((s) => [
      s.trackingId,
      s.orderId,
      `"${s.carrier}"`,
      `"${s.destination}"`,
      s.pieces,
      `"${s.dispatchDate}"`,
      s.status,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `tuw_shipments_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardShell pageTitle="Shipments">
      <PageHeader
        title="Carrier Logistics & Shipments"
        actions={
          <>
            <Button variant="secondary" size="md" icon={<Download size={16} />} onClick={handleExportManifest}>
              Export Manifest
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={<Plus size={16} />}
              onClick={() => {
                if (canPerformAction('fulfillment')) setIsCreateOpen(true);
              }}
            >
              Create Shipment
            </Button>
          </>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <StatCard label="Dispatched Parcels" value={`${shipments.length} pkgs`} trend="Active manifests" trendType="up" hoverable />
        <StatCard label="In Transit" value={String(shipments.filter((s) => s.status === 'in_transit').length)} subtitle="En route to hubs" trendType="neutral" hoverable />
        <StatCard label="Out for Delivery" value={String(shipments.filter((s) => s.status === 'out_for_delivery').length)} subtitle="Final mile delivery" trendType="up" hoverable />
        <StatCard label="Delivered" value={String(shipments.filter((s) => s.status === 'delivered').length)} subtitle="Signed & confirmed" trendType="up" hoverable />
      </div>

      <ContentCard>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div style={{ maxWidth: 360, width: '100%' }}>
            <Input
              placeholder="Search by tracking #, order #, carrier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              prefixIcon={<Search size={16} />}
            />
          </div>

          <FilterPills
            variant="pills"
            ariaLabel="Shipment status filter"
            options={[
              { value: 'all', label: 'All' },
              { value: 'in_transit', label: 'In Transit' },
              { value: 'out_for_delivery', label: 'Out for Delivery' },
              { value: 'delivered', label: 'Delivered' },
              { value: 'exception', label: 'Exception' },
            ]}
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as typeof statusFilter)}
          />
        </div>

        <Table>
          <TableHeader style={{ borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)' }}>
            <TableRow hoverable={false}>
              <TableHead style={{ padding: '12px 16px' }}>Tracking #</TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Order</TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Carrier</TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Destination</TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Pieces</TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Status</TableHead>
              <TableHead style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedShipments.map((shipment) => (
              <TableRow
                key={shipment.trackingId}
                onClick={() => setSelectedShipment(shipment)}
                style={{
                  borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--tuw-bg-canvas, #F7F8F9)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <TableCell style={{ padding: '14px 16px', fontSize: 13, fontFamily: 'monospace', fontWeight: 600, color: 'var(--tuw-text-info, #175CD3)' }}>
                  {shipment.trackingId}
                </TableCell>
                <TableCell style={{ padding: '14px 16px', fontSize: 14, color: 'var(--tuw-action-primary, #7539FF)', fontWeight: 500 }}>
                  {shipment.orderId}
                </TableCell>
                <TableCell style={{ padding: '14px 16px', fontSize: 14, color: 'var(--tuw-text-primary, #262626)' }}>
                  {shipment.carrier}
                </TableCell>
                <TableCell style={{ padding: '14px 16px', fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                  {shipment.destination}
                </TableCell>
                <TableCell style={{ padding: '14px 16px', fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                  {shipment.pieces} pkgs
                </TableCell>
                <TableCell style={{ padding: '14px 16px' }}>
                  {shipment.status === 'delivered' && <Badge variant="success">Delivered</Badge>}
                  {shipment.status === 'in_transit' && <Badge variant="info">In Transit</Badge>}
                  {shipment.status === 'out_for_delivery' && <Badge variant="warning">Out for Delivery</Badge>}
                  {shipment.status === 'exception' && <Badge variant="danger">Exception</Badge>}
                </TableCell>
                <TableCell style={{ padding: '14px 16px', textAlign: 'right' }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedShipment(shipment);
                    }}
                  >
                    Track
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
          totalItems={filteredShipments.length}
          pageSize={pageSize}
          pageSizeOptions={[5, 10, 20]}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
        />
      </ContentCard>

      {/* Tracking Preview Drawer */}
      <Drawer
        isOpen={Boolean(selectedShipment)}
        onClose={() => setSelectedShipment(null)}
        title={selectedShipment ? `Tracking ${selectedShipment.trackingId}` : 'Shipment Details'}
        subtitle={selectedShipment ? `${selectedShipment.carrier} · ${selectedShipment.orderId}` : ''}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
            <Button variant="secondary" size="sm" onClick={() => setSelectedShipment(null)}>
              Close Tracking Preview
            </Button>
          </div>
        }
      >
        {selectedShipment && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <HeroCard
              badge={
                <Badge variant={selectedShipment.status === 'delivered' ? 'success' : selectedShipment.status === 'in_transit' ? 'info' : 'warning'}>
                  {selectedShipment.status}
                </Badge>
              }
            >
              <div>
                <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--tuw-text-secondary, #5D6772)' }}>Destination</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)', marginTop: 2 }}>{selectedShipment.destination}</div>
              </div>
            </HeroCard>

            {/* Carrier Transit Timeline */}
            <DrawerSection title="Carrier Transit Events" titleGap={16}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, borderLeft: '2px solid var(--tuw-border-subtle, #E2E4E6)', paddingLeft: 16, marginLeft: 6 }}>
                {selectedShipment.events.map((evt, idx) => (
                  <div key={idx} style={{ position: 'relative' }}>
                    <div
                      style={{
                        position: 'absolute',
                        left: -22,
                        top: 2,
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        backgroundColor: idx === 0 ? 'var(--tuw-action-primary, #7539FF)' : 'var(--tuw-border-control, #90979F)',
                      }}
                    />
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
                      {evt.description}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)', marginTop: 2, display: 'flex', gap: 10 }}>
                      <span><MapPin size={12} style={{ display: 'inline', marginRight: 2 }} />{evt.location}</span>
                      <span><Clock size={12} style={{ display: 'inline', marginRight: 2 }} />{evt.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </DrawerSection>
          </div>
        )}
      </Drawer>

      {/* Create Shipment Drawer */}
      <Drawer
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Outbound Shipment"
        subtitle="Generate a courier dispatch manifest record"
        width="540px"
        footer={
          <>
            <Button variant="secondary" size="md" type="button" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit" form="shipment-create-form">
              Generate Manifest
            </Button>
          </>
        }
      >
        <form id="shipment-create-form" onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <SearchableSelect
            label="Select Order"
            options={orders.map((o) => ({
              value: o.id,
              label: `${o.id} — ${o.customerName}`,
              meta: `₹${o.total.toFixed(2)}`,
              keywords: `${o.id} ${o.customerName}`,
            }))}
            value={formOrderId}
            onChange={setFormOrderId}
            searchable
            searchPlaceholder="Search orders by ID or customer…"
            emptyText="No orders match your search."
          />

          <Select
            label="Courier Carrier"
            value={formCarrier}
            onChange={(e) => setFormCarrier(e.target.value)}
            options={[
              { value: 'DHL Express Worldwide', label: 'DHL Express Worldwide' },
              { value: 'FedEx Priority', label: 'FedEx Priority' },
              { value: 'UPS Ground', label: 'UPS Ground' },
              { value: 'Bluedart Air Express', label: 'Bluedart Air Express' },
            ]}
          />

          <Input
            label="Tracking Number"
            value={formTracking}
            onChange={(e) => setFormTracking(e.target.value)}
            required
          />

          <Input
            label="Destination Address / Hub"
            value={formDestination}
            onChange={(e) => setFormDestination(e.target.value)}
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input
              label="Pieces (Parcels)"
              type="number"
              value={formPieces}
              onChange={(e) => setFormPieces(e.target.value)}
              required
            />
            <Input
              label="Estimated Delivery SLA"
              value={formEstDelivery}
              onChange={(e) => setFormEstDelivery(e.target.value)}
              required
            />
          </div>
        </form>
      </Drawer>
    </DashboardShell>
  );
}

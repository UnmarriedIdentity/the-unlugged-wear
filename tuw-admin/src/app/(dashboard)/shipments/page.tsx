'use client';

import React, { useState } from 'react';
import DashboardShell from '@/components/layout/DashboardShell';
import { ContentCard, StatCard, Badge, Button, Input, Modal, Drawer } from '@/components/ui';
import { Truck, Search, Filter, Download, ExternalLink, Calendar, MapPin, Clock, Plus } from 'lucide-react';
import { useAdminState } from '@/mocks/state';
import { ShipmentItem } from '@/mocks/fixtures';

export default function ShipmentsPage() {
  const { shipments, createShipment, orders, canPerformAction } = useAdminState();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ShipmentItem['status']>('all');

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
            Carrier Logistics & Shipments
          </h2>
          <p style={{ fontSize: 14, color: 'var(--tuw-text-secondary, #5D6772)' }}>
            Real-time multi-carrier transit manifests, SLA timelines, and package tracking previews.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
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
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <StatCard label="Dispatched Parcels" value={`${shipments.length} pkgs`} trend="Active manifests" trendType="up" />
        <StatCard label="In Transit" value={String(shipments.filter((s) => s.status === 'in_transit').length)} subtitle="En route to hubs" trendType="neutral" />
        <StatCard label="Out for Delivery" value={String(shipments.filter((s) => s.status === 'out_for_delivery').length)} subtitle="Final mile delivery" trendType="up" />
        <StatCard label="Delivered" value={String(shipments.filter((s) => s.status === 'delivered').length)} subtitle="Signed & confirmed" trendType="up" />
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

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(['all', 'in_transit', 'out_for_delivery', 'delivered', 'exception'] as const).map((st) => (
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
                {st === 'in_transit' ? 'In Transit' : st === 'out_for_delivery' ? 'Out for Delivery' : st.charAt(0).toUpperCase() + st.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)' }}>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Tracking #</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Order</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Carrier</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Destination</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Pieces</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredShipments.map((shipment) => (
                <tr
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
                  <td style={{ padding: '14px 16px', fontSize: 13, fontFamily: 'monospace', fontWeight: 600, color: 'var(--tuw-text-info, #175CD3)' }}>
                    {shipment.trackingId}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 14, color: 'var(--tuw-action-primary, #7539FF)', fontWeight: 500 }}>
                    {shipment.orderId}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 14, color: 'var(--tuw-text-primary, #262626)' }}>
                    {shipment.carrier}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                    {shipment.destination}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                    {shipment.pieces} pkgs
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {shipment.status === 'delivered' && <Badge variant="success">Delivered</Badge>}
                    {shipment.status === 'in_transit' && <Badge variant="info">In Transit</Badge>}
                    {shipment.status === 'out_for_delivery' && <Badge variant="warning">Out for Delivery</Badge>}
                    {shipment.status === 'exception' && <Badge variant="danger">Exception</Badge>}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
            <div style={{ padding: 16, backgroundColor: 'var(--tuw-bg-canvas, #F7F8F9)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--tuw-text-secondary, #5D6772)' }}>Destination</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)', marginTop: 2 }}>{selectedShipment.destination}</div>
              </div>
              <Badge variant={selectedShipment.status === 'delivered' ? 'success' : selectedShipment.status === 'in_transit' ? 'info' : 'warning'}>
                {selectedShipment.status}
              </Badge>
            </div>

            {/* Carrier Transit Timeline */}
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--tuw-text-primary, #262626)' }}>
                Carrier Transit Events
              </h4>
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
            </div>
          </div>
        )}
      </Drawer>

      {/* Create Shipment Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Outbound Shipment"
        subtitle="Generate a courier dispatch manifest record"
        footer={
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="secondary" size="md" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" onClick={handleCreateSubmit}>
              Generate Manifest
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--tuw-text-primary, #262626)', display: 'block', marginBottom: 6 }}>
              Select Order
            </label>
            <select
              value={formOrderId}
              onChange={(e) => setFormOrderId(e.target.value)}
              style={{ width: '100%', height: 40, borderRadius: 8, border: '1px solid var(--tuw-border-control, #90979F)', padding: '0 10px', fontSize: 13 }}
            >
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.id} — {o.customerName} (${o.total.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--tuw-text-primary, #262626)', display: 'block', marginBottom: 6 }}>
              Courier Carrier
            </label>
            <select
              value={formCarrier}
              onChange={(e) => setFormCarrier(e.target.value)}
              style={{ width: '100%', height: 40, borderRadius: 8, border: '1px solid var(--tuw-border-control, #90979F)', padding: '0 10px', fontSize: 13 }}
            >
              <option value="DHL Express Worldwide">DHL Express Worldwide</option>
              <option value="FedEx Priority">FedEx Priority</option>
              <option value="UPS Ground">UPS Ground</option>
              <option value="Bluedart Air Express">Bluedart Air Express</option>
            </select>
          </div>

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
      </Modal>
    </DashboardShell>
  );
}

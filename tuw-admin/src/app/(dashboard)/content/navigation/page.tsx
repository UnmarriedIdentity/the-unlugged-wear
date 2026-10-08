'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import DashboardShell from '@/components/layout/DashboardShell';
import {
  ContentCard,
  StatCard,
  Badge,
  Button,
  Input,
  Select,
  Modal,
  Drawer,
  EmptyState,
} from '@/components/ui';
import {
  Menu,
  Plus,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Trash2,
  Edit2,
  ExternalLink,
  Check,
} from 'lucide-react';
import { useAdminState } from '@/mocks/state';

interface MenuItem {
  id: string;
  label: string;
  url: string;
  menuGroup: 'header' | 'footer_shop' | 'footer_legal' | 'mobile';
  order: number;
  isExternal?: boolean;
}

const initialMenuItems: MenuItem[] = [
  // Header
  { id: 'nav-1', label: 'All Apparel', url: '/shop', menuGroup: 'header', order: 1 },
  { id: 'nav-2', label: 'Heavyweight Hoodies', url: '/shop?cat=hoodies', menuGroup: 'header', order: 2 },
  { id: 'nav-3', label: 'Organic Tees', url: '/shop?cat=tees', menuGroup: 'header', order: 3 },
  { id: 'nav-4', label: 'Capsules', url: '/collections', menuGroup: 'header', order: 4 },
  { id: 'nav-5', label: 'Journal', url: '/journal', menuGroup: 'header', order: 5 },
  { id: 'nav-6', label: 'About', url: '/about', menuGroup: 'header', order: 6 },

  // Footer Shop
  { id: 'nav-7', label: 'New Arrivals', url: '/shop?sort=newest', menuGroup: 'footer_shop', order: 1 },
  { id: 'nav-8', label: 'Sustainable Sourcing', url: '/about/sustainability', menuGroup: 'footer_shop', order: 2 },
  { id: 'nav-9', label: 'Track My Order', url: '/track-order', menuGroup: 'footer_shop', order: 3 },
  { id: 'nav-10', label: 'Size Guide', url: '/size-guide', menuGroup: 'footer_shop', order: 4 },

  // Footer Legal
  { id: 'nav-11', label: 'Privacy Policy', url: '/policies/privacy', menuGroup: 'footer_legal', order: 1 },
  { id: 'nav-12', label: 'Terms of Service', url: '/policies/terms', menuGroup: 'footer_legal', order: 2 },
  { id: 'nav-13', label: 'Return Policy', url: '/policies/returns', menuGroup: 'footer_legal', order: 3 },
  { id: 'nav-14', label: 'Shipping Policy', url: '/policies/shipping', menuGroup: 'footer_legal', order: 4 },
];

export default function NavigationPage() {
  const { showToast, canPerformAction } = useAdminState();
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems);
  const [selectedGroup, setSelectedGroup] = useState<'header' | 'footer_shop' | 'footer_legal'>('header');

  // Modals & Edit
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // New Item State
  const [newLabel, setNewLabel] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newGroup, setNewGroup] = useState<'header' | 'footer_shop' | 'footer_legal'>('header');

  const currentItems = menuItems
    .filter((item) => item.menuGroup === selectedGroup)
    .sort((a, b) => a.order - b.order);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPerformAction('products')) {
      showToast({
        type: 'warning',
        title: 'Permission Denied',
        description: 'Your current role cannot modify navigation trees.',
      });
      return;
    }

    if (!newLabel.trim() || !newUrl.trim()) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        description: 'Label and destination URL are required.',
      });
      return;
    }

    const newItem: MenuItem = {
      id: `nav-${Date.now()}`,
      label: newLabel.trim(),
      url: newUrl.trim(),
      menuGroup: newGroup,
      order: currentItems.length + 1,
    };

    setMenuItems((prev) => [...prev, newItem]);
    setIsAddModalOpen(false);
    setNewLabel('');
    setNewUrl('');
    showToast({
      type: 'success',
      title: 'Link Added',
      description: `Added "${newItem.label}" to navigation.`,
    });
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (!canPerformAction('products')) {
      showToast({
        type: 'warning',
        title: 'Permission Denied',
        description: 'Your current role cannot reorder navigation links.',
      });
      return;
    }

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentItems.length) return;

    const itemA = currentItems[index];
    const itemB = currentItems[targetIndex];

    setMenuItems((prev) =>
      prev.map((item) => {
        if (item.id === itemA.id) return { ...item, order: itemB.order };
        if (item.id === itemB.id) return { ...item, order: itemA.order };
        return item;
      })
    );
  };

  const handleDelete = (id: string) => {
    if (!canPerformAction('products')) {
      showToast({
        type: 'warning',
        title: 'Permission Denied',
        description: 'Your current role cannot delete navigation items.',
      });
      return;
    }

    const item = menuItems.find((m) => m.id === id);
    setMenuItems((prev) => prev.filter((m) => m.id !== id));
    showToast({
      type: 'info',
      title: 'Link Removed',
      description: `Removed "${item?.label || 'link'}" from menu.`,
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    if (!canPerformAction('products')) {
      showToast({
        type: 'warning',
        title: 'Permission Denied',
        description: 'Your current role cannot edit navigation items.',
      });
      return;
    }

    setMenuItems((prev) =>
      prev.map((item) => (item.id === editingItem.id ? editingItem : item))
    );
    setEditingItem(null);
    showToast({
      type: 'success',
      title: 'Link Updated',
      description: `Updated "${editingItem.label}".`,
    });
  };

  return (
    <DashboardShell pageTitle="Storefront Navigation">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Link
              href="/content"
              style={{
                color: 'var(--tuw-text-secondary, #5D6772)',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 13,
              }}
            >
              <ArrowLeft size={14} /> Back to Content
            </Link>
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
            Store Navigation Menus
          </h2>
          <p style={{ fontSize: 14, color: 'var(--tuw-text-secondary, #5D6772)' }}>
            Configure main header navigation, category links, and footer site maps.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          icon={<Plus size={16} />}
          onClick={() => {
            setNewGroup(selectedGroup);
            setIsAddModalOpen(true);
          }}
        >
          Add Menu Item
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <StatCard
          label="Active Menu Sets"
          value="3 Sets"
          subtitle="Main Header, Footer Shop, Legal"
          trendType="neutral"
          hoverable
        />
        <StatCard
          label="Total Links"
          value={`${menuItems.length} Links`}
          subtitle="Zero 404 links detected"
          trendType="up"
          hoverable
        />
        <StatCard
          label="Hierarchy Depth"
          value="1 Level"
          subtitle="Touch-friendly flat navigation"
          trendType="up"
          hoverable
        />
        <StatCard
          label="Menu Edge Cache"
          value="TTL 3600s"
          subtitle="Purged automatically on save"
          trendType="neutral"
          hoverable
        />
      </div>

      <ContentCard>
        {/* Menu Set Selector Tabs */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)',
            paddingBottom: 16,
            marginBottom: 20,
          }}
        >
          {[
            { id: 'header', label: 'Main Header Navigation' },
            { id: 'footer_shop', label: 'Footer — Explore & Care' },
            { id: 'footer_legal', label: 'Footer — Legal & Policies' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedGroup(tab.id as any)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: 13,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                backgroundColor:
                  selectedGroup === tab.id
                    ? 'var(--tuw-action-primary, #7539FF)'
                    : 'var(--tuw-bg-surface-subtle, #F1F3F5)',
                color: selectedGroup === tab.id ? '#FFFFFF' : 'var(--tuw-text-secondary, #5D6772)',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Reorderable Menu List */}
        {currentItems.length === 0 ? (
          <EmptyState
            title="No items in this menu"
            description="Add your first link to this navigation container."
            actionLabel="Add Item"
            onAction={() => {
              setNewGroup(selectedGroup);
              setIsAddModalOpen(true);
            }}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {currentItems.map((item, index) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  border: '1px solid var(--tuw-border-subtle, #E2E4E6)',
                  borderRadius: '8px',
                  backgroundColor: 'var(--tuw-bg-surface, #FFFFFF)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      backgroundColor: 'var(--tuw-bg-surface-subtle, #F1F3F5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--tuw-text-secondary, #5D6772)',
                    }}
                  >
                    {index + 1}
                  </span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--tuw-text-primary, #262626)' }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--tuw-action-primary, #7539FF)' }}>
                      <code>{item.url}</code>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={index === 0}
                    onClick={() => handleMove(index, 'up')}
                    aria-label="Move Up"
                  >
                    <ArrowUp size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={index === currentItems.length - 1}
                    onClick={() => handleMove(index, 'down')}
                    aria-label="Move Down"
                  >
                    <ArrowDown size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingItem(item)}
                    aria-label="Edit Item"
                  >
                    <Edit2 size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    style={{ color: 'var(--tuw-status-danger, #EF4444)' }}
                    onClick={() => handleDelete(item.id)}
                    aria-label="Delete Item"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ContentCard>

      {/* Add Item Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Navigation Item"
        subtitle="Insert a link into the navigation hierarchy."
      >
        <form onSubmit={handleAddItem} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input
            label="Display Label"
            placeholder="e.g. Heavyweight Hoodies"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            required
          />
          <Input
            label="Destination Path / URL"
            placeholder="/shop?category=hoodies"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            required
          />
          <Select
            label="Menu Location"
            value={newGroup}
            onChange={(val) => setNewGroup(val as any)}
            options={[
              { value: 'header', label: 'Main Header Navigation' },
              { value: 'footer_shop', label: 'Footer — Explore & Care' },
              { value: 'footer_legal', label: 'Footer — Legal & Policies' },
            ]}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Add Link
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Item Modal */}
      <Modal
        isOpen={Boolean(editingItem)}
        onClose={() => setEditingItem(null)}
        title="Edit Navigation Link"
      >
        {editingItem && (
          <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input
              label="Display Label"
              value={editingItem.label}
              onChange={(e) => setEditingItem({ ...editingItem, label: e.target.value })}
              required
            />
            <Input
              label="Destination Path / URL"
              value={editingItem.url}
              onChange={(e) => setEditingItem({ ...editingItem, url: e.target.value })}
              required
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <Button variant="secondary" onClick={() => setEditingItem(null)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Save Link
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </DashboardShell>
  );
}

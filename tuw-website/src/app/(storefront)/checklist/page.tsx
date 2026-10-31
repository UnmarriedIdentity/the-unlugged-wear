'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumb from '@/components/ui/Breadcrumb';
import {
  CheckCircle2,
  Clock,
  XCircle,
  Plus,
  Trash2,
  ExternalLink,
  Search,
  Filter,
  RotateCcw,
  Copy,
  Check,
  Sparkles,
  Edit3,
  Save,
  AlertCircle,
  Download,
  Upload,
  Globe,
  Laptop,
} from 'lucide-react';

export type PageStatus = 'done' | 'in_progress' | 'pending';

export interface ChecklistItem {
  index: number;
  id: string;
  area: 'Core' | 'Auth' | 'Shopping' | 'Discovery' | 'Purchase' | 'Account' | 'Support' | 'Brand' | 'Policies' | 'System' | string;
  name: string;
  route: string;
  purpose: string;
  status: PageStatus;
  notes?: string;
  isCustom?: boolean;
  image?: string;
}

export const HOSTED_BASE_URL = 'https://tuw-storefront.vercel.app';

// Exactly matches all routes listed in ENDPOINTS.md (1 to 40)
export const DEFAULT_CHECKLIST: ChecklistItem[] = [
  {
    "index": 1,
    "id": "1-home",
    "area": "Core",
    "name": "Home Page",
    "route": "/",
    "purpose": "Editorial landing page with hero, brand values, selected essentials, capsule series, and the Rolls-Royce scroll-morph navbar.",
    "status": "pending"
  },
  {
    "index": 2,
    "id": "2-shop",
    "area": "Shopping",
    "name": "Catalog & Shop",
    "route": "/shop",
    "purpose": "Complete product browsing with desktop FilterBar, mobile slide-over filter drawer, sort dropdown, and active filter pills.",
    "status": "pending"
  },
  {
    "index": 3,
    "id": "3-collections",
    "area": "Shopping",
    "name": "Capsule Collections",
    "route": "/collections",
    "purpose": "Seasonal slow-fashion capsule overview with high-res lookbook banners and garment counts.",
    "status": "pending"
  },
  {
    "index": 4,
    "id": "4-collections-detail",
    "area": "Shopping",
    "name": "Capsule Detail",
    "route": "/collections/hoodies-and-sweats",
    "purpose": "Dedicated capsule collection view with curated matching product grid.",
    "status": "pending"
  },
  {
    "id": "pdp-monolith-hoodie",
    "area": "Shopping",
    "name": "PDP: Monolith Heavyweight Hoodie",
    "route": "/products/monolith-heavyweight-hoodie-vintage-black",
    "image": "/products/2.jpeg",
    "purpose": "500 GSM architectural loopback French terry hoodie, packaging unboxing radio (+₹250), CM/IN sizing table, and customer reviews.",
    "status": "done",
    "index": 5
  },
  {
    "id": "pdp-atelier-tee",
    "area": "Shopping",
    "name": "PDP: Atelier Raw-Edge Relaxed Tee",
    "route": "/products/oversized-classic-tee",
    "image": "/products/1.jpeg",
    "purpose": "280 GSM single-origin combed organic cotton tee with dynamic Textile Integrity & Fiber Characteristics table (4 comparison columns).",
    "status": "done",
    "index": 6
  },
  {
    "id": "pdp-solitude-trousers",
    "area": "Shopping",
    "name": "PDP: Solitude Wide-Leg Canvas Trousers",
    "route": "/products/solitude-wide-leg-canvas-trousers",
    "image": "/products/3.jpeg",
    "purpose": "Heavyweight duck canvas pleated trousers with waist/inseam sizing matrix and utilitarian pockets.",
    "status": "done",
    "index": 7
  },
  {
    "id": "pdp-crewneck-slate",
    "area": "Shopping",
    "name": "PDP: Kinetic Heavy Fleece Crewneck",
    "route": "/products/unplugged-oversized-crewneck-slate",
    "image": "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=1200&auto=format&fit=crop&q=80",
    "purpose": "Heavy fleece crewneck with drop-shoulder silhouette, sizing table with CM/IN toggles, and apparel FAQs.",
    "status": "done",
    "index": 8
  },
  {
    "id": "pdp-carryall-tote",
    "area": "Shopping",
    "name": "PDP: Heavy Canvas Utility Carryall Tote",
    "route": "/products/heavy-canvas-utility-carryall-tote",
    "image": "https://images.unsplash.com/photo-1544816155-12df9643f363?w=1200&auto=format&fit=crop&q=80",
    "purpose": "28L utilitarian carryall tote bag. Size pills strictly hidden; strap radio options (Shoulder Drop ₹0 vs Padded Crossbody +₹150).",
    "status": "done",
    "index": 9
  },
  {
    "id": "pdp-dad-cap",
    "area": "Shopping",
    "name": "PDP: Low-Profile Distressed Dad Cap",
    "route": "/products/washed-cotton-dad-cap-minimal",
    "image": "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=1200&auto=format&fit=crop&q=80",
    "purpose": "Low-profile 6-panel washed cotton cap with debossed antique brass buckle closure. Size pills hidden; strict table omission.",
    "status": "done",
    "index": 10
  },
  {
    "id": "pdp-zip-hoodie",
    "area": "Shopping",
    "name": "PDP: Architectural Drop-Shoulder Zip Hoodie",
    "route": "/products/architectural-zip-hoodie",
    "image": "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=1200&auto=format&fit=crop&q=80",
    "purpose": "520 GSM extra-dense combed organic terry with two-way matte gunmetal zipper and sizing chart.",
    "status": "done",
    "index": 11
  },
  {
    "id": "pdp-bomber-jacket",
    "area": "Shopping",
    "name": "PDP: Technical Shell Modular Bomber Jacket",
    "route": "/products/technical-shell-modular-bomber-jacket",
    "image": "https://images.unsplash.com/photo-1544441893-675973e31985?w=1200&auto=format&fit=crop&q=80",
    "purpose": "3-layer waterproof breathable membrane with Aquaguard zippers, interior shoulder carry strap, and outerwear sizing specs.",
    "status": "done",
    "index": 12
  },
  {
    "id": "pdp-waffle-tee",
    "area": "Shopping",
    "name": "PDP: Raw Hem Heavyweight Thermal Waffle Tee",
    "route": "/products/raw-hem-heavyweight-thermal-waffle-tee",
    "image": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=1200&auto=format&fit=crop&q=80",
    "purpose": "360 GSM honeycomb knitted cotton with raw-cut hem, graceful image fallback handling, and sizing guide.",
    "status": "done",
    "index": 13
  },
  {
    "id": "pdp-chore-coat",
    "area": "Shopping",
    "name": "PDP: Japanese Selvedge Chore Coat",
    "route": "/products/japanese-selvedge-cotton-chore-coat",
    "image": "https://images.unsplash.com/photo-1544441893-675973e31985?w=1200&auto=format&fit=crop&q=80",
    "purpose": "14.5 oz shuttle-loomed selvedge denim chore coat with copper rivet reinforcements and sizing table.",
    "status": "done",
    "index": 14
  },
  {
    "id": "pdp-studio-blanket",
    "area": "Shopping",
    "name": "PDP: Brushed Cashmere Studio Blanket",
    "route": "/products/brushed-cashmere-ribbed-studio-blanket",
    "image": "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=1200&auto=format&fit=crop&q=80",
    "purpose": "100% Grade-A Mongolian cashmere throw. Strict table omission (specTable: null); edge finish radio options (+₹300).",
    "status": "done",
    "index": 15
  },
  {
    "id": "pdp-windbreaker",
    "area": "Shopping",
    "name": "PDP: Minimalist Modular Ripstop Windbreaker",
    "route": "/products/modular-lightweight-ripstop-windbreaker",
    "image": "https://images.unsplash.com/photo-1544441893-675973e31985?w=1200&auto=format&fit=crop&q=80",
    "purpose": "Diamond micro-ripstop windbreaker with packable self-stow hood and sizing table.",
    "status": "done",
    "index": 16
  },
  {
    "id": "pdp-ceramic-mug",
    "area": "Shopping",
    "name": "PDP: Stoneware Emblem Ceramic Mug",
    "route": "/products/stoneware-emblem-ceramic-mug",
    "image": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=1200&auto=format&fit=crop&q=80",
    "purpose": "Wheel-thrown stoneware ceramic mug. Capacity chips (350ml / 450ml), 1,240°C kiln-firing ceramic specs table, and food-safe FAQs.",
    "status": "done",
    "index": 17
  },
  {
    "id": "pdp-kids-tee",
    "area": "Shopping",
    "name": "PDP: Kids Organic Cotton Emblem Tee",
    "route": "/products/kids-organic-cotton-emblem-tee",
    "image": "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=1200&auto=format&fit=crop&q=80",
    "purpose": "Little Atelier kids organic tee with age/height growth chart table (2-3Y to 10-11Y), anti-chafe flatlock seams, and child-safe FAQs.",
    "status": "done",
    "index": 18
  },
  {
    "index": 19,
    "id": "6-cart",
    "area": "Purchase",
    "name": "Shopping Bag",
    "route": "/cart",
    "purpose": "Full-page shopping cart with free-shipping threshold tracker (₹3,000 threshold), item quantity controls, and coupon code entry.",
    "status": "pending"
  },
  {
    "index": 20,
    "id": "7-checkout",
    "area": "Purchase",
    "name": "Checkout & Simulation",
    "route": "/checkout",
    "purpose": "Multi-step checkout with address selection and interactive Payment Simulation Panel (UPI QR, Card, COD).",
    "status": "pending"
  },
  {
    "index": 21,
    "id": "8-checkout-success",
    "area": "Purchase",
    "name": "Order Confirmation & Receipt",
    "route": "/checkout/success",
    "purpose": "Post-purchase order confirmation screen with order summary and shipment tracking seam.",
    "status": "pending"
  },
  {
    "index": 22,
    "id": "9-wishlist",
    "area": "Discovery",
    "name": "Saved Garments",
    "route": "/wishlist",
    "purpose": "Customer wishlist with real-time counter in header and one-click add to cart.",
    "status": "pending"
  },
  {
    "index": 23,
    "id": "10-search",
    "area": "Discovery",
    "name": "Catalog Search",
    "route": "/search?q=hoodie",
    "purpose": "Instant product and collection search overlay and dedicated results page.",
    "status": "pending"
  },
  {
    "index": 24,
    "id": "11-track-order",
    "area": "Support",
    "name": "Order Tracking",
    "route": "/track-order",
    "purpose": "Real-time shipment tracker supporting reference lookups (e.g. TUW-98214-DEL) with chronological checkpoint milestones.",
    "status": "pending"
  },
  {
    "index": 25,
    "id": "12-size-guide",
    "area": "Support",
    "name": "Interactive Size Guide",
    "route": "/size-guide",
    "purpose": "Sizing tables with dynamic centimeter/inch unit toggles across Chest, Length, Sleeve, and Shoulder.",
    "status": "pending"
  },
  {
    "index": 26,
    "id": "13-about",
    "area": "Brand",
    "name": "Brand Philosophy",
    "route": "/about",
    "purpose": "The Unplugged Wear founding story, slow-living philosophy, and Tiruppur craft manifesto.",
    "status": "pending"
  },
  {
    "index": 27,
    "id": "14-about-sustainability",
    "area": "Brand",
    "name": "Sustainability & POD",
    "route": "/about/sustainability",
    "purpose": "Zero-deadstock on-demand manufacturing manifesto, 500 GSM loopback cotton sourcing, and eco-certified water dyes.",
    "status": "pending"
  },
  {
    "index": 28,
    "id": "15-our-story",
    "area": "Brand",
    "name": "Our Story",
    "route": "/about",
    "purpose": "The founding journey of The Unplugged Wear and tactile design ethos.",
    "status": "pending"
  },
  {
    "index": 29,
    "id": "16-journal",
    "area": "Brand",
    "name": "Editorial Journal",
    "route": "/journal",
    "purpose": "Slow-living publications, design essays, and behind-the-scenes craft stories.",
    "status": "pending"
  },
  {
    "index": 30,
    "id": "17-journal-article",
    "area": "Brand",
    "name": "Journal Article View",
    "route": "/journal/choosing-our-blanks",
    "purpose": "Rich editorial article with typographic hierarchy, pull quotes, and author info.",
    "status": "pending"
  },
  {
    "index": 31,
    "id": "18-blog",
    "area": "Brand",
    "name": "Blog Index",
    "route": "/journal",
    "purpose": "Canonical blog index (aliases Journal entries).",
    "status": "pending"
  },
  {
    "index": 32,
    "id": "19-blog-article",
    "area": "Brand",
    "name": "Blog Article View",
    "route": "/journal/zero-deadstock-print-on-demand",
    "purpose": "Individual blog post view with related stories and share metadata.",
    "status": "pending"
  },
  {
    "index": 33,
    "id": "20-contact",
    "area": "Support",
    "name": "Concierge & Inquiries",
    "route": "/contact",
    "purpose": "Concierge inquiries form, studio hours, and client support channels.",
    "status": "pending"
  },
  {
    "index": 34,
    "id": "21-faq",
    "area": "Support",
    "name": "Frequently Asked Questions",
    "route": "/faq",
    "purpose": "Accordion FAQ addressing sizing, shipping timelines, fabrics, and care.",
    "status": "pending"
  },
  {
    "index": 35,
    "id": "22-account",
    "area": "Account",
    "name": "Customer Account Portal",
    "route": "/account",
    "purpose": "Customer profile dashboard, saved addresses, preferences, and quick links.",
    "status": "pending"
  },
  {
    "index": 36,
    "id": "23-account-orders",
    "area": "Account",
    "name": "Account Order History",
    "route": "/account/orders",
    "purpose": "Order history listing with status badges (shipped, delivered, queued).",
    "status": "pending"
  },
  {
    "index": 37,
    "id": "24-account-order-details",
    "area": "Account",
    "name": "Account Order Details",
    "route": "/account/orders/ord-9042",
    "purpose": "Detailed invoice, fulfillment milestone breadcrumbs, and return request seam.",
    "status": "pending"
  },
  {
    "index": 38,
    "id": "25-login",
    "area": "Auth",
    "name": "Customer Login",
    "route": "/login",
    "purpose": "Customer sign in with email and password.",
    "status": "pending"
  },
  {
    "index": 39,
    "id": "26-register",
    "area": "Auth",
    "name": "Customer Registration",
    "route": "/register",
    "purpose": "New client account creation with lifestyle hero imagery.",
    "status": "pending"
  },
  {
    "index": 40,
    "id": "27-forgot-password",
    "area": "Auth",
    "name": "Forgot Password",
    "route": "/forgot-password",
    "purpose": "Password reset request with email recovery link dispatch.",
    "status": "pending"
  },
  {
    "index": 41,
    "id": "28-reset-password",
    "area": "Auth",
    "name": "Reset Password",
    "route": "/reset-password",
    "purpose": "Password reset confirmation with new credential entry.",
    "status": "pending"
  },
  {
    "index": 42,
    "id": "29-policies",
    "area": "Policies",
    "name": "Policy Hub",
    "route": "/policies",
    "purpose": "Policy directory and customer protection overview.",
    "status": "pending"
  },
  {
    "index": 43,
    "id": "30-policies-privacy",
    "area": "Policies",
    "name": "Privacy Policy",
    "route": "/policies/privacy",
    "purpose": "Full privacy notice and data processing disclosure.",
    "status": "pending"
  },
  {
    "index": 44,
    "id": "31-privacy-policy",
    "area": "Policies",
    "name": "Privacy Policy (Direct URL)",
    "route": "/policies/privacy",
    "purpose": "Vanity alias route to Privacy Policy.",
    "status": "pending"
  },
  {
    "index": 45,
    "id": "32-policies-returns",
    "area": "Policies",
    "name": "Returns & Refunds Policy",
    "route": "/policies/returns",
    "purpose": "7-day exchange window, conditions, and return guidelines.",
    "status": "pending"
  },
  {
    "index": 46,
    "id": "33-returns-refunds",
    "area": "Policies",
    "name": "Returns & Refunds (Direct URL)",
    "route": "/policies/returns",
    "purpose": "Vanity alias route to Returns & Refunds Policy.",
    "status": "pending"
  },
  {
    "index": 47,
    "id": "34-policies-shipping",
    "area": "Policies",
    "name": "Shipping Policy",
    "route": "/policies/shipping",
    "purpose": "Pan-India shipping timelines (5–8 business days) and carrier details.",
    "status": "pending"
  },
  {
    "index": 48,
    "id": "35-shipping-policy",
    "area": "Policies",
    "name": "Shipping Policy (Direct URL)",
    "route": "/policies/shipping",
    "purpose": "Vanity alias route to Shipping Policy.",
    "status": "pending"
  },
  {
    "index": 49,
    "id": "36-policies-terms",
    "area": "Policies",
    "name": "Terms & Conditions",
    "route": "/policies/terms",
    "purpose": "Store terms of service, intellectual property, and governing law.",
    "status": "pending"
  },
  {
    "index": 50,
    "id": "37-terms",
    "area": "Policies",
    "name": "Terms (Direct URL)",
    "route": "/policies/terms",
    "purpose": "Vanity alias route to Terms & Conditions.",
    "status": "pending"
  },
  {
    "index": 51,
    "id": "38-checklist",
    "area": "System",
    "name": "Storefront Checklist & Tracker",
    "route": "/checklist",
    "purpose": "Interactive page progress tracker: toggle Done/Not Done, add custom pages, edit review notes, and save.",
    "status": "pending"
  },
  {
    "index": 52,
    "id": "39-design-system",
    "area": "System",
    "name": "Design System Specimen",
    "route": "/design-system",
    "purpose": "Live UI component library: color palettes, typography scale, buttons, badges, drawers, and form controls.",
    "status": "pending"
  },
  {
    "index": 53,
    "id": "40-not-found",
    "area": "System",
    "name": "Custom 404 Experience",
    "route": "/non-existent-page-demo",
    "purpose": "Architectural slow-fashion 404 page with quick recovery links back to the catalog.",
    "status": "pending"
  }
];

const STORAGE_KEY = 'tuw_website_v2_roadmap_checklist_v6';

export default function ChecklistPage() {
  const [items, setItems] = useState<ChecklistItem[]>(DEFAULT_CHECKLIST);
  const [loading, setLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Filters & search
  const [statusFilter, setStatusFilter] = useState<'all' | PageStatus>('all');
  const [areaFilter, setAreaFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');

  // File upload ref for JSON import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New item form state
  const [newName, setNewName] = useState('');
  const [newArea, setNewArea] = useState('Shopping');
  const [newRoute, setNewRoute] = useState('');
  const [newPurpose, setNewPurpose] = useState('');
  const [newStatus, setNewStatus] = useState<PageStatus>('pending');
  const [newNotes, setNewNotes] = useState('');

  // Load checklist on mount from API or LocalStorage
  useEffect(() => {
    async function loadChecklist() {
      // Helper to merge images into loaded items
      const mergeWithDefaults = (loadedItems: ChecklistItem[]) => {
        return loadedItems.map((item) => {
          if (!item.image) {
            const def = DEFAULT_CHECKLIST.find((d) => d.id === item.id || d.route === item.route);
            if (def?.image) return { ...item, image: def.image };
          }
          return item;
        });
      };

      // 1. Try local storage first
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length >= 45) {
            setItems(mergeWithDefaults(parsed));
            setLoading(false);
            return;
          }
        }
      } catch {
        // Ignore parse error
      }

      // 2. Try backend API
      try {
        const res = await fetch('/api/checklist');
        if (res.ok) {
          const json = await res.json();
          if (json.data && Array.isArray(json.data.items) && json.data.items.length >= 45) {
            setItems(mergeWithDefaults(json.data.items));
            if (json.data.lastSavedAt) {
              setLastSavedAt(new Date(json.data.lastSavedAt).toLocaleTimeString());
            }
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Could not fetch from /api/checklist, using defaults', err);
      }

      // 3. Fallback to bundled defaults
      setItems(DEFAULT_CHECKLIST);
      setLoading(false);
    }

    loadChecklist();
  }, []);

  // Save changes handler to both /api/checklist and localStorage
  const handleSaveChanges = async (customItemsList?: ChecklistItem[]) => {
    const dataToSave = customItemsList || items;
    setIsSaving(true);
    const nowTime = new Date().toLocaleTimeString();

    try {
      // 1. Save to browser localStorage (always works on both localhost and hosted domains)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));

      // 2. Save via API (persists to disk in node, safely acknowledged on edge)
      const res = await fetch('/api/checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: dataToSave }),
      });

      setHasUnsavedChanges(false);
      setLastSavedAt(nowTime);

      if (res.ok) {
        const json = await res.json();
        const modeText = json.savedToDisk ? 'disk & browser' : 'browser storage';
        setSaveToast(`Checklist saved successfully to ${modeText}! (${nowTime})`);
      } else {
        setSaveToast(`Saved to browser storage! (${nowTime})`);
      }
      setTimeout(() => setSaveToast(null), 3500);
    } catch {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      setHasUnsavedChanges(false);
      setLastSavedAt(nowTime);
      setSaveToast('Saved locally in browser storage!');
      setTimeout(() => setSaveToast(null), 3500);
    } finally {
      setIsSaving(false);
    }
  };

  // Export JSON backup file
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(items, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `tuw-checklist-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setSaveToast('Checklist state JSON exported!');
    setTimeout(() => setSaveToast(null), 3000);
  };

  // Import JSON backup file
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed);
          setHasUnsavedChanges(true);
          setSaveToast(`Imported ${parsed.length} pages from backup! Click Save Changes.`);
          setTimeout(() => setSaveToast(null), 4000);
        } else {
          alert('Invalid checklist JSON file format.');
        }
      } catch {
        alert('Could not parse JSON file.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Status toggle handler
  const handleToggleStatus = (id: string, newStatus: PageStatus) => {
    const updated = items.map((item) =>
      item.id === id ? { ...item, status: newStatus } : item
    );
    setItems(updated);
    setHasUnsavedChanges(true);
  };

  // Quick 1-click checkbox toggle between 'pending' (Not Complete) and 'done' (Complete)
  const handleQuickCheck = (id: string) => {
    const updated = items.map((item) => {
      if (item.id === id) {
        const nextStatus: PageStatus = item.status === 'done' ? 'pending' : 'done';
        return { ...item, status: nextStatus };
      }
      return item;
    });
    setItems(updated);
    setHasUnsavedChanges(true);
  };

  // Mark all as done
  const handleMarkAll = (status: PageStatus) => {
    const label = status === 'done' ? 'Complete' : 'Not Complete';
    if (confirm(`Are you sure you want to mark all pages as "${label}"? Remember to click Save.`)) {
      const updated = items.map((item) => ({ ...item, status }));
      setItems(updated);
      setHasUnsavedChanges(true);
    }
  };

  // Delete custom item
  const handleDeleteItem = (id: string) => {
    if (confirm('Are you sure you want to remove this item from the checklist?')) {
      const updated = items.filter((item) => item.id !== id);
      setItems(updated);
      setHasUnsavedChanges(true);
    }
  };

  // Reset to default (all Not Complete)
  const handleReset = async () => {
    if (confirm('Reset all pages to "Not Complete"?')) {
      const updated = items.map((item) => ({ ...item, status: 'pending' as PageStatus }));
      setItems(updated);
      await handleSaveChanges(updated);
    }
  };

  // Save note edit
  const handleSaveNote = (id: string) => {
    const updated = items.map((item) =>
      item.id === id ? { ...item, notes: noteDraft.trim() || undefined } : item
    );
    setItems(updated);
    setHasUnsavedChanges(true);
    setEditingNoteId(null);
    setNoteDraft('');
  };

  // Add new item
  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newRoute.trim()) return;

    const newItem: ChecklistItem = {
      index: items.length + 1,
      id: `custom-${Date.now()}`,
      name: newName.trim(),
      area: newArea.trim() || 'Custom',
      route: newRoute.trim().startsWith('/') ? newRoute.trim() : `/${newRoute.trim()}`,
      purpose: newPurpose.trim() || 'Custom application view or sub-route.',
      status: newStatus,
      notes: newNotes.trim() || undefined,
      isCustom: true,
    };

    const updated = [...items, newItem];
    setItems(updated);
    setHasUnsavedChanges(true);

    setNewName('');
    setNewRoute('');
    setNewPurpose('');
    setNewNotes('');
    setNewStatus('pending');
    setShowAddModal(false);
  };

  // Export Markdown summary
  const handleCopyMarkdown = () => {
    const lines = [
      `# The Unplugged Wear — Complete Storefront Checklist`,
      `> Generated on ${new Date().toLocaleDateString()} | Completion: ${doneCount}/${items.length} (${percentDone}%)`,
      ``,
      `| # | Area | Page | Local Route | Hosted Vercel URL | Status | Description | Notes |`,
      `|---|:---|:---|:---|:---|:---:|:---|:---|`,
    ];

    items.forEach((item) => {
      const statusIcon =
        item.status === 'done' ? '🟢 Complete' : item.status === 'in_progress' ? '🟡 In Progress' : '⚪ Not Complete';
      const hostedUrl = `${HOSTED_BASE_URL}${item.route}`;
      lines.push(
        `| ${item.index} | ${item.area} | **${item.name}** | \`${item.route}\` | [${item.route}](${hostedUrl}) | ${statusIcon} | ${item.purpose} | ${item.notes || '-'} |`
      );
    });

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Stats calculation
  const totalCount = items.length;
  const doneCount = items.filter((i) => i.status === 'done').length;
  const inProgressCount = items.filter((i) => i.status === 'in_progress').length;
  const pendingCount = items.filter((i) => i.status === 'pending').length;
  const percentDone = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  // Filter options
  const uniqueAreas = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => set.add(i.area));
    return Array.from(set);
  }, [items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchesArea = areaFilter === 'all' || item.area === areaFilter;
      const matchesSearch =
        searchQuery === '' ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.route.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesStatus && matchesArea && matchesSearch;
    });
  }, [items, statusFilter, areaFilter, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6]">
      <Header />

      {/* Hidden file input for importing JSON backup */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportJSON}
        accept=".json"
        className="hidden"
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Complete Storefront Checklist (40 Pages)' },
          ]}
        />

        {/* Floating Notification Toast */}
        {saveToast && (
          <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="bg-[#1A1A1A] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-[#333]">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="text-xs sm:text-sm font-semibold">{saveToast}</span>
            </div>
          </div>
        )}

        {/* Page Title & Save Actions Header */}
        <div className="mt-8 mb-8 pb-8 border-b border-[#E2DDCF]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#F4F1EA] text-[#C8A96A] border border-[#E2DDCF] mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                All 40 Routes Mapped with Localhost & Hosted Links
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#1A1A1A]">
                Storefront Pages Checklist
              </h1>
              <p className="mt-2 text-sm sm:text-base text-[#666] max-w-2xl">
                Every page includes dedicated links to both your <strong>Localhost</strong> and <strong>Hosted Vercel Site</strong> (<code>tuw-storefront.vercel.app</code>). Toggle status, write review notes, and click <strong>Save Changes</strong>.
              </p>
            </div>

            {/* SAVE BUTTON & Actions */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* PRIMARY SAVE BUTTON */}
              <button
                onClick={() => handleSaveChanges()}
                disabled={isSaving}
                className={`relative inline-flex items-center gap-2.5 px-6 py-3 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all shadow-md ${
                  hasUnsavedChanges
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-4 ring-emerald-400/30 animate-pulse'
                    : 'bg-[#1A1A1A] hover:bg-[#333] text-white'
                }`}
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save Changes *' : 'Save Changes'}
              </button>

              {/* DIRECT LINK TO HOSTED CHECKLIST */}
              <a
                href={`${HOSTED_BASE_URL}/checklist`}
                target="_blank"
                rel="noopener noreferrer"
                title="Open this checklist on your hosted Vercel site"
                className="inline-flex items-center gap-1.5 px-3.5 py-3 rounded-full bg-[#0F0F0F] text-[#FAF9F6] text-xs font-bold uppercase tracking-wider hover:bg-[#2A2A2A] transition-colors shadow-2xs"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>Hosted Checklist ↗</span>
              </a>

              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-3.5 py-3 rounded-full bg-white text-[#1A1A1A] text-xs font-bold uppercase tracking-wider border border-[#E2DDCF] hover:bg-[#F4F1EA] transition-colors shadow-2xs"
              >
                <Plus className="w-4 h-4" />
                Add Page
              </button>

              <button
                onClick={handleExportJSON}
                title="Download JSON backup file"
                className="inline-flex items-center gap-1.5 px-3 py-3 rounded-full bg-white text-[#1A1A1A] text-xs font-bold uppercase tracking-wider border border-[#E2DDCF] hover:bg-[#F4F1EA] transition-colors shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                Backup
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                title="Upload JSON backup file"
                className="inline-flex items-center gap-1.5 px-3 py-3 rounded-full bg-white text-[#1A1A1A] text-xs font-bold uppercase tracking-wider border border-[#E2DDCF] hover:bg-[#F4F1EA] transition-colors shadow-2xs"
              >
                <Upload className="w-3.5 h-3.5" />
                Restore
              </button>

              <button
                onClick={handleCopyMarkdown}
                className="inline-flex items-center gap-2 px-3.5 py-3 rounded-full bg-white text-[#1A1A1A] text-xs font-bold uppercase tracking-wider border border-[#E2DDCF] hover:bg-[#F4F1EA] transition-colors shadow-2xs"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Export MD'}
              </button>

              <button
                onClick={handleReset}
                title="Reset all to Not Complete"
                className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white text-[#666] border border-[#E2DDCF] hover:text-[#1A1A1A] hover:bg-[#F4F1EA] transition-colors shadow-2xs"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Unsaved Changes Banner */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[#666]">
            <div className="flex items-center gap-2">
              {hasUnsavedChanges ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-300 font-bold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Unsaved changes! Click "Save Changes" to store.
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  All {items.length} pages stored and synced
                </span>
              )}
              {lastSavedAt && <span className="text-[#888]">Last saved: {lastSavedAt}</span>}
            </div>

            {/* Batch toggle actions */}
            <div className="flex items-center gap-2">
              <span className="text-[#888]">Batch:</span>
              <button
                onClick={() => handleMarkAll('done')}
                className="text-[11px] font-bold text-emerald-700 hover:underline"
              >
                Mark All Complete
              </button>
              <span className="text-[#ccc]">•</span>
              <button
                onClick={() => handleMarkAll('pending')}
                className="text-[11px] font-bold text-rose-700 hover:underline"
              >
                Mark All Not Complete
              </button>
            </div>
          </div>
        </div>

        {/* Progress Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-5 rounded-2xl bg-white border border-[#E2DDCF] shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#666]">
              <span>Completion Progress</span>
              <span className="text-[#C8A96A] font-extrabold">{percentDone}%</span>
            </div>
            <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-[#1A1A1A]">
              {doneCount} <span className="text-sm font-normal text-[#888]">/ {totalCount} complete</span>
            </div>
            <div className="mt-3 w-full bg-[#F4F1EA] h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full transition-all duration-500 rounded-full"
                style={{ width: `${percentDone}%` }}
              />
            </div>
          </div>

          <div
            onClick={() => setStatusFilter(statusFilter === 'done' ? 'all' : 'done')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'done'
                ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20'
                : 'bg-white border-[#E2DDCF] hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-emerald-700">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Complete
              </span>
              <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                {percentDone}%
              </span>
            </div>
            <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-emerald-950">{doneCount}</div>
            <div className="mt-1 text-xs text-emerald-700">Verified & finished pages</div>
          </div>

          <div
            onClick={() => setStatusFilter(statusFilter === 'in_progress' ? 'all' : 'in_progress')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'in_progress'
                ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/20'
                : 'bg-white border-[#E2DDCF] hover:border-amber-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-amber-700">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" />
                In Progress
              </span>
              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                {inProgressCount}
              </span>
            </div>
            <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-amber-950">{inProgressCount}</div>
            <div className="mt-1 text-xs text-amber-700">Active polishing passes</div>
          </div>

          <div
            onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-500/20'
                : 'bg-white border-[#E2DDCF] hover:border-rose-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-rose-700">
              <span className="flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-rose-600" />
                Not Complete
              </span>
              <span className="text-xs bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-bold">
                {pendingCount}
              </span>
            </div>
            <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-rose-950">{pendingCount}</div>
            <div className="mt-1 text-xs text-rose-700">Remaining to review & verify</div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="p-4 rounded-2xl bg-white border border-[#E2DDCF] shadow-sm mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#888]" />
            <input
              type="text"
              placeholder="Search by page name, route (e.g. /shop, /shipping-policy), description, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#FAF9F6] border border-[#E2DDCF] rounded-xl text-xs sm:text-sm text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#1A1A1A]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-[#666]">
              <Filter className="w-3.5 h-3.5" />
              <span>Area:</span>
            </div>
            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="bg-[#FAF9F6] border border-[#E2DDCF] rounded-xl px-3 py-1.5 text-xs text-[#1A1A1A] font-semibold focus:outline-none focus:ring-1 focus:ring-[#1A1A1A]"
            >
              <option value="all">All Areas ({items.length})</option>
              {uniqueAreas.map((area) => (
                <option key={area} value={area}>
                  {area} ({items.filter((i) => i.area === area).length})
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | PageStatus)}
              className="bg-[#FAF9F6] border border-[#E2DDCF] rounded-xl px-3 py-1.5 text-xs text-[#1A1A1A] font-semibold focus:outline-none focus:ring-1 focus:ring-[#1A1A1A]"
            >
              <option value="all">All Statuses ({items.length})</option>
              <option value="done">Complete ({doneCount})</option>
              <option value="in_progress">In Progress ({inProgressCount})</option>
              <option value="pending">Not Complete ({pendingCount})</option>
            </select>
          </div>
        </div>

        {/* Checklist Table with TWO distinct link columns: Localhost Link & Hosted Link */}
        <div className="bg-white rounded-2xl border border-[#E2DDCF] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm divide-y divide-[#E2DDCF]">
              <thead className="bg-[#FAF9F6] text-[11px] font-bold uppercase tracking-wider text-[#666]">
                <tr>
                  <th className="py-3.5 px-2.5 sm:px-3 w-10 text-center">#</th>
                  <th className="py-3.5 px-2.5 sm:px-3 w-12 text-center">Done?</th>
                  <th className="py-3.5 px-3 sm:px-4 w-28 text-center">Status</th>
                  <th className="py-3.5 px-4 sm:px-6">Route & Page Title</th>
                  <th className="py-3.5 px-3 sm:px-4 hidden sm:table-cell">Area</th>
                  <th className="py-3.5 px-4 sm:px-5 hidden md:table-cell">Description</th>
                  <th className="py-3.5 px-4 sm:px-5">Review Notes</th>
                  <th className="py-3.5 px-3 sm:px-4 text-center w-24">
                    <span className="inline-flex items-center gap-1">
                      <Laptop className="w-3.5 h-3.5" />
                      Local
                    </span>
                  </th>
                  <th className="py-3.5 px-3 sm:px-4 text-center w-36">
                    <span className="inline-flex items-center gap-1 text-emerald-800">
                      <Globe className="w-3.5 h-3.5" />
                      Hosted (Vercel)
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DDCF]">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-[#888]">
                      Loading checklist from disk...
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-[#888]">
                      No pages found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const isDone = item.status === 'done';
                    const isInProgress = item.status === 'in_progress';
                    const hostedFullUrl = `${HOSTED_BASE_URL}${item.route}`;

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-[#FAF9F6]/80 transition-colors ${
                          isDone ? 'bg-emerald-50/20' : isInProgress ? 'bg-amber-50/20' : ''
                        }`}
                      >
                        {/* Numerical Index (#1–40) */}
                        <td className="py-4 px-2.5 sm:px-3 text-center text-xs font-mono font-bold text-[#888] align-middle">
                          {item.index}
                        </td>

                        {/* Quick 1-Click Checkbox */}
                        <td className="py-4 px-2.5 sm:px-3 text-center align-middle">
                          <button
                            type="button"
                            onClick={() => handleQuickCheck(item.id)}
                            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                              isDone
                                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/20'
                                : 'border-2 border-[#D1CBC1] hover:border-[#1A1A1A] bg-white'
                            }`}
                            title={isDone ? 'Click to mark Not Complete' : 'Click to mark Complete'}
                          >
                            {isDone && <Check className="w-4 h-4 stroke-[3]" />}
                          </button>
                        </td>

                        {/* Status Toggle Dropdown */}
                        <td className="py-4 px-3 sm:px-4 text-center align-middle">
                          <select
                            value={item.status}
                            onChange={(e) =>
                              handleToggleStatus(item.id, e.target.value as PageStatus)
                            }
                            className={`text-[11px] font-bold uppercase tracking-wider rounded-full px-2.5 py-1 border transition-colors cursor-pointer focus:outline-none ${
                              isDone
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : isInProgress
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : 'bg-rose-50 text-rose-800 border-rose-300'
                            }`}
                          >
                            <option value="done">Complete</option>
                            <option value="in_progress">In Progress</option>
                            <option value="pending">Not Complete</option>
                          </select>
                        </td>

                        {/* Route & Page Title with Thumbnail Image */}
                        <td className="py-4 px-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            {item.image ? (
                              <div className="relative w-12 h-14 rounded-lg overflow-hidden border border-store-card-border bg-store-canvas shrink-0 shadow-2xs">
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              </div>
                            ) : (
                              <div className="w-12 h-14 rounded-lg border border-dashed border-[#D1CBC1] bg-store-canvas flex items-center justify-center shrink-0 text-store-muted">
                                <span className="text-[10px] font-mono font-bold uppercase">{item.area.slice(0, 3)}</span>
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`font-bold text-store-charcoal truncate ${
                                    isDone ? 'text-emerald-950' : ''
                                  }`}
                                >
                                  {item.name}
                                </span>
                                {item.isCustom && (
                                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 shrink-0">
                                    Custom
                                  </span>
                                )}
                              </div>
                              <code className="text-xs text-[#666] font-mono block mt-0.5 font-semibold truncate">
                                {item.route}
                              </code>
                              <div className="sm:hidden text-xs text-[#888] mt-1">
                                <span className="font-semibold text-[#555]">{item.area}</span> • {item.purpose}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Area */}
                        <td className="py-4 px-3 sm:px-4 hidden sm:table-cell align-middle">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F4F1EA] text-[#555] border border-[#E2DDCF]">
                            {item.area}
                          </span>
                        </td>

                        {/* Description */}
                        <td className="py-4 px-4 sm:px-5 hidden md:table-cell text-xs text-[#555] leading-relaxed max-w-xs lg:max-w-sm">
                          {item.purpose}
                        </td>

                        {/* Editable Notes */}
                        <td className="py-4 px-4 sm:px-5 text-xs align-middle">
                          {editingNoteId === item.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                autoFocus
                                value={noteDraft}
                                onChange={(e) => setNoteDraft(e.target.value)}
                                placeholder="Add review comment..."
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveNote(item.id);
                                  if (e.key === 'Escape') setEditingNoteId(null);
                                }}
                                className="px-2 py-1 bg-white border border-[#1A1A1A] rounded text-xs text-[#1A1A1A] w-full focus:outline-none"
                              />
                              <button
                                onClick={() => handleSaveNote(item.id)}
                                className="p-1 rounded bg-[#1A1A1A] text-white hover:bg-[#333]"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div
                              onClick={() => {
                                setEditingNoteId(item.id);
                                setNoteDraft(item.notes || '');
                              }}
                              className="group flex items-center justify-between gap-1 text-[#666] hover:text-[#1A1A1A] cursor-pointer min-h-[24px]"
                              title="Click to edit notes"
                            >
                              <span className={item.notes ? 'text-[#333]' : 'italic text-[#aaa]'}>
                                {item.notes || 'Add note...'}
                              </span>
                              <Edit3 className="w-3 h-3 opacity-0 group-hover:opacity-100 text-[#888]" />
                            </div>
                          )}
                        </td>

                        {/* COLUMN 1: Localhost Link */}
                        <td className="py-4 px-3 sm:px-4 text-center align-middle">
                          <a
                            href={item.route}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#1A1A1A] bg-[#FAF9F6] border border-[#E2DDCF] hover:bg-[#1A1A1A] hover:text-white transition-all shadow-2xs"
                            title={`Open ${item.name} locally on localhost:3007`}
                          >
                            <span>Local</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>

                        {/* COLUMN 2: Hosted Vercel Link */}
                        <td className="py-4 px-3 sm:px-4 text-center align-middle">
                          <div className="flex items-center justify-center gap-1.5">
                            <a
                              href={hostedFullUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-950 bg-emerald-50 border border-emerald-300 hover:bg-emerald-600 hover:text-white transition-all shadow-2xs group"
                              title={`Open ${item.name} on hosted Vercel: ${hostedFullUrl}`}
                            >
                              <Globe className="w-3 h-3 text-emerald-700 group-hover:text-white" />
                              <span>Hosted</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>

                            {item.isCustom && (
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-1.5 text-[#aaa] hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                                title="Delete custom item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Sticky Save Bar for convenient saving when scrolled down */}
        {hasUnsavedChanges && (
          <div className="sticky bottom-6 mt-8 z-40 animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="bg-[#1A1A1A] text-white p-4 sm:px-6 rounded-3xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-[#333]">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
                <span className="text-sm font-semibold">
                  You have unsaved changes! Don't forget to store your progress.
                </span>
              </div>
              <button
                onClick={() => handleSaveChanges()}
                disabled={isSaving}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-colors"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Changes Now'}
              </button>
            </div>
          </div>
        )}

        {/* Modal: Add New Checklist Item */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="bg-white rounded-3xl border border-[#E2DDCF] shadow-2xl max-w-lg w-full p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-[#E2DDCF]">
                <div>
                  <h3 className="text-xl font-extrabold text-[#1A1A1A]">Add Page to Checklist</h3>
                  <p className="text-xs text-[#666] mt-0.5">
                    Track any new view, section, or dynamic route in the project.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 rounded-full text-[#888] hover:text-[#1A1A1A] hover:bg-[#FAF9F6]"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddNewItem} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1A1A1A] mb-1">
                    Page Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lookbook 2026, VIP Club, Press Kit"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-[#FAF9F6] border border-[#E2DDCF] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1A1A1A]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#1A1A1A] mb-1">
                      Area / Category
                    </label>
                    <select
                      value={newArea}
                      onChange={(e) => setNewArea(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold bg-[#FAF9F6] border border-[#E2DDCF] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1A1A1A]"
                    >
                      <option value="Shopping">Shopping</option>
                      <option value="Discovery">Discovery</option>
                      <option value="Purchase">Purchase</option>
                      <option value="Account">Account</option>
                      <option value="Auth">Auth</option>
                      <option value="Brand">Brand</option>
                      <option value="Support">Support</option>
                      <option value="Policies">Policies</option>
                      <option value="Core">Core</option>
                      <option value="Custom">Custom / Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#1A1A1A] mb-1">
                      Initial Status
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as PageStatus)}
                      className="w-full px-3 py-2 text-xs font-semibold bg-[#FAF9F6] border border-[#E2DDCF] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1A1A1A]"
                    >
                      <option value="pending">Not Complete</option>
                      <option value="in_progress">In Progress</option>
                      <option value="done">Complete</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1A1A1A] mb-1">
                    Route Path *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. /lookbook or /press"
                    value={newRoute}
                    onChange={(e) => setNewRoute(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm font-mono bg-[#FAF9F6] border border-[#E2DDCF] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1A1A1A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1A1A1A] mb-1">
                    Purpose / Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Brief description of what this page does or who it is for..."
                    value={newPurpose}
                    onChange={(e) => setNewPurpose(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-[#FAF9F6] border border-[#E2DDCF] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1A1A1A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1A1A1A] mb-1">
                    Notes (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Review mobile typography, hook into API"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-[#FAF9F6] border border-[#E2DDCF] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1A1A1A]"
                  />
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#E2DDCF]">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider text-[#666] hover:bg-[#FAF9F6]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#1A1A1A] text-white hover:bg-[#333] transition-colors shadow-sm"
                  >
                    Add to Checklist
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

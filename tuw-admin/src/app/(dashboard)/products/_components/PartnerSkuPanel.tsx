'use client';

import React, { useEffect, useState } from 'react';
import { Button, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui';
import type { VariantMapping } from '@tuw/heart/modules/catalog';
import { getMappingsAction, saveMappingsAction } from '@/server/catalog-actions';

type Draft = VariantMapping & { costText: string };
const toDraft = (v: VariantMapping): Draft => ({ ...v, costText: v.unitCost === null ? '' : String(v.unitCost) });

// Which partner SKU prints each variant, and what it costs us (doc 16 §6).
// Saved separately from the product form; never shown to shoppers.
export default function PartnerSkuPanel({ productId }: { productId: string }) {
  const [rows, setRows] = useState<Draft[] | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let live = true;
    void getMappingsAction({ id: productId }).then((r) => {
      if (!live) return;
      if (!r.ok) return setNotice({ tone: 'error', text: r.error.message });
      setProvider(r.data.providerName);
      setRows(r.data.variants.map(toDraft));
    });
    return () => { live = false; };
  }, [productId]);

  const patch = (id: string, change: Partial<Draft>) => setRows((list) => list!.map((r) => (r.variantId === id ? { ...r, ...change } : r)));

  const save = async () => {
    if (!rows || saving) return;
    const bad = rows.find((r) => r.costText.trim() !== '' && !(Number(r.costText) >= 0));
    if (bad) return setNotice({ tone: 'error', text: `Unit cost for ${bad.label} must be an amount in rupees.` });
    setSaving(true);
    const result = await saveMappingsAction({
      productId,
      rows: rows.map((r) => ({ variantId: r.variantId, providerSku: r.providerSku, unitCost: r.costText.trim() === '' ? null : Number(r.costText), payload: r.payload })),
    });
    setSaving(false);
    if (!result.ok) return setNotice({ tone: 'error', text: result.error.message });
    setRows(result.data.variants.map(toDraft));
    setNotice({ tone: 'ok', text: 'Partner SKUs saved.' });
  };

  if (!rows) return <p style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>{notice?.text ?? 'Loading…'}</p>;
  const mapped = rows.filter((r) => r.providerSku.trim()).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
        {provider ? `${provider}: ` : ''}{mapped} of {rows.length} variants mapped. Paste each Store SKU from the partner dashboard; a blank SKU removes the mapping. Staff only — shoppers never see this.
      </p>
      {notice && <div role={notice.tone === 'error' ? 'alert' : 'status'} style={{ fontSize: 13, color: notice.tone === 'error' ? 'var(--tuw-text-error, #C91818)' : 'var(--tuw-text-success, #187343)' }}>{notice.text}</div>}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Variant</TableHead>
            <TableHead>Partner SKU</TableHead>
            <TableHead>Unit cost (₹)</TableHead>
            <TableHead align="right">Margin</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => {
            const cost = r.costText.trim() === '' ? r.sheetCost : Number(r.costText);
            return (
              <TableRow key={r.variantId}>
                <TableCell><div style={{ fontWeight: 600 }}>{r.label}</div><div style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)' }}>₹{r.retail.toLocaleString('en-IN')} retail</div></TableCell>
                <TableCell><Input aria-label={`Partner SKU for ${r.label}`} placeholder="v-…" value={r.providerSku} onChange={(e) => patch(r.variantId, { providerSku: e.target.value })} /></TableCell>
                <TableCell><Input aria-label={`Unit cost for ${r.label}`} inputMode="decimal" placeholder={r.sheetCost === null ? '' : `Sheet: ${r.sheetCost}`} value={r.costText} onChange={(e) => patch(r.variantId, { costText: e.target.value })} /></TableCell>
                <TableCell align="right">{cost === null || Number.isNaN(cost) ? '—' : `₹${(r.retail - cost).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <div><Button variant="primary" size="sm" type="button" disabled={saving} onClick={() => void save()}>{saving ? 'Saving…' : 'Save Partner SKUs'}</Button></div>
    </div>
  );
}

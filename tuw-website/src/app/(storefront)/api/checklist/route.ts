import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'state-for-agents', 'checklist-state.json');

export async function GET() {
  try {
    const content = await fs.readFile(DATA_FILE, 'utf-8');
    const data = JSON.parse(content);
    return NextResponse.json({ success: true, data, source: 'disk' });
  } catch {
    // On hosted edge / serverless platforms where disk files aren't bundled, return null so client uses bundled defaults
    return NextResponse.json({ success: true, data: null, source: 'fallback' });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || !Array.isArray(body.items)) {
      return NextResponse.json({ error: 'Invalid checklist payload' }, { status: 400 });
    }

    const payload = {
      items: body.items,
      lastSavedAt: new Date().toISOString(),
      updatedBy: 'user',
    };

    let savedToDisk = false;
    try {
      await fs.writeFile(DATA_FILE, JSON.stringify(payload, null, 2), 'utf-8');
      savedToDisk = true;
    } catch {
      // Vercel serverless lambdas have a read-only filesystem; client localStorage persists the changes
      savedToDisk = false;
    }

    return NextResponse.json({
      success: true,
      savedToDisk,
      storageMode: savedToDisk ? 'disk-and-localstorage' : 'localstorage',
      lastSavedAt: payload.lastSavedAt,
      itemCount: payload.items.length,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to save checklist state';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

import Link from 'next/link';
import DashboardShell from '@/components/layout/DashboardShell';

// Shown when a signed-in staff member opens a page their role does not
// allow (session.requireStaff). The guard on every action still applies.
const LABELS: Record<string, string> = {
  'user.manage': 'manage the team',
  'role.manage': 'manage roles',
  'settings.manage': 'change store settings',
  'order.refund': 'issue refunds',
  'report.view': 'view reports',
};

export default async function AccessDeniedPage({ searchParams }: { searchParams: Promise<{ need?: string }> }) {
  const { need = '' } = await searchParams;
  const what = LABELS[need] ?? 'open this page';
  return (
    <DashboardShell pageTitle="No access">
      <div style={{ maxWidth: 520, margin: '48px auto', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>You don&apos;t have access to this page</h2>
        <p style={{ fontSize: 14, color: 'var(--tuw-text-secondary, #5D6772)', margin: 0 }}>
          Your role can&apos;t {what}. Ask an admin to change your role on the Team page if you need it.
        </p>
        <p style={{ margin: 0 }}>
          <Link href="/dashboard" style={{ fontWeight: 600, textDecoration: 'underline' }}>Back to the dashboard</Link>
        </p>
      </div>
    </DashboardShell>
  );
}

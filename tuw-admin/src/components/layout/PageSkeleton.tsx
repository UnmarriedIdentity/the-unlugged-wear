import DashboardShell from '@/components/layout/DashboardShell';
import { Skeleton } from '@/components/ui';

// Route-level loading state for data-backed dashboard screens. A loading.tsx
// gives each route its own Suspense boundary below the shared layout, so a
// client navigation shows the shell + skeleton instantly while the server
// reads stream in (Cache Components "instant navigation").
export default function PageSkeleton({ pageTitle }: { pageTitle: string }) {
  return (
    <DashboardShell pageTitle={pageTitle}>
      <div aria-busy="true" aria-label={`Loading ${pageTitle}`} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Skeleton height={36} width="40%" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} height={104} />)}
        </div>
        <Skeleton height={360} />
      </div>
    </DashboardShell>
  );
}

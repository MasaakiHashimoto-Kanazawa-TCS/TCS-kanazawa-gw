'use client';

import { AppLayout } from '@/components/layout';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { MobileLayout, MobileDashboard } from '@/components/mobile';
import { useIsMobile } from '@/hooks';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function Home() {
  const isMobile = useIsMobile();

  return (
    <ErrorBoundary>
      {isMobile ? (
        <MobileLayout title="植物監視システム">
          <MobileDashboard />
        </MobileLayout>
      ) : (
        <AppLayout>
          <DashboardOverview />
        </AppLayout>
      )}
    </ErrorBoundary>
  );
}
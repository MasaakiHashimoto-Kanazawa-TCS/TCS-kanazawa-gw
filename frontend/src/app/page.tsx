'use client';

import { AppLayout } from '@/components/layout';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function Home() {
  return (
    <ErrorBoundary>
      <AppLayout>
        <DashboardOverview />
      </AppLayout>
    </ErrorBoundary>
  );
}
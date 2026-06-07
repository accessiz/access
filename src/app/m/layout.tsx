import { ModelPortalLayout } from '@/components/layouts/model-portal-layout';
import { Suspense } from 'react';

export default function MLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <ModelPortalLayout>{children}</ModelPortalLayout>
    </Suspense>
  );
}

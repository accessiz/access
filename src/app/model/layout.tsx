import { ModelPortalLayout } from '@/components/layouts/model-portal-layout';
import { Suspense } from 'react';
import '@/app/styles/globals-ds.css';

export default function ModelLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <ModelPortalLayout>{children}</ModelPortalLayout>
    </Suspense>
  );
}

import { Suspense } from 'react';
import ClientAnimationWrapper from './_components/ClientAnimationWrapper';

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <Suspense fallback={null}>
            <ClientAnimationWrapper>
                {children}
            </ClientAnimationWrapper>
        </Suspense>
    );
}

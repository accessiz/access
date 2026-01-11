import ClientAnimationWrapper from './_components/ClientAnimationWrapper';

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ClientAnimationWrapper>
            {children}
        </ClientAnimationWrapper>
    );
}

"use client";

import { Suspense } from "react";
import { AuthProvider } from "@/hooks/useAuth";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense>
      <AuthProvider>{children}</AuthProvider>
    </Suspense>
  );
}

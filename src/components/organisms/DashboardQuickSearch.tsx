"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SearchBar } from '@/components/molecules/SearchBar';

export default function DashboardQuickSearch() {
  const [q, setQ] = useState('');
  const router = useRouter();

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!q.trim()) return;
    const params = new URLSearchParams();
    params.set('q', q.trim());
    router.push(`/dashboard/models?${params.toString()}`);
  };

  return (
    <SearchBar
      value={q}
      onValueChange={setQ}
      placeholder="Buscar talento por alias o nombre"
      onSubmit={() => handleSubmit()}
      className="w-full"
    />
  );
}

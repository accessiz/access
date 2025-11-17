"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

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
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input placeholder="Buscar talento por alias o nombre" value={q} onChange={e => setQ(e.target.value)} />
      <Button type="submit" variant="outline" size="icon"><Search className="h-4 w-4" /></Button>
    </form>
  );
}

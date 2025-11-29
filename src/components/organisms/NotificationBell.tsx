"use client";
import { useEffect, useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

type Activity = { id: string; type: string; title: string; when: string; meta?: string };

export default function NotificationBell({ showDotOnly = true }: { showDotOnly?: boolean }) {
  const [activity, setActivity] = useState<Activity[]>([]);
  const [unseen, setUnseen] = useState<number>(0);
  // 'open' y 'setOpen' se eliminaron porque no se usaban.

  useEffect(() => {
    let mounted = true;
    fetch('/api/dashboard/activity')
      .then(r => r.json())
      .then(res => {
        if (!mounted) return;
        if (res.success && Array.isArray(res.data)) {
          setActivity(res.data);
          const seenKey = 'dashboard_seen_ts';
          const seenTs = Number(localStorage.getItem(seenKey) || 0);
          const unseenCount = res.data.filter((a: Activity) => new Date(a.when).getTime() > seenTs).length;
          setUnseen(unseenCount);
        }
      })
      .catch(err => console.error(err));
    return () => { mounted = false; };
  }, []);

  const markAllSeen = () => {
    localStorage.setItem('dashboard_seen_ts', String(Date.now()));
    setUnseen(0);
  };

  // mark seen when popover opens
  // CORRECCIÓN: La función ahora solo recibe 'isOpen'
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      // mark seen automatically when opening
      markAllSeen();
    }
  };

  return (
    // CORRECCIÓN: Se añade 'onOpenChange' para ejecutar la lógica al abrir.
    <Popover onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <Bell />
          {unseen > 0 && showDotOnly && <span className="absolute -top-0.5 -right-0.5 inline-block h-2 w-2 rounded-full bg-destructive animate-pulse" />}
          {unseen > 0 && !showDotOnly && <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center rounded-full bg-destructive text-label-12 text-white px-1">{unseen}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="end" className="w-80" onOpenAutoFocus={() => {}}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-label-14">Actividad</h3>
          <Button variant="ghost" size="sm" onClick={markAllSeen}><Check className="mr-2"/>Marcar como vistas</Button>
        </div>
        <ul className="space-y-2 max-h-64 overflow-auto">
          {activity.slice(0, 20).map(a => (
            <li key={a.id} className="text-copy-14">
              <div className="font-medium">{a.title}</div>
              <div className="text-muted-foreground text-label-12">{new Date(a.when).toLocaleString()}</div>
            </li>
          ))}
          {activity.length === 0 && <li className="text-copy-14 text-muted-foreground">No hay actividad reciente</li>}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
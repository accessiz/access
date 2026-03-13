"use client";
import { useEffect, useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

type Notification = { id: string; type: string; title: string; when: string; meta?: string };

export default function NotificationBell({ showDotOnly = true }: { showDotOnly?: boolean }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unseen, setUnseen] = useState<number>(0);

  useEffect(() => {
    let mounted = true;
    // Solo traer notificaciones urgentes (acciones del cliente)
    fetch('/api/notifications')
      .then(r => r.json())
      .then(res => {
        if (!mounted) return;
        if (res.success && Array.isArray(res.data)) {
          setNotifications(res.data);
          const seenKey = 'notifications_seen_ts';
          const seenTs = Number(localStorage.getItem(seenKey) || 0);
          const unseenCount = res.data.filter((a: Notification) => new Date(a.when).getTime() > seenTs).length;
          setUnseen(unseenCount);
        }
      })
      .catch(err => console.error(err));
    return () => { mounted = false; };
  }, []);

  const markAllSeen = () => {
    localStorage.setItem('notifications_seen_ts', String(Date.now()));
    setUnseen(0);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      markAllSeen();
    }
  };

  return (
    <Popover onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={unseen > 0 ? `${unseen} notificaciones nuevas` : "Notificaciones"}
        >
          <Bell aria-hidden="true" />
          {unseen > 0 && showDotOnly && <span className="absolute -top-0.5 -right-0.5 inline-block h-2 w-2 rounded-full bg-destructive animate-pulse" aria-hidden="true" />}
          {unseen > 0 && !showDotOnly && <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center rounded-full bg-destructive text-label text-white px-1" aria-hidden="true">{unseen}</span>}
          {/* Screen-reader live region for notification count */}
          <span className="sr-only" role="status" aria-live="polite">
            {unseen > 0 ? `${unseen} notificaciones sin leer` : "Sin notificaciones nuevas"}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="end" className="w-80" aria-labelledby="notifications-title">
        <div className="flex items-center justify-between mb-2">
          <h3 id="notifications-title" className="text-body font-medium">Notificaciones</h3>
          {notifications.length > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllSeen} aria-label="Marcar todas las notificaciones como vistas"><Check className="mr-2 h-3 w-3" aria-hidden="true" />Marcar vistas</Button>
          )}
        </div>
        <ul className="space-y-2 max-h-64 overflow-auto" aria-label="Lista de notificaciones" aria-live="polite">
          {notifications.slice(0, 20).map(n => (
            <li key={n.id} className="text-body py-2 border-b last:border-0">
              <div className="font-medium">{n.title}</div>
              <div className="text-muted-foreground text-label">{new Date(n.when).toLocaleString()}</div>
            </li>
          ))}
          {notifications.length === 0 && <li className="text-body text-muted-foreground py-4 text-center">Sin notificaciones del cliente</li>}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

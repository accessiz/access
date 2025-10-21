"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/badge';

export default function DashboardNavLink({ href, children, badge }: { href: string; children: React.ReactNode; badge?: number | null }) {
  const pathname = usePathname();
  // Treat root dashboard link specially: only active on exact match.
  let isActive = false;
  if (!pathname) isActive = false;
  else if (href === '/dashboard') {
    isActive = pathname === '/dashboard';
  } else {
    isActive = pathname === href || pathname.startsWith(href + '/');
  }

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${isActive ? 'bg-accent text-foreground' : 'text-muted-foreground'}`}
    >
      <span className="flex-1">{children}</span>
      {typeof badge === 'number' && badge > 0 && <Badge>{badge}</Badge>}
    </Link>
  );
}

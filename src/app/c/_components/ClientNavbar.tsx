'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sun, Moon } from 'lucide-react';
import LogoLight from '@/components/LogoLight';
import LogoDark from '@/components/LogoDark';

// ThemeToggle ahora recibe el estado y la función toggle desde el padre
function ThemeToggle({ isDark, toggle }: { isDark: boolean; toggle: () => void }) {
  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </Button>
  );
}

export function ClientNavbar({ clientName }: { clientName: string | null }) {
  // Mantener el estado del tema aquí para poder alternar el logo según el tema
  const [isDark, setIsDark] = useState<boolean>(false);
  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialIsDark = stored === 'dark' || (!stored && prefersDark);
    setIsDark(initialIsDark);
    document.documentElement.classList.toggle('dark', initialIsDark);
  }, []);
  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };
  return (
    /* SIN padding horizontal 'px-*' */
    <nav className="flex w-full h-20 items-center justify-between">
      <Link href="/" className="flex items-center gap-2 font-semibold">
        {/* Mostrar LogoLight en modo claro y LogoDark en modo oscuro. Ambos tendrán altura 1.4rem */}
        {isDark ? (
          <LogoDark className="h-[1.4rem]" />
        ) : (
          <LogoLight className="h-[1.4rem]" />
        )}
      </Link>

      <div className="flex items-center gap-4">
        <span className="text-copy-14 text-muted-foreground hidden md:inline">
          {clientName || 'Cliente'}
        </span>
        <ThemeToggle isDark={isDark} toggle={toggle} />
      </div>
    </nav>
  );
}
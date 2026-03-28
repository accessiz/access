'use client';

import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sun, Moon, Calendar } from 'lucide-react';
import LogoLight from '@/components/LogoLight';
import LogoDark from '@/components/LogoDark';
import { ScheduleChips } from '@/components/molecules/ScheduleChips';
import { Project } from '@/lib/types';
import { readVersionedStorage, writeVersionedStorage } from '@/lib/client-storage';

const THEME_STORAGE_KEY = 'client-navbar:theme';
const THEME_STORAGE_VERSION = 1;

function applyTheme(isDark: boolean) {
  document.documentElement.classList.toggle('dark', isDark);
}

// ThemeToggle ahora recibe el estado y la función toggle desde el padre
function ThemeToggle({ isDark, toggle }: { isDark: boolean; toggle: () => void }) {
  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </Button>
  );
}

interface ClientNavbarProps {
  schedule?: Project['schedule'];
}

export function ClientNavbar({ schedule }: ClientNavbarProps) {
  const [isDark, setIsDark] = useState<boolean>(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const hasSchedule = Boolean(schedule && Array.isArray(schedule) && schedule.length > 0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = readVersionedStorage<'dark' | 'light'>('local', THEME_STORAGE_KEY, THEME_STORAGE_VERSION);
    const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialIsDark = stored === 'dark' || (!stored && prefersDark);
    setIsDark(initialIsDark);
    applyTheme(initialIsDark);
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    applyTheme(next);
    writeVersionedStorage('local', THEME_STORAGE_KEY, THEME_STORAGE_VERSION, next ? 'dark' : 'light');
  };

  return (
    <nav className="flex w-full h-20 items-center justify-between">
      <Link href="/" className="flex items-center gap-2 font-semibold">
        {isDark ? (
          <LogoDark className="h-[1.4rem]" />
        ) : (
          <LogoLight className="h-[1.4rem]" />
        )}
      </Link>

      <div className="flex items-center gap-2">
        {hasSchedule && (
          <>
            {/* Backdrop overlay using Portal */}
            {calendarOpen && mounted && createPortal(
              <div
                className="fixed inset-0 z-[150] bg-black/20 transition-opacity"
                onClick={() => setCalendarOpen(false)}
              />,
              document.body
            )}
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <button
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Ver fechas del proyecto"
                  title="Ver fechas"
                >
                  <Calendar className="h-4 w-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="center"
                className="z-[151] p-0 w-auto max-w-[calc(100vw-32px)] sm:max-w-[800px] bg-white/30 dark:bg-black/40 backdrop-blur-xl backdrop-saturate-150 border border-black/5 dark:border-white/15"
                sideOffset={12}
                collisionPadding={16}
              >
                <div className="border-b border-border/40 px-4 py-3">
                  <h4 className="text-body font-semibold text-foreground">Fechas</h4>
                </div>
                <div className="max-h-[60vh] overflow-y-auto p-4 custom-scrollbar">
                  <ScheduleChips schedule={schedule || null} className="sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0 sm:w-fit" />
                </div>
              </PopoverContent>
            </Popover>
          </>
        )}
        <ThemeToggle isDark={isDark} toggle={toggle} />
      </div>
    </nav>
  );
}
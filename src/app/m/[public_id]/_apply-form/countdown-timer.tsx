'use client';

import { useEffect, useState } from 'react';

interface CountdownTimerProps {
  endTime: string; // ISO
}

export function CountdownTimer({ endTime }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const calculateTimeLeft = () => {
      const difference = +new Date(endTime) - +new Date();
      if (difference <= 0) {
        setTimeLeft('Este proyecto ya cerró');
        setIsExpired(true);
        return;
      }

      const totalSeconds = Math.floor(difference / 1000);
      const days = Math.floor(totalSeconds / (3600 * 24));
      const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);

      let text = '';
      if (days > 0) {
        const daysText = days === 1 ? '1 día' : `${days} días`;
        const hoursText = hours === 0 ? '' : (hours === 1 ? ' y 1 hora' : ` y ${hours} horas`);
        text = `Queda${days > 1 ? 'n' : ''} ${daysText}${hoursText} para aplicar`;
      } else if (hours > 0) {
        const hoursText = hours === 1 ? '1 hora' : `${hours} horas`;
        const minutesText = minutes === 0 ? '' : (minutes === 1 ? ' y 1 minuto' : ` y ${minutes} minutos`);
        text = `Queda${hours > 1 ? 'n' : ''} ${hoursText}${minutesText} para aplicar`;
      } else {
        const minutesText = minutes === 1 ? '1 minuto' : `${minutes} minutos`;
        text = `Queda${minutes > 1 ? 'n' : ''} ${minutesText} para aplicar`;
      }
      setTimeLeft(text);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000); // refresh every minute

    return () => clearInterval(timer);
  }, [endTime, mounted]);

  if (!mounted) {
    return (
      <div className="flex items-center gap-2 p-3.5 bg-tertiary/50 rounded-xl border border-border animate-pulse">
        <span className="h-2 w-2 rounded-full bg-purple animate-pulse shrink-0"></span>
        <span className="text-xs font-bold text-foreground">Cargando plazo...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-3.5 bg-tertiary/50 rounded-xl border border-border">
      <span className={`h-2 w-2 rounded-full shrink-0 ${isExpired ? 'bg-red' : 'bg-purple animate-pulse'}`}></span>
      <span className="text-xs font-bold text-foreground">
        {isExpired ? 'Este proyecto ya cerró' : timeLeft}
      </span>
    </div>
  );
}

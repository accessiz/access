'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Project } from '@/lib/types';

// Lazy load Lottie (~50KB) — only loaded when wave animation data is ready
const Lottie = dynamic(() => import('lottie-react').then(mod => mod.default ? { default: mod.default } : mod), {
  ssr: false,
});

// Wave emoji Lottie animation URL
const WAVE_EMOJI_URL = 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44b/lottie.json';

interface ClientHeaderProps {
  project: Project;
  clientName?: string | null;
}

export function ClientHeader({ project, clientName }: ClientHeaderProps) {
  const [waveData, setWaveData] = useState<object | null>(null);

  useEffect(() => {
    fetch(WAVE_EMOJI_URL)
      .then(res => res.json())
      .then(data => setWaveData(data))
      .catch(() => { });
  }, []);

  return (
    <header className="px-0 text-left">
      {/* Greeting */}
      <div className="flex items-center gap-1 mb-2">
        <span className="text-body text-muted-foreground">
          Hola, {clientName || 'Cliente'}
        </span>
        {waveData && (
          <Lottie
            animationData={waveData}
            loop={true}
            className="w-5 h-5"
          />
        )}
      </div>

      {/* Project Name */}
      <h1 className="text-display uppercase">
        {project.project_name || 'Selección de Talento'}
      </h1>
    </header>
  );
}

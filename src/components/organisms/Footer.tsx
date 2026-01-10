"use client";
import React from 'react';
import { Button } from '@/components/ui/button';

const Footer = () => {
  return (
    // --- INICIO DE LA MODIFICACIÓN ---
    // Se cambió 'mt-[20vh]' por 'md:mt-[20vh]'
    <footer className="site-footer flex flex-col items-center gap-10 p-8
                   md:grid md:grid-cols-4 md:grid-rows-2 md:items-start md:gap-y-6 md:p-12 lg:p-16
                   md:mt-[20vh] // <-- ¡Aquí está el cambio!
                   uppercase bg-background text-on-background">

      {/* GRUPO 1: Slogan & CTA (¡Ahora es el primero!) */}
      {/* Móvil: Centrado por defecto gracias al 'items-center' del 'footer'. */}
      {/* Escritorio: Lo mandamos a su esquina con 'md:col-start-4' etc. */}
      <div className="flex flex-col items-center gap-4 text-center
                     md:col-start-4 md:row-span-2 md:items-end md:text-right md:justify-self-end">
          <h3 className="text-display lg:text-display font-normal m-0">
              TU VISIÓN,<br />NUESTRO TALENTO
          </h3>
          <Button asChild>
              <a href="#" aria-label="Conectar con nosotros">Let&apos;s Connect</a>
          </Button>
      </div>

      {/* GRUPO 2: Redes Sociales */}
      {/* Móvil: Centrado por defecto. */}
      {/* Escritorio: Se ubica en la fila 1. */}
      <div className="flex flex-col items-center gap-3 text-label md:items-start md:row-start-1">
          <a href="#" aria-label="Visita nuestro perfil de Instagram">Instagram</a>
          <a href="#" aria-label="Visita nuestro perfil de LinkedIn">LinkedIn</a>
          <a href="#" aria-label="Visita nuestro perfil de Twitter">Twitter</a>
      </div>

      {/* GRUPO 3: Dirección */}
      {/* Móvil: Centrado por defecto. */}
      {/* Escritorio: Se ubica en la fila 1. */}
      <address className="flex flex-col items-center gap-3 text-label not-italic md:items-start md:row-start-1">
        <span>Zona 10</span>
        <span>Ciudad de Guatemala</span>
        <span>Guatemala</span>
      </address>

      {/* GRUPO 4: Contacto */}
      {/* Móvil: Centrado por defecto. */}
      {/* Escritorio: Se ubica en la fila 1. */}
      <div className="flex flex-col items-center gap-3 text-label md:items-start md:row-start-1">
          <span>info@izmanagementglobal.com</span>
      </div>

      {/* GRUPO 5: Copyright (Al final de todo) */}
      {/* Móvil: Centrado por defecto. */}
      {/* Escritorio: Se ubica en la fila 2, al inicio. */}
      <span className="text-label md:col-start-1 md:row-start-2 md:self-end md:mt-4">
          2025 © IZ Management
      </span>

    </footer>
    // --- FIN DE LA MODIFICACIÓN ---
  );
};

export default Footer;
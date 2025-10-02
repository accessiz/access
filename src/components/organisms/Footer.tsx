"use client";
import React from 'react';
import { Button } from '@/components/ui/button'; // Usando el botón de shadcn

const Footer = () => {
  return (
    <footer className="site-footer mt-[20vh] grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-y-6 p-8 md:p-12 lg:p-16 uppercase bg-background text-on-background">
        <div className="flex flex-col gap-3 text-xs text-center md:text-left">
            <a href="#" aria-label="Visita nuestro perfil de Instagram">Instagram</a>
            <a href="#" aria-label="Visita nuestro perfil de LinkedIn">LinkedIn</a>
            <a href="#" aria-label="Visita nuestro perfil de Twitter">Twitter</a>
        </div>

        <address className="flex flex-col gap-3 text-xs not-italic text-center md:text-left">
          <span>Zona 10</span>
          <span>Ciudad de Guatemala</span>
          <span>Guatemala</span>
        </address>
        
        <div className="flex flex-col gap-3 text-xs text-center md:text-left">
            <span>info@izmanagementglobal.com</span>
        </div>

        <div className="md:col-start-4 md:row-start-1 md:row-span-2 justify-self-center md:justify-self-end text-center md:text-right">
            <div className="flex flex-col items-center md:items-end h-full justify-start">
                <h3 className="text-2xl lg:text-3xl font-normal m-0 mb-4">
                    TU VISIÓN,<br />NUESTRO TALENTO
                </h3>
                <Button asChild>
                    <a href="#" aria-label="Conectar con nosotros">Let&apos;s Connect</a>
                </Button>
            </div>
        </div>

        <span className="text-xs text-center md:text-left md:col-start-1 md:row-start-2 self-end mt-4 md:mt-0">
            2025 © IZ Management
        </span>
    </footer>
  );
};

export default Footer;
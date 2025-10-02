"use client";
import React from 'react';
import Link from 'next/link';

const headerStyles = {
    header: "relative flex flex-col gap-[var(--md-sys-spacing-md)] w-full",
    nav: "w-full flex justify-between items-center text-xs uppercase",
    line: "w-full h-[1px] bg-[var(--md-sys-color-on-background)] origin-left",
};

const Header = () => {
  return (
    <header className={headerStyles.header}>
      <nav className={headerStyles.nav}>
        <Link href="/" aria-label="Ir a la página de IZ Access">IZ ACCESS</Link>
        <Link href="/management" aria-label="Ir a la página de IZ Management">IZ Management</Link>
        <Link href="/boost" aria-label="Ir a la página de IZ Boost">IZ Boost</Link>
        <Link href="/login" aria-label="Iniciar sesión en la plataforma">Iniciar Sesión</Link>
      </nav>
      <div className={`${headerStyles.line} line`}></div>
    </header>
  );
};

export default Header;
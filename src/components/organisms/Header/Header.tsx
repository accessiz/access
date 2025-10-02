"use client";
import React from 'react';
import styles from './Header.module.css';

const Header = () => {
  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        {/* #4. Añadidos atributos aria-label por accesibilidad */}
        <a href="#" aria-label="Ir a la página de IZ Access">IZ ACCESS</a>
        <a href="#" aria-label="Ir a la página de IZ Management">IZ Management</a>
        <a href="#" aria-label="Ir a la página de IZ Boost">IZ Boost</a>
        <a href="#" aria-label="Iniciar sesión en la plataforma">Iniciar Sesión</a>
      </nav>
      <div className={`${styles.line} line`}></div>
    </header>
  );
};

export default Header;
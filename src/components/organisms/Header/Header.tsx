"use client";
import React from 'react';
import styles from './Header.module.css';

const Header = () => {
  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <a href="#">IZ ACCESS</a>
        <a href="#">IZ Management</a>
        <a href="#">IZ Boost</a>
        <a href="#">Iniciar Sesión</a>
      </nav>
      <div className={`${styles.line} line`}></div>
    </header>
  );
};

export default Header;

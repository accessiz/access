"use client";
import React from 'react';
import styles from './Footer.module.css';

const Footer = () => {
  return (
    <footer className={`${styles.footer} site-footer`}>
        {/* Columna 1: Redes Sociales y Copyright */}
        <div className={`${styles.column} ${styles.columnFirst}`}>
            <div className={styles.socialLinks}>
                <a href="#" aria-label="Visita nuestro perfil de Instagram">Instagram</a>
                <a href="#" aria-label="Visita nuestro perfil de LinkedIn">LinkedIn</a>
                <a href="#" aria-label="Visita nuestro perfil de Twitter">Twitter</a>
            </div>
            <span>2025 © IZ Management</span>
        </div>

        {/* Columna 2: Dirección */}
        <div className={`${styles.column} ${styles.stack}`}>
        <span>Zona 10</span>
        <span>Ciudad de Guatemala</span>
        <span>Guatemala</span>
        </div>

        
        {/* Columna 3: Dirección */}
        <div className={styles.column}>
            <span>info@izmanagementglobal.com</span>
        </div>

        {/* Columna 4: Call to Action */}
        <div className={`${styles.column} ${styles.columnRight}`}>
        <div className={styles.ctaWrapper}>
            <h3>Do you like<br />What you see?</h3>
            <a href="#" className={styles.button}>Let&apos;s Connect</a>
        </div>
        </div>

    </footer>
  );
};

export default Footer;


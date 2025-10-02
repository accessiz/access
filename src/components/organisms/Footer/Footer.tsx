"use client";
import React from 'react';
import styles from './Footer.module.css';
import Button from '../../atoms/Button/Button'; // Importar el nuevo átomo

const Footer = () => {
  return (
    <footer className={`${styles.footer} site-footer`}>
        {/* Columna 1 - Fila 1 (Social) */}
        <div className={styles.footer__column}>
            <div className={styles.footer__social_links}>
                <a href="#" aria-label="Visita nuestro perfil de Instagram">Instagram</a>
                <a href="#" aria-label="Visita nuestro perfil de LinkedIn">LinkedIn</a>
                <a href="#" aria-label="Visita nuestro perfil de Twitter">Twitter</a>
            </div>
        </div>

        {/* Columna 2 - Fila 1 (Address) */}
        <address className={styles.footer__column}>
          <span>Zona 10</span>
          <span>Ciudad de Guatemala</span>
          <span>Guatemala</span>
        </address>
        
        {/* Columna 3 - Fila 1 (Email) */}
        <div className={styles.footer__column}>
            <span>info@izmanagementglobal.com</span>
        </div>

        {/* Columna 4 - Fila 1 y 2 (CTA) */}
        <div className={styles.footer__column__right}>
            <div className={styles.footer__cta_wrapper}>
                <h3 className={styles.footer__cta_title}>TU VISIÓN,<br />NUESTRO TALENTO</h3>
                <Button href="#" ariaLabel="Conectar con nosotros">Let&apos;s Connect</Button>
            </div>
        </div>

        {/* Columna 1 - Fila 2 (Copyright) */}
        <span className={styles.footer__copyright}>2025 © IZ Management</span>
    </footer>
  );
};

export default Footer;


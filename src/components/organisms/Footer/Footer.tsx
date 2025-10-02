"use client";
import React from 'react';
import styles from './Footer.module.css';

const Footer = () => {
  return (
    <footer className={`${styles.footer} site-footer`}>
        <div className={styles.column}>
            <a href="#">Instagram</a>
            <a href="#">LinkedIn</a>
            <a href="#">Twitter</a>
        </div>
        <div className={styles.column}>
            <span>250 Park Avenue Street</span>
            <span>New York, NY 10003</span>
            <span>United States</span>
        </div>
        <div className={`${styles.column} ${styles.columnRight}`}>
            <h3>Do you like<br/>What you see?</h3>
            <a href="#" className={styles.button}>Let's Connect</a>
        </div>
        <div className={styles.bottomRow}>
            <span>2024 © IZ Management</span>
        </div>
    </footer>
  );
};

export default Footer;

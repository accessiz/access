
"use client";
import React from 'react';
import styles from './Button.module.css';

interface ButtonProps {
  children: React.ReactNode;
  href: string;
  ariaLabel?: string;
}

const Button: React.FC<ButtonProps> = ({ children, href, ariaLabel }) => {
  return (
    <a href={href} className={styles.button} aria-label={ariaLabel}>
      {children}
    </a>
  );
};

export default Button;

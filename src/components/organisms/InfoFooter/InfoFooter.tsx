"use client";
import React from 'react';
import styles from './InfoFooter.module.css';

interface InfoFooterProps {
    time: string;
}

const InfoFooter = ({ time }: InfoFooterProps) => {
  return (
    <div className={styles.infoFooter}>
      <div className={styles.left}>
        <span>Villa Nueva, Guatemala</span>
      </div>
      <div className={styles.center}>
        <span>{time}</span>
      </div>
      <div className={styles.right}>
        <span>Developed by Skopos</span>
      </div>
    </div>
  );
};

export default InfoFooter;

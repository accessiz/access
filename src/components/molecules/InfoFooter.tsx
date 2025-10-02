"use client";
import React from 'react';

const infoFooterStyles = {
  infoFooter: {
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    alignItems: 'center',
    width: '100%',
    fontSize: 'var(--md-typescale-body-small-size)',
    textTransform: 'uppercase' as 'uppercase',
  },
  left: { justifySelf: 'start' },
  center: { justifySelf: 'center' },
  right: { justifySelf: 'end' },
};

interface InfoFooterProps {
    time: string;
}

const InfoFooter = ({ time }: InfoFooterProps) => {
  return (
    <div style={infoFooterStyles.infoFooter}>
      <div style={infoFooterStyles.left}>
        <span>Villa Nueva, Guatemala</span>
      </div>
      <div style={infoFooterStyles.center}>
        <span>{time}</span>
      </div>
      <div style={infoFooterStyles.right}>
        <span>Developed by Skopos</span>
      </div>
    </div>
  );
};

export default InfoFooter;
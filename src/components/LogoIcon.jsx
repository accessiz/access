import React from 'react';

// Logo pequeño - solo la "A" morada para sidebar colapsado
const LogoIcon = (props) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 23 18"
        {...props}
    >
        <path
            fill="#9a6eea"
            d="M7.15,17.35H0V.65h8.21l14.73,14.67-1.67,1.68-6.89-6.86-7.23,7.2ZM2.37,14.98h3.8l6.53-6.51L7.23,3.02H2.37v11.96Z"
        />
    </svg>
);

export default LogoIcon;

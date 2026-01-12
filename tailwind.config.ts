import type { Config } from 'tailwindcss'
import animatePlugin from 'tailwindcss-animate'

const config: Config = {
	darkMode: 'class',
	content: [
		'./pages/**/*.{ts,tsx}',
		'./components/**/*.{ts,tsx}',
		'./app/**/*.{ts,tsx}',
		'./src/**/*.{ts,tsx,css}',
	],
	prefix: '',
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px',
			},
		},
		extend: {
			zIndex: {
				100: '100',
			},
			// Accessibility note: Tailwind's focus `ring-*` utilities rely on box-shadow.
			// We neutralize only the `shadow-*` and `drop-shadow-*` utilities by mapping them
			// to a transparent, zero-size shadow, preserving rings while removing elevation.
			boxShadow: {
				sm: '0 0 #0000',
				DEFAULT: '0 0 #0000',
				md: '0 0 #0000',
				lg: '0 0 #0000',
				xl: '0 0 #0000',
				'2xl': '0 0 #0000',
				inner: '0 0 #0000',
			},
			dropShadow: {
				sm: '0 0 #0000',
				DEFAULT: '0 0 #0000',
				md: '0 0 #0000',
				lg: '0 0 #0000',
				xl: '0 0 #0000',
				'2xl': '0 0 #0000',
			},
			fontSize: {
				// NYXA typography: ONLY 4 sizes in the entire product.
				// 11px -> 13px -> 18.72px -> 22.464px
				label: [
					'11px',
					{
						lineHeight: '1.2',
						letterSpacing: '0.01em',
						fontWeight: '600',
					},
				],
				body: [
					'13px',
					{
						lineHeight: '1.7',
						letterSpacing: '0',
						fontWeight: '400',
					},
				],
				title: [
					'18.72px',
					{
						lineHeight: '1.4',
						letterSpacing: '0',
						fontWeight: '600',
					},
				],
				display: [
					'22.464px',
					{
						lineHeight: '1.1',
						letterSpacing: '-0.01em',
						fontWeight: '700',
					},
				],
			},
			colors: {
				// Minimal token system (matches src/app/globals.css)
				background: 'rgb(var(--sys-bg) / <alpha-value>)',
				foreground: 'rgb(var(--primary) / <alpha-value>)',
				border: 'rgb(var(--separator))',
				ring: 'rgb(var(--separator))',
				// Convenience aliases for new system backgrounds
				'sys-bg': 'rgb(var(--sys-bg) / <alpha-value>)',
				'sys-bg-secondary': 'rgb(var(--sys-bg-secondary))',
				'sys-bg-tertiary': 'rgb(var(--sys-bg-tertiary))',
				// Note: sys-bg-tertiary is currently `initial` in globals.css
				quaternary: 'rgb(var(--quaternary))',
				quinary: 'rgb(var(--quinary) / <alpha-value>)',
				'hover-overlay': 'rgb(var(--hover-overlay))',
				separator: 'rgb(var(--separator))',
				input: 'rgb(var(--separator))',
				muted: 'rgb(var(--primary) / <alpha-value>)',
				'muted-foreground': 'rgb(var(--primary) / 0.7)',
				accent: 'rgb(var(--primary) / <alpha-value>)',
				'accent-foreground': 'rgb(var(--primary) / <alpha-value>)',
				card: 'rgb(var(--sys-bg-secondary))',
				'card-foreground': 'rgb(var(--primary) / <alpha-value>)',
				popover: 'rgb(var(--sys-bg-secondary))',
				'popover-foreground': 'rgb(var(--primary) / <alpha-value>)',
				destructive: {
					DEFAULT: 'rgb(var(--red) / <alpha-value>)',
					foreground: 'rgb(var(--sys-bg) / <alpha-value>)',
				},
				success: {
					DEFAULT: 'rgb(var(--green) / <alpha-value>)',
					foreground: 'rgb(var(--sys-bg) / <alpha-value>)',
				},
				warning: {
					DEFAULT: 'rgb(var(--yellow) / <alpha-value>)',
					foreground: 'rgb(var(--sys-bg) / <alpha-value>)',
				},
				info: {
					DEFAULT: 'rgb(var(--blue) / <alpha-value>)',
					foreground: 'rgb(var(--sys-bg) / <alpha-value>)',
				},
				cyan: {
					DEFAULT: 'rgb(var(--cyan) / <alpha-value>)',
					foreground: 'rgb(var(--sys-bg) / <alpha-value>)',
				},
				indigo: {
					DEFAULT: 'rgb(var(--indigo) / <alpha-value>)',
					foreground: 'rgb(var(--sys-bg) / <alpha-value>)',
				},
				orange: {
					DEFAULT: 'rgb(var(--orange) / <alpha-value>)',
					foreground: 'rgb(var(--sys-bg) / <alpha-value>)',
				},
				red: {
					DEFAULT: 'rgb(var(--red) / <alpha-value>)',
					foreground: 'rgb(var(--sys-bg) / <alpha-value>)',
				},
				yellow: {
					DEFAULT: 'rgb(var(--yellow) / <alpha-value>)',
					foreground: 'rgb(var(--sys-bg) / <alpha-value>)',
				},
				green: {
					DEFAULT: 'rgb(var(--green) / <alpha-value>)',
					foreground: 'rgb(var(--sys-bg) / <alpha-value>)',
				},
				mint: {
					DEFAULT: 'rgb(var(--mint) / <alpha-value>)',
					foreground: 'rgb(var(--sys-bg) / <alpha-value>)',
				},
				teal: {
					DEFAULT: 'rgb(var(--teal) / <alpha-value>)',
					foreground: 'rgb(var(--sys-bg) / <alpha-value>)',
				},
				blue: {
					DEFAULT: 'rgb(var(--blue) / <alpha-value>)',
					foreground: 'rgb(var(--sys-bg) / <alpha-value>)',
				},
				purple: {
					DEFAULT: 'rgb(var(--purple) / <alpha-value>)',
					foreground: 'rgb(var(--sys-bg) / <alpha-value>)',
				},
				'access-purple': {
					DEFAULT: 'rgb(var(--access-purple) / <alpha-value>)',
					foreground: 'rgb(var(--sys-bg) / <alpha-value>)',
				},
				pink: {
					DEFAULT: 'rgb(var(--pink) / <alpha-value>)',
					foreground: 'rgb(var(--sys-bg) / <alpha-value>)',
				},
				brown: {
					DEFAULT: 'rgb(var(--brown) / <alpha-value>)',
					foreground: 'rgb(var(--sys-bg) / <alpha-value>)',
				},
				primary: {
					DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
					foreground: 'rgb(var(--sys-bg) / <alpha-value>)',
				},
				secondary: {
					DEFAULT: 'rgb(var(--secondary))',
					foreground: 'rgb(var(--primary) / <alpha-value>)',
				},
				tertiary: {
					DEFAULT: 'rgb(var(--tertiary))',
					foreground: 'rgb(var(--primary) / <alpha-value>)',
				},
				sidebar: {
					DEFAULT: 'rgb(var(--sys-bg-secondary))',
					foreground: 'rgb(var(--primary) / <alpha-value>)',
					primary: 'rgb(var(--sys-bg) / <alpha-value>)',
					'primary-foreground': 'rgb(var(--primary) / <alpha-value>)',
					accent: 'rgb(var(--purple))',
					'accent-foreground': 'rgb(var(--white))',
					border: 'rgb(var(--separator))',
					ring: 'rgb(var(--separator))',
				},

				white: 'rgb(var(--white))',
			},
			borderRadius: {
				// M3 Shape Scale
				'none': '0px',
				'xs': '4px',       // Extra Small (4dp)
				'sm': '8px',       // Small (8dp)
				'md': '12px',      // Medium (12dp)
				'lg': '16px',      // Large (16dp)
				'xl': '28px',      // Extra Large (28dp)
				'2xl': '32px',     // FAB radius
				'full': '9999px',  // Full/Pill
				// Legacy support (using CSS variable for backwards compatibility)
				'DEFAULT': 'var(--radius)',
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [animatePlugin],
};

export default config;
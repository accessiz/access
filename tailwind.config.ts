import type { Config } from 'tailwindcss'
import animatePlugin from 'tailwindcss-animate'

const config: Config = {
	darkMode: ["class"],
	content: [
		'./pages/**/*.{ts,tsx}',
		'./components/**/*.{ts,tsx}',
		'./app/**/*.{ts,tsx}',
		'./src/**/*.{ts,tsx,css}',
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontSize: {
				'heading-72': [
					'4.5rem',
					{
						lineHeight: '1',
						letterSpacing: '-0.02em',
						fontWeight: '700'
					}
				],
				'heading-64': [
					'4rem',
					{
						lineHeight: '1',
						letterSpacing: '-0.02em',
						fontWeight: '700'
					}
				],
				'heading-56': [
					'3.5rem',
					{
						lineHeight: '1.05',
						letterSpacing: '-0.02em',
						fontWeight: '700'
					}
				],
				'heading-48': [
					'3rem',
					{
						lineHeight: '1.05',
						letterSpacing: '-0.02em',
						fontWeight: '700'
					}
				],
				'heading-40': [
					'2.5rem',
					{
						lineHeight: '1.1',
						letterSpacing: '-0.01em',
						fontWeight: '700'
					}
				],
				'heading-32': [
					'2rem',
					{
						lineHeight: '1.2',
						letterSpacing: '-0.01em',
						fontWeight: '600'
					}
				],
				'heading-24': [
					'1.5rem',
					{
						lineHeight: '1.3',
						letterSpacing: '-0.005em',
						fontWeight: '600'
					}
				],
				'heading-20': [
					'1.25rem',
					{
						lineHeight: '1.4',
						letterSpacing: '0',
						fontWeight: '600'
					}
				],
				'heading-16': [
					'1rem',
					{
						lineHeight: '1.4',
						letterSpacing: '0',
						fontWeight: '600'
					}
				],
				'heading-14': [
					'0.875rem',
					{
						lineHeight: '1.4',
						letterSpacing: '0',
						fontWeight: '600'
					}
				],
				'button-16': [
					'1rem',
					{
						lineHeight: '1.25',
						letterSpacing: '0',
						fontWeight: '600'
					}
				],
				'button-14': [
					'0.875rem',
					{
						lineHeight: '1.25',
						letterSpacing: '0',
						fontWeight: '600'
					}
				],
				'button-12': [
					'0.75rem',
					{
						lineHeight: '1.2',
						letterSpacing: '0.01em',
						fontWeight: '600'
					}
				],
				'label-20': [
					'1.25rem',
					{
						lineHeight: '1.1',
						letterSpacing: '0',
						fontWeight: '500'
					}
				],
				'label-18': [
					'1.125rem',
					{
						lineHeight: '1.1',
						letterSpacing: '0',
						fontWeight: '500'
					}
				],
				'label-16': [
					'1rem',
					{
						lineHeight: '1.2',
						letterSpacing: '0',
						fontWeight: '600'
					}
				],
				'label-14': [
					'0.875rem',
					{
						lineHeight: '1.2',
						letterSpacing: '0',
						fontWeight: '600'
					}
				],
				'label-13': [
					'0.8125rem',
					{
						lineHeight: '1.2',
						letterSpacing: '0.01em',
						fontWeight: '600'
					}
				],
				'label-12': [
					'0.75rem',
					{
						lineHeight: '1.3',
						letterSpacing: '0.04em',
						fontWeight: '700'
					}
				],
				'label-14-mono': [
					'0.875rem',
					{
						lineHeight: '1.2',
						letterSpacing: '0.02em',
						fontWeight: '600'
					}
				],
				'label-13-mono': [
					'0.8125rem',
					{
						lineHeight: '1.2',
						letterSpacing: '0.03em',
						fontWeight: '600'
					}
				],
				'label-12-mono': [
					'0.75rem',
					{
						lineHeight: '1.3',
						letterSpacing: '0.04em',
						fontWeight: '700'
					}
				],
				'copy-24': [
					'1.5rem',
					{
						lineHeight: '1.6',
						letterSpacing: '0',
						fontWeight: '500'
					}
				],
				'copy-20': [
					'1.25rem',
					{
						lineHeight: '1.6',
						letterSpacing: '0',
						fontWeight: '500'
					}
				],
				'copy-18': [
					'1.125rem',
					{
						lineHeight: '1.65',
						letterSpacing: '0',
						fontWeight: '500'
					}
				],
				'copy-16': [
					'1rem',
					{
						lineHeight: '1.7',
						letterSpacing: '0',
						fontWeight: '400'
					}
				],
				'copy-14': [
					'0.875rem',
					{
						lineHeight: '1.7',
						letterSpacing: '0',
						fontWeight: '400'
					}
				],
				'copy-13': [
					'0.8125rem',
					{
						lineHeight: '1.7',
						letterSpacing: '0.01em',
						fontWeight: '400'
					}
				],
				'copy-13-mono': [
					'0.8125rem',
					{
						lineHeight: '1.7',
						letterSpacing: '0.02em',
						fontWeight: '500'
					}
				]
			},
			colors: {
				border: 'rgb(var(--border) / <alpha-value>)',
				input: 'rgb(var(--input) / <alpha-value>)',
				ring: 'rgb(var(--ring) / <alpha-value>)',
				background: 'rgb(var(--background) / <alpha-value>)',
				foreground: 'rgb(var(--foreground) / <alpha-value>)',
				'nav-background': 'rgb(var(--nav-background) / <alpha-value>)',
				'nav-foreground': 'rgb(var(--nav-foreground) / <alpha-value>)',
				'sidebar-background': 'hsl(var(--sidebar-background) / <alpha-value>)',
				'sidebar-foreground': 'hsl(var(--sidebar-foreground) / <alpha-value>)',
				primary: {
					DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
					foreground: 'rgb(var(--primary-foreground) / <alpha-value>)'
				},
				secondary: {
					DEFAULT: 'rgb(var(--secondary) / <alpha-value>)',
					foreground: 'rgb(var(--secondary-foreground) / <alpha-value>)'
				},
				destructive: {
					DEFAULT: 'rgb(var(--destructive) / <alpha-value>)',
					foreground: 'rgb(var(--destructive-foreground) / <alpha-value>)'
				},
				muted: {
					DEFAULT: 'rgb(var(--muted) / <alpha-value>)',
					foreground: 'rgb(var(--muted-foreground) / <alpha-value>)'
				},
				accent: {
					DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
					foreground: 'rgb(var(--accent-foreground) / <alpha-value>)'
				},
				// M3 Semantic Colors (Custom Extension)
				success: {
					DEFAULT: 'rgb(var(--success) / <alpha-value>)',
					foreground: 'rgb(var(--success-foreground) / <alpha-value>)'
				},
				warning: {
					DEFAULT: 'rgb(var(--warning) / <alpha-value>)',
					foreground: 'rgb(var(--warning-foreground) / <alpha-value>)'
				},
				info: {
					DEFAULT: 'rgb(var(--info) / <alpha-value>)',
					foreground: 'rgb(var(--info-foreground) / <alpha-value>)'
				},
				popover: {
					DEFAULT: 'rgb(var(--popover) / <alpha-value>)',
					foreground: 'rgb(var(--popover-foreground) / <alpha-value>)'
				},
				card: {
					DEFAULT: 'rgb(var(--card) / <alpha-value>)',
					foreground: 'rgb(var(--card-foreground) / <alpha-value>)'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
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
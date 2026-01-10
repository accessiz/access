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
					foreground: 'rgb(var(--primary-foreground) / <alpha-value>)',
				},
				secondary: {
					DEFAULT: 'rgb(var(--secondary) / <alpha-value>)',
					foreground: 'rgb(var(--secondary-foreground) / <alpha-value>)',
				},
				destructive: {
					DEFAULT: 'rgb(var(--destructive) / <alpha-value>)',
					foreground: 'rgb(var(--destructive-foreground) / <alpha-value>)',
				},
				muted: {
					DEFAULT: 'rgb(var(--muted) / <alpha-value>)',
					foreground: 'rgb(var(--muted-foreground) / <alpha-value>)',
				},
				accent: {
					DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
					foreground: 'rgb(var(--accent-foreground) / <alpha-value>)',
				},
				tertiary: {
					DEFAULT: 'rgb(var(--tertiary) / <alpha-value>)',
					foreground: 'rgb(var(--tertiary-foreground) / <alpha-value>)',
				},
				tertiaryContainer: {
					DEFAULT: 'rgb(var(--tertiary-container) / <alpha-value>)',
					foreground: 'rgb(var(--tertiary-container-foreground) / <alpha-value>)',
				},
				// Kebab-case aliases (more Tailwind-native, safer for scanners/tools)
				'tertiary-container': {
					DEFAULT: 'rgb(var(--tertiary-container) / <alpha-value>)',
					foreground: 'rgb(var(--tertiary-container-foreground) / <alpha-value>)',
				},
				// M3 Semantic Colors (Custom Extension)
				success: {
					DEFAULT: 'rgb(var(--success) / <alpha-value>)',
					foreground: 'rgb(var(--success-foreground) / <alpha-value>)',
				},
				warning: {
					DEFAULT: 'rgb(var(--warning) / <alpha-value>)',
					foreground: 'rgb(var(--warning-foreground) / <alpha-value>)',
				},
				info: {
					DEFAULT: 'rgb(var(--info) / <alpha-value>)',
					foreground: 'rgb(var(--info-foreground) / <alpha-value>)',
				},
				popover: {
					DEFAULT: 'rgb(var(--popover) / <alpha-value>)',
					foreground: 'rgb(var(--popover-foreground) / <alpha-value>)',
				},
				card: {
					DEFAULT: 'rgb(var(--card) / <alpha-value>)',
					foreground: 'rgb(var(--card-foreground) / <alpha-value>)',
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))',
				},
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
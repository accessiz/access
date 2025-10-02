import os
import json
import shutil

# This script should be run from the root of your nyxa project.
# It will update package.json, tailwind.config.ts, and clear .next cache.

PROJECT_ROOT = os.getcwd()

# Paths
PACKAGE_JSON_PATH = os.path.join(PROJECT_ROOT, 'package.json')
TAILWIND_CONFIG_PATH = os.path.join(PROJECT_ROOT, 'tailwind.config.ts')
NEXT_CACHE_PATH = os.path.join(PROJECT_ROOT, '.next')

print("Starting correction script...")

# Step 1: Update package.json - Change tailwindcss version to ^3.4.13
if os.path.exists(PACKAGE_JSON_PATH):
    with open(PACKAGE_JSON_PATH, 'r', encoding='utf-8') as f:
        package_data = json.load(f)
    
    if 'devDependencies' in package_data and 'tailwindcss' in package_data['devDependencies']:
        package_data['devDependencies']['tailwindcss'] = '^3.4.13'
        print("Updated tailwindcss version in package.json to ^3.4.13")
    else:
        print("tailwindcss not found in devDependencies!")
    
    with open(PACKAGE_JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(package_data, f, indent=2)
else:
    print("package.json not found! Make sure to run this script from the project root.")

# Step 2: Update tailwind.config.ts - Use rgb format for colors, add .css to content
new_tailwind_config = """import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx,css}', // Added css files for scanning
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "rgb(var(--border) / <alpha-value>)",
        input: "rgb(var(--input) / <alpha-value>)",
        ring: "rgb(var(--ring) / <alpha-value>)",
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        primary: {
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          foreground: "rgb(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "rgb(var(--secondary) / <alpha-value>)",
          foreground: "rgb(var(--secondary-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "rgb(var(--destructive) / <alpha-value>)",
          foreground: "rgb(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "rgb(var(--muted) / <alpha-value>)",
          foreground: "rgb(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          foreground: "rgb(var(--accent-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "rgb(var(--popover) / <alpha-value>)",
          foreground: "rgb(var(--popover-foreground) / <alpha-value>)",
        },
        card: {
          DEFAULT: "rgb(var(--card) / <alpha-value>)",
          foreground: "rgb(var(--card-foreground) / <alpha-value>)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
"""

if os.path.exists(TAILWIND_CONFIG_PATH):
    with open(TAILWIND_CONFIG_PATH, 'w', encoding='utf-8') as f:
        f.write(new_tailwind_config)
    print("Updated tailwind.config.ts with rgb format and added .css to content paths.")
else:
    print("tailwind.config.ts not found! Make sure to run this script from the project root.")

# Step 3: Clear .next cache if exists
if os.path.exists(NEXT_CACHE_PATH):
    shutil.rmtree(NEXT_CACHE_PATH)
    print("Cleared .next cache directory.")
else:
    print(".next directory not found, no cache to clear.")

print("Corrections applied successfully.")
print("Next steps:")
print("1. Run 'npm install' to update dependencies.")
print("2. Run 'npm run dev' to start the development server and test the changes.")
print("If the error persists, check for other issues like PostCSS configuration or run 'npm run build' to see detailed errors.")
import os
import textwrap

# -----------------------------------------------------------------------------
# SCRIPT PARA AJUSTAR LA TIPOGRAFÍA BASE A 88% (~14.08PX)
# -----------------------------------------------------------------------------
# Instrucciones:
# 1. Guarda este archivo como `update_font_size_88_percent.py` en la raíz de tu proyecto.
# 2. Ejecuta el script con: python update_font_size_88_percent.py
# -----------------------------------------------------------------------------

files_to_update = [
    {
        "path": "src/app/globals.css",
        "action": "modify",
        "content": textwrap.dedent("""
            @tailwind base;
            @tailwind components;
            @tailwind utilities;

            @layer base {
              :root {
                /* ====================================================== */
                /* ==   MODO CLARO (LIGHT THEME) - REFINADO            == */
                /* ====================================================== */
                --background: 249 249 249; /* Un blanco roto muy sutil */
                --foreground: 20 20 20;

                --nav-background: 255 255 255; /* Blanco puro para la barra lateral y header */
                --nav-foreground: 20 20 20;

                --card: 255 255 255;
                --card-foreground: 20 20 20;

                --popover: 255 255 255;
                --popover-foreground: 20 20 20;
                
                --primary: 135 24 157;
                --primary-foreground: 250 250 250;

                --secondary: 242 242 242; /* Un gris muy claro para elementos secundarios */
                --secondary-foreground: 28 26 29;
                
                --muted: 242 242 242;
                --muted-foreground: 120 120 120;
                
                --accent: 242 242 242;
                --accent-foreground: 28 26 29;
                
                --destructive: 220 38 38;
                --destructive-foreground: 250 250 250;

                --border: 230 230 230;
                --input: 230 230 230;
                --ring: 135 24 157;

                --radius: 0.5rem; /* Bordes ligeramente menos redondeados para un look más serio */
              }

              .dark {
                /* ==================================================== */
                /* ==   MODO OSCURO (DARK THEME) - REFINADO          == */
                /* ==================================================== */
                --background: 10 10 10; /* Fondo principal casi negro */
                --foreground: 235 235 235;

                --nav-background: 19 19 19; /* Sidebar y Header ligeramente más claros */
                --nav-foreground: 235 235 235;
                
                --card: 19 19 19;
                --card-foreground: 235 235 235;

                --popover: 19 19 19;
                --popover-foreground: 235 235 235;
                
                --primary: 135 24 157;
                --primary-foreground: 250 250 250;
                
                --secondary: 35 35 35; /* Gris oscuro para elementos activos/hover */
                --secondary-foreground: 250 250 250;
                
                --muted: 35 35 35;
                --muted-foreground: 160 160 160;
                
                --accent: 35 35 35;
                --accent-foreground: 250 250 250;
                
                --destructive: 153 27 27;
                --destructive-foreground: 235 235 235;
                
                --border: 35 35 35;
                --input: 35 35 35;
                --ring: 135 24 157;
              }
            }
            
            @layer base {
              html {
                /* Establece ~14.08px como el tamaño de fuente base (16px * 88%) */
                font-size: 88%; 
              }
              * {
                @apply border-border;
              }
              body {
                @apply bg-background text-foreground;
                font-feature-settings: "rlig" 1, "calt" 1;
                /* Base font size in rem, which now equals ~14.08px */
                font-size: 1rem;
              }
            }
        """)
    },
    {
        "path": "tailwind.config.ts",
        "action": "modify",
        "content": textwrap.dedent("""
            import type { Config } from 'tailwindcss'

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
                  padding: "2rem",
                  screens: {
                    "2xl": "1400px",
                  },
                },
                extend: {
                  fontSize: {
                      'xs': '0.852rem', // ~12px
                      'sm': '0.923rem', // ~13px
                      'base': '1rem',    // ~14.08px (base)
                      'lg': '1.136rem', // ~16px
                      'xl': '1.278rem', // ~18px
                      '2xl': '1.562rem', // ~22px
                      '3xl': '1.846rem', // ~26px
                      '4xl': '2.272rem', // ~32px
                  },
                  colors: {
                    border: "rgb(var(--border) / <alpha-value>)",
                    input: "rgb(var(--input) / <alpha-value>)",
                    ring: "rgb(var(--ring) / <alpha-value>)",
                    background: "rgb(var(--background) / <alpha-value>)",
                    foreground: "rgb(var(--foreground) / <alpha-value>)",
                    "nav-background": "rgb(var(--nav-background) / <alpha-value>)",
                    "nav-foreground": "rgb(var(--nav-foreground) / <alpha-value>)",
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
        """)
    }
]

def apply_font_update():
    """
    Applies the font size modifications to the project files.
    """
    print("🚀 Sincronizando la tipografía base a 88%...")
    
    project_root = os.getcwd()
    
    for file_info in files_to_update:
        file_path = os.path.join(project_root, file_info["path"])
        
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(file_info["content"])
            print(f"✨ Sincronizado: {file_info['path']}")
        
        except FileNotFoundError:
            print(f"⚠️ Advertencia: No se encontró el archivo {file_info['path']}. Se omitió.")
        except Exception as e:
            print(f"❌ Error al procesar {file_info['path']}: {e}")
            
    print("\n🎉 ¡Sincronización de tipografía completada!")
    print("La base ahora es de ~14.08px y la escala es consistente. ¡Reinicia tu servidor!")

if __name__ == "__main__":
    apply_font_update()

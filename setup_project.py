import os
import subprocess

# --- Contenido de los Archivos ---

# Contenido para: tailwind.config.ts
tailwind_config_content = """
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class", // Habilitamos el modo oscuro basado en una clase en el HTML
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Definimos nuestros colores usando variables CSS para que cambien con el tema
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      borderRadius: {
        lg: "0.5rem",
        md: "calc(0.5rem - 2px)",
        sm: "calc(0.5rem - 4px)",
      },
    },
  },
  plugins: [],
};
export default config;
"""

# Contenido para: src/app/globals.css
globals_css_content = """
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Definimos nuestras variables de color para el tema claro (light mode) */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  /* Aquí sobreescribimos las variables para el tema oscuro (dark mode) */
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

/* Estilos base para el cuerpo de la página */
@layer base {
  body {
    background-color: hsl(var(--background));
    color: hsl(var(--foreground));
  }
}
"""

# Contenido para: src/app/layout.tsx
# --- CAMBIO DE FUENTE A GEIST APLICADO AQUÍ ---
layout_tsx_content = """
import type { Metadata } from "next";
// Importamos la fuente Geist Sans
import { GeistSans } from 'geist/font/sans';
import "./globals.css";

export const metadata: Metadata = {
  title: "IZ Access",
  description: "Portal de Gestión para IZ Management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      {/* Aplicamos la fuente Geist a toda la aplicación */}
      <body className={GeistSans.className}>{children}</body>
    </html>
  );
}
"""

# Contenido para: src/app/page.tsx
# --- AJUSTES DE ESTILO PARA GEIST ---
page_tsx_content = """
import { Target } from 'lucide-react';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <div className="text-center">
        <div className="flex items-center justify-center space-x-3 mb-6">
          <Target className="h-9 w-9 text-primary" />
          <h1 className="text-5xl font-bold tracking-tighter text-foreground">
            IZ Access
          </h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Portal de Gestión para IZ Management.
        </p>
        <div className="mt-8">
            <button className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors font-semibold tracking-wide">
              Iniciar Sesión
            </button>
        </div>
      </div>
    </main>
  );
}
"""

# --- Lógica del Script ---

def write_file(filepath, content):
    """Función para escribir contenido en un archivo, creando directorios si es necesario."""
    try:
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Archivo modificado/creado exitosamente: {filepath}")
    except Exception as e:
        print(f"❌ Error al escribir el archivo {filepath}: {e}")

def install_dependencies():
    """Instala las dependencias necesarias."""
    try:
        print("📦 Instalando la dependencia 'geist'...")
        # Usamos check=True para que el script se detenga si hay un error
        subprocess.run(["yarn", "add", "geist"], check=True, shell=True)
        print("✅ Dependencia 'geist' instalada correctamente.")
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        print(f"❌ Error al instalar dependencias con yarn: {e}")
        print("   Por favor, asegúrate de tener Yarn instalado y ejecuta 'yarn add geist' manualmente.")

def main():
    """Función principal del script."""
    print("🚀 Aplicando la fuente 'Geist' al proyecto 'IZ Access'...")
    
    install_dependencies()

    print("\\n📝 Modificando archivos del proyecto...")
    
    files_to_process = {
        "tailwind.config.ts": tailwind_config_content,
        "src/app/globals.css": globals_css_content,
        "src/app/layout.tsx": layout_tsx_content,
        "src/app/page.tsx": page_tsx_content,
    }
    
    for filepath, content in files_to_process.items():
        write_file(filepath, content)
        
    print("\\n✨ ¡Fuente 'Geist' aplicada correctamente!")
    print("   Ahora puedes correr 'yarn dev' para ver los cambios.")

if __name__ == "__main__":
    main()


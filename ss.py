import os
import re

# -----------------------------------------------------------------------------
# SCRIPT PARA CAMBIAR EL NÚMERO DE MODELOS POR PÁGINA A 24
# -----------------------------------------------------------------------------
# Instrucciones:
# 1. Guarda este archivo como `update_items_per_page.py` en la raíz de tu proyecto.
# 2. Ejecuta el script con: python update_items_per_page.py
# -----------------------------------------------------------------------------

# --- Archivo a modificar: src/app/dashboard/models/page.tsx ---
# Objetivo:
# Cambiar la constante ITEMS_PER_PAGE de su valor actual a 24.

file_path = "src/app/dashboard/models/page.tsx"

def set_models_per_page_to_24():
    """
    Finds the ITEMS_PER_PAGE constant and sets its value to 24.
    """
    print("🚀 Ajustando el número de modelos por página a 24...")
    
    project_root = os.getcwd()
    full_path = os.path.join(project_root, file_path)

    try:
        with open(full_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Usamos una expresión regular para encontrar la línea y cambiar solo el número.
        # Esto es más seguro que reemplazar toda la línea.
        old_constant = r"const ITEMS_PER_PAGE = \d+;"
        new_constant = "const ITEMS_PER_PAGE = 24;"
        
        if re.search(old_constant, content):
            new_content = re.sub(old_constant, new_constant, content, 1)
            
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            
            print(f"✨ ¡Listo! El archivo {file_path} ahora mostrará 24 modelos por página.")
        else:
            print(f"⚠️ No se encontró la constante 'ITEMS_PER_PAGE' en {file_path}. ¿Ya fue modificada?")

    except FileNotFoundError:
        print(f"❌ Error: No se encontró el archivo {full_path}.")
    except Exception as e:
        print(f"❌ Ocurrió un error inesperado: {e}")

if __name__ == "__main__":
    set_models_per_page_to_24()

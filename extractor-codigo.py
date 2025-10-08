import os

# Rutas
ROOT_DIR = r"C:\Users\Evo-minidesk\Desktop\nyxa"
OUTPUT_FILE = r"C:\Users\Evo-minidesk\Desktop\nyxa_dump.md"

# Exclusiones absolutas (carpetas o archivos)
EXCLUDED_PATHS = [
    os.path.join(ROOT_DIR, "node_modules"),
    os.path.join(ROOT_DIR, ".next"),
    os.path.join(ROOT_DIR, "package-lock.json"),
    os.path.join(ROOT_DIR, "yarn.lock"),
    os.path.join(ROOT_DIR, "README.md"),
    os.path.join(ROOT_DIR, ".env.local"),
    os.path.join(ROOT_DIR, ".git"),
]

def is_excluded(path):
    """
    Verifica si una ruta debe ser excluida según la lista de exclusiones.
    """
    try:
        return any(os.path.commonpath([path, ex]) == ex for ex in EXCLUDED_PATHS)
    except ValueError:
        return False  # En caso de rutas incompatibles

def is_binary_file(file_path):
    """
    Determina si un archivo es binario.
    """
    try:
        with open(file_path, 'rb') as f:
            chunk = f.read(1024)
        return b'\0' in chunk
    except Exception:
        return True  # Si falla al abrir, tratarlo como binario

def build_sitemap_and_extract(root_dir):
    """
    Construye el sitemap del proyecto y extrae contenido de archivos de texto.
    """
    result_lines = []

    sitemap_lines = []
    file_sections = []

    for dirpath, dirnames, filenames in os.walk(root_dir):
        if is_excluded(dirpath):
            dirnames[:] = []  # Detener exploración de subdirectorios excluidos
            continue

        # Estructura del árbol (sitemap)
        level = dirpath.replace(root_dir, '').count(os.sep)
        indent = '    ' * level
        folder_name = os.path.basename(dirpath) or os.path.basename(root_dir)
        sitemap_lines.append(f"{indent}- **{folder_name}**")

        for file in filenames:
            file_path = os.path.join(dirpath, file)
            if is_excluded(file_path):
                continue

            sitemap_lines.append(f"{indent}    - {file}")

            # Leer contenido del archivo si no es binario
            if is_binary_file(file_path):
                content = "[Archivo binario omitido]"
            else:
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                except Exception as e:
                    content = f"[No se pudo leer este archivo como texto: {e}]"

            relative_path = os.path.relpath(file_path, root_dir)
            file_sections.append(f"\n\n---\n\n### `{relative_path}`\n```txt\n{content}\n```")

    result_lines.append("# 📁 Sitemap del Proyecto\n")
    result_lines.extend(sitemap_lines)
    result_lines.append("\n\n# 📄 Contenido de Archivos\n")
    result_lines.extend(file_sections)

    return '\n'.join(result_lines)

if __name__ == "__main__":
    output = build_sitemap_and_extract(ROOT_DIR)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as out_file:
        out_file.write(output)

    print(f"✅ Archivo generado: {OUTPUT_FILE}")

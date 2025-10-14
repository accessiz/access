import os

def generar_arbol(directorio, archivo_salida):
    with open(archivo_salida, 'w', encoding='utf-8') as f:
        for raiz, carpetas, archivos in os.walk(directorio):
            # Nivel de profundidad (para indentación)
            nivel = raiz.replace(directorio, '').count(os.sep)
            indent = '│   ' * nivel + '├── '
            f.write(f"{indent}{os.path.basename(raiz)}\n")
            
            sub_indent = '│   ' * (nivel + 1)
            for archivo in archivos:
                f.write(f"{sub_indent}├── {archivo}\n")

if __name__ == "__main__":
    # Ruta base a explorar
    ruta_base = r"C:\Users\Evo-minidesk\Desktop\nyxa\src"
    salida_txt = "estructura_nyxa.txt"

    print(f"Generando organigrama de: {ruta_base}")
    generar_arbol(ruta_base, salida_txt)
    print(f"Estructura guardada en: {salida_txt}")

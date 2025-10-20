import os
import re

# --- CONFIGURACIÓN ---
# ✅ Ruta ajustada para coincidir con la del script de subida (bulk).
carpeta_origen = r"C:\Users\Evo-minidesk\Downloads\portafolio_cards"

# Ubicación del archivo de texto de salida en el Escritorio.
escritorio = os.path.join(os.path.expanduser("~"), "Desktop")
archivo_salida = os.path.join(escritorio, "nombres_limpios.txt")

# ✅ Palabras que se eliminarán de los nombres de archivo (lista expandida).
palabras_invalidas = {
    # Palabras comunes de archivos
    "book", "card", "comp", "digitals", "polaroids", "portfolio",
    "final", "edit", "edited", "version", "ver", "copy",
    "img", "dsc", "photo", "pic", "shot",
    # Meses y palabras aleatorias
    "jul", "extra", "nuevo", "revisión",
    # Conectores y preposiciones
    "y", "and", "para", "con", "de",
    # Específicas de la agencia
    "iz", "management"
}

# --- SCRIPT ---

# 1. Verificar si la carpeta de origen existe.
if not os.path.isdir(carpeta_origen):
    print(f"⚠️  Error: La carpeta de origen no existe en la ruta especificada:\n{carpeta_origen}")
    exit()

# 2. Listar solo los archivos (ignorando subcarpetas).
try:
    archivos = [f for f in os.listdir(carpeta_origen) if os.path.isfile(os.path.join(carpeta_origen, f))]
except FileNotFoundError:
    print(f"⚠️  Error: No se pudo acceder a la carpeta: {carpeta_origen}")
    exit()
    
print(f"📂 Encontrados {len(archivos)} archivos en la carpeta de origen.")

nombres_guardados = []

# 3. Procesar cada archivo.
for archivo in archivos:
    # Ignorar archivos temporales de ejecuciones anteriores
    if archivo.endswith('.tmp'):
        continue

    ruta_actual = os.path.join(carpeta_origen, archivo)
    nombre_original, extension = os.path.splitext(archivo)

    # Lógica de limpieza agresiva
    nombre_separado = re.sub(r'[\d\._\-()\[\]]+', ' ', nombre_original)
    nombre_solo_letras = re.sub(r'[^a-zA-Z\s\u00C0-\u017F]', '', nombre_separado)
    palabras = nombre_solo_letras.lower().split()
    palabras_filtradas = [p for p in palabras if p not in palabras_invalidas and len(p) > 1]
    nombre_limpio = ' '.join(palabras_filtradas).title()

    if not nombre_limpio:
        print(f"⏭️  Omitido: '{archivo}' no resultó en un nombre válido.")
        continue

    # 4. Manejar duplicados.
    nuevo_nombre_base = nombre_limpio
    contador = 1
    while True:
        nuevo_nombre = nuevo_nombre_base if contador == 1 else f"{nuevo_nombre_base} {contador}"
        nuevo_archivo_con_extension = f"{nuevo_nombre}{extension.lower()}"
        ruta_nueva = os.path.join(carpeta_origen, nuevo_archivo_con_extension)
        
        # Si la nueva ruta no existe O si es la misma que la ruta actual (ignorando mayúsculas), podemos usarla.
        if not os.path.exists(ruta_nueva) or ruta_actual.lower() == ruta_nueva.lower():
            break
        contador += 1

    # 5. Renombrar el archivo físico.
    try:
        # ✅ CORRECCIÓN: Usar una comparación directa y sensible a mayúsculas.
        if archivo != nuevo_archivo_con_extension:
            # Renombrar a un archivo temporal primero para forzar el cambio de mayúsculas/minúsculas.
            temp_path = ruta_actual + ".tmp"
            os.rename(ruta_actual, temp_path)
            os.rename(temp_path, ruta_nueva)
            print(f"🔄 Renombrado: '{archivo}' -> '{nuevo_archivo_con_extension}'")
        else:
            print(f"👍 Sin cambios: '{archivo}' ya tiene el nombre correcto.")
            
        nombres_guardados.append(nuevo_nombre)
    except PermissionError:
         print(f"❌ Error de Permiso: No se pudo renombrar '{archivo}'. ¿Está abierto en otro programa?")
    except Exception as e:
        print(f"❌ Error al renombrar '{archivo}': {e}")


# 6. Guardar la lista de nombres limpios en el archivo .txt del escritorio.
try:
    with open(archivo_salida, "w", encoding="utf-8") as f:
        for nombre in sorted(nombres_guardados): # Guardar en orden alfabético
            f.write(f"{nombre}\n")
    print("\n--- REPORTE FINAL ---")
    print(f"✅ {len(nombres_guardados)} archivos procesados.")
    print(f"📄 La lista de nombres limpios se ha guardado en: {archivo_salida}")
except Exception as e:
    print(f"\n❌ Error al guardar el archivo de texto: {e}")


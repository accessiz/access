import os
from PIL import Image

# --- CONFIGURACIÓN ---

# 1. Carpeta con las imágenes originales que quieres comprimir.
#    ✅ ¡Ruta actualizada con la carpeta que mencionaste!
carpeta_origen = r"C:\Users\Evo-minidesk\Downloads\Compcards_comp"

# 2. Carpeta donde se guardarán las imágenes comprimidas.
#    Se creará automáticamente si no existe.
carpeta_destino = r"C:\Users\Evo-minidesk\Downloads\Compcards_comprimidas"

# 3. Calidad de la compresión WebP (de 0 a 100).
#    Un valor entre 80 y 90 suele ser excelente para un balance entre calidad y tamaño.
CALIDAD_WEBP = 85

# --- SCRIPT ---

def comprimir_imagenes():
    """
    Busca imágenes en la carpeta de origen, las convierte a formato WebP
    y las guarda en la carpeta de destino.
    """
    # Verificar si Pillow está instalado
    try:
        from PIL import Image
    except ImportError:
        print("❌ Error: La librería Pillow no está instalada.")
        print("   Por favor, instálala ejecutando este comando en tu terminal:")
        print("   pip install Pillow")
        return

    # Verificar si la carpeta de origen existe
    if not os.path.isdir(carpeta_origen):
        print(f"⚠️  Error: La carpeta de origen no existe en la ruta especificada:\n{carpeta_origen}")
        return

    # Crear la carpeta de destino si no existe
    if not os.path.exists(carpeta_destino):
        print(f"📁 Creando carpeta de destino en: {carpeta_destino}")
        os.makedirs(carpeta_destino)

    # Listar archivos de imagen soportados
    archivos_soportados = ('.jpg', '.jpeg', '.png', '.bmp', '.tiff')
    try:
        archivos = [f for f in os.listdir(carpeta_origen) if f.lower().endswith(archivos_soportados)]
    except FileNotFoundError:
        print(f"⚠️  Error: No se pudo acceder a la carpeta: {carpeta_origen}")
        return

    if not archivos:
        print("ℹ️  No se encontraron imágenes en la carpeta de origen.")
        return

    print(f"🚀 Iniciando compresión de {len(archivos)} imágenes...")
    
    contador_exito = 0
    contador_fallo = 0

    # Procesar cada imagen
    for archivo in archivos:
        nombre_sin_extension, _ = os.path.splitext(archivo)
        ruta_origen = os.path.join(carpeta_origen, archivo)
        ruta_destino_webp = os.path.join(carpeta_destino, f"{nombre_sin_extension}.webp")

        try:
            # Abrir la imagen
            with Image.open(ruta_origen) as img:
                # Guardar en formato WebP con la calidad especificada
                img.save(ruta_destino_webp, 'webp', quality=CALIDAD_WEBP)
            
            print(f"✅ Comprimido: '{archivo}' -> '{os.path.basename(ruta_destino_webp)}'")
            contador_exito += 1
        except Exception as e:
            print(f"❌ Error al procesar '{archivo}': {e}")
            contador_fallo += 1
    
    # Reporte final
    print("\n--- ✨ REPORTE FINAL ✨ ---")
    print(f"✅ Imágenes procesadas con éxito: {contador_exito}")
    if contador_fallo > 0:
        print(f"❌ Archivos que fallaron: {contador_fallo}")
    print(f"📂 Tus imágenes comprimidas están en: {carpeta_destino}")


# Ejecutar la función principal
if __name__ == "__main__":
    comprimir_imagenes()

import os
import sys
import glob
import shutil
import argparse
import cv2

# Rutas y constantes
DEFAULT_DIR = r"C:\Users\Evo-minidesk\Downloads\Hombres"
IMAGE_EXTS = ('.jpg', '.jpeg', '.png', '.webp', '.tiff', '.avif')

# Cargar el clasificador de rostros Haar Cascade
cascPath = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
faceCascade = cv2.CascadeClassifier(cascPath)

def get_face_ratio(img_path, verbose=False):
    try:
        # Usar cv2.imdecode para soportar rutas con tildes/espacios en Windows
        import numpy as np
        with open(img_path, 'rb') as f:
            chunk = f.read()
        chunk_arr = np.frombuffer(chunk, dtype=np.uint8)
        img = cv2.imdecode(chunk_arr, cv2.IMREAD_COLOR)

        if img is None:
            return 0.0

        img_area = img.shape[0] * img.shape[1]
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Detectar rostros
        faces = faceCascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(50, 50)
        )

        if len(faces) == 0:
            return 0.0

        # Encontrar el rostro que ocupa mayor área
        max_face_area = 0
        for (x, y, w, h) in faces:
            area = w * h
            if area > max_face_area:
                max_face_area = area

        return max_face_area / img_area
    except Exception as e:
        if verbose:
            print(f"Error procesando {os.path.basename(img_path)}: {e}")
        return 0.0

def get_ficha_path(model_path):
    possible_names = ['Ficha', 'ficha', 'FICHA']
    for name in possible_names:
        full_path = os.path.join(model_path, name)
        if os.path.exists(full_path) and os.path.isdir(full_path):
            return full_path
    return None

def list_images(dir_path):
    if not os.path.exists(dir_path):
        return []
    files = [f for f in os.listdir(dir_path) if f.lower().endswith(IMAGE_EXTS) and os.path.isfile(os.path.join(dir_path, f))]
    return sorted(files)

def process_model(model_name, base_dir, dry_run=True, verbose=False):
    model_path = os.path.join(base_dir, model_name)
    ficha_path = get_ficha_path(model_path)

    if not ficha_path:
        print(f"  [SKIP] {model_name} - No tiene carpeta Ficha/ficha")
        return False

    portada_path = os.path.join(ficha_path, 'portada')
    
    # Check if portada exists and is not empty
    if os.path.exists(portada_path) and len(list_images(portada_path)) > 0:
        print(f"  [OK] {model_name} - Ya tiene portada pre-configurada.")
        return True

    ficha_files = list_images(ficha_path)

    if len(ficha_files) == 0:
        print(f"  [SKIP] {model_name} - Ficha vacía.")
        return False

    # Regla: <= 3 fotos, no crear portada
    if len(ficha_files) <= 3:
        print(f"  [INFO] {model_name} - Solo {len(ficha_files)} fotos. Omitiendo portada.")
        return True

    if verbose:
        print(f"  Analizando {len(ficha_files)} fotos en {model_name}/Ficha...")

    max_ratio = -1.0
    best_file = ficha_files[0]

    for f in ficha_files:
        full_path = os.path.join(ficha_path, f)
        ratio = get_face_ratio(full_path, verbose)
        
        if verbose:
            print(f"    - {f}: Ratio Rostro = {(ratio * 100):.2f}%")
            
        if ratio > max_ratio:
            max_ratio = ratio
            best_file = f

    source_path = os.path.join(ficha_path, best_file)
    target_path = os.path.join(portada_path, best_file)

    if not dry_run:
        if not os.path.exists(portada_path):
            os.makedirs(portada_path)
        shutil.move(source_path, target_path)

    print(f"  [DONE] {model_name} - Portada: {best_file} (Ratio: {(max_ratio * 100):.1f}%)")
    return True

def main():
    parser = argparse.ArgumentParser(description="Organiza las carpetas de hombres creando subcarpetas 'portada'")
    parser.add_argument("--dir", default=DEFAULT_DIR, help="Carpeta base (Hombres)")
    parser.add_argument("--models", help="Modelos específicos a procesar (por ejemplo: 'Adrian Estrada,Carlos Bonilla')")
    parser.add_argument("--dry-run", action="store_true", help="Simular sin mover archivos")
    parser.add_argument("--verbose", action="store_true", help="Imprimir progreso detallado")
    args = parser.parse_args()

    print("==========================================================")
    print("       Preparar Carpetas Hombres (OpenCV local)")
    print("==========================================================")
    print(f"  Modo:        {'DRY RUN (no mueve archivos)' if args.dry_run else 'LIVE (modificando carpetas)'}")
    print(f"  Directorio:  {args.dir}")
    print()

    if not os.path.exists(args.dir):
        print(f"Error: No existe el directorio {args.dir}")
        sys.exit(1)

    folders = [f for f in os.listdir(args.dir) if os.path.isdir(os.path.join(args.dir, f))]
    
    if args.models:
        filter_names = [x.strip().lower() for x in args.models.split(',')]
        folders = [f for f in folders if f.lower() in filter_names]
        print(f"  Filtro: Procesando solo {len(folders)} modelos\n")

    print(f"Encontrados {len(folders)} modelos para analizar...\n")

    count = 0
    for folder in folders:
        if process_model(folder, args.dir, args.dry_run, args.verbose):
            count += 1

    print("\n==========================================================")
    print(f"  Proceso terminado exitosamente. Analizados {count}/{len(folders)} modelos.")
    print("==========================================================\n")

if __name__ == "__main__":
    main()

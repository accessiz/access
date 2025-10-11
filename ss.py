import os
import re
import textwrap

# -----------------------------------------------------------------------------
# SCRIPT PARA AJUSTAR LA TABLA DE MODELOS
# -----------------------------------------------------------------------------
# Instrucciones:
# 1. Guarda este archivo como `adjust_table_columns.py` en la raíz de tu proyecto.
# 2. Ejecuta el script con: python adjust_table_columns.py
# -----------------------------------------------------------------------------

file_path = "src/app/dashboard/models/page.tsx"

def adjust_models_table():
    """
    Adds the TikTok column, reorders columns, and aligns the download button.
    """
    print("🚀 Realizando ajustes finos en la tabla de modelos...")
    
    project_root = os.getcwd()
    full_path = os.path.join(project_root, file_path)

    try:
        with open(full_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # --- 1. Ajustar Cabeceras de la Tabla ---
        
        # Patrón para encontrar el bloque de cabeceras completo
        header_pattern = re.compile(
            r'(<TableRow>\s*<TableHead className="w-\[80px\]"></TableHead>.*?<TableHead className="text-right">Acciones</TableHead>\s*</TableRow>)',
            re.DOTALL
        )
        
        # Nuevo bloque de cabeceras con TikTok y el orden correcto
        new_header_block = textwrap.dedent("""
                                    <TableRow>
                                        <TableHead className="w-[80px]"></TableHead>
                                        <SortableHeader tkey="alias" label="Alias" />
                                        <SortableHeader tkey="country" label="País" />
                                        <SortableHeader tkey="height_cm" label="Estatura" />
                                        <TableHead>Instagram</TableHead>
                                        <TableHead>TikTok</TableHead>
                                        <TableHead>Perfil</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
        """).strip()

        content, header_replacements = header_pattern.subn(new_header_block, content, count=1)
        if header_replacements > 0:
            print("  - Cabeceras de la tabla actualizadas y reordenadas.")
        else:
            print("  - (Advertencia) No se encontró el bloque de cabeceras esperado.")

        # --- 2. Ajustar Cuerpo de la Tabla ---

        # Patrón para encontrar el bloque de celdas completo de la fila
        body_row_pattern = re.compile(
            r'(<TableRow key=\{model.id\} onClick=\{.*?\}\s*className="cursor-pointer">\s*<TableCell><Avatar>.*?</Avatar></TableCell>.*?<TableCell className="text-right">.*?<Download .*?/>.*?</TableCell>\s*</TableRow>)',
            re.DOTALL
        )
        
        # Nuevo bloque de celdas con TikTok, orden correcto y alineación del botón de descarga
        new_body_row_block = textwrap.dedent("""
                                            <TableRow key={model.id} onClick={() => handleRowClick(model.id)} className="cursor-pointer">
                                                <TableCell><Avatar><AvatarImage src={`${publicUrl}/${model.id}/cover/cover.jpg`} /><AvatarFallback>{model.alias?.substring(0, 2) || 'IZ'}</AvatarFallback></Avatar></TableCell>
                                                <TableCell className="font-medium">{model.alias}</TableCell>
                                                <TableCell>{model.country}</TableCell>
                                                <TableCell>{model.height_cm} cm</TableCell>
                                                <TableCell>{model.instagram && <Link href={`https://instagram.com/${model.instagram}`} target="_blank" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 hover:underline text-muted-foreground hover:text-foreground">@{model.instagram} <ExternalLink className="h-3.5 w-3.5" /></Link>}</TableCell>
                                                <TableCell>{model.tiktok && <Link href={`https://tiktok.com/@${model.tiktok}`} target="_blank" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 hover:underline text-muted-foreground hover:text-foreground">@{model.tiktok} <ExternalLink className="h-3.5 w-3.5" /></Link>}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Progress value={model.profile_completion || 0} className="w-20 h-1.5" />
                                                        <span className="text-xs text-muted-foreground">{`${Math.round(model.profile_completion || 0)}%`}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end">
                                                        <Download className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" onClick={(e) => { e.stopPropagation(); alert('Próximamente'); }} />
                                                    </div>
                                                </TableCell>
                                            </TableRow>
        """).strip()
        
        # Reemplazamos todas las ocurrencias en el map
        content = body_row_pattern.sub(new_body_row_block, content)
        
        # Pequeña verificación para ver si se hizo el cambio
        if new_body_row_block in content:
             print("  - Celdas del cuerpo de la tabla actualizadas y reordenadas.")
             print("  - Botón de descarga alineado a la derecha.")
        else:
            # Si el regex falla, intentamos un reemplazo más simple como fallback
            simple_body_pattern = re.compile(r'\{models.map\(\(model\) => \((.*?)\)\)\}', re.DOTALL)
            match = simple_body_pattern.search(content)
            if match:
                new_map_content = f"{{models.map((model) => (\\n                                            {new_body_row_block}\\n                                        ))}}"
                content = simple_body_pattern.sub(new_map_content, content, count=1)
                print("  - (Fallback) Celdas del cuerpo de la tabla actualizadas.")

        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(content)
            
        print("\n✨ ¡Ajustes de tabla completados!")

    except FileNotFoundError:
        print(f"❌ Error: No se encontró el archivo {full_path}.")
    except Exception as e:
        print(f"❌ Ocurrió un error inesperado: {e}")

if __name__ == "__main__":
    adjust_models_table()



'use server';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// 1. Configuración de R2 (movida aquí)
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

async function uploadAndGetUrl(file: File, modelId: string, category: string, slotIndex: string | null) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.\\-_]/g, '').toLowerCase();

    let fileName = `${Date.now()}-${cleanFileName}`;
    if (category === 'Portada') {
        fileName = 'cover.webp';
    } else if (category === 'Portfolio') {
        fileName = 'portfolio.webp';
    } else if (category === 'Contraportada' && slotIndex) {
        fileName = `comp_${slotIndex}.webp`;
    }
    
    const fullPath = `${modelId}/${category}/${fileName}`;

    await r2.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: fullPath,
      Body: buffer,
      ContentType: file.type,
      ACL: 'public-read',
    }));

    const publicUrl = `${process.env.R2_PUBLIC_URL}/${fullPath}`;
    return { publicUrl, path: fullPath };
}


export async function POST(
  request: Request,
  { params }: { params: { modelId: string } }
) {
  try {
    const { modelId } = params;
    const formData = await request.formData();
    
    const file = formData.get("file") as File | null;
    const category = formData.get("category") as string | null;
    const slotIndex = formData.get("slotIndex") as string | null;

    if (!file || !category) {
        return NextResponse.json({ success: false, error: 'Faltan datos (file o category).' }, { status: 400 });
    }

    // 2. Lógica de subida ahora vive aquí
    const { publicUrl, path } = await uploadAndGetUrl(file, modelId, category, slotIndex);

    if (!publicUrl || !path) {
      return NextResponse.json({ success: false, error: 'La subida a R2 falló o no devolvió una URL.' }, { status: 500 });
    }

    // 3. Actualización de Supabase con el cliente Admin
    let error;

    if (category === 'Portada') {
      const { error: updateError } = await supabaseAdmin.from('models').update({ cover_path: path }).eq('id', modelId);
      error = updateError;
    } else if (category === 'Portfolio') {
        const { error: updateError } = await supabaseAdmin.from('models').update({ portfolio_path: path }).eq('id', modelId);
        error = updateError;
    } else if (category === 'Contraportada' && slotIndex !== null) { // Check for not null
        const { data: currentModel, error: fetchError } = await supabaseAdmin.from('models').select('comp_card_paths').eq('id', modelId).single();
        if (fetchError) throw new Error('No se pudo obtener la galería actual del modelo');
        
        const currentPaths = currentModel?.comp_card_paths || [];
        const index = parseInt(slotIndex, 10);
        // Aseguramos que el array tenga la longitud necesaria
        while (currentPaths.length <= index) {
            currentPaths.push(null);
        }
        currentPaths[index] = path;

        const { error: updateError } = await supabaseAdmin.from('models').update({ comp_card_paths: currentPaths }).eq('id', modelId);
        error = updateError;
    }

    if (error) {
      // Log de error más explícito para la "terminal"
      console.error('Error al actualizar Supabase:', JSON.stringify(error, null, 2));
      return NextResponse.json({ success: false, error: "Archivo subido a R2, pero no se pudo actualizar la base de datos." }, { status: 500 });
    }

    // 4. Devolvemos la nueva URL y path para que el cliente actualice el estado visual
    return NextResponse.json({ success: true, path, signedUrl: publicUrl });

  } catch (err: any) {
    console.error('❌ Error general en la API Route:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// --- LÓGICA DELETE (NUEVA) ---
// Añadimos la lógica para manejar eliminaciones de archivos, que también necesita ser una API route
export async function DELETE(
    request: Request,
    { params }: { params: { modelId: string } }
) {
    try {
        const { modelId } = params;
        const body = await request.json();
        const { filePath, type, slotIndex } = body;

        if (!filePath || !type) {
            return NextResponse.json({ success: false, error: 'Faltan datos (filePath o type).' }, { status: 400 });
        }
        
        // Aquí podrías añadir lógica para eliminar el archivo de R2 si lo deseas, pero por ahora solo actualizamos la DB.
        // const deleteCommand = new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: filePath });
        // await r2.send(deleteCommand);
        
        let error;
        if (type === 'Portada') {
            const { error: updateError } = await supabaseAdmin.from('models').update({ cover_path: null }).eq('id', modelId);
            error = updateError;
        } else if (type === 'Portfolio') {
            const { error: updateError } = await supabaseAdmin.from('models').update({ portfolio_path: null }).eq('id', modelId);
            error = updateError;
        } else if (type === 'Contraportada' && slotIndex !== undefined) {
             const { data: currentModel, error: fetchError } = await supabaseAdmin.from('models').select('comp_card_paths').eq('id', modelId).single();
            if (fetchError) throw new Error('No se pudo obtener la galería actual del modelo para eliminar');
            
            const currentPaths = currentModel?.comp_card_paths || [];
            const index = parseInt(slotIndex, 10);
            if(index >= 0 && index < currentPaths.length) {
                currentPaths[index] = null;
            }

            const { error: updateError } = await supabaseAdmin.from('models').update({ comp_card_paths: currentPaths }).eq('id', modelId);
            error = updateError;
        }

        if (error) {
            console.error('❌ Error Supabase al eliminar:', error);
            return NextResponse.json({ success: false, error: "Error al eliminar la referencia en la base de datos." }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (err: any) {
        console.error('❌ Error general en DELETE:', err);
        return NextResponse.json({ success: false, error: err.message || 'Error interno del servidor' }, { status: 500 });
    }
}

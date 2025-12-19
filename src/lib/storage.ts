import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

/**
 * Sube una imagen a R2 manteniendo la estructura: ID_TALENTO / CARPETA / ARCHIVO
 */
export async function uploadImageToR2(file: File, talentId: string, category: 'Portada' | 'Portfolio' | 'General' = 'General') {
  const buffer = Buffer.from(await file.arrayBuffer());
  // Limpiamos el nombre del archivo para evitar espacios raros
  const cleanFileName = file.name.replace(/\s+/g, '-').toLowerCase();
  
  // AQUÍ ESTÁ LA MAGIA: Creamos la ruta igual que en tu Supabase
  // Ej: 00416e47.../Portada/17345678-foto.jpg
  const fullPath = `${talentId}/${category}/${Date.now()}-${cleanFileName}`;

  try {
    await r2.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fullPath,
      Body: buffer,
      ContentType: file.type,
    }));

    // Devolvemos la URL pública completa
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${fullPath}`;
    return publicUrl;
  } catch (error) {
    console.error("Error subiendo a R2:", error);
    throw new Error("No se pudo subir la imagen a la bodega nueva");
  }
}
"use server"; // <--- ESTO ES OBLIGATORIO para leer las claves

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function uploadImageToR2(formData: FormData) {
  // Extraemos los datos del paquete seguro (FormData)
  const file = formData.get("file") as File;
  const talentId = formData.get("talentId") as string;
  const category = formData.get("category") as string;
  const slotIndex = formData.get("slotIndex") as string | null;

  if (!file || !talentId || !category) {
    throw new Error("Faltan datos (file, talentId o category) para subir la imagen.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const cleanFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '').toLowerCase();

  // Estructura de Path: ID / Categoria / Archivo
  let fileName = `${Date.now()}-${cleanFileName}`;
  if (type === 'cover') {
    fileName = 'cover.webp'; // Nombre de archivo estandarizado
  } else if (type === 'portfolio') {
    fileName = 'portfolio.webp'; // Nombre de archivo estandarizado
  } else if (type === 'comp-card' && slotIndex) {
    fileName = `comp_${slotIndex}.webp`; // Nombre de archivo estandarizado
  }
  
  const fullPath = `${talentId}/${category}/${fileName}`;

  try {
    await r2.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fullPath,
      Body: buffer,
      ContentType: file.type,
      ACL: 'public-read', // ¡Importante! Hace el objeto públicamente legible
    }));

    // Devuelve la URL pública y el path
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${fullPath}`;
    return { publicUrl, path: fullPath };
    
  } catch (error) {
    console.error("Error en servidor R2:", error);
    throw new Error("Fallo la subida a R2");
  }
}

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

  if (!file || !talentId) {
    throw new Error("Faltan datos para subir la imagen");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const cleanFileName = file.name.replace(/\s+/g, '-').toLowerCase();
  
  // Estructura: ID / Categoria / Archivo
  const fullPath = `${talentId}/${category}/${Date.now()}-${cleanFileName}`;

  try {
    await r2.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fullPath,
      Body: buffer,
      ContentType: file.type,
    }));

    const publicUrl = `${process.env.R2_PUBLIC_URL}/${fullPath}`;
    return publicUrl;
  } catch (error) {
    console.error("Error en servidor R2:", error);
    throw new Error("Fallo la subida a R2");
  }
}
import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Configuration
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing environment variables in .env.local');
    process.exit(1);
}

const r2 = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
});

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const BASE_DIR = "C:\\Users\\Evo-minidesk\\Downloads\\Mujeres";
const DRY_RUN = process.argv.includes('--dry-run');
const CONCURRENCY = 3;

async function compressImage(inputPath) {
    // .rotate() without arguments auto-rotates based on EXIF
    return await sharp(inputPath)
        .rotate()
        .resize({ width: 3000, height: 3000, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();
}

async function deleteOldFiles(modelId, category, slotIndex = null) {
    if (DRY_RUN) return;
    const prefix = `${modelId}/${category}/`;
    const searchPrefix = (category === 'Contraportada' && slotIndex !== null)
        ? `${prefix}comp_${slotIndex}_`
        : prefix;

    try {
        const listCommand = new ListObjectsV2Command({
            Bucket: R2_BUCKET_NAME,
            Prefix: searchPrefix,
        });

        const listedObjects = await r2.send(listCommand);

        if (listedObjects.Contents && listedObjects.Contents.length > 0) {
            for (const obj of listedObjects.Contents) {
                if (obj.Key) {
                    await r2.send(new DeleteObjectCommand({
                        Bucket: R2_BUCKET_NAME,
                        Key: obj.Key,
                    }));
                }
            }
        }
    } catch (err) {
        console.warn(`Warning deleting old files for ${modelId}/${category}:`, err.message);
    }
}

async function uploadToR2(buffer, modelId, category, fileName) {
    const fullPath = `${modelId}/${category}/${fileName}`;
    if (DRY_RUN) return fullPath;

    await r2.send(new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: fullPath,
        Body: buffer,
        ContentType: 'image/webp',
        ACL: 'public-read',
    }));

    return fullPath;
}

async function processModel(modelName, modelId) {
    const modelPath = path.join(BASE_DIR, modelName);
    const fichaPath = path.join(modelPath, 'ficha');
    const portadaPath = path.join(fichaPath, 'portada');

    const results = {
        name: modelName,
        id: modelId,
        cover: null,
        compcards: [],
        portfolio: [],
        status: 'Success',
        reason: ''
    };

    try {
        // 1. Cover (Portada)
        if (fs.existsSync(portadaPath)) {
            const files = fs.readdirSync(portadaPath).filter(f => f.match(/\.(jpg|jpeg|png|webp)$/i));
            if (files.length > 0) {
                const timestamp = Date.now();
                const buffer = await compressImage(path.join(portadaPath, files[0]));
                await deleteOldFiles(modelId, 'Portada');
                const remotePath = await uploadToR2(buffer, modelId, 'Portada', `${timestamp}-cover.webp`);
                results.cover = remotePath;
            }
        }

        // 2. Comp Cards (Ficha)
        const fichaFiles = fs.existsSync(fichaPath)
            ? fs.readdirSync(fichaPath).filter(f => f.match(/\.(jpg|jpeg|png|webp)$/i)).slice(0, 3) // Only up to 3 photos
            : [];

        const compCardPaths = [null, null, null, null]; // Slots: 0, 1 (Reserved), 2, 3
        const targetSlots = [0, 2, 3]; // Mapping files to these slots

        for (let i = 0; i < fichaFiles.length; i++) {
            const slotIndex = targetSlots[i];
            const timestamp = Date.now() + i;
            const buffer = await compressImage(path.join(fichaPath, fichaFiles[i]));
            await deleteOldFiles(modelId, 'Contraportada', slotIndex);
            const remotePath = await uploadToR2(buffer, modelId, 'Contraportada', `comp_${slotIndex}_${timestamp}.webp`);
            compCardPaths[slotIndex] = remotePath;
        }
        results.compcards = compCardPaths;

        // 3. Portfolio Grid Logic
        const outsideFiles = fs.existsSync(modelPath)
            ? fs.readdirSync(modelPath).filter(f => {
                const full = path.join(modelPath, f);
                return fs.statSync(full).isFile() && f.match(/\.(jpg|jpeg|png|webp)$/i);
            })
            : [];

        if (outsideFiles.length > 0) {
            const portfolioPaths = [];
            for (let i = 0; i < outsideFiles.length; i++) {
                const timestamp = Date.now() + i + 20;
                const buffer = await compressImage(path.join(modelPath, outsideFiles[i]));
                if (i === 0) await deleteOldFiles(modelId, 'PortfolioGallery');
                const remotePath = await uploadToR2(buffer, modelId, 'PortfolioGallery', `${timestamp}-gallery.webp`);
                portfolioPaths.push(remotePath);
            }
            results.portfolio = portfolioPaths;
        } else if (fichaFiles.length > 0) {
            const portfolioPaths = [];
            for (let i = 0; i < fichaFiles.length; i++) {
                const timestamp = Date.now() + i + 10;
                const buffer = await compressImage(path.join(fichaPath, fichaFiles[i]));
                if (i === 0) await deleteOldFiles(modelId, 'PortfolioGallery');
                const remotePath = await uploadToR2(buffer, modelId, 'PortfolioGallery', `${timestamp}-gallery.webp`);
                portfolioPaths.push(remotePath);
            }
            results.portfolio = portfolioPaths;
        }

        // 4. Update Database
        if (!DRY_RUN) {
            const updateData = {};
            if (results.cover) updateData.cover_path = results.cover;
            if (results.compcards.length > 0) updateData.comp_card_paths = results.compcards;
            if (results.portfolio.length > 0) updateData.gallery_paths = results.portfolio;

            if (Object.keys(updateData).length > 0) {
                const { error } = await supabase.from('models').update(updateData).eq('id', modelId);
                if (error) throw error;
            }
        }

        console.log(`[DONE] ${modelName}`);
        return results;
    } catch (err) {
        console.error(`[ERROR] ${modelName}:`, err.message);
        results.status = 'Failed';
        results.reason = err.message;
        return results;
    }
}

async function main() {
    console.log(`Starting upload process. Dry run: ${DRY_RUN}, Concurrency: ${CONCURRENCY}`);
    try {
        if (!fs.existsSync(BASE_DIR)) throw new Error(`Base directory not found: ${BASE_DIR}`);
        const folders = fs.readdirSync(BASE_DIR).filter(f => fs.statSync(path.join(BASE_DIR, f)).isDirectory());

        const { data: allModels, error } = await supabase.from('models').select('id, full_name, alias');
        if (error) throw error;

        const report = [];
        const queue = [...folders];

        const workers = Array(CONCURRENCY).fill(0).map(async () => {
            while (queue.length > 0) {
                const folder = queue.shift();
                if (!folder) break;

                const model = allModels.find(m =>
                    (m.alias?.toLowerCase().trim() === folder.toLowerCase().trim()) ||
                    (m.full_name?.toLowerCase().trim() === folder.toLowerCase().trim())
                );

                if (!model) {
                    console.warn(`[WARN] No match for: ${folder}`);
                    report.push({ name: folder, status: 'Failed', reason: 'No matching model found in database' });
                    continue;
                }

                const result = await processModel(folder, model.id);
                report.push(result);
            }
        });

        await Promise.all(workers);
        generateHtmlReport(report);
    } catch (err) {
        console.error('Fatal error in main:', err.message);
        process.exit(1);
    }
}

function generateHtmlReport(report) {
    const successCount = report.filter(r => r.status === 'Success').length;
    const failCount = report.length - successCount;

    let rows = '';
    for (const r of report) {
        const info = r.reason || `Cover: ${r.cover ? 'Yes' : 'No'}, CompCards: ${r.compcards.length}, Portfolio: ${r.portfolio.length}`;
        const statusClass = r.status === 'Success' ? 'success' : 'failed';
        rows += `
            <tr>
                <td>${r.name}</td>
                <td>${r.id || 'N/A'}</td>
                <td class="${statusClass}">${r.status}</td>
                <td>${info}</td>
            </tr>`;
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Upload Report</title>
    <style>
        body { font-family: sans-serif; margin: 20px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .success { color: green; font-weight: bold; }
        .failed { color: red; font-weight: bold; }
    </style>
</head>
<body>
    <h1>Model Photo Upload Report</h1>
    <p>Total: ${report.length} | Success: ${successCount} | Failed: ${failCount}</p>
    <table>
        <thead>
            <tr>
                <th>Model Name</th>
                <th>ID</th>
                <th>Status</th>
                <th>Reason / Info</th>
            </tr>
        </thead>
        <tbody>
            ${rows}
        </tbody>
    </table>
</body>
</html>`;

    fs.writeFileSync('upload-report.html', html);
    console.log('Report generated: upload-report.html');
}

main();

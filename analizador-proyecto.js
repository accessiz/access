/**
 * Analizador de Proyectos Next.js - Versión Mejorada
 *
 * Este script analiza un proyecto Next.js para identificar archivos y dependencias
 * que podrían no estar en uso.
 *
 * Mejoras clave:
 * - Uso de operaciones asíncronas (fs.promises) para mayor rendimiento.
 * - Análisis de imports mediante un parser AST (es-module-lexer) para más precisión.
 * - Lógica mejorada para detectar archivos no utilizados (compatible con /src).
 * - Manejo de errores más robusto.
 * - Generación de informes en formato .txt y .html.
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { init, parse } from 'es-module-lexer';
import { createRequire } from 'module';

// Crea una función 'require' compatible con ES Modules para poder usar 'require.resolve'
const require = createRequire(import.meta.url);

// === CONFIGURACIÓN ===

const projectRoot = process.cwd(); // Directorio actual donde se ejecuta el script
const escritorio = path.join(os.homedir(), 'Desktop');
const outputTxtFile = path.join(escritorio, 'informe_proyecto_analisis.txt');
const outputHtmlFile = path.join(escritorio, 'informe_proyecto_analisis.html');

// Extensiones de archivo a analizar
const extensionesCodigo = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'];
// Carpetas a ignorar durante el escaneo
const ignorarCarpetas = ['node_modules', '.next', 'public', 'out', 'dist', '.git', 'coverage'];
// Puntos de entrada principales de una app Next.js (archivos que siempre se consideran "usados")
const entryPoints = [
    'next.config.js',
    'middleware.js',
    'middleware.ts',
    'instrumentation.js',
    'instrumentation.ts'
];


// === FUNCIONES AUXILIARES ===

/**
 * Recorre un directorio recursivamente para encontrar todos los archivos que coincidan
 * con las extensiones de código configuradas, ignorando las carpetas especificadas.
 * @param {string} dir - El directorio a escanear.
 * @returns {Promise<string[]>} - Una promesa que resuelve a una lista de rutas de archivo.
 */
async function obtenerArchivos(dir) {
    let resultados = [];
    try {
        const elementos = await fs.readdir(dir, { withFileTypes: true });

        for (const elemento of elementos) {
            const rutaCompleta = path.join(dir, elemento.name);
            if (elemento.isDirectory()) {
                if (!ignorarCarpetas.includes(elemento.name)) {
                    resultados = resultados.concat(await obtenerArchivos(rutaCompleta));
                }
            } else if (extensionesCodigo.includes(path.extname(elemento.name))) {
                resultados.push(rutaCompleta);
            }
        }
    } catch (error) {
        console.error(`❌ Error al leer el directorio ${dir}:`, error.message);
    }
    return resultados;
}

/**
 * Extrae todas las declaraciones de import de un contenido de archivo usando un parser AST.
 * @param {string} content - El contenido del archivo.
 * @returns {Promise<string[]>} - Una promesa que resuelve a un array de especificadores de import.
 */
async function extraerImports(content) {
    try {
        const [imports] = await parse(content);
        return imports.map(imp => imp.n).filter(Boolean); // imp.n es el especificador del módulo
    } catch (error) {
        // Ignora errores de parseo en archivos que podrían no ser módulos JS estándar
        return [];
    }
}

/**
 * Lee el package.json y devuelve una lista de todas las dependencias.
 * @returns {Promise<string[]>} - Una promesa que resuelve a la lista de dependencias.
 */
async function obtenerDependencias() {
    const pkgPath = path.join(projectRoot, 'package.json');
    try {
        const pkgContent = await fs.readFile(pkgPath, 'utf-8');
        const pkg = JSON.parse(pkgContent);
        return Object.keys({
            ...(pkg.dependencies || {}),
            ...(pkg.devDependencies || {}),
        });
    } catch (error) {
        console.error('❌ Error al leer o parsear package.json. Asegúrate de que el archivo exista y sea válido.', error.message);
        return [];
    }
}


// === LÓGICA PRINCIPAL DE ANÁLISIS ===

/**
 * Orquesta el análisis completo del proyecto.
 * @returns {Promise<object>} - Una promesa que resuelve a un objeto con los resultados del análisis.
 */
async function analizarProyecto() {
    console.log('🚀 Iniciando análisis del proyecto...');
    await init; // Inicializa el parser de imports (es-module-lexer)

    const todosLosArchivos = await obtenerArchivos(projectRoot);
    console.log(`🔍 Encontrados ${todosLosArchivos.length} archivos para analizar.`);

    const dependenciasPkg = await obtenerDependencias();
    const todosLosImports = new Set();
    const archivosImportados = new Set();

    for (const archivo of todosLosArchivos) {
        const contenido = await fs.readFile(archivo, 'utf-8');
        const imports = await extraerImports(contenido);

        for (const imp of imports) {
            todosLosImports.add(imp);
            // Si es un import relativo, resuelve la ruta absoluta para marcar el archivo como "usado"
            if (imp.startsWith('.') || imp.startsWith('/')) {
                try {
                    const resolvedPath = require.resolve(path.resolve(path.dirname(archivo), imp));
                    archivosImportados.add(resolvedPath);
                } catch (e) {
                    // Intenta resolver con extensiones comunes si falla
                    let resolved = false;
                    for (const ext of extensionesCodigo) {
                        try {
                            const resolvedPathWithExt = require.resolve(path.resolve(path.dirname(archivo), imp + ext));
                            archivosImportados.add(resolvedPathWithExt);
                            resolved = true;
                            break;
                        } catch (e2) { /* continue */ }
                    }
                    if (!resolved) {
                       // console.warn(`⚠️ No se pudo resolver el import: ${imp} en ${archivo}`);
                    }
                }
            }
        }
    }
    
    // Lógica para identificar archivos no utilizados
    const archivosSinUso = todosLosArchivos.filter(archivo => {
        const relativo = path.relative(projectRoot, archivo).replace(/\\/g, '/');
        // Un archivo no se usa si no es importado Y no es un punto de entrada conocido (página, layout, etc.)
        // CORRECCIÓN: Usamos .includes() para que funcione con la carpeta 'src/'
        return !archivosImportados.has(archivo) &&
               !relativo.includes('pages/') &&
               !relativo.includes('app/') &&
               !entryPoints.includes(path.basename(archivo));
    });

    // Lógica para identificar dependencias no utilizadas
    const dependenciasUsadas = new Set();
    [...todosLosImports].forEach(imp => {
        const depMatch = dependenciasPkg.find(dep => imp === dep || imp.startsWith(`${dep}/`));
        if (depMatch) {
            dependenciasUsadas.add(depMatch);
        }
    });

    const dependenciasNoUsadas = dependenciasPkg.filter(dep => !dependenciasUsadas.has(dep));

    console.log('✅ Análisis completado.');
    return {
        archivosTotales: todosLosArchivos,
        archivosSinUso,
        dependenciasNoUsadas,
        dependenciasUsadas: Array.from(dependenciasUsadas).sort(),
    };
}


// === GENERACIÓN DE REPORTES ===

/**
 * Genera un informe en formato de texto plano (.txt).
 * @param {object} datos - Los datos del análisis.
 */
async function generarReporteTxt(datos) {
    const fecha = new Date().toLocaleString('es-GT', { timeZone: 'America/Guatemala' });
    const lines = [
        '==================================================',
        ' INFORME DE ANÁLISIS DE PROYECTO',
        '==================================================',
        `📅 Fecha de generación: ${fecha}`,
        `📁 Archivos totales analizados: ${datos.archivosTotales.length}`,
        `📦 Dependencias totales en package.json: ${datos.dependenciasUsadas.length + datos.dependenciasNoUsadas.length}`,
        '',
        '--------------------------------------------------',
        '🗃️ Archivos que POSIBLEMENTE NO ESTÁN EN USO',
        '--------------------------------------------------',
    ];

    if (datos.archivosSinUso.length === 0) {
        lines.push('✔️ ¡Excelente! Todos los archivos de código parecen estar referenciados.');
    } else {
        lines.push(`Se encontraron ${datos.archivosSinUso.length} archivos que no parecen ser importados desde otro lugar.`);
        lines.push('Revisa si son puntos de entrada, parte del build, o si realmente pueden ser eliminados:');
        datos.archivosSinUso.forEach(a => lines.push(`  - ${path.relative(projectRoot, a)}`));
    }
    lines.push('');

    lines.push('--------------------------------------------------');
    lines.push('📦 Dependencias que POSIBLEMENTE NO ESTÁN EN USO');
    lines.push('--------------------------------------------------');

    if (datos.dependenciasNoUsadas.length === 0) {
        lines.push('✔️ ¡Genial! Todas las dependencias del package.json parecen ser utilizadas en el código.');
    } else {
        lines.push(`Se encontraron ${datos.dependenciasNoUsadas.length} dependencias que no fueron importadas en el código.`);
        lines.push('Considera eliminarlas si no son necesarias para el build o scripts:');
        datos.dependenciasNoUsadas.forEach(d => lines.push(`  - ${d}`));
    }
    lines.push('');

    lines.push('--------------------------------------------------');
    lines.push('✅ Dependencias Utilizadas');
    lines.push('--------------------------------------------------');
    datos.dependenciasUsadas.forEach(d => lines.push(`  - ${d}`));

    await fs.writeFile(outputTxtFile, lines.join('\n'), 'utf-8');
    console.log(`📄 Informe en texto generado en: ${outputTxtFile}`);
}

/**
 * Genera un informe visual en formato HTML.
 * @param {object} datos - Los datos del análisis.
 */
async function generarReporteHtml(datos) {
    const fecha = new Date().toLocaleString('es-GT', { timeZone: 'America/Guatemala' });
    const toLi = items => items.map(item => `<li><code>${item}</code></li>`).join('');

    const html = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Informe de Análisis de Proyecto</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 960px; margin: 20px auto; background-color: #f9f9f9; }
                .container { background: #fff; padding: 25px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
                h1, h2 { border-bottom: 2px solid #eee; padding-bottom: 10px; color: #1a1a1a; }
                h1 { font-size: 2em; }
                h2 { font-size: 1.5em; margin-top: 30px; }
                ul { list-style-type: none; padding-left: 0; }
                li { background: #f0f0f0; margin-bottom: 8px; padding: 12px; border-radius: 5px; font-size: 0.95em; word-break: break-all; }
                li code { font-family: "SF Mono", "Fira Code", "Fira Mono", "Roboto Mono", monospace; }
                .success { color: #28a745; }
                .warning { color: #ffc107; }
                .header { text-align: center; }
                .summary p { font-size: 1.1em; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📊 Informe de Análisis de Proyecto</h1>
                    <p><strong>Fecha:</strong> ${fecha}</p>
                </div>

                <div class="summary">
                    <h2>Resumen General</h2>
                    <p><strong>Archivos analizados:</strong> ${datos.archivosTotales.length}</p>
                    <p><strong>Dependencias encontradas:</strong> ${datos.dependenciasUsadas.length + datos.dependenciasNoUsadas.length}</p>
                </div>

                <h2><span class="warning">🗃️</span> Archivos Posiblemente no Usados (${datos.archivosSinUso.length})</h2>
                ${datos.archivosSinUso.length === 0 ? '<p class="success">✔️ Todos los archivos parecen estar en uso.</p>' : `<ul>${toLi(datos.archivosSinUso.map(a => path.relative(projectRoot, a)))}</ul>`}

                <h2><span class="warning">📦</span> Dependencias Posiblemente no Usadas (${datos.dependenciasNoUsadas.length})</h2>
                ${datos.dependenciasNoUsadas.length === 0 ? '<p class="success">✔️ Todas las dependencias parecen estar en uso.</p>' : `<ul>${toLi(datos.dependenciasNoUsadas)}</ul>`}

                <h2><span class="success">✅</span> Dependencias Utilizadas (${datos.dependenciasUsadas.length})</h2>
                <ul>${toLi(datos.dependenciasUsadas)}</ul>
            </div>
        </body>
        </html>
    `;
    await fs.writeFile(outputHtmlFile, html, 'utf-8');
    console.log(`📊 Informe HTML generado en: ${outputHtmlFile}`);
}

// === EJECUCIÓN ===

async function main() {
    try {
        const datos = await analizarProyecto();
        await generarReporteTxt(datos);
        await generarReporteHtml(datos);
    } catch (error) {
        console.error('☠️ Ocurrió un error fatal durante la ejecución:', error);
    }
}

main();



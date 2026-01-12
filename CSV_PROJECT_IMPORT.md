# CSV Project Import

## Overview
Crear proyectos importando CSV de encuestas de WhatsApp (plugin Export).

## CSV Structure (WhatsApp Poll Export)
```csv
Name, Phone Number, Option1, Option2, ..., Total
"Modelo", "", "✓", "", ..., "2"
```
> ⚠️ **Nota:** El CSV NO incluye teléfonos, solo nombres de contacto.

## Complexity: 🟡 Medium (3-4 días)

## Model Matching Strategy

El CSV usa el **nombre del contacto en WhatsApp**, no el teléfono.

| Prioridad | Campo DB | Descripción |
|-----------|----------|-------------|
| 1️⃣ | `alias` | Match exacto con nombre en CSV |
| 2️⃣ | `full_name` | Fallback si no hay alias match |
| 3️⃣ | Fuzzy | Sugerir modelos similares ("Gaby" → "Gabriela") |

### Requerimiento para usuarios:
Los modelos deben tener `alias` = nombre como aparece en WhatsApp.

## Proposed Flow
1. **Upload CSV** → Parsear con Papaparse
2. **Preview** → Mostrar tabla con modelos y fechas detectadas
3. **Match Models** → Buscar por `alias` → `full_name` → fuzzy
4. **Review Unmatched** → Usuario resuelve: crear nuevo o ignorar
5. **Create Project** → Generar proyecto con schedule + assignments

## Required Changes

### Backend
- [ ] `parseWhatsAppPollCSV(file)` - Extrae encabezados, fechas, respuestas
- [ ] `matchModelsFromCSV(names[])` - Match por alias → full_name → fuzzy
- [ ] `createProjectFromCSV(data)` - Server action para crear todo

### Frontend  
- [ ] `CSVImportDialog` - Modal con dropzone + preview
- [ ] `CSVPreviewTable` - Tabla con matches encontrados
- [ ] `UnmatchedModelRow` - UI para resolver no-matches
- [ ] Botón "Importar desde WhatsApp" en `/dashboard/projects`

## Edge Cases
- ❌ Modelo no encontrado → Mostrar opciones: [Crear] [Ignorar] [Buscar manual]
- ✓ vs otros símbolos → Regex flexible para detectar "votó"
- Nombres duplicados → Mostrar selector si hay múltiples matches

## Dependencies
- `papaparse` (ya instalado ✓)

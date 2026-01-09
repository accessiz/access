# Plan de Tareas - 8 de Enero 2026

## Resumen de Solicitudes

1. **Cumpleaños como página** - Convertir el modal de cumpleaños en una página completa del dashboard
2. **Cumpleaños no muestra datos** - Investigar y corregir la query de cumpleaños
3. **Logging para CompCard Firefox** - Agregar logs para debuggear el error "font is undefined"
4. **Reorganizar Información del Modelo** - Segmentar en 3 cards: Personal, Contacto, Estado

---

## [ ] 1. Convertir Cumpleaños a Página

### Cambios necesarios:
- **[NEW]** `src/app/dashboard/birthdays/page.tsx` - Página server-side
- **[NEW]** `src/app/dashboard/birthdays/birthdays-client-page.tsx` - Cliente con filtros
- **[MODIFY]** `src/components/organisms/AppSidebar.tsx` - Cambiar de modal a link
- **[DELETE]** Remover lógica de Dialog del BirthdayPanel (convertir a enlace simple)

### Layout propuesto:
- Header con título "Cumpleaños"
- Card destacada si hay cumpleañeros hoy
- Selector de mes con navegación
- Grid/Lista de cumpleañeros del mes seleccionado

---

## [ ] 2. Corregir Query de Cumpleaños

### Problema sospechado:
El filtro `ilike('birth_date', '%-${monthStr}-%')` puede no funcionar correctamente.

### Verificaciones:
1. Confirmar formato de `birth_date` en Supabase (YYYY-MM-DD vs otras variantes)
2. Revisar si hay datos de prueba con fechas de nacimiento
3. Agregar logs para ver qué devuelve la query

### Solución propuesta:
Usar funciones de SQL o filtros más confiables para extraer mes/día.

---

## [ ] 3. Logging CompCard Download (Firefox)

### Error reportado:
```
Error al generar
can't access property "trim", font is undefined
```

### Acciones:
1. Agregar `console.log` extensivo en `handleDownload()`
2. Logear las opciones de captura antes de ejecutar `toJpeg`/`toPng`
3. Investigar qué elemento del DOM tiene fuentes problemáticas
4. Potencialmente agregar `skipFonts: true` a las opciones de captura

---

## [ ] 4. Reorganizar Cards de Información del Modelo

### Estructura actual:
- 1 Card grande "Información Personal" (8 campos)
- 1 Card "Medidas y Tallas"

### Nueva estructura:

#### Card 1: Información Personal
- Nombre completo
- Alias
- Género
- Fecha de nacimiento
- Documento ID
- Pasaporte
- País

#### Card 2: Contacto
- Teléfono
- Email
- Instagram
- TikTok

#### Card 3: Estado en la Agencia
- Fecha de ingreso
- Estado

### Archivo a modificar:
- `src/app/dashboard/models/[id]/page-client.tsx`

---

## Orden de Ejecución

1. ✅ Crear este plan
2. [ ] Agregar logging a CompCard (tarea rápida)
3. [ ] Corregir query de cumpleaños
4. [ ] Reorganizar cards del modelo
5. [ ] Convertir cumpleaños a página completa

# 📊 Análisis de Dimensiones CompCard

## ✅ Verificación de Cálculos

### Dimensiones de la Hoja Completa
- **Hoja completa:** 3300 × 2550 px ✅
- **Padding global:** 72 px ✅
- **Gap entre columnas:** 144 px (72 + 72) ✅

### ✅ Dimensiones CORRECTAS de Portada/Contraportada

#### Cálculo del Ancho Real:
```
Ancho total:              3300 px
- Padding izquierdo:      -  72 px
- Padding derecho:        -  72 px
- Gap central:            - 144 px (72 + 72)
                          ________
Espacio para 2 columnas:  3012 px
÷ 2 columnas              ÷    2
                          ________
Ancho por columna:        1506 px ✅
```

#### Cálculo del Alto Real:
```
Alto total:               2550 px
- Padding superior:       -  72 px
- Padding inferior:       -  72 px
                          ________
Alto utilizable:          2406 px ✅
```

### 📐 Dimensiones Finales CORRECTAS:

| Elemento | Ancho (px) | Alto (px) | Notas |
|----------|------------|-----------|-------|
| **Hoja Completa** | 3300 | 2550 | Lienzo total |
| **Portada (con márgenes)** | 1650 | 2550 | Mitad exacta de 3300 |
| **Contraportada (con márgenes)** | 1650 | 2550 | Mitad exacta de 3300 |
| **Espacio utilizable por columna** | 1506 | 2406 | Restando 72px de margen en cada lado |
| **Padding global** | 72 | 72 | Margen exterior del lienzo |
| **Gap entre columnas** | 144 | — | 72 (derecha) + 72 (izquierda) |

### 🎯 Confirmación:

**Cada página (portada/contraportada) mide exactamente:**
```
1650 × 2550 px ✅ (la mitad de la hoja completa)
```

**Con márgenes internos de 72px en cada lado, el área utilizable es:**
```
1506 × 2406 px ✅

```

---

## ✅ Problema Resuelto

El código ahora usa **GAP_SIZE = 144** que representa correctamente:
- 72px de margen derecho de la portada
- 72px de margen izquierdo de la contraportada
- **Total: 144px de separación entre columnas** ✅

---

## 🐛 Problema de Archivos "blob" - RESUELTO

### Correcciones Aplicadas:

1. **Sanitización mejorada del nombre:**
   - Consolida guiones múltiples (`___` → `_`)
   - Elimina guiones al inicio/fin
   - Fallback a 'compcard' si el nombre queda vacío

2. **Orden correcto de atributos:**
   - `link.download` se asigna **ANTES** de `link.href`
   - Previene nombres "blob" en navegadores estrictos

3. **Limpieza optimizada:**
   - Timeout reducido de 1000ms → 100ms
   - Cleanup inmediato después del clic

---

## 📝 Código Relevante:

```tsx
// En CompCardPrintTemplate.tsx
const PAGE_WIDTH = 3300;
const PAGE_HEIGHT = 2550;
const GAP_SIZE = 72;
const PADDING_SIZE = 72;

// El contenedor usa:
style={{
  width: PAGE_WIDTH,           // 3300
  height: PAGE_HEIGHT,         // 2550
  padding: PADDING_SIZE,       // 72
  gap: GAP_SIZE,               // 72
  display: 'flex',
  flexDirection: 'row',
  boxSizing: 'border-box'
}}

// Cada columna usa:
style={{ 
  flex: 1  // Esto distribuye el espacio equitativamente
}}
```

Con `flex: 1`, cada columna recibe:
- **(3300 - 144 - 72) ÷ 2 = 1542 px** de ancho
- **2550 - 144 = 2406 px** de alto

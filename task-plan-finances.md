# 📊 Task Plan: Módulo de Finanzas + Mejoras UX

> **Filosofía de diseño**: Basado en principios de **Don Norman** (diseño centrado en el usuario, visibilidad, feedback) y **Steve Jobs** (simplicidad radical, eliminar lo innecesario, "it just works").

---

## 👤 Contexto del Usuario (CRÍTICO)

> **La dueña de esta app es una madre soltera con 2 niños pequeños y 2 trabajos. Este es su trabajo secundario.**

### Implicaciones de diseño:
- ⏱️ **Tiempo = Lujo**: Cada click cuenta. Zero fricción.
- 📱 **Mobile-first**: Probablemente gestiona desde el teléfono mientras espera a los niños.
- 🧠 **Carga cognitiva mínima**: No puede recordar flujos complejos.
- ✅ **Defaults inteligentes**: Todo debe funcionar con el mínimo esfuerzo.

### Realidad del negocio:
- 🚫 **Los clientes NO usan la plataforma** para aprobar modelos
- 💬 **Los clientes escriben por privado** diciendo "quiero este y este modelo"
- 📋 **Ella debe registrar manualmente** las decisiones del cliente

---

## 🎯 NUEVOS Objetivos (Actualizado 8 Ene 2026)

### Problema 1: Proyectos que nunca se "terminan"
> El cliente selecciona 1 modelo pero nunca da "terminar calificación". ¿Qué pasa?

**Solución propuesta (Don Norman - Affordance + Feedback)**:
1. ❌ NO auto-rechazar después de la fecha - puede confundir
2. ✅ **Mostrar un banner de alerta** en proyectos vencidos sin finalizar
3. ✅ **Un botón prominente**: "Finalizar Selección Ahora"
4. ✅ **Defaults inteligentes**: Los no-aprobados = rechazados automáticamente al finalizar

### Problema 2: Necesita poder cambiar aprobaciones después
> Aunque el proyecto haya terminado, debe poder corregir aprobaciones.

**Solución (Steve Jobs - "It just works")**:
- ✅ **Siempre editable**: El estado approved/rejected debe poder cambiarse
- ✅ **Sin confirmaciones molestas**: Toggle simple, cambio inmediato
- ✅ **Historial implícito**: updated_at ya registra cuándo se cambió

### Problema 3: El cliente no entra a ver perfiles
> En el grid de modelos, ¿añadir botones de aprobar/rechazar directamente?

**Solución (Don Norman - Visibilidad + Mínima interacción)**:
```
┌─────────────────────────────────────────────────────────────────┐
│ Grid de Modelos del Proyecto                                    │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐              │
│ │  Foto   │  │  Foto   │  │  Foto   │  │  Foto   │              │
│ │ María   │  │ Carlos  │  │ Ana     │  │ Luis    │              │
│ ├─────────┤  ├─────────┤  ├─────────┤  ├─────────┤              │
│ │ [✓] [✗] │  │ [✓] [✗] │  │ [✓] [✗] │  │ [✓] [✗] │              │
│ └─────────┘  └─────────┘  └─────────┘  └─────────┘              │
│                                                                 │
│ Seleccionados: 2/4          [Finalizar Selección]              │
└─────────────────────────────────────────────────────────────────┘
```

**Características**:
- ✅ **Botones visibles** en cada card del modelo
- ✅ **Toggle visual**: Verde = aprobado, Rojo = rechazado, Gris = sin decidir
- ✅ **Contador**: "Seleccionados: X/Y"
- ✅ **Sin necesidad de entrar al perfil**

---

## 📐 Principios de Diseño Aplicados

### Don Norman
- **Visibilidad**: Los números importantes deben ser visibles de un vistazo
- **Feedback**: Indicadores claros de estado (pagado, pendiente, vencido)
- **Affordance**: Botones de descarga obvios, filtros intuitivos
- **Mapeo Natural**: Flujo lógico: Proyecto → Cobro Cliente → Pago Modelos

### Steve Jobs
- **Simplicidad**: Una sola pantalla de finanzas, no múltiples módulos
- **Defaults Inteligentes**: IVA 12% por defecto (Guatemala), moneda GTQ
- **Eliminar Fricción**: Auto-cálculos, sin campos innecesarios
- **Elegancia**: Diseño limpio, KPIs prominentes

---

## ✅ Checklist de Implementación

### 🔴 PRIORIDAD ALTA: UX de Modelos en Proyectos

#### Grid de Modelos con Aprobación Rápida
- [ ] Agregar botones ✓/✗ visibles en cada card de modelo
- [ ] Mostrar estado visual (verde/rojo/gris) en la card
- [ ] Contador de seleccionados visible
- [ ] Botón "Finalizar Selección" prominente

#### Proyectos Vencidos
- [ ] Banner de alerta para proyectos pasados sin finalizar
- [ ] Acción rápida: "Finalizar ahora"
- [ ] Al finalizar: no-decididos → rechazados automáticamente

#### Edición Post-Finalización
- [ ] Permitir cambiar approved/rejected en cualquier momento
- [ ] Toggle simple sin confirmación excesiva
- [ ] Feedback visual inmediato

### 🟡 PRIORIDAD MEDIA: Finanzas (Ya implementado parcialmente)

#### Base de Datos ✅
- [x] Crear migración para nuevos campos en `projects`
- [x] Actualizar tipos TypeScript

#### Formulario de Proyecto ✅
- [x] Agregar schema Zod para campos de facturación
- [x] Agregar sección de facturación al formulario
- [x] Implementar cálculo de total con impuesto

#### Página de Finanzas ✅
- [x] Rediseñar con tabs (Modelos, Clientes)
- [x] Implementar tab de Cobros a Clientes
- [x] KPIs actualizados

#### Exportación Excel ✅
- [x] Instalar dependencia (`xlsx`)
- [x] Crear API routes para exportación
- [x] Botón de descarga en UI

---

## 🚀 Próximos Pasos Recomendados

1. **Primero**: Implementar botones de aprobación rápida en grid de modelos
2. **Segundo**: Agregar banner y acciones para proyectos vencidos
3. **Tercero**: Permitir edición de estados post-finalización
4. **Cuarto**: Polish y testing

---

## 📝 Notas de Diseño para Madre Ocupada

### Lo que DEBE ser (Steve Jobs approach)
- 🎯 **1 tap para aprobar**: Sin modales de confirmación
- 📱 **Funciona en móvil**: Botones grandes, touch-friendly
- 👁️ **Estado visible**: Color coding obvio
- ⚡ **Respuesta instantánea**: No waiting spinners largos
- 🔄 **Undo fácil**: Otro tap para cambiar de opinión

### Lo que NO debemos hacer
- ❌ Confirmaciones dobles ("¿Estás segura?")
- ❌ Flujos de múltiples pasos
- ❌ Modales que bloquean
- ❌ Esperas largas
- ❌ Mensajes de error crípticos

---

*Creado: 8 de Enero 2026*
*Última actualización: 8 de Enero 2026*

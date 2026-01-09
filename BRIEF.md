# NYXA ACCESS — Project Brief

> Sistema de gestión para agencias de modelaje diseñado para **María**: madre soltera con 2 hijos, 2 trabajos, y un jefe desorganizado. Cada decisión de diseño debe reducir su carga cognitiva.

## 🎯 Principios de Diseño (Jobs + Norman)

| Principio | Aplicación |
|-----------|------------|
| **"La tecnología debe ser invisible"** (Jobs) | María no debería pensar en CÓMO usar la app |
| **"Reconocimiento sobre recuerdo"** (Norman) | Todo lo importante debe ser visible sin buscar |
| **"El sistema debe anticipar"** (Norman) | Alertas proactivas, no retroactivas |
| **Reducir decisiones** | Una acción obvia, no múltiples opciones |

---

## 📊 Módulos del Sistema

### 1. Dashboard (`/dashboard`)
**Propósito**: Vista rápida del estado general.

| Componente | Función |
|------------|---------|
| Resumen de Proyectos | Conteos por estado (draft, sent, in-review, completed) |
| Acciones Rápidas | +Talento, +Proyecto, Búsqueda |
| Actividad Reciente | Últimos movimientos del día |
| Perfiles Incompletos | Talentos que necesitan atención |

---

### 2. Talento (`/dashboard/models`)
**Propósito**: Gestión de modelos/talentas.

| Feature | Descripción |
|---------|-------------|
| Lista de modelos | Tabla con foto, alias, estado, % completitud |
| Detalle de modelo | Información completa, portfolio, métricas |
| **Tab "Trabajos"** | Proyectos asignados al modelo → KPI de proyectos completados |
| Crear modelo | Formulario paso a paso |

**Campos principales**:
- Datos personales (nombre, alias, fecha nacimiento, género)
- Medidas (altura, busto, cintura, cadera, calzado)
- Portfolio (fotos en R2 storage)
- Disponibilidad y tarifas

---

### 3. Proyectos (`/dashboard/projects`)
**Propósito**: Gestión de trabajos/producciones.

| Feature | Descripción |
|---------|-------------|
| Lista de proyectos | Tabla con nombre, cliente, estado, fecha |
| Filtros | Por estado, año, mes |
| Búsqueda | Por nombre o cliente |
| Detalle | Info completa + modelos asignados |

**Estados de proyecto**:
- `draft` → En borrador
- `sent` → Enviado al cliente
- `in-review` → En revisión
- `completed` → Completado
- `archived` → Archivado

**Campos principales**:
- `project_name`, `client_name`
- `total_budget` → Lo que se cobra al cliente
- `status`, `project_types[]`
- `schedule[]` → Fechas de producción con horarios
- Modelos asignados (con `agreed_fee` individual)

---

### 4. Clientes (`/dashboard/clients`)
**Propósito**: Directorio de clientes y marcas.

| Feature | Descripción |
|---------|-------------|
| Lista de clientes | Nombre, contacto, # proyectos |
| Detalle | Info + marcas asociadas + historial |
| Marcas | Cada cliente puede tener múltiples marcas |

---

### 5. Finanzas (`/dashboard/finances`)
**Propósito**: Vista financiera de proyectos (separada de proyectos para enfoque).

| Feature | Descripción |
|---------|-------------|
| Ingresos | Por proyecto, por período |
| Costos | Fees de modelos |
| Márgenes | Rentabilidad por proyecto |

---

### 6. Cumpleaños (`/dashboard/birthdays`)
**Propósito**: Recordatorio de cumpleaños de talentos.

| Feature | Descripción |
|---------|-------------|
| Hoy | Talentas que cumplen hoy (con indicador en sidebar) |
| Esta semana | Próximos cumpleaños |
| Acciones | Enviar felicitación, ver perfil |

---

### 7. Configuración (`/dashboard/settings`)
**Propósito**: Ajustes de cuenta y preferencias.

---

## 🗄️ Estructura de Datos (Supabase)

```
models
├── id, alias, first_name, last_name
├── birth_date, gender, nationality
├── height, bust, waist, hips, shoe_size
├── cover_path, portfolio_path (R2)
└── profile_completeness (calculado)

projects
├── id, public_id, project_name
├── client_name, client_id (FK)
├── total_budget, status
├── project_types[] (runway, editorial, etc.)
└── user_id

project_schedule
├── id, project_id (FK)
├── start_time, end_time
└── (múltiples fechas por proyecto)

projects_models (junction)
├── project_id, model_id
├── client_selection (pending/approved/rejected)
├── agreed_fee, fee_type, currency
└── notes

clients
├── id, name, contact_name, email
└── billing fields

brands
├── id, name, client_id (FK)
└── logo, description
```

---

## 🎨 Stack Técnico

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 15 (App Router) |
| UI | React 19, Tailwind CSS, shadcn/ui |
| Auth | Supabase Auth |
| Database | Supabase PostgreSQL |
| Storage | Cloudflare R2 (imágenes/portfolio) |
| Hosting | Vercel |

---

## 📐 Design System

- **Tipografía**: Golden Ratio (12px / 16px / 25.89px)
- **Colores**: Dark mode by default
- **Componentes**: Badge con variantes semánticas (success, warning, info, accent, neutral)
- **Sidebar**: Collapsible con tooltips

---

## 🚧 Pendientes / Roadmap

- [ ] Calendario visual de producciones
- [ ] Columna de modelos asignados en lista de proyectos
- [ ] Vista financiera mejorada en proyectos (margen rápido)
- [ ] Notificaciones push
- [ ] Exportación de reports

---

*Última actualización: 2026-01-08*

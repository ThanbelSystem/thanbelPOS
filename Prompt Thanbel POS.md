## 1. ROL Y OBJETIVO

Actúa como un equipo de desarrollo full-stack senior. Tu objetivo es construir un sistema de Punto de Venta y gestión empresarial llamado **"ThanBel POS — Gestión Inteligente"**, orientado a pequeños negocios (contexto de arepera / producción de alimentos). El sistema debe ser completo, funcional, profesional y con estética premium.

---

## 2. STACK TECNOLÓGICO

- **Framework**: Next.js 13.5+ (App Router) con React 18 y TypeScript estricto (`strict: true`).
- **Estilos**: Tailwind CSS 3.3+ con variables CSS HSL, plugin `tailwindcss-animate`.
- **UI**: Convenciones de shadcn/ui (Radix UI), `lucide-react` para íconos.
- **Gráficos**: `recharts`.
- **Notificaciones**: `sonner` (toasts).
- **PDF**: `jsPDF` + `jspdf-autotable`.
- **Base de datos**: Supabase (PostgreSQL) con cliente JS v2, `persistSession: false`, `autoRefreshToken: false`.
- **Auth**: Autenticación personalizada con cookie de sesión (NO Supabase Auth). Hash SHA-256 para contraseñas. Cookie `tabel_session` httpOnly, sameSite lax, maxAge 12 horas.
- **Fuentes**: Inter vía `next/font/google`, con `rlig` y `calt` habilitados, `antialiased`.
- **Despliegue**: Netlify con `@netlify/plugin-nextjs`, `images.unoptimized: true`, `eslint.ignoreDuringBuilds: true`.
- **Alias**: `@/*` apuntando a la raíz del proyecto (`tsconfig.json`).

---

## 3. SISTEMA DE DISEÑO (ESTÉTICA)

### 3.1 Paleta de colores (variables CSS HSL en `globals.css`)

Usar variables HSL con la función `hsl(var(--token))`. Valores exactos:

| Token | HSL | Hex aprox. | Uso |
|---|---|---|---|
| `--background` | `210 40% 98%` | `#F8FAFC` | Fondo de página |
| `--foreground` | `215 28% 17%` | `#1E293B` | Texto primario |
| `--card` | `0 0% 100%` | `#FFFFFF` | Fondos de tarjeta |
| `--primary` | `156 100% 35%` | `#00B074` | Color de marca (esmeralda) |
| `--primary-foreground` | `0 0% 100%` | `#FFFFFF` | Texto sobre primary |
| `--secondary` | `152 60% 95%` | `#E7F8F1` | Superficies secundarias |
| `--secondary-foreground` | `156 100% 25%` | `#00994D` | Texto sobre secondary |
| `--muted` | `210 40% 96%` | `#F1F5F9` | Fondos muted |
| `--muted-foreground` | `215 16% 47%` | `#64748B` | Texto muted |
| `--accent` | `152 70% 94%` | `#DCF5EC` | Superficies de acento |
| `--destructive` | `0 84% 60%` | `#E5484D` | Eliminar / peligro |
| `--success` | `142 71% 45%` | `#22C55E` | Estados de éxito |
| `--warning` | `38 92% 50%` | `#F59E0B` | Estados de advertencia |
| `--border` | `210 40% 90%` | `#E2E8F0` | Bordes |
| `--ring` | `156 100% 35%` | `#00B074` | Focus rings |
| `--chart-1` | `156 100% 35%` | `#00B074` | Gráfico 1 |
| `--chart-2` | `210 80% 55%` | `#3B82F6` | Gráfico 2 |
| `--chart-3` | `38 92% 50%` | `#F59E0B` | Gráfico 3 |
| `--chart-4` | `280 65% 60%` | `#9D5CE0` | Gráfico 4 |
| `--chart-5` | `0 75% 55%` | `#D92E2E` | Gráfico 5 |
| `--radius` | `0.75rem` | — | Radio base |

**Color de marca principal**: esmeralda `#00B074`. NUNCA usar morado/índigo como color principal. El modo oscuro está configurado (`darkMode: ['class']`) pero no se aplica por defecto.

### 3.2 Tipografía

- Fuente única: **Inter**.
- Pesos máximos: 3 (normal 400, semibold 600, bold 700).
- Interlineado: 150% cuerpo, 120% titulares.
- Separador decimal: **coma** (,) en todo el sistema (locale `es-VE`).
- Números tabulares: clase `tabular-nums` en todos los montos.

### 3.3 Espaciado y layout

- Sistema de espaciado: **8px** consistente.
- Sidebar fija: 264px (`w-64`), oculta en móvil (`hidden lg:flex`).
- Header sticky: 64px (`h-16`), `bg-white/80 backdrop-blur`.
- Contenido principal: padding generoso, `animate-in-fade` (fadeIn 0.3s ease-out).

### 3.4 Componentes visuales recurrentes

**Tarjetas**: `rounded-2xl border border-slate-100 shadow-sm`, fondo blanco.

**Botones**:
- Primario: `bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg`.
- Peligro: `bg-rose-600 text-white hover:bg-rose-700 rounded-lg`.
- Advertencia: `bg-amber-500 text-white hover:bg-amber-600 rounded-lg`.
- Fantasma: `hover:bg-slate-100 rounded-lg`.
- Focus: `focus:ring-2 focus:ring-emerald-500/30`.

**Tablas**: `rounded-2xl`, cabecera `bg-slate-50`, filas `border-b border-slate-50 hover:bg-slate-50`, números tabulares.

**Modales**: `rounded-2xl shadow-2xl`, overlay `bg-slate-900/40 backdrop-blur-sm`, animación de entrada, scroll interno si excede altura, botón X arriba a la derecha, título + descripción, cuerpo con formulario o contenido, footer con botones de acción.

**Badges**: `rounded-full px-2.5 py-0.5 text-xs font-medium` con colores semánticos (emerald, amber, blue, rose, violet).

**Inputs**: `rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500`.

**Paginación**: Selector de tamaño de página (10/20/50), botones anterior/siguiente, contador total.

**ConfirmDialog**: Modal de confirmación reutilizable con 3 variantes (danger/warning/info), ícono personalizable, estado de carga, backdrop blur.

**Toasts (sonner)**: Notificaciones de éxito (emerald), error (rose), info (blue). Posición abajo a la derecha.

### 3.5 Animaciones

- `animate-in-fade`: fadeIn 0.3s ease-out (opacity 0→1, translateY 4px→0).
- `accordion-down` / `accordion-up`: 0.2s ease-out.
- Hover states en botones, tarjetas y filas de tabla.
- Transiciones suaves en toggles y badges.

### 3.6 Utilidades custom

- `.scrollbar-thin`: scrollbar de 6px con thumb muted-foreground.
- `bg-gradient-radial` y `bg-gradient-conic`: gradientes custom.

---

## 4. ARQUITECTURA DEL BACKEND

### 4.1 Estructura de carpetas

```
app/
  api/
    auth/
      login/route.ts       — POST: autenticar, devolver token base64
      logout/route.ts      — POST: limpiar cookie
      me/route.ts          — GET: usuario actual desde sesión
      session/route.ts     — GET: setear cookie desde ?token=, redirigir a /
    caja/route.ts          — GET (caja abierta), POST (abrir), PATCH (cerrar)
    pos/checkout/route.ts  — POST: checkout completo
    mantenimiento/
      demo/route.ts        — POST: cargar datos demo
      reset/route.ts       — POST: factory reset
  [modulo]/page.tsx        — Server Component: fetch Supabase + render Client
  layout.tsx               — Root layout: html, Inter, Toaster, AppShell
  globals.css              — Variables CSS + utilidades
lib/
  supabase.ts              — Cliente Supabase
  auth.ts                  — getSession() leer cookie
  auditoria.ts             — registrarAuditoria() server + cliente
  crypto.ts                — hashPassword() SHA-256
  divisas.ts               — ConfigDivisas, fmtPrincipal, fmtSecundaria, fmtMonto
  utils.ts                 — cn() clsx + tailwind-merge
middleware.ts              — Protección de rutas, cookie check
components/
  layout/                  — app-shell, header, sidebar, mobile-nav
  [modulo]/                 — [modulo]-client.tsx (Client Components)
  ui/                       — confirm-dialog, pagination, sonner + shadcn/ui
```

### 4.2 Flujo de autenticación

1. **Login** (`POST /api/auth/login`): Recibe `{email, password}`. Consulta tabla `usuarios` con join a `roles`. Hashea password con SHA-256, compara con `password_hash`. Verifica `estado === 'ACTIVO'`. Devuelve `{user: AuthUser, token}` donde token es `base64(JSON.stringify(authUser))`. Registra log `INICIO_SESION`.
2. **Cookie** (`GET /api/auth/session?token=...`): Setea cookie `tabel_session` httpOnly, sameSite lax, secure si HTTPS, maxAge 43200 (12h), path /. Redirige a /.
3. **Middleware** (`middleware.ts`): Verifica cookie en cada request. Rutas públicas: `/login`, `/api/auth/*`. Sin cookie → redirect `/login`. Static/_next pasan.
4. **getSession** (`lib/auth.ts`): Lee cookie, URL-decode, base64-decode, JSON-parse → `AuthUser {id, nombre, email, rol: {id, nombre_rol, permisos[]}}`.
5. **Logout**: Limpia cookie (maxAge 0).
6. **Me** (`GET /api/auth/me`): Devuelve usuario desde sesión o 401.

### 4.3 API de checkout (`POST /api/pos/checkout`)

Recibe: `caja_id, cliente_id, usuario_id, items[{producto_id, cantidad, precio_unitario_usd}], tasa_cambio, metodo_pago, referencia_pago, iva_pct`.

Lógica:
1. Valida carrito no vacío y caja abierta.
2. Valida stock y estado HABILITADO de cada producto.
3. Calcula `totalUsd` desde items. IVA solo sobre productos NO exentos. `totalConIvaUsd = totalUsd + ivaUsd`. `totalConIvaVed = totalConIvaUsd * tasa_cambio`.
4. Si `metodo_pago === CREDITO`: valida `deuda_actual + total <= limite_credito`. `estado_pago = PENDIENTE`. Sino `PAGADO`.
5. Si `metodo_pago` es PAGO_MOVIL o PUNTO_DE_VENTA: requiere `referencia_pago`.
6. Inserta en `ventas` + `venta_detalles`.
7. Descuenta stock de cada producto.
8. Si CREDITO: actualiza `deuda_actual_usd` del cliente.
9. Inserta registro en `transacciones` (tipo VENTA_POS).
10. Registra auditoría `VENTA_POS`.
11. Rollback parcial si falla (elimina venta si detalles fallan).
12. Devuelve `{ok, venta_id, total_usd, total_ved}`.

### 4.4 API de caja (`/api/caja`)

- **GET**: Obtiene caja con `estado = ABIERTA`.
- **POST**: Abre nueva caja con `monto_inicial_usd/ved`. Rechaza si ya hay una abierta. Registra `APERTURA_CAJA`.
- **PATCH**: Cierra caja abierta (set CERRADA + fecha_cierre). Registra `CIERRE_CAJA`.

### 4.5 API de mantenimiento

- **demo** (`POST /api/mantenimiento/demo`): Crea usuario admin (admin@thanbel.com / admin123), 4 materias primas, 5 productos terminados, 3 clientes, 2 proveedores. Omite duplicados. Registra `CARGAR_DATOS_DEMO`.
- **reset** (`POST /api/mantenimiento/reset`): Elimina datos de 11 tablas + elimina usuarios excepto admin@thanbel.com. Factory reset.

### 4.6 Librería de auditoría (`lib/auditoria.ts`)

- `registrarAuditoria(accion, modulo, detalles?)`: Server-side, lee cookie para usuario_id, inserta en `auditoria_logs`. Falla silenciosamente.
- `registrarAuditoriaCliente(usuario_id, accion, modulo, detalles?)`: Client-side con usuario_id explícito.

### 4.7 Librería de divisas (`lib/divisas.ts`)

- `ConfigDivisas` interface: `{divisa_principal, simbolo_principal, divisa_secundaria, simbolo_secundaria, tasa_cambio, mostrar_como}`.
- `DEFAULT_DIVISAS`: USD/$, VED/Bs., tasa 100, AMBAS.
- `fmtPrincipal(monto, config)`: Formatea en divisa principal con coma decimal.
- `fmtSecundaria(monto, config)`: Multiplica por tasa_cambio, formatea con coma decimal.
- `fmtMonto(monto, config)`: Respeta `mostrar_como` (PRINCIPAL/SECUNDARIA/AMBAS).
- `fmtTasa(config)`: "1 USD = X Bs."
- `getConfigDivisas()`: Fetch desde Supabase, fallback a DEFAULT.

---

## 5. BASE DE DATOS — ESQUEMA COMPLETO

### 5.1 Normalización (3FN)

La base está en **Tercera Forma Normal (3FN)**:
- **1FN**: Todos los atributos son atómicos. No hay grupos repetitivos. Cada tabla tiene PK única (UUID o INT singleton).
- **2FN**: No hay dependencias parciales. Todas las columnas no-clave dependen de la PK completa. Tablas de detalle (venta_detalles, receta_ingredientes, venta_pagos) tienen su propia PK.
- **3FN**: No hay dependencias transitivas. Los datos de empresa, config_divisas y config_fiscal están en tablas singleton separadas (no embebidas en usuarios o ventas). Los roles están normalizados en tabla propia. Los inventarios separados de productos.

### 5.2 Tablas (17 totales)

#### roles
| Columna | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | `gen_random_uuid()` |
| `nombre_rol` | TEXT UNIQUE | |
| `permisos` | JSONB | Array de strings |
| `fecha_creacion` | TIMESTAMPTZ DEFAULT now() | |

Seed: ADMINISTRADOR `["*"]`, GERENTE `["pos","inventarios","clientes","reportes","transacciones","produccion"]`, CAJERO `["pos","clientes"]`.

#### usuarios
| Columna | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `nombre` | TEXT | |
| `email` | TEXT UNIQUE | |
| `password_hash` | TEXT | SHA-256 hex |
| `rol_id` | UUID FK→roles | ON DELETE SET NULL |
| `estado` | TEXT CHECK | `ACTIVO` / `INACTIVO` |
| `fecha_creacion` | TIMESTAMPTZ DEFAULT now() | |

Index en `rol_id`.

#### empresa
| Columna | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | Singleton |
| `nombre` | TEXT | |
| `rif_identificacion` | TEXT | |
| `direccion` | TEXT | |
| `telefono` | TEXT | |
| `fecha_creacion` | TIMESTAMPTZ DEFAULT now() | |

#### inventarios
| Columna | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `nombre_inventario` | TEXT | |
| `es_materia_prima` | BOOLEAN | |
| `visible_en_pos` | BOOLEAN | |
| `fecha_creacion` | TIMESTAMPTZ DEFAULT now() | |

Seed: "Materia Prima" (es_materia_prima=true, visible_en_pos=false), "Productos Terminados" (false, true).

#### productos
| Columna | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `inventario_id` | UUID FK→inventarios | ON DELETE CASCADE |
| `nombre` | TEXT | |
| `codigo_barras` | TEXT | |
| `unidad_medida` | TEXT DEFAULT 'UND' | UND/KG/G/L/ML/CAJA |
| `stock_actual` | NUMERIC(14,2) | |
| `stock_minimo` | NUMERIC(14,2) | |
| `costo_compra_usd` | NUMERIC(14,2) | |
| `precio_venta_usd` | NUMERIC(14,2) | |
| `exento_iva` | BOOLEAN DEFAULT false | Añadido en migración 0002 |
| `estado` | TEXT CHECK | `HABILITADO` / `DESHABILITADO` |
| `fecha_creacion` | TIMESTAMPTZ DEFAULT now() | |

Indexes en `inventario_id`, `estado`, `codigo_barras`.

#### clientes
| Columna | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `nombre` | TEXT | |
| `identificacion_cedula_rif` | TEXT | |
| `telefono` | TEXT | |
| `limite_credito_usd` | NUMERIC(14,2) | |
| `deuda_actual_usd` | NUMERIC(14,2) DEFAULT 0 | |
| `fecha_vencimiento_credito` | DATE | |
| `latitud_gps` | DOUBLE PRECISION | |
| `longitud_gps` | DOUBLE PRECISION | |
| `fecha_registro` | TIMESTAMPTZ DEFAULT now() | |

Index en `nombre`.

#### proveedores
| Columna | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `nombre` | TEXT | |
| `rif` | TEXT | |
| `telefono` | TEXT | |
| `latitud_gps` | DOUBLE PRECISION | |
| `longitud_gps` | DOUBLE PRECISION | |
| `fecha_registro` | TIMESTAMPTZ DEFAULT now() | |

#### caja_apertura
| Columna | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `usuario_id` | UUID FK→usuarios | ON DELETE SET NULL |
| `monto_inicial_usd` | NUMERIC(14,2) | |
| `monto_inicial_ved` | NUMERIC(14,2) | |
| `estado` | TEXT CHECK | `ABIERTA` / `CERRADA` |
| `fecha_apertura` | TIMESTAMPTZ DEFAULT now() | |
| `fecha_cierre` | TIMESTAMPTZ | |

Index en `estado`.

#### ventas
| Columna | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `caja_id` | UUID FK→caja_apertura | ON DELETE SET NULL |
| `cliente_id` | UUID FK→clientes | ON DELETE SET NULL |
| `usuario_id` | UUID FK→usuarios | ON DELETE SET NULL |
| `total_usd` | NUMERIC(14,2) | |
| `total_ved` | NUMERIC(14,2) | |
| `tasa_cambio_usada` | NUMERIC(14,2) | |
| `metodo_pago` | TEXT CHECK | `EFECTIVO`, `PAGO_MOVIL`, `PUNTO_DE_VENTA`, `CREDITO`, `MIXTO` |
| `estado_pago` | TEXT CHECK | `PAGADO` / `PENDIENTE` |
| `referencia_pago` | TEXT | |
| `fecha_venta` | TIMESTAMPTZ DEFAULT now() | |

Indexes en `fecha_venta`, `cliente_id`, `caja_id`.

#### venta_detalles
| Columna | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `venta_id` | UUID FK→ventas | ON DELETE CASCADE |
| `producto_id` | UUID FK→productos | ON DELETE CASCADE |
| `cantidad` | NUMERIC(14,2) | |
| `precio_unitario_usd` | NUMERIC(14,2) | |
| `subtotal_usd` | NUMERIC(14,2) | |

Indexes en `venta_id`, `producto_id`.

#### venta_pagos (migración 0003 — pago mixto)
| Columna | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `venta_id` | UUID FK→ventas | ON DELETE CASCADE |
| `metodo_pago` | TEXT CHECK | `EFECTIVO`, `PAGO_MOVIL`, `PUNTO_DE_VENTA`, `CREDITO` (NO MIXTO) |
| `monto_usd` | NUMERIC(14,2) | |
| `referencia` | TEXT | |

Index en `venta_id`.

#### transacciones
| Columna | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `tipo` | TEXT CHECK | `VENTA_POS`, `COBRO_DEUDA`, `ABONO_CLIENTE`, `COMPRA_INVENTARIO` |
| `referencia_id` | UUID | Sin FK (referencia flexible) |
| `monto_usd` | NUMERIC(14,2) | |
| `monto_ved` | NUMERIC(14,2) | |
| `cliente_id` | UUID FK→clientes | ON DELETE SET NULL |
| `usuario_id` | UUID FK→usuarios | ON DELETE SET NULL |
| `fecha_transaccion` | TIMESTAMPTZ DEFAULT now() | |

#### recetas_produccion
| Columna | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `producto_resultante_id` | UUID FK→productos | ON DELETE CASCADE |
| `porcentaje_profit_esperado` | NUMERIC(5,2) | |
| `costo_total_ingredientes_usd` | NUMERIC(14,2) | |
| `cantidad_unidades_producidas` | NUMERIC(14,2) | |
| `costo_unitario_final_usd` | NUMERIC(14,2) | |
| `fecha_creacion` | TIMESTAMPTZ DEFAULT now() | |

#### receta_ingredientes
| Columna | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `receta_id` | UUID FK→recetas_produccion | ON DELETE CASCADE |
| `producto_materia_prima_id` | UUID FK→productos | ON DELETE CASCADE |
| `cantidad_usada` | NUMERIC(14,2) | |
| `costo_parcial_usd` | NUMERIC(14,2) | |

#### divisas_historial
| Columna | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `divisa_principal` | TEXT | |
| `divisa_secundaria` | TEXT | |
| `tasa_cambio` | NUMERIC(14,2) | |
| `origen` | TEXT CHECK | `AUTOMATICO_API` / `MANUAL` |
| `fecha_registro` | TIMESTAMPTZ DEFAULT now() | |

#### config_divisas (singleton, id=1)
| Columna | Tipo | Notas |
|---|---|---|
| `id` | INT PK DEFAULT 1 | Singleton |
| `divisa_principal` | TEXT | |
| `simbolo_principal` | TEXT | |
| `divisa_secundaria` | TEXT | |
| `simbolo_secundaria` | TEXT | |
| `tasa_cambio` | NUMERIC(14,2) DEFAULT 100 | Añadido en migración 0002 |
| `mostrar_como` | TEXT CHECK | `PRINCIPAL` / `SECUNDARIA` / `AMBAS` |
| `updated_at` | TIMESTAMPTZ DEFAULT now() | |

Seed: USD/$, VED/Bs., tasa 100, AMBAS.

#### config_fiscal (singleton, id=1) — migración 0002
| Columna | Tipo | Notas |
|---|---|---|
| `id` | INT PK DEFAULT 1 | Singleton |
| `porcentaje_iva` | NUMERIC(5,2) | |
| `nombre_impresora` | TEXT | |
| `ancho_papel` | TEXT CHECK | `58mm` / `80mm` |
| `mostrar_iva` | BOOLEAN | |
| `updated_at` | TIMESTAMPTZ DEFAULT now() | |

Seed: iva=0, 58mm.

#### auditoria_logs
| Columna | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `usuario_id` | UUID FK→usuarios | ON DELETE SET NULL |
| `accion` | TEXT | |
| `modulo` | TEXT | |
| `detalles_json` | JSONB | |
| `ip_address` | TEXT | |
| `fecha_hora` | TIMESTAMPTZ DEFAULT now() | |

Indexes en `fecha_hora`, `modulo`.

### 5.3 RLS (Row Level Security)

RLS habilitado en las 17 tablas. Polítics de acceso total (`USING (true)`, `WITH CHECK (true)`) para roles `anon` y `authenticated` en SELECT, INSERT, UPDATE, DELETE (una política por verbo CRUD). La seguridad se enforce a nivel de aplicación/middleware, no en la BD.

### 5.4 Relaciones (diagrama)

```
roles ──< usuarios >── caja_apertura
                     >── ventas ──< venta_detalles >── productos
                     >── transacciones                   ↑
inventarios ──< productos                                │
                    ↑                                    │
                    ├── receta_ingredientes >── recetas_produccion
                    │                                   └──> productos (resultante)
clientes ──< ventas
         ──< transacciones
proveedores (standalone)
empresa (singleton)
config_divisas (singleton)
config_fiscal (singleton)
divisas_historial (standalone)
auditoria_logs >── usuarios
venta_pagos >── ventas
```

### 5.5 Reglas ON DELETE

- `inventarios → productos`: CASCADE (borrar inventario borra productos).
- `ventas → venta_detalles`: CASCADE.
- `ventas → venta_pagos`: CASCADE.
- `recetas_produccion → receta_ingredientes`: CASCADE.
- `recetas_produccion → productos (resultante)`: CASCADE.
- `receta_ingredientes → productos (materia prima)`: CASCADE.
- `roles → usuarios`: SET NULL.
- `usuarios → caja_apertura/ventas/transacciones/auditoria_logs`: SET NULL.
- `clientes → ventas/transacciones`: SET NULL.
- `caja_apertura → ventas`: SET NULL.

---

## 6. ARQUITECTURA DEL FRONTEND

### 6.1 Patrón Server/Client Component

Cada página sigue el patrón:
- `app/[modulo]/page.tsx` — **Server Component**: hace fetch a Supabase, llama `getConfigDivisas()`, pasa datos como props al Client Component.
- `components/[modulo]/[modulo]-client.tsx` — **Client Component** (`'use client'`): toda la interactividad (estado, formularios, modales, CRUD, auditoría).

### 6.2 Layout (`components/layout/`)

**AppShell**: Wrapper principal. Renderiza Sidebar (desktop), MobileNav (drawer móvil con state), Header, y `<main>` con padding.

**Sidebar** (`w-64`, fija, `hidden lg:flex`):
- Logo: cuadrado con gradiente esmeralda, ícono `Store`, texto "ThanBel POS" / "Gestión Inteligente".
- Navegación: 11 items con estado activo (bg emerald-50, texto emerald-700, punto emerald-500).
- Botón cerrar sesión abajo (rose-600).

**Header** (`h-16`, sticky, `bg-white/80 backdrop-blur`):
- Botón menú móvil (hamburguesa, `lg:hidden`).
- Reloj en vivo (locale es-VE, actualiza cada segundo, muestra "America/Caracas").
- Badge de tasa de cambio (bg emerald-50, "1 USD = X Bs.").
- Campana de notificaciones con punto rojo.
- Avatar usuario (círculo gradiente esmeralda con inicial).

**MobileNav**: Drawer deslizante con mismos items de navegación + logout.

### 6.3 Items de navegación (11)

| # | Módulo | Ruta | Ícono |
|---|---|---|---|
| 1 | Dashboard | `/` | LayoutDashboard |
| 2 | Ventas POS | `/pos` | ShoppingCart |
| 3 | Clientes | `/clientes` | Users |
| 4 | Proveedores | `/proveedores` | Truck |
| 5 | Inventarios | `/inventarios` | Boxes |
| 6 | Producción | `/produccion` | Factory |
| 7 | Transacciones | `/transacciones` | ArrowLeftRight |
| 8 | Reportes | `/reportes` | FileBarChart |
| 9 | Usuarios | `/usuarios` | UserCog |
| 10 | Auditoría | `/auditoria` | ScrollText |
| 11 | Configuración | `/configuracion` | Settings |

---

## 7. MÓDULOS — FUNCIONALIDAD DETALLADA

### 7.1 Dashboard (`/`)

- **3 tarjetas KPI**: Ventas del día (total_usd), Total transacciones, Clientes activos. Cada tarjeta tiene ícono de ojo para ocultar/mostrar montos (reemplaza valor con "••••").
- **Gráfico**: LineChart de 7 días mostrando productos vendidos por día.
- **Accesos rápidos**: Grid de atajos a todos los módulos.
- Fetch: ventas (hoy), conteo transacciones, conteo clientes, venta_detalles para gráfico.

### 7.2 Ventas POS (`/pos`) — Módulo más complejo

- **Gestión de caja**: Debe abrir caja antes de vender. Modal para abrir (montos iniciales USD/VED) y cerrar. Al cerrar redirige al dashboard.
- **Grilla de productos**: Productos de inventarios con `visible_en_pos = true`. Filtrable por inventario, buscable por nombre/código de barras.
- **Carrito**: Agregar productos, editar cantidad inline, eliminar items, muestra subtotal. Se pueden agregar productos custom (nombre + precio, sin descontar stock).
- **Selección de cliente**: Dropdown buscable con indicador de check. Permite "Consumidor Final" (sin cliente).
- **Métodos de pago**: EFECTIVO, PAGO_MOVIL (requiere referencia), PUNTO_DE_VENTA (requiere referencia), CREDITO, MIXTO.
- **Pago MIXTO**: Modal para dividir pago entre múltiples métodos, se guarda en `venta_pagos`.
- **Cálculo de IVA**: Solo sobre productos NO exentos, basado en `config_fiscal.porcentaje_iva`.
- **Totales**: Muestra en ambas divisas según `config_divisas`.
- **Impresión de ticket**: Tras checkout, ofrece imprimir recibo térmico (58mm o 80mm según config) via `window.print()` con HTML formateado.
- **Auditoría**: Registra `VENTA_POS` con detalles.
- **Descuento de stock**: Manejado por la API de checkout.

### 7.3 Clientes (`/clientes`)

- **Tabla**: Nombre, identificación (cédula/RIF), teléfono, límite de crédito, deuda actual, GPS.
- **CRUD**: Crear/editar/eliminar con modales.
- **Captura GPS**: API de geolocalización del navegador, guarda lat/long, link a Google Maps.
- **Abonos y cobros**: Click en fila abre modal con transacciones del cliente (paginado 10 filas). Registrar abonos (ABONO_CLIENTE) y cobros (COBRO_DEUDA) que actualizan `deuda_actual_usd`.
- **WhatsApp**: Genera mensaje pre-llenado (`wa.me/...`) para clientes con deuda, mostrando monto en divisa principal. Registra `WHATSAPP_CLIENTE`.
- **Historial de transacciones**: Vista por cliente.

### 7.4 Configuración (`/configuracion`) — 4 pestañas

1. **Empresa**: Editar nombre, RIF, dirección, teléfono. Registra `GUARDAR_EMPRESA`.
2. **Divisas**: Editar códigos y símbolos de divisa principal/secundaria, tasa de cambio, modo de visualización (PRINCIPAL/SECUNDARIA/AMBAS). Sincronizar tasa desde divisas_historial. Registra `GUARDAR_DIVISAS` / `SINCRONIZAR_DIVISAS_API`.
3. **Fiscal**: Porcentaje de IVA, nombre de impresora, ancho de papel (58mm/80mm toggle), mostrar IVA toggle. Preview de recibo en vivo. Registra `GUARDAR_FISCAL`.
4. **Mantenimiento**: Botón "Cargar datos demo" (llama `/api/mantenimiento/demo`) y "Factory reset" (llama `/api/mantenimiento/reset`) con diálogo de confirmación. Registra `CARGAR_DATOS_DEMO`.

### 7.5 Inventarios (`/inventarios`) — 2 pestañas

1. **Inventarios**: Grid de tarjetas con nombre y conteo de productos. Materia Prima (ícono amber) vs Producto Terminado (ícono emerald). CRUD — pero el inventario "Materia Prima" está protegido (sin botones editar/eliminar). Borrar inventario hace cascade a productos.
2. **Productos**: Tabla con búsqueda, paginación (10/20/50), columnas: nombre (+ marcador "(E)" si exento_iva), código de barras, inventario, stock (con alerta roja + ícono AlertTriangle si stock ≤ mínimo), costo, precio, toggle de estado (HABILITADO/DESHABILITADO), acciones. Formulario: nombre, código, unidad (UND/KG/G/L/ML/CAJA), inventario, stock actual/mínimo, costo USD, precio USD (con preview en divisa secundaria), estado, checkbox exento_iva.
- **Devolución a inventario**: Modal para reabastecer items devueltos. Filtrar por inventario, buscar productos, agregar items con cantidades, actualizar stock en lote. Registra `DEVOLUCION_INVENTARIO`.
- Auditoría: `CREAR/EDITAR/ELIMINAR_INVENTARIO`, `CREAR/EDITAR/ELIMINAR_PRODUCTO`, `DEVOLUCION_INVENTARIO`.

### 7.6 Producción (`/produccion`) — 2 pestañas

1. **Calculadora**: Seleccionar materias primas como ingredientes, setear cantidad por ingrediente. Configurar: nombre del producto, inventario destino (productos terminados), % profit, unidades producidas. Panel de costos en vivo (tarjeta gradiente esmeralda):
   - Por ingrediente: costo unitario × cantidad = costo parcial
   - Total materiales
   - Profit % y monto de profit
   - Costo + profit
   - Costo unitario = (costo + profit) / unidades
   - Precio sugerido = costo unitario
   - **Fórmula**: `costoConProfit = costoTotalMateriales * (1 + profit/100)`, `costoUnitario = costoConProfit / unidades`, `precioSugerido = costoUnitario`
   - Procesamiento: crea producto en inventario destino, crea receta_produccion, crea receta_ingredientes, descuenta stock de materias primas. Rollback si hay error. Registra `PRODUCCION_PROCESADA`.
2. **Historial**: Tabla de recetas pasadas: fecha, producto, conteo de ingredientes, costo total, unidades, costo unitario, % profit.

### 7.7 Proveedores (`/proveedores`)

- Tabla: nombre, RIF, teléfono, GPS (link Google Maps + coordenadas), acciones.
- CRUD con modal (nombre, RIF, teléfono, coordenadas GPS con geolocalización del navegador).
- Búsqueda por nombre/RIF/teléfono, paginación.
- Diálogo de confirmación para eliminar. Auditoría: `CREAR/EDITAR/ELIMINAR_PROVEEDOR`.

### 7.8 Transacciones (`/transacciones`)

- **Libro mayor unificado** de todos los movimientos financieros.
- **4 tarjetas KPI**: Total movimientos, suma en divisa principal, suma en divisa secundaria, filtros activos.
- **Filtros**: Dropdown de tipo (todos/VENTA_POS/COBRO_DEUDA/ABONO_CLIENTE/COMPRA_INVENTARIO), búsqueda de cliente, rango de fechas (desde/hasta).
- **Badges de tipo** con íconos color-coded: VENTA_POS (emerald, ShoppingBag), COBRO_DEUDA (amber, Wallet), ABONO_CLIENTE (blue, CreditCard), COMPRA_INVENTARIO (violet, Truck).
- Tabla: fecha, badge de tipo, cliente, usuario, monto en ambas divisas.

### 7.9 Reportes (`/reportes`)

- 3 tarjetas seleccionables: Resumen Consolidado, Reporte de Ventas, Reporte de Transacciones. Cada una muestra monto total.
- Panel de preview con tabla de datos del reporte seleccionado.
- **Exportación PDF** via jsPDF + jspdf-autotable:
  - Header: nombre empresa, RIF, dirección, teléfono, título del reporte, fecha de generación.
  - Tablas con header color esmeralda `[0, 176, 116]`.
  - Resumen: Ventas POS, Abonos, Cobros Deuda, Compras, Neto.
  - Nombres de archivo: `reporte-ventas.pdf`, `reporte-transacciones.pdf`, `resumen-consolidado.pdf`.

### 7.10 Usuarios (`/usuarios`)

- **4 tarjetas KPI**: Total, activos, inactivos, conteo de roles.
- Tabla: avatar (inicial del nombre), nombre, email, badge de rol, badge de estado (con ícono ShieldCheck/ShieldOff), fecha de creación, acciones (editar, toggle estado, eliminar).
- CRUD con modal: nombre, email, password (obligatorio para nuevo, opcional para editar — "dejar vacío para mantener"), select de rol, select de estado.
- Password hasheado con SHA-256 en el cliente antes de enviar a Supabase.
- Paginación. Diálogo de confirmación para eliminar.
- Auditoría: `CREAR/EDITAR/ELIMINAR/ACTIVAR/DESACTIVAR_USUARIO`.

### 7.11 Auditoría (`/auditoria`)

- **Visor de logs de auditoría inmutable**.
- Filtros: búsqueda (acción, módulo o nombre de usuario), dropdown de módulo (poblado dinámicamente con módulos únicos de los datos).
- Tabla: fecha/hora, usuario (o "Sistema"), badge de módulo, acción, dirección IP.
- Click en cualquier fila abre modal de detalle: fecha, usuario, módulo, acción, y `detalles_json` renderizado como:
  - JSON pretty-printed en bloque oscuro (`bg-slate-900 text-slate-100`), O
  - Renderizado especial para logs `DEVOLUCION_INVENTARIO`: lista de items con nombre de producto, inventario y cantidades.
- Paginación.

---

## 8. SISTEMA MULTI-DIVISA

- **Divisa principal**: USD (almacenamiento en BD).
- **Divisa secundaria**: VED (Bs.) — conversión en tiempo de visualización.
- **Tasa de cambio**: Configurable en `config_divisas.tasa_cambio`. Historial en `divisas_historial`.
- **Modo de visualización**: PRINCIPAL (solo USD), SECUNDARIA (solo Bs.), AMBAS (las dos).
- **Separador decimal**: Coma (,) en todo el sistema.
- **Todas las cantidades se almacenan en USD**; la conversión a VED es solo de visualización.

---

## 9. SISTEMA FISCAL (IVA)

- **Porcentaje de IVA**: Configurable en `config_fiscal.porcentaje_iva`.
- **Exención por producto**: Flag `exento_iva` en tabla `productos`.
- **Cálculo**: IVA solo sobre productos NO exentos. `ivaUsd = suma(subtotales_no_exentos) * iva_pct / 100`.
- **Display**: Toggle `mostrar_iva` en config fiscal. Visible en tickets y totales del POS.

---

## 10. GESTIÓN DE CAJA

- Una caja abierta a la vez (estado ABIERTA).
- Debe estar abierta para procesar ventas en POS.
- Apertura: montos iniciales USD + VED. Registro de auditoría.
- Cierre: set estado CERRADA + fecha_cierre. Registro de auditoría. Redirige al dashboard.

---

## 11. AUDITORÍA — TIPOS DE ACCIÓN REGISTRADOS

| Acción | Módulo |
|---|---|
| `INICIO_SESION` | Auth |
| `VENTA_POS` | POS |
| `APERTURA_CAJA` / `CIERRE_CAJA` | Caja |
| `CREAR/EDITAR/ELIMINAR_INVENTARIO` | Inventarios |
| `CREAR/EDITAR/ELIMINAR_PRODUCTO` | Inventarios |
| `DEVOLUCION_INVENTARIO` | Inventarios |
| `PRODUCCION_PROCESADA` | Producción |
| `CREAR/EDITAR/ELIMINAR_PROVEEDOR` | Proveedores |
| `WHATSAPP_CLIENTE` | Clientes |
| `CREAR/EDITAR/ELIMINAR/ACTIVAR/DESACTIVAR_USUARIO` | Usuarios |
| `GUARDAR_EMPRESA` / `GUARDAR_DIVISAS` / `SINCRONIZAR_DIVISAS_API` / `GUARDAR_FISCAL` | Configuración |
| `CARGAR_DATOS_DEMO` | Mantenimiento |

---

## 12. DATOS DEMO (SEED)

Al activar "Cargar datos demo":
- **Usuario admin**: admin@thanbel.com / admin123 (rol ADMINISTRADOR).
- **4 materias primas**: Harina de maíz, Queso blanco, Carne mechada, Aceite vegetal.
- **5 productos terminados**: Empanizada, Empanizada con queso, Pelua, Pelua con queso, Combo completo.
- **3 clientes**: Con límites de crédito y deudas variadas.
- **2 proveedores**: Con RIF y GPS.

Omite duplicados por código de barras, identificación o RIF.

---

## 13. CONSIDERACIONES DE IMPLEMENTACIÓN

1. **TypeScript estricto**: Todos los parámetros con tipo explícito, sin `any` implícito.
2. **Importaciones**: Importar todo símbolo referenciado (componentes, íconos, hooks, tipos).
3. **Manejo de errores**: Verificar resultados de Supabase antes de usar. Mostrar estado de error visible (toast). No dejar `undefined` llegar a la pantalla.
4. **Paginación**: Hook `usePagination<T>` reutilizable con selector de tamaño (10/20/50).
5. **Confirmación**: `ConfirmDialog` para eliminar o resetear.
6. **Responsive**: Sidebar colapsa a drawer en móvil. Tablas con scroll horizontal si es necesario. Grilla de productos adaptativa.
7. **Accesibilidad**: Focus rings visibles, labels en inputs, contraste suficiente.
8. **Performance**: Server Components para fetch inicial, Client Components solo para interactividad.
9. **Consistencia**: Todas las tablas siguen el mismo patrón visual. Todos los modales siguen el mismo layout. Todos los formularios validan antes de enviar.
10. **Locale**: `es-VE` en todas las fechas y formatos. Coma como separador decimal.

---

## 14. ESTRUCTURA DE ARCHIVOS FINAL

```
project/
├── app/
│   ├── api/
│   │   ├── auth/{login,logout,me,session}/route.ts
│   │   ├── caja/route.ts
│   │   ├── pos/checkout/route.ts
│   │   └── mantenimiento/{demo,reset}/route.ts
│   ├── auditoria/page.tsx
│   ├── clientes/page.tsx
│   ├── configuracion/page.tsx
│   ├── inventarios/page.tsx
│   ├── login/page.tsx
│   ├── produccion/page.tsx
│   ├── proveedores/page.tsx
│   ├── reportes/page.tsx
│   ├── transacciones/page.tsx
│   ├── usuarios/page.tsx
│   ├── pos/page.tsx
│   ├── page.tsx (dashboard)
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── layout/{app-shell,header,sidebar,mobile-nav}.tsx
│   ├── dashboard/dashboard-client.tsx
│   ├── pos/pos-client.tsx
│   ├── clientes/clientes-client.tsx
│   ├── config/config-client.tsx
│   ├── inventarios/inventarios-client.tsx
│   ├── produccion/produccion-client.tsx
│   ├── proveedores/proveedores-client.tsx
│   ├── reportes/reportes-client.tsx
│   ├── transacciones/transacciones-client.tsx
│   ├── usuarios/usuarios-client.tsx
│   ├── auditoria/auditoria-client.tsx
│   └── ui/{confirm-dialog,pagination,sonner}.tsx + shadcn/ui components
├── lib/
│   ├── supabase.ts
│   ├── auth.ts
│   ├── auditoria.ts
│   ├── crypto.ts
│   ├── divisas.ts
│   └── utils.ts
├── middleware.ts
├── supabase/migrations/
│   ├── 0001_initial_schema.sql
│   ├── 0002_add_tasa_cambio_and_fiscal.sql
│   └── 0003_add_mixed_payment.sql
├── tailwind.config.ts
├── tsconfig.json
├── next.config.js
├── components.json
├── package.json
└── .env
```

---

## 15. INSTRUCCIONES FINALES PARA EL AGENTE

Construye el sistema completo siguiendo este documento al pie de la letra. Prioriza:

1. **Base de datos primero**: Crea las 3 migraciones en orden con todas las tablas, relaciones, constraints, indexes, seeds y políticas RLS.
2. **Backend segundo**: Librerías (`lib/`), middleware, API routes.
3. **Frontend tercero**: Layout, luego cada módulo en orden (Dashboard → POS → Clientes → Proveedores → Inventarios → Producción → Transacciones → Reportes → Usuarios → Auditoría → Configuración).
4. **Diseño consistente**: Usa exactamente la paleta de colores, tipografía y componentes especificados.
5. **Verifica**: Al final, ejecuta el build y corrige todos los errores de TypeScript.
6. **No dejes nada a medias**: Cada módulo debe ser completamente funcional con CRUD, validación, auditoría y feedback visual (toasts).

El resultado debe ser un sistema POS profesional, completo y funcional, con estética premium esmeralda, listo para usar en un negocio real.

## SUPABASE
NEXT_PUBLIC_SUPABASE_URL = https://fmrjumymlunmdakopycp.supabase.co/rest/v1/
NEXT_PUBLIC_SUPABASE_ANON_KEY = sb_publishable_sV8lWhpARekjI21nGUPaWw_nyzqAu8E
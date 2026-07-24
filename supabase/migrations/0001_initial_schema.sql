-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Roles table
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_rol TEXT UNIQUE NOT NULL,
  permisos JSONB NOT NULL,
  fecha_creacion TIMESTAMPTZ DEFAULT now()
);

-- Seed roles
INSERT INTO roles (nombre_rol, permisos) VALUES
  ('ADMINISTRADOR', '["*"]'),
  ('GERENTE', '["pos","inventarios","clientes","reportes","transacciones","produccion"]'),
  ('CAJERO', '["pos","clientes"]');

-- Usuarios
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  rol_id UUID REFERENCES roles(id) ON DELETE SET NULL,
  estado TEXT NOT NULL CHECK (estado IN ('ACTIVO', 'INACTIVO')),
  fecha_creacion TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_usuarios_rol_id ON usuarios(rol_id);

-- Empresa (singleton)
CREATE TABLE empresa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  rif_identificacion TEXT,
  direccion TEXT,
  telefono TEXT,
  fecha_creacion TIMESTAMPTZ DEFAULT now()
);
INSERT INTO empresa (nombre, rif_identificacion, direccion, telefono) VALUES ('Mi Empresa', '', '', '');

-- Inventarios
CREATE TABLE inventarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_inventario TEXT NOT NULL,
  es_materia_prima BOOLEAN NOT NULL DEFAULT false,
  visible_en_pos BOOLEAN NOT NULL DEFAULT false,
  fecha_creacion TIMESTAMPTZ DEFAULT now()
);
INSERT INTO inventarios (nombre_inventario, es_materia_prima, visible_en_pos) VALUES
  ('Materia Prima', true, false),
  ('Productos Terminados', false, true);

-- Productos
CREATE TABLE productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventario_id UUID NOT NULL REFERENCES inventarios(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  codigo_barras TEXT,
  unidad_medida TEXT DEFAULT 'UND',
  stock_actual NUMERIC(14,2) DEFAULT 0,
  stock_minimo NUMERIC(14,2) DEFAULT 0,
  costo_compra_usd NUMERIC(14,2) DEFAULT 0,
  precio_venta_usd NUMERIC(14,2) DEFAULT 0,
  exento_iva BOOLEAN DEFAULT false,
  estado TEXT NOT NULL DEFAULT 'HABILITADO' CHECK (estado IN ('HABILITADO', 'DESHABILITADO')),
  fecha_creacion TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_productos_inventario_id ON productos(inventario_id);
CREATE INDEX idx_productos_estado ON productos(estado);
CREATE INDEX idx_productos_codigo_barras ON productos(codigo_barras);

-- Clientes
CREATE TABLE clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  identificacion_cedula_rif TEXT,
  telefono TEXT,
  limite_credito_usd NUMERIC(14,2) DEFAULT 0,
  deuda_actual_usd NUMERIC(14,2) DEFAULT 0,
  fecha_vencimiento_credito DATE,
  latitud_gps DOUBLE PRECISION,
  longitud_gps DOUBLE PRECISION,
  fecha_registro TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_clientes_nombre ON clientes(nombre);

-- Proveedores
CREATE TABLE proveedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  rif TEXT,
  telefono TEXT,
  latitud_gps DOUBLE PRECISION,
  longitud_gps DOUBLE PRECISION,
  fecha_registro TIMESTAMPTZ DEFAULT now()
);

-- Caja apertura
CREATE TABLE caja_apertura (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  monto_inicial_usd NUMERIC(14,2) DEFAULT 0,
  monto_inicial_ved NUMERIC(14,2) DEFAULT 0,
  estado TEXT NOT NULL CHECK (estado IN ('ABIERTA', 'CERRADA')),
  fecha_apertura TIMESTAMPTZ DEFAULT now(),
  fecha_cierre TIMESTAMPTZ
);
CREATE INDEX idx_caja_estado ON caja_apertura(estado);

-- Ventas
CREATE TABLE ventas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caja_id UUID REFERENCES caja_apertura(id) ON DELETE SET NULL,
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  total_usd NUMERIC(14,2) DEFAULT 0,
  total_ved NUMERIC(14,2) DEFAULT 0,
  tasa_cambio_usada NUMERIC(14,2) DEFAULT 100,
  metodo_pago TEXT CHECK (metodo_pago IN ('EFECTIVO', 'PAGO_MOVIL', 'PUNTO_DE_VENTA', 'CREDITO', 'MIXTO')),
  estado_pago TEXT CHECK (estado_pago IN ('PAGADO', 'PENDIENTE')),
  referencia_pago TEXT,
  fecha_venta TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_ventas_fecha ON ventas(fecha_venta);
CREATE INDEX idx_ventas_cliente_id ON ventas(cliente_id);
CREATE INDEX idx_ventas_caja_id ON ventas(caja_id);

-- Venta detalles
CREATE TABLE venta_detalles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venta_id UUID NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
  cantidad NUMERIC(14,2) NOT NULL,
  precio_unitario_usd NUMERIC(14,2) NOT NULL,
  subtotal_usd NUMERIC(14,2) NOT NULL
);
CREATE INDEX idx_venta_detalles_venta_id ON venta_detalles(venta_id);
CREATE INDEX idx_venta_detalles_producto_id ON venta_detalles(producto_id);

-- Venta pagos (mixed payment)
CREATE TABLE venta_pagos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venta_id UUID NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
  metodo_pago TEXT CHECK (metodo_pago IN ('EFECTIVO', 'PAGO_MOVIL', 'PUNTO_DE_VENTA', 'CREDITO')),
  monto_usd NUMERIC(14,2) NOT NULL,
  referencia TEXT
);
CREATE INDEX idx_venta_pagos_venta_id ON venta_pagos(venta_id);

-- Transacciones
CREATE TABLE transacciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT CHECK (tipo IN ('VENTA_POS', 'COBRO_DEUDA', 'ABONO_CLIENTE', 'COMPRA_INVENTARIO')),
  referencia_id UUID,
  monto_usd NUMERIC(14,2) DEFAULT 0,
  monto_ved NUMERIC(14,2) DEFAULT 0,
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  fecha_transaccion TIMESTAMPTZ DEFAULT now()
);

-- Recetas produccion
CREATE TABLE recetas_produccion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_resultante_id UUID REFERENCES productos(id) ON DELETE CASCADE,
  porcentaje_profit_esperado NUMERIC(5,2),
  costo_total_ingredientes_usd NUMERIC(14,2),
  cantidad_unidades_producidas NUMERIC(14,2),
  costo_unitario_final_usd NUMERIC(14,2),
  fecha_creacion TIMESTAMPTZ DEFAULT now()
);

-- Receta ingredientes
CREATE TABLE receta_ingredientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receta_id UUID NOT NULL REFERENCES recetas_produccion(id) ON DELETE CASCADE,
  producto_materia_prima_id UUID REFERENCES productos(id) ON DELETE CASCADE,
  cantidad_usada NUMERIC(14,2),
  costo_parcial_usd NUMERIC(14,2)
);

-- Divisas historial
CREATE TABLE divisas_historial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  divisa_principal TEXT NOT NULL,
  divisa_secundaria TEXT NOT NULL,
  tasa_cambio NUMERIC(14,2) NOT NULL,
  origen TEXT CHECK (origen IN ('AUTOMATICO_API', 'MANUAL')),
  fecha_registro TIMESTAMPTZ DEFAULT now()
);

-- Config divisas (singleton)
CREATE TABLE config_divisas (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  divisa_principal TEXT NOT NULL DEFAULT 'USD',
  simbolo_principal TEXT NOT NULL DEFAULT '$',
  divisa_secundaria TEXT NOT NULL DEFAULT 'VED',
  simbolo_secundaria TEXT NOT NULL DEFAULT 'Bs.',
  tasa_cambio NUMERIC(14,2) DEFAULT 100,
  mostrar_como TEXT CHECK (mostrar_como IN ('PRINCIPAL', 'SECUNDARIA', 'AMBAS')) DEFAULT 'AMBAS',
  updated_at TIMESTAMPTZ DEFAULT now()
);
INSERT INTO config_divisas (divisa_principal, simbolo_principal, divisa_secundaria, simbolo_secundaria, tasa_cambio, mostrar_como)
VALUES ('USD', '$', 'VED', 'Bs.', 100, 'AMBAS');

-- Config fiscal (singleton)
CREATE TABLE config_fiscal (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  porcentaje_iva NUMERIC(5,2) DEFAULT 0,
  nombre_impresora TEXT DEFAULT '',
  ancho_papel TEXT CHECK (ancho_papel IN ('58mm', '80mm')) DEFAULT '58mm',
  mostrar_iva BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);
INSERT INTO config_fiscal (porcentaje_iva, nombre_impresora, ancho_papel, mostrar_iva)
VALUES (0, '', '58mm', true);

-- Auditoria logs
CREATE TABLE auditoria_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  accion TEXT NOT NULL,
  modulo TEXT NOT NULL,
  detalles_json JSONB,
  ip_address TEXT,
  fecha_hora TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_auditoria_fecha ON auditoria_logs(fecha_hora);
CREATE INDEX idx_auditoria_modulo ON auditoria_logs(modulo);

-- RLS: Enable on all tables
DO $$ DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
  END LOOP;
END $$;

-- RLS Policies: Full access for anon and authenticated
DO $$ DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('
      DROP POLICY IF EXISTS ''anon_select_%I'' ON %I;
      CREATE POLICY ''anon_select_%I'' ON %I FOR SELECT USING (true);
      DROP POLICY IF EXISTS ''anon_insert_%I'' ON %I;
      CREATE POLICY ''anon_insert_%I'' ON %I FOR INSERT WITH CHECK (true);
      DROP POLICY IF EXISTS ''anon_update_%I'' ON %I;
      CREATE POLICY ''anon_update_%I'' ON %I FOR UPDATE USING (true);
      DROP POLICY IF EXISTS ''anon_delete_%I'' ON %I;
      CREATE POLICY ''anon_delete_%I'' ON %I FOR DELETE USING (true);
    ', tbl, tbl, tbl, tbl, tbl, tbl, tbl, tbl, tbl, tbl, tbl, tbl, tbl, tbl, tbl, tbl);
  END LOOP;
END $$;

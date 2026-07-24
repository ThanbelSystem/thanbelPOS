import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { hashPassword } from '@/lib/crypto'
import { registrarAuditoria } from '@/lib/auditoria'

export async function POST() {
  try {
    const adminHash = await hashPassword('admin123')

    const { data: existingAdmin } = await supabase
      .from('usuarios')
      .select('id')
      .eq('email', 'admin@thanbel.com')
      .single()

    if (!existingAdmin) {
      const { data: adminRole } = await supabase
        .from('roles')
        .select('id')
        .eq('nombre_rol', 'ADMINISTRADOR')
        .single()

      if (adminRole) {
        await supabase.from('usuarios').insert({
          nombre: 'Admin',
          email: 'admin@thanbel.com',
          password_hash: adminHash,
          rol_id: adminRole.id,
          estado: 'ACTIVO',
        })
      }
    }

    const materiasPrimas = [
      { nombre: 'Harina de maíz', codigo_barras: 'MP001', unidad_medida: 'KG', stock_actual: 50, stock_minimo: 10, costo_compra_usd: 1.5, precio_venta_usd: 2.0 },
      { nombre: 'Queso blanco', codigo_barras: 'MP002', unidad_medida: 'KG', stock_actual: 30, stock_minimo: 5, costo_compra_usd: 3.0, precio_venta_usd: 4.5 },
      { nombre: 'Carne mechada', codigo_barras: 'MP003', unidad_medida: 'KG', stock_actual: 20, stock_minimo: 5, costo_compra_usd: 5.0, precio_venta_usd: 7.0 },
      { nombre: 'Aceite vegetal', codigo_barras: 'MP004', unidad_medida: 'L', stock_actual: 15, stock_minimo: 3, costo_compra_usd: 2.0, precio_venta_usd: 3.0 },
    ]

    const { data: mpInventario } = await supabase
      .from('inventarios')
      .select('id')
      .eq('es_materia_prima', true)
      .single()

    if (mpInventario) {
      for (const mp of materiasPrimas) {
        const { data: existing } = await supabase
          .from('productos')
          .select('id')
          .eq('codigo_barras', mp.codigo_barras)
          .single()

        if (!existing) {
          await supabase.from('productos').insert({
            inventario_id: mpInventario.id,
            ...mp,
            exento_iva: false,
            estado: 'HABILITADO',
          })
        }
      }
    }

    const productosTerminados = [
      { nombre: 'Empanizada', codigo_barras: 'PT001', precio_venta_usd: 3.5 },
      { nombre: 'Empanizada con queso', codigo_barras: 'PT002', precio_venta_usd: 4.5 },
      { nombre: 'Pelua', codigo_barras: 'PT003', precio_venta_usd: 5.0 },
      { nombre: 'Pelua con queso', codigo_barras: 'PT004', precio_venta_usd: 6.0 },
      { nombre: 'Combo completo', codigo_barras: 'PT005', precio_venta_usd: 8.0 },
    ]

    const { data: ptInventario } = await supabase
      .from('inventarios')
      .select('id')
      .eq('es_materia_prima', false)
      .single()

    if (ptInventario) {
      for (const pt of productosTerminados) {
        const { data: existing } = await supabase
          .from('productos')
          .select('id')
          .eq('codigo_barras', pt.codigo_barras)
          .single()

        if (!existing) {
          await supabase.from('productos').insert({
            inventario_id: ptInventario.id,
            ...pt,
            unidad_medida: 'UND',
            stock_actual: 100,
            stock_minimo: 10,
            costo_compra_usd: pt.precio_venta_usd * 0.5,
            exento_iva: false,
            estado: 'HABILITADO',
          })
        }
      }
    }

    const clientesDemo = [
      { nombre: 'Carlos Méndez', identificacion_cedula_rif: 'V-12345678', telefono: '+58 412-1234567', limite_credito_usd: 500, deuda_actual_usd: 150 },
      { nombre: 'María Rodríguez', identificacion_cedula_rif: 'V-23456789', telefono: '+58 414-2345678', limite_credito_usd: 300, deuda_actual_usd: 0 },
      { nombre: 'José Contreras', identificacion_cedula_rif: 'V-34567890', telefono: '+58 416-3456789', limite_credito_usd: 1000, deuda_actual_usd: 450 },
      { nombre: 'Ana Martínez', identificacion_cedula_rif: 'V-45678901', telefono: '+58 426-4567890', limite_credito_usd: 200, deuda_actual_usd: 50 },
      { nombre: 'Luis Pereira', identificacion_cedula_rif: 'V-56789012', telefono: '+58 412-5678901', limite_credito_usd: 0, deuda_actual_usd: 0 },
      { nombre: 'Diana Torres', identificacion_cedula_rif: 'V-67890123', telefono: '+58 414-6789012', limite_credito_usd: 800, deuda_actual_usd: 200 },
      { nombre: 'Pedro Gómez', identificacion_cedula_rif: 'V-78901234', telefono: '+58 416-7890123', limite_credito_usd: 0, deuda_actual_usd: 0 },
      { nombre: 'Sofia Rivas', identificacion_cedula_rif: 'V-89012345', telefono: '+58 426-8901234', limite_credito_usd: 400, deuda_actual_usd: 100 },
      { nombre: 'Jorge Castillo', identificacion_cedula_rif: 'V-90123456', telefono: '+58 412-9012345', limite_credito_usd: 0, deuda_actual_usd: 0 },
      { nombre: 'Laura Blanco', identificacion_cedula_rif: 'V-01234567', telefono: '+58 414-0123456', limite_credito_usd: 600, deuda_actual_usd: 300 },
      { nombre: 'Miguel Ángel', identificacion_cedula_rif: 'V-11234567', telefono: '+58 416-1123456', limite_credito_usd: 0, deuda_actual_usd: 0 },
    ]

    for (const cli of clientesDemo) {
      const { data: existing } = await supabase
        .from('clientes')
        .select('id')
        .eq('identificacion_cedula_rif', cli.identificacion_cedula_rif)
        .single()

      if (!existing) {
        await supabase.from('clientes').insert(cli)
      }
    }

    const proveedoresDemo = [
      { nombre: 'Distribuidora La Española', rif: 'J-12345678-9', telefono: '+58 212-1234567' },
      { nombre: 'Lácteos Los Andes', rif: 'J-23456789-0', telefono: '+58 212-2345678' },
      { nombre: 'Carnes Selectas C.A.', rif: 'J-34567890-1', telefono: '+58 212-3456789' },
      { nombre: 'Aceites del Sur', rif: 'J-45678901-2', telefono: '+58 212-4567890' },
    ]

    for (const prov of proveedoresDemo) {
      const { data: existing } = await supabase
        .from('proveedores')
        .select('id')
        .eq('rif', prov.rif)
        .single()

      if (!existing) {
        await supabase.from('proveedores').insert(prov)
      }
    }

    await registrarAuditoria('CARGAR_DATOS_DEMO', 'Mantenimiento', {})

    return NextResponse.json({ ok: true, message: 'Datos demo cargados exitosamente' })
  } catch (err) {
    console.error('Demo error:', err)
    return NextResponse.json({ error: 'Error al cargar datos demo' }, { status: 500 })
  }
}
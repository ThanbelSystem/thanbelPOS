import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST() {
  try {
    const tables = [
      'auditoria_logs',
      'transacciones',
      'venta_pagos',
      'venta_detalles',
      'ventas',
      'caja_apertura',
      'receta_ingredientes',
      'recetas_produccion',
      'productos',
      'proveedores',
      'clientes',
    ]

    for (const table of tables) {
      await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000')
    }

    await supabase.from('usuarios').delete().neq('email', 'admin@thanbel.com')

    return NextResponse.json({ ok: true, message: 'Factory reset completado' })
  } catch (err) {
    console.error('Reset error:', err)
    return NextResponse.json({ error: 'Error al resetear datos' }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { registrarAuditoria } from '@/lib/auditoria'
import { getSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = getSession()
    if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const body = await request.json()
    const { caja_id, cliente_id, items, metodo_pago, referencia_pago, tasa_cambio, iva_pct } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Carrito vacío' }, { status: 400 })
    }

    const { data: caja } = await supabase
      .from('caja_apertura')
      .select('id')
      .eq('id', caja_id)
      .eq('estado', 'ABIERTA')
      .single()

    if (!caja) return NextResponse.json({ error: 'Caja no abierta' }, { status: 400 })

    for (const item of items) {
      const { data: prod } = await supabase
        .from('productos')
        .select('id, stock_actual, estado')
        .eq('id', item.producto_id)
        .single()

      if (!prod || prod.estado !== 'HABILITADO') {
        return NextResponse.json({ error: `Producto ${item.producto_id} no disponible` }, { status: 400 })
      }
      if (Number(prod.stock_actual) < Number(item.cantidad)) {
        return NextResponse.json({ error: `Stock insuficiente para producto ${item.producto_id}` }, { status: 400 })
      }
    }

    let totalUsd = 0
    let subtotalNoExento = 0
    const detalleItems = []

    for (const item of items) {
      const { data: prod } = await supabase
        .from('productos')
        .select('precio_venta_usd, exento_iva')
        .eq('id', item.producto_id)
        .single()

      const precio = Number(item.precio_unitario_usd) || Number(prod?.precio_venta_usd) || 0
      const subtotal = precio * Number(item.cantidad)
      totalUsd += subtotal

      if (!prod?.exento_iva) {
        subtotalNoExento += subtotal
      }

      detalleItems.push({
        producto_id: item.producto_id,
        cantidad: Number(item.cantidad),
        precio_unitario_usd: precio,
        subtotal_usd: subtotal,
      })
    }

    const ivaUsd = subtotalNoExento * (Number(iva_pct) || 0) / 100
    const totalConIvaUsd = totalUsd + ivaUsd
    const totalConIvaVed = totalConIvaUsd * Number(tasa_cambio || 100)

    if (metodo_pago === 'CREDITO' && cliente_id) {
      const { data: cliente } = await supabase
        .from('clientes')
        .select('deuda_actual_usd, limite_credito_usd')
        .eq('id', cliente_id)
        .single()

      if (cliente) {
        const nuevaDeuda = Number(cliente.deuda_actual_usd) + totalConIvaUsd
        if (nuevaDeuda > Number(cliente.limite_credito_usd)) {
          return NextResponse.json({ error: 'Límite de crédito excedido' }, { status: 400 })
        }
      }
    }

    if (['PAGO_MOVIL', 'PUNTO_DE_VENTA'].includes(metodo_pago) && !referencia_pago) {
      return NextResponse.json({ error: 'Referencia de pago requerida' }, { status: 400 })
    }

    const estadoPago = metodo_pago === 'CREDITO' ? 'PENDIENTE' : 'PAGADO'

    const { data: venta, error: ventaError } = await supabase
      .from('ventas')
      .insert({
        caja_id,
        cliente_id: cliente_id || null,
        usuario_id: session.id,
        total_usd: totalConIvaUsd,
        total_ved: totalConIvaVed,
        tasa_cambio_usada: Number(tasa_cambio || 100),
        metodo_pago,
        estado_pago: estadoPago,
        referencia_pago: referencia_pago || null,
      })
      .select()
      .single()

    if (ventaError) return NextResponse.json({ error: ventaError.message }, { status: 500 })

    if (metodo_pago === 'MIXTO' && body.pagos) {
      for (const pago of body.pagos) {
        const { error: pagoError } = await supabase.from('venta_pagos').insert({
          venta_id: venta.id,
          metodo_pago: pago.metodo,
          monto_usd: Number(pago.monto) || 0,
          referencia: pago.referencia || null,
        })
        if (pagoError) {
          await supabase.from('ventas').delete().eq('id', venta.id)
          return NextResponse.json({ error: pagoError.message }, { status: 500 })
        }
      }
    }

    for (const det of detalleItems) {
      const { error: detError } = await supabase.from('venta_detalles').insert({
        venta_id: venta.id,
        ...det,
      })
      if (detError) {
        await supabase.from('ventas').delete().eq('id', venta.id)
        return NextResponse.json({ error: detError.message }, { status: 500 })
      }

      const { error: stockError } = await supabase.rpc('decrementar_stock', {
        p_producto_id: det.producto_id,
        p_cantidad: det.cantidad,
      })

      if (stockError) {
        const { data: prod } = await supabase
          .from('productos')
          .select('stock_actual')
          .eq('id', det.producto_id)
          .single()

        const nuevoStock = Number(prod?.stock_actual || 0) - det.cantidad
        await supabase
          .from('productos')
          .update({ stock_actual: nuevoStock })
          .eq('id', det.producto_id)
      }
    }

    if (metodo_pago === 'CREDITO' && cliente_id) {
      const { data: cliente } = await supabase
        .from('clientes')
        .select('deuda_actual_usd')
        .eq('id', cliente_id)
        .single()

      if (cliente) {
        const nuevaDeuda = Number(cliente.deuda_actual_usd) + totalConIvaUsd
        await supabase.from('clientes').update({ deuda_actual_usd: nuevaDeuda }).eq('id', cliente_id)
      }
    }

    await supabase.from('transacciones').insert({
      tipo: 'VENTA_POS',
      referencia_id: venta.id,
      monto_usd: totalConIvaUsd,
      monto_ved: totalConIvaVed,
      cliente_id: cliente_id || null,
      usuario_id: session.id,
    })

    await registrarAuditoria('VENTA_POS', 'POS', {
      venta_id: venta.id,
      total_usd: totalConIvaUsd,
      items_count: items.length,
    }, session.id)

    return NextResponse.json({
      ok: true,
      venta_id: venta.id,
      total_usd: totalConIvaUsd,
      total_ved: totalConIvaVed,
      iva_usd: ivaUsd,
    })
  } catch (err) {
    console.error('Checkout error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
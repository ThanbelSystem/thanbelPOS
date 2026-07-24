import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { registrarAuditoria } from '@/lib/auditoria'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('caja_apertura')
      .select('*')
      .eq('estado', 'ABIERTA')
      .single()
    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: 'Error al consultar caja' }, { status: 500 })
    }
    return NextResponse.json(data || null)
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = getSession()
    if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { monto_inicial_usd, monto_inicial_ved } = await request.json()

    const { data: existing } = await supabase
      .from('caja_apertura')
      .select('id')
      .eq('estado', 'ABIERTA')
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Ya hay una caja abierta' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('caja_apertura')
      .insert({
        usuario_id: session.id,
        monto_inicial_usd,
        monto_inicial_ved,
        estado: 'ABIERTA',
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await registrarAuditoria('APERTURA_CAJA', 'Caja', { monto_inicial_usd, monto_inicial_ved }, session.id)

    return NextResponse.json(data)
  } catch (err) {
    console.error('Error apertura caja:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function PATCH() {
  try {
    const session = getSession()
    if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { data: caja } = await supabase
      .from('caja_apertura')
      .select('id')
      .eq('estado', 'ABIERTA')
      .single()

    if (!caja) return NextResponse.json({ error: 'No hay caja abierta' }, { status: 400 })

    const { error } = await supabase
      .from('caja_apertura')
      .update({ estado: 'CERRADA', fecha_cierre: new Date().toISOString() })
      .eq('id', caja.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await registrarAuditoria('CIERRE_CAJA', 'Caja', {}, session.id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Error cierre caja:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
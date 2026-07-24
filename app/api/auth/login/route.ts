import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyPassword } from '@/lib/crypto'
import { registrarAuditoria } from '@/lib/auditoria'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña requeridos' }, { status: 400 })
    }

    const { data: user, error } = await supabase
      .from('usuarios')
      .select('id, nombre, email, password_hash, estado, rol:roles(id, nombre_rol, permisos)')
      .eq('email', email)
      .single()

    if (error || !user) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    if (user.estado !== 'ACTIVO') {
      return NextResponse.json({ error: 'Usuario inactivo' }, { status: 403 })
    }

    const valid = await verifyPassword(password, user.password_hash)
    if (!valid) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    const rol = Array.isArray(user.rol) ? user.rol[0] : user.rol
    const authUser = {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: rol as { id: string; nombre_rol: string; permisos: string[] },
    }

    const token = Buffer.from(JSON.stringify(authUser)).toString('base64')

    await registrarAuditoria('INICIO_SESION', 'Auth', { email: user.email }, user.id)

    return NextResponse.json({ user: authUser, token })
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
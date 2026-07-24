import { cookies } from 'next/headers'

export interface AuthUser {
  id: string
  nombre: string
  email: string
  rol: {
    id: string
    nombre_rol: string
    permisos: string[]
  }
}

export function getSession(): AuthUser | null {
  try {
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get('tabel_session')
    if (!sessionCookie?.value) return null
    const decoded = decodeURIComponent(sessionCookie.value)
    const json = Buffer.from(decoded, 'base64').toString('utf-8')
    return JSON.parse(json) as AuthUser
  } catch {
    return null
  }
}

export function hasPermission(user: AuthUser | null, permission: string): boolean {
  if (!user) return false
  return user.rol.permisos.includes('*') || user.rol.permisos.includes(permission)
}

import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/app-shell'
import UsuariosClient from '@/components/usuarios/usuarios-client'

export default async function UsuariosPage() {
  const session = getSession()
  if (!session) redirect('/login')

  const { data: usuarios } = await supabase
    .from('usuarios')
    .select('*, rol:roles(id, nombre_rol, permisos)')
    .order('nombre')

  const { data: roles } = await supabase.from('roles').select('*').order('nombre_rol')

  return (
    <AppShell user={session}>
      <UsuariosClient usuarios={usuarios || []} roles={roles || []} user={session} />
    </AppShell>
  )
}
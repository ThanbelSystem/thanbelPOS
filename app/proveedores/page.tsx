import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/app-shell'
import ProveedoresClient from '@/components/proveedores/proveedores-client'

export default async function ProveedoresPage() {
  const session = getSession()
  if (!session) redirect('/login')

  const { data: proveedores } = await supabase.from('proveedores').select('*').order('nombre')
  return (
    <AppShell user={session}>
      <ProveedoresClient proveedores={proveedores || []} user={session} />
    </AppShell>
  )
}

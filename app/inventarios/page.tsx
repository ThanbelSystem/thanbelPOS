import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { getConfigDivisas } from '@/lib/divisas'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/app-shell'
import InventariosClient from '@/components/inventarios/inventarios-client'

export default async function InventariosPage() {
  const session = getSession()
  if (!session) redirect('/login')

  const { data: inventarios } = await supabase.from('inventarios').select('*').order('nombre_inventario')
  const { data: productos } = await supabase.from('productos').select('*, inventarios!inner(nombre_inventario, es_materia_prima)').order('nombre')
  const config = await getConfigDivisas()

  return (
    <AppShell user={session}>
      <InventariosClient
        inventarios={inventarios || []}
        productos={productos || []}
        config={config}
        user={session}
      />
    </AppShell>
  )
}

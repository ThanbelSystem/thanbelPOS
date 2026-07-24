import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { getConfigDivisas } from '@/lib/divisas'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/app-shell'
import ClientesClient from '@/components/clientes/clientes-client'

export default async function ClientesPage() {
  const session = getSession()
  if (!session) redirect('/login')

  const { data: clientes } = await supabase.from('clientes').select('*').order('nombre')
  const config = await getConfigDivisas()

  return (
    <AppShell user={session}>
      <ClientesClient clientes={clientes || []} config={config} user={session} />
    </AppShell>
  )
}
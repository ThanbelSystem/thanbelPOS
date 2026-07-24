import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { getConfigDivisas } from '@/lib/divisas'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/app-shell'
import TransaccionesClient from '@/components/transacciones/transacciones-client'

export default async function TransaccionesPage() {
  const session = getSession()
  if (!session) redirect('/login')

  const { data: transacciones } = await supabase
    .from('transacciones')
    .select('*, clientes!inner(nombre)')
    .order('fecha_transaccion', { ascending: false })
    .limit(1000)

  const { data: clientes } = await supabase.from('clientes').select('id, nombre').order('nombre')
  const config = await getConfigDivisas()

  return (
    <AppShell user={session}>
      <TransaccionesClient
        transacciones={transacciones || []}
        clientes={clientes || []}
        config={config}
        user={session}
      />
    </AppShell>
  )
}

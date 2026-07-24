import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { getConfigDivisas } from '@/lib/divisas'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/app-shell'
import ReportesClient from '@/components/reportes/reportes-client'

export default async function ReportesPage() {
  const session = getSession()
  if (!session) redirect('/login')

  const { data: empresa } = await supabase.from('empresa').select('*').single()
  const { data: ventas } = await supabase.from('ventas').select('*, clientes!inner(nombre)').order('fecha_venta', { ascending: false }).limit(500)
  const { data: transacciones } = await supabase.from('transacciones').select('*, clientes!inner(nombre)').order('fecha_transaccion', { ascending: false }).limit(500)
  const config = await getConfigDivisas()

  return (
    <AppShell user={session}>
      <ReportesClient
        empresa={empresa}
        ventas={ventas || []}
        transacciones={transacciones || []}
        config={config}
      />
    </AppShell>
  )
}

import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { getConfigDivisas } from '@/lib/divisas'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/app-shell'
import DashboardClient from '@/components/dashboard/dashboard-client'

export default async function DashboardPage() {
  const session = getSession()
  if (!session) redirect('/login')

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data: ventasHoy } = await supabase
    .from('ventas')
    .select('total_usd')
    .gte('fecha_venta', today.toISOString())

  const { count: transaccionesHoy } = await supabase
    .from('transacciones')
    .select('*', { count: 'exact', head: true })
    .gte('fecha_transaccion', today.toISOString())

  const { count: clientesActivos } = await supabase
    .from('clientes')
    .select('*', { count: 'exact', head: true })

  const last7Days = new Date()
  last7Days.setDate(last7Days.getDate() - 7)

  const { data: ventas7 } = await supabase
    .from('venta_detalles')
    .select('cantidad, venta_id, ventas!inner(fecha_venta)')
    .gte('ventas.fecha_venta', last7Days.toISOString())
    .order('ventas.fecha_venta', { ascending: true }) as unknown as { data: { cantidad: number; ventas: { fecha_venta: string } }[] | null }

  const config = await getConfigDivisas()

  return (
    <AppShell user={session}>
      <DashboardClient
        ventasHoy={ventasHoy || []}
        transaccionesHoy={transaccionesHoy || 0}
        clientesActivos={clientesActivos || 0}
        ventas7={ventas7 || []}
        config={config}
      />
    </AppShell>
  )
}

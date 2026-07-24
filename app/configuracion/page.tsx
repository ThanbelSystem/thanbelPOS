import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { getConfigDivisas } from '@/lib/divisas'
import AppShell from '@/components/layout/app-shell'
import { redirect } from 'next/navigation'
import ConfigClient from '@/components/config/config-client'

export default async function ConfiguracionPage() {
  const session = getSession()
  if (!session) redirect('/login')

  const { data: empresa } = await supabase.from('empresa').select('*').single()
  const { data: configFiscal } = await supabase.from('config_fiscal').select('*').single()
  const { data: divisasHistorial } = await supabase.from('divisas_historial').select('*').order('fecha_registro', { ascending: false }).limit(10)
  const configDivisas = await getConfigDivisas()

  return (
    <AppShell user={session}>
      <ConfigClient
        empresa={empresa}
        configFiscal={configFiscal || { porcentaje_iva: 0, nombre_impresora: '', ancho_papel: '58mm', mostrar_iva: true }}
        configDivisas={configDivisas}
        divisasHistorial={divisasHistorial || []}
        user={session}
      />
    </AppShell>
  )
}

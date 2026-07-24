import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { getConfigDivisas } from '@/lib/divisas'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/app-shell'
import PosClient from '@/components/pos/pos-client'

export default async function PosPage() {
  const session = getSession()
  if (!session) redirect('/login')

  const { data: caja } = await supabase
    .from('caja_apertura')
    .select('*')
    .eq('estado', 'ABIERTA')
    .single()

  const { data: inventarios } = await supabase
    .from('inventarios')
    .select('*')
    .eq('visible_en_pos', true)

  const invIds = (inventarios || []).map(i => i.id)
  const { data: productos } = invIds.length > 0
    ? await supabase
        .from('productos')
        .select('*, inventarios!inner(nombre_inventario)')
        .in('inventario_id', invIds)
        .eq('estado', 'HABILITADO')
        .order('nombre')
    : { data: [] }

  const { data: clientes } = await supabase
    .from('clientes')
    .select('*')
    .order('nombre')

  const { data: configFiscal } = await supabase
    .from('config_fiscal')
    .select('*')
    .single()

  const configDivisas = await getConfigDivisas()

  return (
    <AppShell user={session}>
      <PosClient
        caja={caja}
        inventarios={inventarios || []}
        productos={productos || []}
        clientes={clientes || []}
        configFiscal={configFiscal || { porcentaje_iva: 0, mostrar_iva: true, ancho_papel: '58mm', nombre_impresora: '' }}
        configDivisas={configDivisas}
        user={session}
      />
    </AppShell>
  )
}

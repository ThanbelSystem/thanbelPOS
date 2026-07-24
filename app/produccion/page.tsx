import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { getConfigDivisas } from '@/lib/divisas'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/app-shell'
import ProduccionClient from '@/components/produccion/produccion-client'

export default async function ProduccionPage() {
  const session = getSession()
  if (!session) redirect('/login')

  const { data: inventarios } = await supabase.from('inventarios').select('*')
  const { data: productos } = await supabase.from('productos').select('*, inventarios!inner(nombre_inventario, es_materia_prima)').order('nombre')
  const { data: recetas } = await supabase.from('recetas_produccion').select('*, producto_resultante:productos!inner(nombre), receta_ingredientes(id)').order('fecha_creacion', { ascending: false })
  const config = await getConfigDivisas()

  return (
    <AppShell user={session}>
      <ProduccionClient
        inventarios={inventarios || []}
        productos={productos || []}
        recetas={recetas || []}
        config={config}
        user={session}
      />
    </AppShell>
  )
}

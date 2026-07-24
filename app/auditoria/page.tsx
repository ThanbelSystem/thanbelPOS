import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/app-shell'
import AuditoriaClient from '@/components/auditoria/auditoria-client'

export default async function AuditoriaPage() {
  const session = getSession()
  if (!session) redirect('/login')

  const { data: logs } = await supabase
    .from('auditoria_logs')
    .select('*, usuarios!inner(nombre)')
    .order('fecha_hora', { ascending: false })
    .limit(1000)

  return (
    <AppShell user={session}>
      <AuditoriaClient logs={logs || []} />
    </AppShell>
  )
}

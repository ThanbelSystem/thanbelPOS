import { supabase } from './supabase'

export async function registrarAuditoria(
  accion: string,
  modulo: string,
  detalles?: Record<string, unknown>,
  usuarioId?: string | null
): Promise<void> {
  try {
    const { error } = await supabase.from('auditoria_logs').insert({
      usuario_id: usuarioId || null,
      accion,
      modulo,
      detalles_json: detalles || null,
      ip_address: null,
    })
    if (error) console.error('Error registrando auditoría:', error)
  } catch (err) {
    console.error('Error registrando auditoría:', err)
  }
}

export async function registrarAuditoriaCliente(
  usuario_id: string,
  accion: string,
  modulo: string,
  detalles?: Record<string, unknown>
): Promise<void> {
  try {
    const { error } = await supabase.from('auditoria_logs').insert({
      usuario_id,
      accion,
      modulo,
      detalles_json: detalles || null,
      ip_address: null,
    })
    if (error) console.error('Error registrando auditoría:', error)
  } catch (err) {
    console.error('Error registrando auditoría:', err)
  }
}

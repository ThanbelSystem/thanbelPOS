'use client'

import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { Search, Plus, Pencil, Trash2, MapPin, MessageCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { fmtMonto, ConfigDivisas, DEFAULT_DIVISAS } from '@/lib/divisas'
import { registrarAuditoriaCliente } from '@/lib/auditoria'
import Pagination from '@/components/ui/pagination'
import ConfirmDialog from '@/components/ui/confirm-dialog'

interface Cliente {
  id: string
  nombre: string
  identificacion_cedula_rif: string
  telefono: string
  limite_credito_usd: number
  deuda_actual_usd: number
  fecha_vencimiento_credito: string
  latitud_gps: number
  longitud_gps: number
}

interface ClientesClientProps {
  clientes: Cliente[]
  config: ConfigDivisas
  user: { id: string }
}

export default function ClientesClient({ clientes: initialClientes, config, user }: ClientesClientProps) {
  const [clientes, setClientes] = useState(initialClientes)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Cliente | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [transactionsModal, setTransactionsModal] = useState<Cliente | null>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [form, setForm] = useState({
    nombre: '', identificacion_cedula_rif: '', telefono: '',
    limite_credito_usd: '', fecha_vencimiento_credito: '',
    latitud_gps: '', longitud_gps: '',
  })
  const [loading, setLoading] = useState(false)
  const [transLoading, setTransLoading] = useState(false)
  const [abonoMonto, setAbonoMonto] = useState('')
  const [cobroMonto, setCobroMonto] = useState('')

  const filtered = useMemo(() => clientes.filter(c =>
    c.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (c.identificacion_cedula_rif && c.identificacion_cedula_rif.toLowerCase().includes(search.toLowerCase())) ||
    (c.telefono && c.telefono.toLowerCase().includes(search.toLowerCase()))
  ), [clientes, search])

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  const openNew = () => {
    setEditing(null)
    setForm({ nombre: '', identificacion_cedula_rif: '', telefono: '', limite_credito_usd: '', fecha_vencimiento_credito: '', latitud_gps: '', longitud_gps: '' })
    setModalOpen(true)
  }

  const openEdit = (c: Cliente) => {
    setEditing(c)
    setForm({
      nombre: c.nombre,
      identificacion_cedula_rif: c.identificacion_cedula_rif || '',
      telefono: c.telefono || '',
      limite_credito_usd: String(c.limite_credito_usd || 0),
      fecha_vencimiento_credito: c.fecha_vencimiento_credito || '',
      latitud_gps: c.latitud_gps ? String(c.latitud_gps) : '',
      longitud_gps: c.longitud_gps ? String(c.longitud_gps) : '',
    })
    setModalOpen(true)
  }

  const captureGps = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setForm(prev => ({ ...prev, latitud_gps: String(pos.coords.latitude), longitud_gps: String(pos.coords.longitude) })),
        () => toast.error('No se pudo obtener la ubicación')
      )
    }
  }

  const save = async () => {
    if (!form.nombre) { toast.error('El nombre es requerido'); return }
    setLoading(true)
    try {
      const data = {
        nombre: form.nombre,
        identificacion_cedula_rif: form.identificacion_cedula_rif || null,
        telefono: form.telefono || null,
        limite_credito_usd: Number(form.limite_credito_usd) || 0,
        fecha_vencimiento_credito: form.fecha_vencimiento_credito || null,
        latitud_gps: form.latitud_gps ? Number(form.latitud_gps) : null,
        longitud_gps: form.longitud_gps ? Number(form.longitud_gps) : null,
      }

      if (editing) {
        const { error } = await supabase.from('clientes').update(data).eq('id', editing.id)
        if (error) { toast.error(error.message); return }
        setClientes(prev => prev.map(c => c.id === editing.id ? { ...c, ...data } as Cliente : c))
        await registrarAuditoriaCliente(user.id, 'EDITAR_CLIENTE', 'Clientes', { id: editing.id })
        toast.success('Cliente actualizado')
      } else {
        const { data: nuevo, error } = await supabase.from('clientes').insert(data).select().single()
        if (error) { toast.error(error.message); return }
        setClientes(prev => [...prev, nuevo as Cliente])
        await registrarAuditoriaCliente(user.id, 'CREAR_CLIENTE', 'Clientes', { id: nuevo.id })
        toast.success('Cliente creado')
      }
      setModalOpen(false)
    } catch { toast.error('Error al guardar') }
    finally { setLoading(false) }
  }

  const deleteCliente = async () => {
    if (!deleteConfirm) return
    setLoading(true)
    try {
      const { error } = await supabase.from('clientes').delete().eq('id', deleteConfirm)
      if (error) { toast.error(error.message); return }
      setClientes(prev => prev.filter(c => c.id !== deleteConfirm))
      await registrarAuditoriaCliente(user.id, 'ELIMINAR_CLIENTE', 'Clientes', { id: deleteConfirm })
      toast.success('Cliente eliminado')
      setDeleteConfirm(null)
    } catch { toast.error('Error al eliminar') }
    finally { setLoading(false) }
  }

  const openTransactions = async (c: Cliente) => {
    setTransactionsModal(c)
    setTransLoading(true)
    const { data } = await supabase
      .from('transacciones')
      .select('*')
      .eq('cliente_id', c.id)
      .order('fecha_transaccion', { ascending: false })
    setTransactions(data || [])
    setTransLoading(false)
  }

  const registrarAbono = async () => {
    if (!transactionsModal || !abonoMonto) { toast.error('Ingrese un monto'); return }
    setLoading(true)
    try {
      const monto = Number(abonoMonto)
      const { error } = await supabase.from('transacciones').insert({
        tipo: 'ABONO_CLIENTE',
        monto_usd: monto,
        monto_ved: monto * config.tasa_cambio,
        cliente_id: transactionsModal.id,
        usuario_id: user.id,
      })
      if (error) { toast.error(error.message); return }
      await supabase.from('clientes').update({ deuda_actual_usd: Math.max(0, Number(transactionsModal.deuda_actual_usd) - monto) }).eq('id', transactionsModal.id)
      setClientes(prev => prev.map(c => c.id === transactionsModal.id ? { ...c, deuda_actual_usd: Math.max(0, Number(c.deuda_actual_usd) - monto) } as Cliente : c))
      if (transactionsModal) {
        setTransactionsModal({ ...transactionsModal, deuda_actual_usd: Math.max(0, Number(transactionsModal.deuda_actual_usd) - monto) })
      }
      await registrarAuditoriaCliente(user.id, 'ABONO_CLIENTE', 'Clientes', { cliente_id: transactionsModal.id, monto })
      toast.success('Abono registrado')
      setAbonoMonto('')
      openTransactions(transactionsModal)
    } catch { toast.error('Error al registrar') }
    finally { setLoading(false) }
  }

  const registrarCobro = async () => {
    if (!transactionsModal || !cobroMonto) { toast.error('Ingrese un monto'); return }
    setLoading(true)
    try {
      const monto = Number(cobroMonto)
      const { error } = await supabase.from('transacciones').insert({
        tipo: 'COBRO_DEUDA',
        monto_usd: monto,
        monto_ved: monto * config.tasa_cambio,
        cliente_id: transactionsModal.id,
        usuario_id: user.id,
      })
      if (error) { toast.error(error.message); return }
      await supabase.from('clientes').update({ deuda_actual_usd: Number(transactionsModal.deuda_actual_usd) + monto }).eq('id', transactionsModal.id)
      setClientes(prev => prev.map(c => c.id === transactionsModal.id ? { ...c, deuda_actual_usd: Number(c.deuda_actual_usd) + monto } as Cliente : c))
      if (transactionsModal) {
        setTransactionsModal({ ...transactionsModal, deuda_actual_usd: Number(transactionsModal.deuda_actual_usd) + monto })
      }
      await registrarAuditoriaCliente(user.id, 'COBRO_DEUDA', 'Clientes', { cliente_id: transactionsModal.id, monto })
      toast.success('Cobro registrado')
      setCobroMonto('')
      openTransactions(transactionsModal)
    } catch { toast.error('Error al registrar') }
    finally { setLoading(false) }
  }

  const sendWhatsApp = (c: Cliente) => {
    if (!c.telefono) { toast.error('El cliente no tiene teléfono'); return }
    const phone = c.telefono.replace(/[^0-9]/g, '')
    const msg = encodeURIComponent(`Hola ${c.nombre}, le recordamos que tiene un saldo pendiente de ${fmtMonto(Number(c.deuda_actual_usd), config)}. Por favor contacte a ThanBel POS.`)
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank')
    registrarAuditoriaCliente(user.id, 'WHATSAPP_CLIENTE', 'Clientes', { cliente_id: c.id, deuda: c.deuda_actual_usd })
  }

  return (
    <div className="space-y-4 animate-in-fade">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Clientes</h1>
          <p className="text-sm text-slate-500 mt-1">{clientes.length} registros</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700">
          <Plus className="w-4 h-4" /> Nuevo cliente
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="Buscar por nombre, RIF o teléfono..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
        <table className="w-full">
          <thead><tr className="bg-slate-50">
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Nombre</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Identificación</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Teléfono</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Límite crédito</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Deuda actual</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">GPS</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Acciones</th>
          </tr></thead>
          <tbody>
            {paginated.map(c => (
              <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer" onClick={() => openTransactions(c)}>
                <td className="px-4 py-3 text-sm font-medium text-slate-700">{c.nombre}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{c.identificacion_cedula_rif || '-'}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{c.telefono || '-'}</td>
                <td className="px-4 py-3 text-sm tabular-nums text-right">{fmtMonto(Number(c.limite_credito_usd), config)}</td>
                <td className="px-4 py-3 text-sm tabular-nums text-right">
                  <span className={Number(c.deuda_actual_usd) > 0 ? 'text-rose-600 font-semibold' : 'text-slate-500'}>
                    {fmtMonto(Number(c.deuda_actual_usd), config)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {c.latitud_gps && c.longitud_gps ? (
                    <a href={`https://www.google.com/maps?q=${c.latitud_gps},${c.longitud_gps}`} target="_blank" rel="noopener noreferrer"
                      className="text-emerald-600 hover:text-emerald-700" onClick={e => e.stopPropagation()}>
                      <MapPin className="w-4 h-4 inline" />
                    </a>
                  ) : '-'}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                    <button onClick={() => sendWhatsApp(c)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-green-50 text-green-600" title="Enviar WhatsApp">
                      <MessageCircle className="w-4 h-4" />
                    </button>
                    <button onClick={() => openEdit(c)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteConfirm(c.id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-rose-50 text-rose-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination data={filtered} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin p-6 animate-in-fade">
            <button onClick={() => setModalOpen(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
            <h3 className="text-lg font-semibold text-slate-800 mb-1">{editing ? 'Editar cliente' : 'Nuevo cliente'}</h3>
            <p className="text-sm text-slate-500 mb-4">Complete los datos del cliente</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
                <input value={form.nombre} onChange={e => setForm(prev => ({ ...prev, nombre: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cédula/RIF</label>
                  <input value={form.identificacion_cedula_rif} onChange={e => setForm(prev => ({ ...prev, identificacion_cedula_rif: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                  <input value={form.telefono} onChange={e => setForm(prev => ({ ...prev, telefono: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Límite crédito (USD)</label>
                  <input type="number" step="0.01" value={form.limite_credito_usd} onChange={e => setForm(prev => ({ ...prev, limite_credito_usd: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vencimiento crédito</label>
                  <input type="date" value={form.fecha_vencimiento_credito} onChange={e => setForm(prev => ({ ...prev, fecha_vencimiento_credito: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Coordenadas GPS</label>
                <div className="flex gap-2">
                  <input placeholder="Latitud" value={form.latitud_gps} onChange={e => setForm(prev => ({ ...prev, latitud_gps: e.target.value }))}
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" />
                  <input placeholder="Longitud" value={form.longitud_gps} onChange={e => setForm(prev => ({ ...prev, longitud_gps: e.target.value }))}
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" />
                  <button onClick={captureGps} className="px-3 py-2 bg-slate-100 rounded-lg hover:bg-slate-200 text-sm">
                    <MapPin className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                <button onClick={save} disabled={loading}
                  className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                  {loading ? 'Guardando...' : editing ? 'Actualizar' : 'Crear cliente'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {transactionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setTransactionsModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin p-6 animate-in-fade">
            <button onClick={() => setTransactionsModal(null)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
            <h3 className="text-lg font-semibold text-slate-800">{transactionsModal.nombre}</h3>
            <p className="text-sm text-slate-500 mb-4">Deuda actual: {fmtMonto(Number(transactionsModal.deuda_actual_usd), config)}</p>
            <div className="flex gap-3 mb-4">
              <div className="flex-1">
                <input type="number" step="0.01" placeholder="Monto abono" value={abonoMonto} onChange={e => setAbonoMonto(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" />
                <button onClick={registrarAbono} disabled={loading}
                  className="mt-1 w-full bg-emerald-600 text-white py-1.5 rounded-lg text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50">
                  Registrar Abono
                </button>
              </div>
              <div className="flex-1">
                <input type="number" step="0.01" placeholder="Monto cobro" value={cobroMonto} onChange={e => setCobroMonto(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" />
                <button onClick={registrarCobro} disabled={loading}
                  className="mt-1 w-full bg-amber-500 text-white py-1.5 rounded-lg text-xs font-semibold hover:bg-amber-600 disabled:opacity-50">
                  Registrar Cobro
                </button>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Historial de transacciones</p>
              {transLoading ? <p className="text-sm text-slate-400">Cargando...</p> : (
                transactions.length === 0 ? <p className="text-sm text-slate-400">Sin transacciones</p> : (
                  <div className="space-y-1">
                    {transactions.map(t => (
                      <div key={t.id} className="flex items-center justify-between text-sm py-1">
                        <span className="text-slate-500">{new Date(t.fecha_transaccion).toLocaleDateString('es-VE')}</span>
                        <span className="font-medium">{t.tipo}</span>
                        <span className="tabular-nums">{fmtMonto(Number(t.monto_usd), config)}</span>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={deleteCliente}
        title="Eliminar cliente"
        description="¿Está seguro de eliminar este cliente? Esta acción no puede deshacerse."
        variant="danger"
        loading={loading}
      />
    </div>
  )
}

'use client'

import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { Search, Plus, Pencil, Trash2, MapPin, Phone } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { registrarAuditoriaCliente } from '@/lib/auditoria'
import Pagination from '@/components/ui/pagination'
import ConfirmDialog from '@/components/ui/confirm-dialog'

interface Proveedor {
  id: string
  nombre: string
  rif: string
  telefono: string
  latitud_gps: number
  longitud_gps: number
}

interface ProveedoresClientProps {
  proveedores: Proveedor[]
  user: { id: string }
}

export default function ProveedoresClient({ proveedores: initial, user }: ProveedoresClientProps) {
  const [proveedores, setProveedores] = useState(initial)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Proveedor | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [form, setForm] = useState({ nombre: '', rif: '', telefono: '', latitud_gps: '', longitud_gps: '' })
  const [loading, setLoading] = useState(false)

  const filtered = useMemo(() => proveedores.filter(p =>
    p.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (p.rif && p.rif.toLowerCase().includes(search.toLowerCase())) ||
    (p.telefono && p.telefono.includes(search))
  ), [proveedores, search])

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  const openNew = () => {
    setEditing(null)
    setForm({ nombre: '', rif: '', telefono: '', latitud_gps: '', longitud_gps: '' })
    setModalOpen(true)
  }

  const openEdit = (p: Proveedor) => {
    setEditing(p)
    setForm({
      nombre: p.nombre,
      rif: p.rif || '',
      telefono: p.telefono || '',
      latitud_gps: p.latitud_gps ? String(p.latitud_gps) : '',
      longitud_gps: p.longitud_gps ? String(p.longitud_gps) : '',
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
        rif: form.rif || null,
        telefono: form.telefono || null,
        latitud_gps: form.latitud_gps ? Number(form.latitud_gps) : null,
        longitud_gps: form.longitud_gps ? Number(form.longitud_gps) : null,
      }

      if (editing) {
        const { error } = await supabase.from('proveedores').update(data).eq('id', editing.id)
        if (error) { toast.error(error.message); return }
        setProveedores(prev => prev.map(p => p.id === editing.id ? { ...p, ...data } as Proveedor : p))
        await registrarAuditoriaCliente(user.id, 'EDITAR_PROVEEDOR', 'Proveedores', { id: editing.id })
        toast.success('Proveedor actualizado')
      } else {
        const { data: nuevo, error } = await supabase.from('proveedores').insert(data).select().single()
        if (error) { toast.error(error.message); return }
        setProveedores(prev => [...prev, nuevo as Proveedor])
        await registrarAuditoriaCliente(user.id, 'CREAR_PROVEEDOR', 'Proveedores', { id: nuevo.id })
        toast.success('Proveedor creado')
      }
      setModalOpen(false)
    } catch { toast.error('Error al guardar') }
    finally { setLoading(false) }
  }

  const deleteProv = async () => {
    if (!deleteConfirm) return
    setLoading(true)
    try {
      const { error } = await supabase.from('proveedores').delete().eq('id', deleteConfirm)
      if (error) { toast.error(error.message); return }
      setProveedores(prev => prev.filter(p => p.id !== deleteConfirm))
      await registrarAuditoriaCliente(user.id, 'ELIMINAR_PROVEEDOR', 'Proveedores', { id: deleteConfirm })
      toast.success('Proveedor eliminado')
      setDeleteConfirm(null)
    } catch { toast.error('Error al eliminar') }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-4 animate-in-fade">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Proveedores</h1>
          <p className="text-sm text-slate-500 mt-1">{proveedores.length} registros</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700">
          <Plus className="w-4 h-4" /> Nuevo proveedor
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
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">RIF</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Teléfono</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">GPS</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Acciones</th>
          </tr></thead>
          <tbody>
            {paginated.map(p => (
              <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3 text-sm font-medium text-slate-700">{p.nombre}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{p.rif || '-'}</td>
                <td className="px-4 py-3 text-sm text-slate-500 flex items-center gap-1">
                  {p.telefono || '-'}
                </td>
                <td className="px-4 py-3 text-right">
                  {p.latitud_gps && p.longitud_gps ? (
                    <a href={`https://www.google.com/maps?q=${p.latitud_gps},${p.longitud_gps}`} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-700">
                      <MapPin className="w-4 h-4 inline" />
                    </a>
                  ) : '-'}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(p)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteConfirm(p.id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-rose-50 text-rose-500">
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
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-in-fade">
            <button onClick={() => setModalOpen(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
            <h3 className="text-lg font-semibold text-slate-800 mb-1">{editing ? 'Editar proveedor' : 'Nuevo proveedor'}</h3>
            <p className="text-sm text-slate-500 mb-4">Complete los datos del proveedor</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
                <input value={form.nombre} onChange={e => setForm(prev => ({ ...prev, nombre: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">RIF</label>
                  <input value={form.rif} onChange={e => setForm(prev => ({ ...prev, rif: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                  <input value={form.telefono} onChange={e => setForm(prev => ({ ...prev, telefono: e.target.value }))}
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
                  {loading ? 'Guardando...' : editing ? 'Actualizar' : 'Crear proveedor'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={deleteProv}
        title="Eliminar proveedor"
        description="¿Está seguro de eliminar este proveedor?"
        variant="danger"
        loading={loading}
      />
    </div>
  )
}

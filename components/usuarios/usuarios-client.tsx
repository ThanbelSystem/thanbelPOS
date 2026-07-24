'use client'

import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { Search, Plus, Pencil, Trash2, ShieldCheck, ShieldOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { hashPassword } from '@/lib/crypto'
import { registrarAuditoriaCliente } from '@/lib/auditoria'
import Pagination from '@/components/ui/pagination'
import ConfirmDialog from '@/components/ui/confirm-dialog'

interface UsuariosClientProps {
  usuarios: any[]
  roles: any[]
  user: { id: string }
}

export default function UsuariosClient({ usuarios: initial, roles, user }: UsuariosClientProps) {
  const [usuarios, setUsuarios] = useState(initial)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [form, setForm] = useState({ nombre: '', email: '', password: '', rol_id: '', estado: 'ACTIVO' })
  const [loading, setLoading] = useState(false)

  const filtered = useMemo(() => usuarios.filter(u =>
    u.nombre.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  ), [usuarios, search])

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  const total = usuarios.length
  const activos = usuarios.filter(u => u.estado === 'ACTIVO').length
  const inactivos = usuarios.filter(u => u.estado === 'INACTIVO').length
  const rolesCount = new Set(usuarios.map(u => u.rol?.nombre_rol)).size

  const openNew = () => {
    setEditing(null)
    setForm({ nombre: '', email: '', password: '', rol_id: roles[0]?.id || '', estado: 'ACTIVO' })
    setModalOpen(true)
  }

  const openEdit = (u: any) => {
    setEditing(u)
    setForm({ nombre: u.nombre, email: u.email, password: '', rol_id: u.rol_id, estado: u.estado })
    setModalOpen(true)
  }

  const save = async () => {
    if (!form.nombre || !form.email) { toast.error('Nombre y email requeridos'); return }
    if (!editing && !form.password) { toast.error('Contraseña requerida para nuevo usuario'); return }
    setLoading(true)
    try {
      const data: any = { nombre: form.nombre, email: form.email, rol_id: form.rol_id || null, estado: form.estado }
      if (form.password) {
        data.password_hash = await hashPassword(form.password)
      }

      if (editing) {
        const { error } = await supabase.from('usuarios').update(data).eq('id', editing.id)
        if (error) { toast.error(error.message); return }
        setUsuarios(prev => prev.map(u => u.id === editing.id ? { ...u, ...data, rol: roles.find(r => r.id === form.rol_id) } : u))
        await registrarAuditoriaCliente(user.id, 'EDITAR_USUARIO', 'Usuarios', { id: editing.id })
        toast.success('Usuario actualizado')
      } else {
        const { data: nuevo, error } = await supabase.from('usuarios').insert(data).select('*, rol:roles(id, nombre_rol, permisos)').single()
        if (error) { toast.error(error.message); return }
        setUsuarios(prev => [...prev, nuevo])
        await registrarAuditoriaCliente(user.id, 'CREAR_USUARIO', 'Usuarios', { id: nuevo.id })
        toast.success('Usuario creado')
      }
      setModalOpen(false)
    } catch { toast.error('Error al guardar') }
    finally { setLoading(false) }
  }

  const toggleEstado = async (id: string, current: string) => {
    const nuevoEstado = current === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'
    setLoading(true)
    try {
      const { error } = await supabase.from('usuarios').update({ estado: nuevoEstado }).eq('id', id)
      if (error) { toast.error(error.message); return }
      setUsuarios(prev => prev.map(u => u.id === id ? { ...u, estado: nuevoEstado } : u))
      await registrarAuditoriaCliente(user.id, nuevoEstado === 'ACTIVO' ? 'ACTIVAR_USUARIO' : 'DESACTIVAR_USUARIO', 'Usuarios', { id })
      toast.success(`Usuario ${nuevoEstado === 'ACTIVO' ? 'activado' : 'desactivado'}`)
    } catch { toast.error('Error al cambiar estado') }
    finally { setLoading(false) }
  }

  const deleteUser = async () => {
    if (!deleteConfirm) return
    setLoading(true)
    try {
      const { error } = await supabase.from('usuarios').delete().eq('id', deleteConfirm)
      if (error) { toast.error(error.message); return }
      setUsuarios(prev => prev.filter(u => u.id !== deleteConfirm))
      await registrarAuditoriaCliente(user.id, 'ELIMINAR_USUARIO', 'Usuarios', { id: deleteConfirm })
      toast.success('Usuario eliminado')
      setDeleteConfirm(null)
    } catch { toast.error('Error al eliminar') }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-4 animate-in-fade">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Usuarios</h1>
          <p className="text-sm text-slate-500 mt-1">Gestión del personal</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700">
          <Plus className="w-4 h-4" /> Nuevo usuario
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs text-slate-500">Total</p>
          <p className="text-lg font-bold text-slate-800 tabular-nums">{total}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs text-slate-500">Activos</p>
          <p className="text-lg font-bold text-emerald-600 tabular-nums">{activos}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs text-slate-500">Inactivos</p>
          <p className="text-lg font-bold text-rose-600 tabular-nums">{inactivos}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs text-slate-500">Roles</p>
          <p className="text-lg font-bold text-amber-600 tabular-nums">{rolesCount}</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="Buscar usuario..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
        <table className="w-full">
          <thead><tr className="bg-slate-50">
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Usuario</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Email</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Rol</th>
            <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Estado</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Creado</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Acciones</th>
          </tr></thead>
          <tbody>
            {paginated.map(u => {
              const initial = u.nombre?.charAt(0)?.toUpperCase() || '?'
              return (
                <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs font-semibold">
                        {initial}
                      </div>
                      <span className="text-sm font-medium text-slate-700">{u.nombre}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
                      {u.rol?.nombre_rol || 'Sin rol'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full ${
                      u.estado === 'ACTIVO' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {u.estado === 'ACTIVO' ? <ShieldCheck className="w-3 h-3" /> : <ShieldOff className="w-3 h-3" />}
                      {u.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">{new Date(u.fecha_creacion).toLocaleDateString('es-VE')}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => toggleEstado(u.id, u.estado)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500" title={u.estado === 'ACTIVO' ? 'Desactivar' : 'Activar'}>
                        {u.estado === 'ACTIVO' ? <ShieldOff className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                      </button>
                      <button onClick={() => openEdit(u)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteConfirm(u.id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-rose-50 text-rose-500" disabled={u.id === user.id}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
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
            <h3 className="text-lg font-semibold text-slate-800 mb-1">{editing ? 'Editar usuario' : 'Nuevo usuario'}</h3>
            <p className="text-sm text-slate-500 mb-4">{editing ? 'Deje la contraseña vacía para mantener la actual' : 'Complete los datos del usuario'}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
                <input value={form.nombre} onChange={e => setForm(prev => ({ ...prev, nombre: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input type="email" value={form.email} onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{editing ? 'Nueva contraseña (opcional)' : 'Contraseña *'}</label>
                <input type="password" value={form.password} onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Rol</label>
                  <select value={form.rol_id} onChange={e => setForm(prev => ({ ...prev, rol_id: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none">
                    {roles.map(r => <option key={r.id} value={r.id}>{r.nombre_rol}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
                  <select value={form.estado} onChange={e => setForm(prev => ({ ...prev, estado: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none">
                    <option value="ACTIVO">Activo</option>
                    <option value="INACTIVO">Inactivo</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                <button onClick={save} disabled={loading}
                  className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                  {loading ? 'Guardando...' : editing ? 'Actualizar' : 'Crear usuario'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={deleteUser}
        title="Eliminar usuario"
        description="¿Está seguro de eliminar este usuario?"
        variant="danger"
        loading={loading}
      />
    </div>
  )
}

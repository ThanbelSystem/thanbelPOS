'use client'

import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import {
  Search, Plus, Pencil, Trash2, Boxes, Package, ToggleLeft, ToggleRight, AlertTriangle,
  ArrowLeftRight,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { fmtMonto, fmtPrincipal, ConfigDivisas, DEFAULT_DIVISAS } from '@/lib/divisas'
import { parseNum } from '@/lib/utils'
import { registrarAuditoriaCliente } from '@/lib/auditoria'
import Pagination from '@/components/ui/pagination'
import ConfirmDialog from '@/components/ui/confirm-dialog'

interface InventariosClientProps {
  inventarios: any[]
  productos: any[]
  config: ConfigDivisas
  user: { id: string }
}

export default function InventariosClient({ inventarios: initialInv, productos: initialProd, config, user }: InventariosClientProps) {
  const [tab, setTab] = useState<'inventarios' | 'productos'>('inventarios')
  const [inventarios, setInventarios] = useState(initialInv)
  const [productos, setProductos] = useState(initialProd)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [invModalOpen, setInvModalOpen] = useState(false)
  const [prodModalOpen, setProdModalOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleteType, setDeleteType] = useState<'inventario' | 'producto'>('inventario')
  const [devModalOpen, setDevModalOpen] = useState(false)
  const [devItems, setDevItems] = useState<{ producto_id: string; nombre: string; cantidad: string }[]>([])
  const [devSearch, setDevSearch] = useState('')
  const [devInvFilter, setDevInvFilter] = useState('all')

  const [invForm, setInvForm] = useState({ nombre_inventario: '', es_materia_prima: false, visible_en_pos: false })
  const [prodForm, setProdForm] = useState({
    nombre: '', codigo_barras: '', unidad_medida: 'UND', inventario_id: '',
    stock_actual: '0', stock_minimo: '0', costo_compra_usd: '0', precio_venta_usd: '0', exento_iva: false, estado: 'HABILITADO',
  })
  const [loading, setLoading] = useState(false)

  const filteredProductos = useMemo(() => productos.filter(p =>
    p.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (p.codigo_barras && p.codigo_barras.toLowerCase().includes(search.toLowerCase()))
  ), [productos, search])

  const paginatedProductos = filteredProductos.slice((page - 1) * pageSize, page * pageSize)

  const protectedInvId = inventarios.find(i => i.es_materia_prima)?.id

  const openNewInv = () => {
    setEditing(null)
    setInvForm({ nombre_inventario: '', es_materia_prima: false, visible_en_pos: true })
    setInvModalOpen(true)
  }

  const openNewProd = () => {
    setEditing(null)
    setProdForm({
      nombre: '', codigo_barras: '', unidad_medida: 'UND', inventario_id: inventarios[0]?.id || '',
      stock_actual: '0', stock_minimo: '0', costo_compra_usd: '0', precio_venta_usd: '0', exento_iva: false, estado: 'HABILITADO',
    })
    setProdModalOpen(true)
  }

  const openEditProd = (p: any) => {
    setEditing(p)
    setProdForm({
      nombre: p.nombre,
      codigo_barras: p.codigo_barras || '',
      unidad_medida: p.unidad_medida,
      inventario_id: p.inventario_id,
      stock_actual: String(p.stock_actual || 0),
      stock_minimo: String(p.stock_minimo || 0),
      costo_compra_usd: String(p.costo_compra_usd || 0),
      precio_venta_usd: String(p.precio_venta_usd || 0),
      exento_iva: p.exento_iva || false,
      estado: p.estado,
    })
    setProdModalOpen(true)
  }

  const saveInv = async () => {
    if (!invForm.nombre_inventario) { toast.error('Nombre requerido'); return }
    setLoading(true)
    try {
      const data = {
        nombre_inventario: invForm.nombre_inventario,
        es_materia_prima: invForm.es_materia_prima,
        visible_en_pos: invForm.visible_en_pos,
      }
      if (editing) {
        const { error } = await supabase.from('inventarios').update(data).eq('id', editing.id)
        if (error) { toast.error(error.message); return }
        setInventarios(prev => prev.map(i => i.id === editing.id ? { ...i, ...data } : i))
        await registrarAuditoriaCliente(user.id, 'EDITAR_INVENTARIO', 'Inventarios', { id: editing.id })
        toast.success('Inventario actualizado')
      } else {
        const { data: nuevo, error } = await supabase.from('inventarios').insert(data).select().single()
        if (error) { toast.error(error.message); return }
        setInventarios(prev => [...prev, nuevo])
        await registrarAuditoriaCliente(user.id, 'CREAR_INVENTARIO', 'Inventarios', { id: nuevo.id })
        toast.success('Inventario creado')
      }
      setInvModalOpen(false)
    } catch { toast.error('Error al guardar') }
    finally { setLoading(false) }
  }

  const saveProd = async () => {
    if (!prodForm.nombre || !prodForm.inventario_id) { toast.error('Nombre e inventario requeridos'); return }
    setLoading(true)
    try {
      const data = {
        nombre: prodForm.nombre,
        codigo_barras: prodForm.codigo_barras || null,
        unidad_medida: prodForm.unidad_medida,
        inventario_id: prodForm.inventario_id,
        stock_actual: parseNum(prodForm.stock_actual) || 0,
        stock_minimo: parseNum(prodForm.stock_minimo) || 0,
        costo_compra_usd: parseNum(prodForm.costo_compra_usd) || 0,
        precio_venta_usd: parseNum(prodForm.precio_venta_usd) || 0,
        exento_iva: prodForm.exento_iva,
        estado: prodForm.estado,
      }
      if (editing) {
        const { error } = await supabase.from('productos').update(data).eq('id', editing.id)
        if (error) { toast.error(error.message); return }
        setProductos(prev => prev.map(p => p.id === editing.id ? { ...p, ...data } : p))
        await registrarAuditoriaCliente(user.id, 'EDITAR_PRODUCTO', 'Inventarios', { id: editing.id })
        toast.success('Producto actualizado')
      } else {
        const { data: nuevo, error } = await supabase.from('productos').insert(data).select().single()
        if (error) { toast.error(error.message); return }
        setProductos(prev => [...prev, nuevo])
        await registrarAuditoriaCliente(user.id, 'CREAR_PRODUCTO', 'Inventarios', { id: nuevo.id })
        toast.success('Producto creado')
      }
      setProdModalOpen(false)
    } catch { toast.error('Error al guardar') }
    finally { setLoading(false) }
  }

  const toggleEstado = async (id: string, current: string) => {
    const nuevo = current === 'HABILITADO' ? 'DESHABILITADO' : 'HABILITADO'
    const { error } = await supabase.from('productos').update({ estado: nuevo }).eq('id', id)
    if (error) { toast.error(error.message); return }
    setProductos(prev => prev.map(p => p.id === id ? { ...p, estado: nuevo } : p))
    await registrarAuditoriaCliente(user.id, nuevo === 'HABILITADO' ? 'ACTIVAR_PRODUCTO' : 'DESACTIVAR_PRODUCTO', 'Inventarios', { id })
  }

  const deleteItem = async () => {
    if (!deleteConfirm) return
    setLoading(true)
    try {
      if (deleteType === 'inventario') {
        await supabase.from('inventarios').delete().eq('id', deleteConfirm)
        setInventarios(prev => prev.filter(i => i.id !== deleteConfirm))
        await registrarAuditoriaCliente(user.id, 'ELIMINAR_INVENTARIO', 'Inventarios', { id: deleteConfirm })
      } else {
        await supabase.from('productos').delete().eq('id', deleteConfirm)
        setProductos(prev => prev.filter(p => p.id !== deleteConfirm))
        await registrarAuditoriaCliente(user.id, 'ELIMINAR_PRODUCTO', 'Inventarios', { id: deleteConfirm })
      }
      toast.success('Eliminado exitosamente')
      setDeleteConfirm(null)
    } catch { toast.error('Error al eliminar') }
    finally { setLoading(false) }
  }

  // Devolución
  const openDevModal = () => {
    setDevItems([])
    setDevSearch('')
    setDevInvFilter('all')
    setDevModalOpen(true)
  }

  const devFilteredProducts = productos.filter(p => {
    if (devInvFilter !== 'all' && p.inventario_id !== devInvFilter) return false
    return p.nombre.toLowerCase().includes(devSearch.toLowerCase()) ||
      (p.codigo_barras && p.codigo_barras.toLowerCase().includes(devSearch.toLowerCase()))
  })

  const addDevItem = (p: any) => {
    setDevItems(prev => {
      const existing = prev.find(item => item.producto_id === p.id)
      if (existing) return prev.map(item => item.producto_id === p.id ? { ...item, cantidad: String(Number(item.cantidad) + 1) } : item)
      return [...prev, { producto_id: p.id, nombre: p.nombre, cantidad: '1' }]
    })
  }

  const removeDevItem = (producto_id: string) => {
    setDevItems(prev => prev.filter(item => item.producto_id !== producto_id))
  }

  const processDev = async () => {
    if (devItems.length === 0) { toast.error('Seleccione al menos un producto'); return }
    setLoading(true)
    try {
      for (const item of devItems) {
        const { data: prod } = await supabase.from('productos').select('stock_actual').eq('id', item.producto_id).single()
        if (prod) {
          const newStock = Number(prod.stock_actual) + parseNum(item.cantidad)
          await supabase.from('productos').update({ stock_actual: newStock }).eq('id', item.producto_id)
        }
      }
      const detalles = devItems.map(i => ({ producto_id: i.producto_id, cantidad: parseNum(i.cantidad) }))
      await registrarAuditoriaCliente(user.id, 'DEVOLUCION_INVENTARIO', 'Inventarios', { items: detalles })
      setProductos(prev => prev.map(p => {
        const devItem = devItems.find(i => i.producto_id === p.id)
        if (devItem) return { ...p, stock_actual: Number(p.stock_actual) + parseNum(devItem.cantidad) }
        return p
      }))
      toast.success('Devolución procesada')
      setDevModalOpen(false)
    } catch { toast.error('Error al procesar devolución') }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-4 animate-in-fade">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Inventarios</h1>
        <div className="flex gap-2">
          <button onClick={openDevModal} className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-amber-600">
            <ArrowLeftRight className="w-4 h-4" /> Devolución
          </button>
          {tab === 'inventarios' ? (
            <button onClick={openNewInv} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700">
              <Plus className="w-4 h-4" /> Nuevo inventario
            </button>
          ) : (
            <button onClick={openNewProd} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700">
              <Plus className="w-4 h-4" /> Nuevo producto
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        <button onClick={() => setTab('inventarios')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'inventarios' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          Inventarios
        </button>
        <button onClick={() => setTab('productos')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'productos' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          Productos
        </button>
      </div>

      {tab === 'inventarios' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {inventarios.map(inv => {
            const count = productos.filter(p => p.inventario_id === inv.id).length
            const isProtected = inv.es_materia_prima
            return (
              <div key={inv.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${inv.es_materia_prima ? 'bg-amber-50' : 'bg-emerald-50'}`}>
                    <Boxes className={`w-5 h-5 ${inv.es_materia_prima ? 'text-amber-600' : 'text-emerald-600'}`} />
                  </div>
                  {!isProtected && (
                    <button onClick={() => { setDeleteConfirm(inv.id); setDeleteType('inventario') }} className="text-rose-400 hover:text-rose-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-slate-800">{inv.nombre_inventario}</h3>
                <p className="text-xs text-slate-400 mt-1">{count} productos</p>
                <div className="flex gap-2 mt-3">
                  {inv.es_materia_prima && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium">Materia prima</span>}
                  {inv.visible_en_pos && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-medium">POS</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'productos' && (
        <>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Buscar producto..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" />
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Nombre</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Código</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Inventario</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Stock</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Costo</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Precio</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Estado</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Acciones</th>
              </tr></thead>
              <tbody>
                {paginatedProductos.map(p => {
                  const stockBajo = Number(p.stock_actual) <= Number(p.stock_minimo) && Number(p.stock_minimo) > 0
                  return (
                    <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-medium text-slate-700">
                        {p.nombre}
                        {p.exento_iva && <span className="text-xs text-blue-500 ml-1">(E)</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">{p.codigo_barras || '-'}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">{p.inventarios?.nombre_inventario}</td>
                      <td className={`px-4 py-3 text-sm tabular-nums text-right ${stockBajo ? 'text-rose-600 font-semibold' : ''}`}>
                        <span className="flex items-center justify-end gap-1">
                          {Number(p.stock_actual).toLocaleString('es-VE')}
                          {stockBajo && <AlertTriangle className="w-3 h-3 text-rose-500" />}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm tabular-nums text-right">{fmtMonto(Number(p.costo_compra_usd), config)}</td>
                      <td className="px-4 py-3 text-sm tabular-nums text-right font-medium">{fmtMonto(Number(p.precio_venta_usd), config)}</td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => toggleEstado(p.id, p.estado)} className="inline-flex items-center gap-1 text-xs">
                          {p.estado === 'HABILITADO' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                              <ToggleRight className="w-3 h-3" /> HABILITADO
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">
                              <ToggleLeft className="w-3 h-3" /> DESHABILITADO
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEditProd(p)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => { setDeleteConfirm(p.id); setDeleteType('producto') }} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-rose-50 text-rose-500">
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

          <Pagination data={filteredProductos} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
        </>
      )}

      {/* Inv Modal */}
      {invModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setInvModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in-fade">
            <button onClick={() => setInvModalOpen(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">{editing ? 'Editar inventario' : 'Nuevo inventario'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                <input value={invForm.nombre_inventario} onChange={e => setInvForm(prev => ({ ...prev, nombre_inventario: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" />
              </div>
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={invForm.es_materia_prima} onChange={e => setInvForm(prev => ({ ...prev, es_materia_prima: e.target.checked }))}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                <span className="text-sm text-slate-700">Es materia prima</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={invForm.visible_en_pos} onChange={e => setInvForm(prev => ({ ...prev, visible_en_pos: e.target.checked }))}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                <span className="text-sm text-slate-700">Visible en POS</span>
              </label>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setInvModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                <button onClick={saveInv} disabled={loading} className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                  {loading ? 'Guardando...' : editing ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prod Modal */}
      {prodModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setProdModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin p-6 animate-in-fade">
            <button onClick={() => setProdModalOpen(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">{editing ? 'Editar producto' : 'Nuevo producto'}</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
                  <input value={prodForm.nombre} onChange={e => setProdForm(prev => ({ ...prev, nombre: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Código de barras</label>
                  <input value={prodForm.codigo_barras} onChange={e => setProdForm(prev => ({ ...prev, codigo_barras: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Unidad</label>
                  <select value={prodForm.unidad_medida} onChange={e => setProdForm(prev => ({ ...prev, unidad_medida: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none">
                    <option value="UND">UND</option><option value="KG">KG</option><option value="G">G</option><option value="L">L</option><option value="ML">ML</option><option value="CAJA">CAJA</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Inventario</label>
                  <select value={prodForm.inventario_id} onChange={e => setProdForm(prev => ({ ...prev, inventario_id: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none">
                    {inventarios.map((inv: any) => (
                      <option key={inv.id} value={inv.id}>{inv.nombre_inventario}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Stock actual</label>
                  <input type="text" inputMode="decimal" value={prodForm.stock_actual} onChange={e => setProdForm(prev => ({ ...prev, stock_actual: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Stock mínimo</label>
                  <input type="text" inputMode="decimal" value={prodForm.stock_minimo} onChange={e => setProdForm(prev => ({ ...prev, stock_minimo: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Costo (USD)</label>
                  <input type="text" inputMode="decimal" value={prodForm.costo_compra_usd} onChange={e => setProdForm(prev => ({ ...prev, costo_compra_usd: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Precio venta (USD)</label>
                  <input type="text" inputMode="decimal" value={prodForm.precio_venta_usd} onChange={e => setProdForm(prev => ({ ...prev, precio_venta_usd: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" />
                </div>
              </div>
              <div className="text-xs text-slate-500 tabular-nums">
                Precio en {config.divisa_secundaria}: {fmtPrincipal(parseNum(prodForm.precio_venta_usd) * config.tasa_cambio, {...config, mostrar_como: 'PRINCIPAL'})}
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={prodForm.exento_iva} onChange={e => setProdForm(prev => ({ ...prev, exento_iva: e.target.checked }))}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                  <span className="text-sm text-slate-700">Exento de IVA</span>
                </label>
                <select value={prodForm.estado} onChange={e => setProdForm(prev => ({ ...prev, estado: e.target.value }))}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none">
                  <option value="HABILITADO">Habilitado</option>
                  <option value="DESHABILITADO">Deshabilitado</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setProdModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                <button onClick={saveProd} disabled={loading} className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                  {loading ? 'Guardando...' : editing ? 'Actualizar' : 'Crear producto'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Devolución Modal */}
      {devModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDevModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin p-6 animate-in-fade">
            <button onClick={() => setDevModalOpen(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Devolución a inventario</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Buscar producto..." value={devSearch} onChange={e => setDevSearch(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" />
              </div>
              <select value={devInvFilter} onChange={e => setDevInvFilter(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none">
                <option value="all">Todos los inventarios</option>
                {inventarios.map((inv: any) => (
                  <option key={inv.id} value={inv.id}>{inv.nombre_inventario}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="max-h-60 overflow-y-auto scrollbar-thin space-y-1 border border-slate-100 rounded-xl p-2">
                {devFilteredProducts.map(p => (
                  <button key={p.id} onClick={() => addDevItem(p)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 rounded-lg flex justify-between">
                    <span>{p.nombre}</span>
                    <span className="text-slate-400 tabular-nums">{Number(p.stock_actual).toLocaleString('es-VE')}</span>
                  </button>
                ))}
              </div>
              <div className="border border-slate-100 rounded-xl p-3">
                <p className="text-xs font-semibold text-slate-500 mb-2">Items a devolver ({devItems.length})</p>
                {devItems.map(item => (
                  <div key={item.producto_id} className="flex items-center gap-2 mb-2">
                    <span className="flex-1 text-sm truncate">{item.nombre}</span>
                    <input type="text" inputMode="decimal" value={item.cantidad} onChange={e => setDevItems(prev => prev.map(i => i.producto_id === item.producto_id ? { ...i, cantidad: e.target.value } : i))}
                      className="w-20 rounded border border-slate-200 px-2 py-1 text-sm text-right focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" />
                    <button onClick={() => removeDevItem(item.producto_id)} className="text-rose-500"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
                  </div>
                ))}
                {devItems.length === 0 && <p className="text-sm text-slate-400">Seleccione productos de la lista</p>}
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setDevModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
              <button onClick={processDev} disabled={loading || devItems.length === 0}
                className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50">
                {loading ? 'Procesando...' : 'Procesar devolución'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={deleteItem}
        title={`Eliminar ${deleteType === 'inventario' ? 'inventario' : 'producto'}`}
        description={`¿Está seguro? ${deleteType === 'inventario' ? 'Se eliminarán todos los productos asociados.' : ''}`}
        variant="danger"
        loading={loading}
      />
    </div>
  )
}

'use client'

import { useState, useMemo } from 'react'
import { Search, ShoppingBag, Wallet, CreditCard, Truck, Filter } from 'lucide-react'
import { fmtMonto, ConfigDivisas, DEFAULT_DIVISAS } from '@/lib/divisas'
import Pagination from '@/components/ui/pagination'

interface TransaccionesClientProps {
  transacciones: any[]
  clientes: { id: string; nombre: string }[]
  config: ConfigDivisas
  user: any
}

export default function TransaccionesClient({ transacciones, clientes, config }: TransaccionesClientProps) {
  const [tipoFilter, setTipoFilter] = useState('')
  const [clienteSearch, setClienteSearch] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const filtered = useMemo(() => {
    return transacciones.filter(t => {
      if (tipoFilter && t.tipo !== tipoFilter) return false
      if (clienteSearch && t.clientes?.nombre && !t.clientes.nombre.toLowerCase().includes(clienteSearch.toLowerCase())) return false
      if (fechaDesde && new Date(t.fecha_transaccion) < new Date(fechaDesde)) return false
      if (fechaHasta && new Date(t.fecha_transaccion) > new Date(fechaHasta + 'T23:59:59')) return false
      return true
    })
  }, [transacciones, tipoFilter, clienteSearch, fechaDesde, fechaHasta])

  const tipos = useMemo(() => Array.from(new Set(transacciones.map(t => t.tipo))), [transacciones])
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  const totalUsd = filtered.reduce((sum, t) => sum + Number(t.monto_usd), 0)
  const totalVed = filtered.reduce((sum, t) => sum + Number(t.monto_ved), 0)

  const badges: Record<string, { icon: any; color: string }> = {
    VENTA_POS: { icon: ShoppingBag, color: 'text-emerald-700 bg-emerald-50' },
    COBRO_DEUDA: { icon: Wallet, color: 'text-amber-700 bg-amber-50' },
    ABONO_CLIENTE: { icon: CreditCard, color: 'text-blue-700 bg-blue-50' },
    COMPRA_INVENTARIO: { icon: Truck, color: 'text-violet-700 bg-violet-50' },
  }

  return (
    <div className="space-y-4 animate-in-fade">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Transacciones</h1>
          <p className="text-sm text-slate-500 mt-1">Libro mayor unificado</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs text-slate-500">Total movimientos</p>
          <p className="text-lg font-bold text-slate-800 tabular-nums">{filtered.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs text-slate-500">Total USD</p>
          <p className="text-lg font-bold text-slate-800 tabular-nums">{fmtMonto(totalUsd, { ...config, mostrar_como: 'PRINCIPAL' })}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs text-slate-500">Total VED</p>
          <p className="text-lg font-bold text-slate-800 tabular-nums">{fmtMonto(totalVed, { ...config, mostrar_como: 'SECUNDARIA' })}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs text-slate-500">Filtros activos</p>
          <p className="text-lg font-bold text-slate-800 tabular-nums">{[(tipoFilter ? 1 : 0), (clienteSearch ? 1 : 0), (fechaDesde ? 1 : 0), (fechaHasta ? 1 : 0)].reduce((a, b) => a + b, 0)}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={tipoFilter} onChange={e => { setTipoFilter(e.target.value); setPage(1) }}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none">
          <option value="">Todos los tipos</option>
          {tipos.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <input type="text" placeholder="Buscar cliente..." value={clienteSearch} onChange={e => { setClienteSearch(e.target.value); setPage(1) }}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" />
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500">Desde:</label>
          <input type="date" value={fechaDesde} onChange={e => { setFechaDesde(e.target.value); setPage(1) }}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500">Hasta:</label>
          <input type="date" value={fechaHasta} onChange={e => { setFechaHasta(e.target.value); setPage(1) }}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
        <table className="w-full">
          <thead><tr className="bg-slate-50">
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Fecha</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Tipo</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Cliente</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Usuario</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Monto USD</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Monto VED</th>
          </tr></thead>
          <tbody>
            {paginated.map(t => {
              const badge = badges[t.tipo] || { icon: Filter, color: 'text-slate-700 bg-slate-50' }
              const Icon = badge.icon
              return (
                <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {new Date(t.fecha_transaccion).toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full ${badge.color}`}>
                      <Icon className="w-3 h-3" /> {t.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{t.clientes?.nombre || '-'}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">-</td>
                  <td className="px-4 py-3 text-sm tabular-nums text-right font-medium">{fmtMonto(Number(t.monto_usd), { ...config, mostrar_como: 'PRINCIPAL' })}</td>
                  <td className="px-4 py-3 text-sm tabular-nums text-right">{fmtMonto(Number(t.monto_ved), { ...config, mostrar_como: 'SECUNDARIA' })}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Pagination data={filtered} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
    </div>
  )
}

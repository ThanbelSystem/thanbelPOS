'use client'

import { useState, useMemo } from 'react'
import { Search, Filter } from 'lucide-react'
import Pagination from '@/components/ui/pagination'

interface AuditoriaClientProps {
  logs: any[]
}

export default function AuditoriaClient({ logs }: AuditoriaClientProps) {
  const [search, setSearch] = useState('')
  const [moduloFilter, setModuloFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedLog, setSelectedLog] = useState<any>(null)

  const modulos = useMemo(() => Array.from(new Set(logs.map(l => l.modulo))), [logs])

  const filtered = useMemo(() => {
    return logs.filter(l => {
      if (moduloFilter && l.modulo !== moduloFilter) return false
      if (search) {
        const q = search.toLowerCase()
        const matchAccion = l.accion.toLowerCase().includes(q)
        const matchModulo = l.modulo.toLowerCase().includes(q)
        const matchUser = l.usuarios?.nombre?.toLowerCase().includes(q)
        return matchAccion || matchModulo || matchUser
      }
      return true
    })
  }, [logs, search, moduloFilter])

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  const renderDetalles = (detalles: any) => {
    if (!detalles) return null
    // Special render for DEVOLUCION_INVENTARIO
    if (detalles.items && Array.isArray(detalles.items)) {
      return (
        <div className="space-y-1">
          {detalles.items.map((item: any, i: number) => (
            <div key={i} className="flex justify-between text-sm py-1 border-b border-slate-700 last:border-0">
              <span className="text-slate-300">{item.nombre_producto || `Producto #${item.producto_id?.slice(0, 8)}`}</span>
              <span className="text-slate-100 tabular-nums">Cantidad: {item.cantidad}</span>
            </div>
          ))}
        </div>
      )
    }
    return (
      <pre className="text-xs text-slate-100 overflow-x-auto scrollbar-thin whitespace-pre-wrap font-mono">
        {JSON.stringify(detalles, null, 2)}
      </pre>
    )
  }

  return (
    <div className="space-y-4 animate-in-fade">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Auditoría</h1>
          <p className="text-sm text-slate-500 mt-1">Registro de actividades ({logs.length} registros)</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Buscar acción, módulo o usuario..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" />
        </div>
        <select value={moduloFilter} onChange={e => { setModuloFilter(e.target.value); setPage(1) }}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none">
          <option value="">Todos los módulos</option>
          {modulos.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
        <table className="w-full">
          <thead><tr className="bg-slate-50">
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Fecha/Hora</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Usuario</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Módulo</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Acción</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">IP</th>
          </tr></thead>
          <tbody>
            {paginated.map(log => (
              <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedLog(log)}>
                <td className="px-4 py-3 text-sm text-slate-500">
                  {new Date(log.fecha_hora).toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">{log.usuarios?.nombre || 'Sistema'}</td>
                <td className="px-4 py-3">
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {log.modulo}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{log.accion}</td>
                <td className="px-4 py-3 text-sm text-slate-400 text-right tabular-nums">{log.ip_address || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination data={filtered} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedLog(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin p-6 animate-in-fade">
            <button onClick={() => setSelectedLog(null)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
            <h3 className="text-lg font-semibold text-slate-800 mb-1">Detalle de auditoría</h3>
            <p className="text-xs text-slate-400 mb-4">ID: {selectedLog.id.slice(0, 8)}...</p>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-500">Fecha:</span>
                  <p className="font-medium">{new Date(selectedLog.fecha_hora).toLocaleString('es-VE')}</p>
                </div>
                <div>
                  <span className="text-slate-500">Usuario:</span>
                  <p className="font-medium">{selectedLog.usuarios?.nombre || 'Sistema'}</p>
                </div>
                <div>
                  <span className="text-slate-500">Módulo:</span>
                  <p className="font-medium">{selectedLog.modulo}</p>
                </div>
                <div>
                  <span className="text-slate-500">Acción:</span>
                  <p className="font-medium">{selectedLog.accion}</p>
                </div>
              </div>
              {selectedLog.detalles_json && (
                <div>
                  <span className="text-sm text-slate-500 block mb-2">Detalles:</span>
                  <div className="bg-slate-900 rounded-xl p-4 max-h-60 overflow-y-auto scrollbar-thin">
                    {renderDetalles(selectedLog.detalles_json)}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={() => setSelectedLog(null)} className="px-4 py-2 text-sm bg-slate-100 rounded-lg hover:bg-slate-200">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

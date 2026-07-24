'use client'

import { useState } from 'react'
import { FileBarChart, TrendingUp, Receipt, FileText, Download } from 'lucide-react'
import { fmtMonto, ConfigDivisas, DEFAULT_DIVISAS } from '@/lib/divisas'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface ReportesClientProps {
  empresa: any
  ventas: any[]
  transacciones: any[]
  config: ConfigDivisas
}

type ReporteType = 'consolidado' | 'ventas' | 'transacciones'

export default function ReportesClient({ empresa, ventas, transacciones, config }: ReportesClientProps) {
  const [selectedReporte, setSelectedReporte] = useState<ReporteType>('consolidado')

  const totalVentas = ventas.reduce((sum, v) => sum + Number(v.total_usd), 0)
  const totalAbonos = transacciones.filter(t => t.tipo === 'ABONO_CLIENTE').reduce((sum, t) => sum + Number(t.monto_usd), 0)
  const totalCobros = transacciones.filter(t => t.tipo === 'COBRO_DEUDA').reduce((sum, t) => sum + Number(t.monto_usd), 0)
  const totalCompras = transacciones.filter(t => t.tipo === 'COMPRA_INVENTARIO').reduce((sum, t) => sum + Number(t.monto_usd), 0)

  const generarPDF = () => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()

    // Header
    doc.setFontSize(14)
    doc.text(empresa?.nombre || 'ThanBel POS', pageWidth / 2, 20, { align: 'center' })
    doc.setFontSize(8)
    if (empresa?.rif_identificacion) doc.text(`RIF: ${empresa.rif_identificacion}`, pageWidth / 2, 27, { align: 'center' })
    if (empresa?.direccion) doc.text(empresa.direccion, pageWidth / 2, 33, { align: 'center' })
    if (empresa?.telefono) doc.text(`Tel: ${empresa.telefono}`, pageWidth / 2, 39, { align: 'center' })
    
    doc.setFontSize(12)
    const tituloMap = { consolidado: 'Resumen Consolidado', ventas: 'Reporte de Ventas', transacciones: 'Reporte de Transacciones' }
    doc.text(tituloMap[selectedReporte], pageWidth / 2, 48, { align: 'center' })
    doc.setFontSize(8)
    doc.text(`Generado: ${new Date().toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, pageWidth / 2, 55, { align: 'center' })

    if (selectedReporte === 'consolidado') {
      autoTable(doc, {
        startY: 62,
        head: [['Concepto', 'Monto USD']],
        body: [
          ['Ventas POS', fmtMonto(totalVentas, { ...config, mostrar_como: 'PRINCIPAL' })],
          ['Abonos de Clientes', fmtMonto(totalAbonos, { ...config, mostrar_como: 'PRINCIPAL' })],
          ['Cobros de Deuda', fmtMonto(totalCobros, { ...config, mostrar_como: 'PRINCIPAL' })],
          ['Compras Inventario', fmtMonto(totalCompras, { ...config, mostrar_como: 'PRINCIPAL' })],
          ['Neto', fmtMonto(totalVentas + totalAbonos - totalCobros - totalCompras, { ...config, mostrar_como: 'PRINCIPAL' })],
        ],
        headStyles: { fillColor: [0, 176, 116], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 9 },
      })
    } else if (selectedReporte === 'ventas') {
      const body = ventas.slice(0, 50).map(v => [
        new Date(v.fecha_venta).toLocaleDateString('es-VE'),
        v.clientes?.nombre || 'Consumidor Final',
        v.metodo_pago,
        fmtMonto(Number(v.total_usd), { ...config, mostrar_como: 'PRINCIPAL' }),
      ])
      autoTable(doc, {
        startY: 62,
        head: [['Fecha', 'Cliente', 'Método Pago', 'Total']],
        body,
        headStyles: { fillColor: [0, 176, 116], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8 },
      })
    } else {
      const body = transacciones.slice(0, 50).map(t => [
        new Date(t.fecha_transaccion).toLocaleDateString('es-VE'),
        t.tipo,
        t.clientes?.nombre || '-',
        fmtMonto(Number(t.monto_usd), { ...config, mostrar_como: 'PRINCIPAL' }),
      ])
      autoTable(doc, {
        startY: 62,
        head: [['Fecha', 'Tipo', 'Cliente', 'Monto']],
        body,
        headStyles: { fillColor: [0, 176, 116], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8 },
      })
    }

    const filenameMap = { consolidado: 'resumen-consolidado.pdf', ventas: 'reporte-ventas.pdf', transacciones: 'reporte-transacciones.pdf' }
    doc.save(filenameMap[selectedReporte])
  }

  const reportes = [
    { id: 'consolidado' as ReporteType, label: 'Resumen Consolidado', icon: FileBarChart, total: totalVentas + totalAbonos - totalCobros - totalCompras },
    { id: 'ventas' as ReporteType, label: 'Reporte de Ventas', icon: TrendingUp, total: totalVentas },
    { id: 'transacciones' as ReporteType, label: 'Reporte de Transacciones', icon: Receipt, total: transacciones.length },
  ]

  return (
    <div className="space-y-4 animate-in-fade">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Reportes</h1>
          <p className="text-sm text-slate-500 mt-1">Exportación y análisis</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reportes.map(r => {
          const Icon = r.icon
          const isSelected = selectedReporte === r.id
          return (
            <button key={r.id} onClick={() => setSelectedReporte(r.id)}
              className={`bg-white rounded-2xl border p-6 text-left transition-all ${
                isSelected ? 'border-emerald-200 ring-2 ring-emerald-500/20 shadow-md' : 'border-slate-100 shadow-sm hover:shadow-md'
              }`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${isSelected ? 'bg-emerald-50' : 'bg-slate-50'}`}>
                <Icon className={`w-5 h-5 ${isSelected ? 'text-emerald-600' : 'text-slate-500'}`} />
              </div>
              <p className="text-sm font-semibold text-slate-800">{r.label}</p>
              <p className="text-xs text-slate-500 mt-1 tabular-nums">
                {typeof r.total === 'number' ? fmtMonto(r.total, config) : `${r.total} registros`}
              </p>
            </button>
          )
        })}
      </div>

      {selectedReporte === 'consolidado' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
          <table className="w-full">
            <thead><tr className="bg-slate-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Concepto</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Monto USD</th>
            </tr></thead>
            <tbody>
              <tr className="border-b border-slate-50"><td className="px-4 py-3 text-sm text-slate-700">Ventas POS</td><td className="px-4 py-3 text-sm tabular-nums text-right font-medium">{fmtMonto(totalVentas, { ...config, mostrar_como: 'PRINCIPAL' })}</td></tr>
              <tr className="border-b border-slate-50"><td className="px-4 py-3 text-sm text-slate-700">Abonos de Clientes</td><td className="px-4 py-3 text-sm tabular-nums text-right">{fmtMonto(totalAbonos, { ...config, mostrar_como: 'PRINCIPAL' })}</td></tr>
              <tr className="border-b border-slate-50"><td className="px-4 py-3 text-sm text-slate-700">Cobros de Deuda</td><td className="px-4 py-3 text-sm tabular-nums text-right">{fmtMonto(totalCobros, { ...config, mostrar_como: 'PRINCIPAL' })}</td></tr>
              <tr className="border-b border-slate-50"><td className="px-4 py-3 text-sm text-slate-700">Compras Inventario</td><td className="px-4 py-3 text-sm tabular-nums text-right">{fmtMonto(totalCompras, { ...config, mostrar_como: 'PRINCIPAL' })}</td></tr>
              <tr className="bg-slate-50"><td className="px-4 py-3 text-sm font-semibold text-slate-800">Neto</td><td className="px-4 py-3 text-sm tabular-nums text-right font-bold">{fmtMonto(totalVentas + totalAbonos - totalCobros - totalCompras, { ...config, mostrar_como: 'PRINCIPAL' })}</td></tr>
            </tbody>
          </table>
        </div>
      )}

      {selectedReporte === 'ventas' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
          <table className="w-full">
            <thead><tr className="bg-slate-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Fecha</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Cliente</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Método Pago</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Total</th>
            </tr></thead>
            <tbody>
              {ventas.slice(0, 50).map(v => (
                <tr key={v.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm text-slate-500">{new Date(v.fecha_venta).toLocaleDateString('es-VE')}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{v.clientes?.nombre || 'Consumidor Final'}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{v.metodo_pago}</td>
                  <td className="px-4 py-3 text-sm tabular-nums text-right font-medium">{fmtMonto(Number(v.total_usd), config)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedReporte === 'transacciones' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
          <table className="w-full">
            <thead><tr className="bg-slate-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Fecha</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Tipo</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Cliente</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Monto</th>
            </tr></thead>
            <tbody>
              {transacciones.slice(0, 50).map(t => (
                <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm text-slate-500">{new Date(t.fecha_transaccion).toLocaleDateString('es-VE')}</td>
                  <td className="px-4 py-3 text-sm"><span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100">{t.tipo}</span></td>
                  <td className="px-4 py-3 text-sm text-slate-700">{t.clientes?.nombre || '-'}</td>
                  <td className="px-4 py-3 text-sm tabular-nums text-right">{fmtMonto(Number(t.monto_usd), config)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-center">
        <button onClick={generarPDF} className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors">
          <Download className="w-4 h-4" /> Exportar PDF
        </button>
      </div>
    </div>
  )
}

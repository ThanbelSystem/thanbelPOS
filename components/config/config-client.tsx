'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Building2, DollarSign, Receipt, Wrench, Printer } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ConfigDivisas } from '@/lib/divisas'
import { parseNum } from '@/lib/utils'
import { registrarAuditoriaCliente } from '@/lib/auditoria'
import ConfirmDialog from '@/components/ui/confirm-dialog'

interface ConfigClientProps {
  empresa: any
  configFiscal: any
  configDivisas: ConfigDivisas
  divisasHistorial: any[]
  user: { id: string }
}

export default function ConfigClient({ empresa: initialEmpresa, configFiscal: initialFiscal, configDivisas: initialDivisas, divisasHistorial, user }: ConfigClientProps) {
  const [tab, setTab] = useState<'empresa' | 'divisas' | 'fiscal' | 'mantenimiento'>('empresa')
  const [empresa, setEmpresa] = useState<Record<string, string>>(initialEmpresa || { nombre: '', rif_identificacion: '', direccion: '', telefono: '' })
  const [fiscal, setFiscal] = useState<Record<string, any>>(initialFiscal)
  const [divisas, setDivisas] = useState(initialDivisas)
  const [loading, setLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const saveEmpresa = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.from('empresa').update({
        nombre: empresa.nombre,
        rif_identificacion: empresa.rif_identificacion,
        direccion: empresa.direccion,
        telefono: empresa.telefono,
      }).eq('id', empresa.id)
      if (error) { toast.error(error.message); return }
      await registrarAuditoriaCliente(user.id, 'GUARDAR_EMPRESA', 'Configuración', {})
      toast.success('Empresa actualizada')
    } catch { toast.error('Error al guardar') }
    finally { setLoading(false) }
  }

  const saveDivisas = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.from('config_divisas').update({
        divisa_principal: divisas.divisa_principal,
        simbolo_principal: divisas.simbolo_principal,
        divisa_secundaria: divisas.divisa_secundaria,
        simbolo_secundaria: divisas.simbolo_secundaria,
        tasa_cambio: divisas.tasa_cambio,
        mostrar_como: divisas.mostrar_como,
        updated_at: new Date().toISOString(),
      }).eq('id', 1)
      if (error) { toast.error(error.message); return }
      await registrarAuditoriaCliente(user.id, 'GUARDAR_DIVISAS', 'Configuración', {})
      toast.success('Configuración de divisas actualizada')
    } catch { toast.error('Error al guardar') }
    finally { setLoading(false) }
  }

  const saveFiscal = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.from('config_fiscal').update({
        porcentaje_iva: parseNum(fiscal.porcentaje_iva) || 0,
        nombre_impresora: fiscal.nombre_impresora,
        ancho_papel: fiscal.ancho_papel,
        mostrar_iva: fiscal.mostrar_iva,
        mensaje_agradecimiento: fiscal.mensaje_agradecimiento,
        updated_at: new Date().toISOString(),
      }).eq('id', 1)
      if (error) { toast.error(error.message); return }
      await registrarAuditoriaCliente(user.id, 'GUARDAR_FISCAL', 'Configuración', {})
      toast.success('Configuración fiscal actualizada')
    } catch { toast.error('Error al guardar') }
    finally { setLoading(false) }
  }

  const cargarDemo = async () => {
    setDemoLoading(true)
    try {
      const res = await fetch('/api/mantenimiento/demo', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success(data.message)
      await registrarAuditoriaCliente(user.id, 'CARGAR_DATOS_DEMO', 'Mantenimiento', {})
    } catch { toast.error('Error al cargar datos demo') }
    finally { setDemoLoading(false) }
  }

  const factoryReset = async () => {
    setResetLoading(true)
    try {
      const res = await fetch('/api/mantenimiento/reset', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success(data.message)
      setShowResetConfirm(false)
    } catch { toast.error('Error al resetear') }
    finally { setResetLoading(false) }
  }

  const ticketPreview = () => {
    const line = fiscal.ancho_papel === '80mm' ? '-'.repeat(42) : '-'.repeat(28)
    const showIva = fiscal.mostrar_iva && Number(fiscal.porcentaje_iva) > 0
    const mensaje = fiscal.mensaje_agradecimiento || '¡Gracias por su compra!'
    return (
      <div className={`bg-white border border-slate-200 rounded-xl p-4 font-mono text-xs ${fiscal.ancho_papel === '80mm' ? 'max-w-sm' : 'max-w-[220px]'}`}>
        <p className="text-center font-bold text-sm">{empresa.nombre || 'Mi Empresa'}</p>
        {empresa.direccion && <p className="text-center text-[10px] text-slate-400">{empresa.direccion}</p>}
        {empresa.rif_identificacion && <p className="text-center text-[10px] text-slate-400">RIF: {empresa.rif_identificacion}</p>}
        {empresa.telefono && <p className="text-center text-[10px] text-slate-400">Telf: {empresa.telefono}</p>}
        <p className="text-center text-slate-400">{line}</p>
        <p className="text-center text-[10px] text-slate-400">{new Date().toLocaleString('es-VE')}</p>
        <p className="text-center text-[10px] text-slate-400">Cliente: Consumidor Final</p>
        <p className="text-center text-slate-400">{line}</p>
        <p className="text-center font-bold text-[11px]">FACTURA</p>
        <p className="text-center text-slate-400">{line}</p>
        <p className="text-center">Producto x1    $10.00</p>
        <p className="text-center">Producto x2    $20.00</p>
        <p className="text-center text-slate-400">{line}</p>
        {showIva ? (
          <>
            <p className="text-center">Base IVA:      $20.00</p>
            <p className="text-center">IVA ({fiscal.porcentaje_iva}%):  $0.00</p>
            <p className="text-center">Exento:        $10.00</p>
          </>
        ) : null}
        <p className="text-center font-bold text-sm">TOTAL    $30.00</p>
        <p className="text-center text-slate-400">{line}</p>
        <p className="text-center text-[10px]">{mensaje}</p>
      </div>
    )
  }

  const tabs = [
    { id: 'empresa', label: 'Empresa', icon: Building2 },
    { id: 'divisas', label: 'Divisas', icon: DollarSign },
    { id: 'fiscal', label: 'Fiscal', icon: Receipt },
    { id: 'mantenimiento', label: 'Mantenimiento', icon: Wrench },
  ]

  return (
    <div className="space-y-4 animate-in-fade">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Configuración</h1>
      </div>

      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit flex-wrap">
        {tabs.map(t => {
          const Icon = t.icon
          return (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                tab === t.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}>
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          )
        })}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        {tab === 'empresa' && (
          <div className="space-y-4 max-w-lg">
            <h3 className="text-sm font-semibold text-slate-700">Datos de la empresa</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
              <input value={empresa.nombre} onChange={e => setEmpresa(prev => ({ ...prev, nombre: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">RIF</label>
              <input value={empresa.rif_identificacion} onChange={e => setEmpresa(prev => ({ ...prev, rif_identificacion: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
              <textarea value={empresa.direccion} onChange={e => setEmpresa(prev => ({ ...prev, direccion: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" rows={3} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
              <input value={empresa.telefono} onChange={e => setEmpresa(prev => ({ ...prev, telefono: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" />
            </div>
            <button onClick={saveEmpresa} disabled={loading}
              className="bg-emerald-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50">
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        )}

        {tab === 'divisas' && (
          <div className="space-y-4 max-w-lg">
            <h3 className="text-sm font-semibold text-slate-700">Configuración de divisas</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Divisa principal</label>
                <input value={divisas.divisa_principal} onChange={e => setDivisas(prev => ({ ...prev, divisa_principal: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Símbolo principal</label>
                <input value={divisas.simbolo_principal} onChange={e => setDivisas(prev => ({ ...prev, simbolo_principal: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Divisa secundaria</label>
                <input value={divisas.divisa_secundaria} onChange={e => setDivisas(prev => ({ ...prev, divisa_secundaria: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Símbolo secundario</label>
                <input value={divisas.simbolo_secundaria} onChange={e => setDivisas(prev => ({ ...prev, simbolo_secundaria: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tasa de cambio</label>
              <input type="text" inputMode="decimal" value={divisas.tasa_cambio} onChange={e => setDivisas(prev => ({ ...prev, tasa_cambio: parseNum(e.target.value) }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Modo de visualización</label>
              <select value={divisas.mostrar_como} onChange={e => setDivisas(prev => ({ ...prev, mostrar_como: e.target.value as any }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none">
                <option value="PRINCIPAL">Solo principal</option>
                <option value="SECUNDARIA">Solo secundaria</option>
                <option value="AMBAS">Ambas</option>
              </select>
            </div>
            {divisasHistorial.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-2">Historial de tasas</p>
                <div className="space-y-1 max-h-32 overflow-y-auto scrollbar-thin">
                  {divisasHistorial.map(h => (
                    <div key={h.id} className="flex justify-between text-sm text-slate-500">
                      <span>{new Date(h.fecha_registro).toLocaleDateString('es-VE')}</span>
                      <span className="tabular-nums">1 {h.divisa_principal} = {Number(h.tasa_cambio).toLocaleString('es-VE')} {h.divisa_secundaria}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button onClick={saveDivisas} disabled={loading}
              className="bg-emerald-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50">
              {loading ? 'Guardando...' : 'Guardar configuración'}
            </button>
          </div>
        )}

        {tab === 'fiscal' && (
          <div className="space-y-4 max-w-lg">
            <h3 className="text-sm font-semibold text-slate-700">Configuración fiscal</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Porcentaje de IVA (%)</label>
              <input type="text" inputMode="decimal" value={fiscal.porcentaje_iva} onChange={e => setFiscal(prev => ({ ...prev, porcentaje_iva: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de impresora</label>
              <input value={fiscal.nombre_impresora} onChange={e => setFiscal(prev => ({ ...prev, nombre_impresora: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ancho de papel</label>
              <div className="flex gap-2">
                <button onClick={() => setFiscal(prev => ({ ...prev, ancho_papel: '58mm' }))}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${fiscal.ancho_papel === '58mm' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  58mm
                </button>
                <button onClick={() => setFiscal(prev => ({ ...prev, ancho_papel: '80mm' }))}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${fiscal.ancho_papel === '80mm' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  80mm
                </button>
              </div>
            </div>
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={fiscal.mostrar_iva} onChange={e => setFiscal(prev => ({ ...prev, mostrar_iva: e.target.checked }))}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
              <span className="text-sm text-slate-700">Mostrar IVA en tickets</span>
            </label>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mensaje de agradecimiento</label>
              <input value={fiscal.mensaje_agradecimiento || ''} onChange={e => setFiscal(prev => ({ ...prev, mensaje_agradecimiento: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" />
            </div>
            <button onClick={saveFiscal} disabled={loading}
              className="bg-emerald-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50">
              {loading ? 'Guardando...' : 'Guardar configuración'}
            </button>
            <div className="mt-4">
              <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1">
                <Printer className="w-3 h-3" /> Preview de recibo
              </p>
              {ticketPreview()}
            </div>
          </div>
        )}

        {tab === 'mantenimiento' && (
          <div className="space-y-6 max-w-lg">
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Cargar datos demo</h3>
              <p className="text-sm text-slate-500 mb-3">Crea datos de ejemplo: usuario admin, productos, clientes y proveedores.</p>
              <button onClick={cargarDemo} disabled={demoLoading}
                className="bg-emerald-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50">
                {demoLoading ? 'Cargando...' : 'Cargar datos demo'}
              </button>
            </div>
            <div className="border-t border-slate-100 pt-6">
              <h3 className="text-sm font-semibold text-rose-600 mb-2">Factory reset</h3>
              <p className="text-sm text-slate-500 mb-3">Elimina todos los datos del sistema excepto el usuario admin.</p>
              <button onClick={() => setShowResetConfirm(true)} disabled={resetLoading}
                className="bg-rose-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-rose-700 disabled:opacity-50">
                {resetLoading ? 'Reseteando...' : 'Factory reset'}
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={factoryReset}
        title="Factory reset"
        description="¿Está seguro? Se eliminarán todos los datos del sistema. Esta acción no puede deshacerse."
        variant="danger"
        loading={resetLoading}
        confirmText="Resetear todo"
      />
    </div>
  )
}

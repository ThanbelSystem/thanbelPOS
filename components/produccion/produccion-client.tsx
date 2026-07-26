'use client'

import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { Search, Plus, Trash2, Calculator, History, Factory, DollarSign } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { fmtMonto, fmtPrincipal, ConfigDivisas, DEFAULT_DIVISAS } from '@/lib/divisas'
import { parseNum } from '@/lib/utils'
import { registrarAuditoriaCliente } from '@/lib/auditoria'
import Pagination from '@/components/ui/pagination'

interface ProduccionClientProps {
  inventarios: any[]
  productos: any[]
  recetas: any[]
  config: ConfigDivisas
  user: { id: string }
}

export default function ProduccionClient({ inventarios, productos: initialProductos, recetas: initialRecetas, config, user }: ProduccionClientProps) {
  const [tab, setTab] = useState<'calculadora' | 'historial'>('calculadora')
  const [productos, setProductos] = useState(initialProductos)
  const [recetas, setRecetas] = useState(initialRecetas)
  const [ingredientes, setIngredientes] = useState<{ producto_id: string; nombre: string; cantidad: string; costo_unitario: number }[]>([])
  const [nombreProducto, setNombreProducto] = useState('')
  const [inventarioDestino, setInventarioDestino] = useState('')
  const [profitPct, setProfitPct] = useState('30')
  const [unidadesProducidas, setUnidadesProducidas] = useState('1')
  const [searchMp, setSearchMp] = useState('')
  const [loading, setLoading] = useState(false)

  const materiasPrimas = productos.filter(p => p.inventarios?.es_materia_prima)

  const mpFiltered = materiasPrimas.filter(p =>
    p.nombre.toLowerCase().includes(searchMp.toLowerCase())
  )

  const filteredMp = mpFiltered

  const addIngrediente = (p: any) => {
    setIngredientes(prev => {
      if (prev.find(i => i.producto_id === p.id)) return prev
      return [...prev, {
        producto_id: p.id,
        nombre: p.nombre,
        cantidad: '1',
        costo_unitario: Number(p.costo_compra_usd),
      }]
    })
  }

  const removeIngrediente = (producto_id: string) => {
    setIngredientes(prev => prev.filter(i => i.producto_id !== producto_id))
  }

  const updateIngCantidad = (producto_id: string, cantidad: string) => {
    setIngredientes(prev => prev.map(i => i.producto_id === producto_id ? { ...i, cantidad } : i))
  }

  const costoTotalMateriales = useMemo(() =>
    ingredientes.reduce((sum, i) => sum + (parseNum(i.cantidad) || 0) * i.costo_unitario, 0),
    [ingredientes]
  )

  const profitDecimal = parseNum(profitPct) / 100 || 0
  const costoConProfit = costoTotalMateriales * (1 + profitDecimal)
  const montoProfit = costoConProfit - costoTotalMateriales
  const costoUnitario = unidadesProducidas && parseNum(unidadesProducidas) > 0
    ? costoConProfit / parseNum(unidadesProducidas)
    : 0

  const procesar = async () => {
    if (!nombreProducto) { toast.error('Nombre del producto requerido'); return }
    if (!inventarioDestino) { toast.error('Inventario destino requerido'); return }
    if (ingredientes.length === 0) { toast.error('Agregue al menos un ingrediente'); return }
    if (!unidadesProducidas || parseNum(unidadesProducidas) <= 0) { toast.error('Unidades a producir debe ser mayor a 0'); return }

    setLoading(true)
    try {
      // Create product
      const { data: nuevoProducto, error: prodError } = await supabase.from('productos').insert({
        inventario_id: inventarioDestino,
        nombre: nombreProducto,
        unidad_medida: 'UND',
        stock_actual: parseNum(unidadesProducidas),
        stock_minimo: 0,
        costo_compra_usd: costoUnitario,
        precio_venta_usd: costoUnitario,
        exento_iva: false,
        estado: 'HABILITADO',
      }).select().single()

      if (prodError) { toast.error(prodError.message); return }

      // Create receta
      const { data: receta, error: recError } = await supabase.from('recetas_produccion').insert({
        producto_resultante_id: nuevoProducto.id,
        porcentaje_profit_esperado: parseNum(profitPct),
        costo_total_ingredientes_usd: costoTotalMateriales,
        cantidad_unidades_producidas: parseNum(unidadesProducidas),
        costo_unitario_final_usd: costoUnitario,
      }).select().single()

      if (recError) {
        await supabase.from('productos').delete().eq('id', nuevoProducto.id)
        toast.error(recError.message); return
      }

      // Create ingredientes
      for (const ing of ingredientes) {
        const costoParcial = (parseNum(ing.cantidad) || 0) * ing.costo_unitario
        const { error: ingError } = await supabase.from('receta_ingredientes').insert({
          receta_id: receta.id,
          producto_materia_prima_id: ing.producto_id,
          cantidad_usada: parseNum(ing.cantidad),
          costo_parcial_usd: costoParcial,
        })
        if (ingError) {
          await supabase.from('recetas_produccion').delete().eq('id', receta.id)
          await supabase.from('productos').delete().eq('id', nuevoProducto.id)
          toast.error(ingError.message); return
        }

        // Decrease stock of materia prima
        const { data: mp } = await supabase.from('productos').select('stock_actual').eq('id', ing.producto_id).single()
        if (mp) {
          const newStock = Number(mp.stock_actual) - (parseNum(ing.cantidad) || 0)
          await supabase.from('productos').update({ stock_actual: newStock }).eq('id', ing.producto_id)
        }
      }

      await registrarAuditoriaCliente(user.id, 'PRODUCCION_PROCESADA', 'Producción', {
        producto: nombreProducto,
        costo_total: costoTotalMateriales,
        costo_unitario: costoUnitario,
        profit: profitPct,
        unidades: parseNum(unidadesProducidas),
      })

      toast.success('Producción procesada exitosamente')
      setProductos(prev => [...prev, nuevoProducto])
      setNombreProducto('')
      setIngredientes([])
      setUnidadesProducidas('1')

      const { data: newRecetas } = await supabase.from('recetas_produccion').select('*, producto_resultante:productos!inner(nombre), receta_ingredientes(id)').order('fecha_creacion', { ascending: false })
      if (newRecetas) setRecetas(newRecetas)
    } catch { toast.error('Error al procesar producción') }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-4 animate-in-fade">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Producción</h1>
      </div>

      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        <button onClick={() => setTab('calculadora')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${tab === 'calculadora' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>
          <Calculator className="w-4 h-4" /> Calculadora
        </button>
        <button onClick={() => setTab('historial')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${tab === 'historial' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>
          <History className="w-4 h-4" /> Historial
        </button>
      </div>

      {tab === 'calculadora' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: Ingredients selection */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Factory className="w-4 h-4" /> Ingredientes (materias primas)
            </h3>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Buscar materia prima..." value={searchMp} onChange={e => setSearchMp(e.target.value)}
                className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" />
            </div>
            <div className="max-h-64 overflow-y-auto scrollbar-thin space-y-1">
              {filteredMp.map(mp => (
                <button key={mp.id} onClick={() => addIngrediente(mp)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 rounded-lg flex justify-between">
                  <span>{mp.nombre}</span>
                  <span className="text-slate-400 tabular-nums">{fmtMonto(Number(mp.costo_compra_usd), config)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Form */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Configuración</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del producto a producir</label>
                <input value={nombreProducto} onChange={e => setNombreProducto(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Inventario destino</label>
                <select value={inventarioDestino} onChange={e => setInventarioDestino(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none">
                  <option value="">Seleccionar...</option>
                  {inventarios.filter((i: any) => !i.es_materia_prima).map((inv: any) => (
                    <option key={inv.id} value={inv.id}>{inv.nombre_inventario}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">% Profit</label>
                  <div className="relative">
                    <input type="text" inputMode="decimal" value={profitPct} onChange={e => setProfitPct(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 pr-8 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Unidades a producir</label>
                  <input type="text" inputMode="decimal" value={unidadesProducidas} onChange={e => setUnidadesProducidas(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" />
                </div>
              </div>

              {/* Ingredients list */}
              {ingredientes.length > 0 && (
                <div className="border border-slate-100 rounded-xl p-3 space-y-2">
                  <p className="text-xs font-semibold text-slate-500">Ingredientes seleccionados</p>
                  {ingredientes.map(ing => (
                    <div key={ing.producto_id} className="flex items-center gap-2">
                      <span className="flex-1 text-sm truncate">{ing.nombre}</span>
                      <input type="text" inputMode="decimal" value={ing.cantidad} onChange={e => updateIngCantidad(ing.producto_id, e.target.value)}
                        className="w-20 rounded border border-slate-200 px-2 py-1 text-sm text-right" />
                      <span className="text-xs text-slate-400 w-16 text-right tabular-nums">{fmtMonto((parseNum(ing.cantidad) || 0) * ing.costo_unitario, config)}</span>
                      <button onClick={() => removeIngrediente(ing.producto_id)} className="text-rose-500"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
              )}

              <button onClick={procesar} disabled={loading || ingredientes.length === 0}
                className="w-full bg-emerald-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50">
                {loading ? 'Procesando...' : 'Procesar producción'}
              </button>
            </div>
          </div>

          {/* Cost Panel */}
          <div className="lg:col-span-2 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-6 text-white">
            <h3 className="text-sm font-semibold text-emerald-100 mb-4">Panel de costos</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <p className="text-xs text-emerald-200">Total materiales</p>
                <p className="text-lg font-bold tabular-nums">{fmtPrincipal(costoTotalMateriales, config)}</p>
              </div>
              <div>
                <p className="text-xs text-emerald-200">Profit ({profitPct}%)</p>
                <p className="text-lg font-bold tabular-nums">{fmtPrincipal(montoProfit, config)}</p>
              </div>
              <div>
                <p className="text-xs text-emerald-200">Costo + Profit</p>
                <p className="text-lg font-bold tabular-nums">{fmtPrincipal(costoConProfit, config)}</p>
              </div>
              <div>
                <p className="text-xs text-emerald-200">Costo unitario</p>
                <p className="text-lg font-bold tabular-nums">{fmtPrincipal(costoUnitario, config)}</p>
              </div>
              <div>
                <p className="text-xs text-emerald-200">Precio sugerido</p>
                <p className="text-lg font-bold tabular-nums">{fmtPrincipal(costoUnitario, config)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'historial' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
          <table className="w-full">
            <thead><tr className="bg-slate-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Fecha</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Producto</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Ingredientes</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Costo total</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Unidades</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Costo unit.</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Profit %</th>
            </tr></thead>
            <tbody>
              {recetas.map(r => (
                <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm text-slate-500">{new Date(r.fecha_creacion).toLocaleDateString('es-VE')}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-700">{r.producto_resultante?.nombre || '-'}</td>
                  <td className="px-4 py-3 text-sm text-right tabular-nums">{r.receta_ingredientes?.length || 0}</td>
                  <td className="px-4 py-3 text-sm text-right tabular-nums">{fmtMonto(Number(r.costo_total_ingredientes_usd), config)}</td>
                  <td className="px-4 py-3 text-sm text-right tabular-nums">{Number(r.cantidad_unidades_producidas).toLocaleString('es-VE')}</td>
                  <td className="px-4 py-3 text-sm text-right tabular-nums">{fmtMonto(Number(r.costo_unitario_final_usd), config)}</td>
                  <td className="px-4 py-3 text-sm text-right tabular-nums">{r.porcentaje_profit_esperado}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

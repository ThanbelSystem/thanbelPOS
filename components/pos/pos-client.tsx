'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ShoppingCart, Plus, Minus, Trash2, Search, X, CreditCard, Wallet, Banknote, Smartphone,
  Printer, Check, User as UserIcon,
} from 'lucide-react'
import { fmtMonto, fmtPrincipal, fmtSecundaria, ConfigDivisas, DEFAULT_DIVISAS } from '@/lib/divisas'
import { registrarAuditoriaCliente } from '@/lib/auditoria'

interface CartItem {
  producto_id: string
  nombre: string
  cantidad: number
  precio_unitario_usd: number
  exento_iva: boolean
  inventario_nombre: string
}

interface PosClientProps {
  caja: any
  inventarios: any[]
  productos: any[]
  clientes: any[]
  configFiscal: any
  configDivisas: ConfigDivisas
  user: any
}

export default function PosClient({ caja, inventarios, productos, clientes, configFiscal, configDivisas, user }: PosClientProps) {
  const router = useRouter()
  const [openCajaModal, setOpenCajaModal] = useState(!caja)
  const [closeCajaModal, setCloseCajaModal] = useState(false)
  const [montoInicialUsd, setMontoInicialUsd] = useState('0')
  const [montoInicialVed, setMontoInicialVed] = useState('0')
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [selectedInv, setSelectedInv] = useState<string>('all')
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [showClientSelect, setShowClientSelect] = useState(false)
  const [clientSearch, setClientSearch] = useState('')
  const [metodoPago, setMetodoPago] = useState<string>('EFECTIVO')
  const [referenciaPago, setReferenciaPago] = useState('')
  const [showMixedPayment, setShowMixedPayment] = useState(false)
  const [mixedPayments, setMixedPayments] = useState<{ metodo: string; monto: string; referencia: string }[]>([])
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [showTicket, setShowTicket] = useState(false)
  const [lastSale, setLastSale] = useState<any>(null)
  const [cajaLoading, setCajaLoading] = useState(false)

  const filteredProducts = productos.filter(p => {
    const matchSearch = p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (p.codigo_barras && p.codigo_barras.toLowerCase().includes(search.toLowerCase()))
    const matchInv = selectedInv === 'all' || p.inventario_id === selectedInv
    return matchSearch && matchInv
  })

  const filteredClientes = clientes.filter(c =>
    c.nombre.toLowerCase().includes(clientSearch.toLowerCase())
  )

  const addToCart = (producto: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.producto_id === producto.id)
      if (existing) {
        return prev.map(item =>
          item.producto_id === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        )
      }
      return [...prev, {
        producto_id: producto.id,
        nombre: producto.nombre,
        cantidad: 1,
        precio_unitario_usd: Number(producto.precio_venta_usd),
        exento_iva: producto.exento_iva,
        inventario_nombre: producto.inventarios?.nombre_inventario || '',
      }]
    })
  }

  const updateQuantity = (producto_id: string, delta: number) => {
    setCart(prev => prev.map(item =>
      item.producto_id === producto_id
        ? { ...item, cantidad: Math.max(0.01, item.cantidad + delta) }
        : item
    ).filter(item => item.cantidad > 0))
  }

  const removeFromCart = (producto_id: string) => {
    setCart(prev => prev.filter(item => item.producto_id !== producto_id))
  }

  const subtotalSinIva = cart
    .filter(item => item.exento_iva)
    .reduce((sum, item) => sum + item.cantidad * item.precio_unitario_usd, 0)
  const subtotalConIva = cart
    .filter(item => !item.exento_iva)
    .reduce((sum, item) => sum + item.cantidad * item.precio_unitario_usd, 0)
  const ivaAmount = subtotalConIva * (Number(configFiscal.porcentaje_iva) || 0) / 100
  const totalUsd = subtotalSinIva + subtotalConIva + ivaAmount

  const openCaja = async () => {
    setCajaLoading(true)
    try {
      const res = await fetch('/api/caja', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monto_inicial_usd: Number(montoInicialUsd) || 0,
          monto_inicial_ved: Number(montoInicialVed) || 0,
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success('Caja abierta exitosamente')
      setOpenCajaModal(false)
      router.refresh()
    } catch { toast.error('Error al abrir caja') }
    finally { setCajaLoading(false) }
  }

  const closeCaja = async () => {
    setCajaLoading(true)
    try {
      const res = await fetch('/api/caja', { method: 'PATCH' })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success('Caja cerrada exitosamente')
      setCloseCajaModal(false)
      router.push('/')
    } catch { toast.error('Error al cerrar caja') }
    finally { setCajaLoading(false) }
  }

  const handleCheckout = async () => {
    if (cart.length === 0) { toast.error('Carrito vacío'); return }
    setCheckoutLoading(true)
    try {
      let pagos = null
      let metodo = metodoPago
      let ref = referenciaPago

      if (metodoPago === 'MIXTO') {
        const totalMixed = mixedPayments.reduce((sum, p) => sum + (Number(p.monto) || 0), 0)
        if (Math.abs(totalMixed - totalUsd) > 0.01) {
          toast.error('Los pagos no cubren el total exacto'); setCheckoutLoading(false); return
        }
        pagos = mixedPayments
        ref = mixedPayments.map(p => `${p.metodo}:${p.referencia || ''}`).join('; ')
      }

      const res = await fetch('/api/pos/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caja_id: caja?.id,
          cliente_id: selectedClient?.id || null,
          items: cart.map(item => ({
            producto_id: item.producto_id,
            cantidad: item.cantidad,
            precio_unitario_usd: item.precio_unitario_usd,
          })),
          tasa_cambio: configDivisas.tasa_cambio,
          metodo_pago: metodo,
          referencia_pago: ref || null,
          iva_pct: Number(configFiscal.porcentaje_iva) || 0,
          pagos: metodo === 'MIXTO' ? pagos : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }

      toast.success('Venta procesada exitosamente')
      setLastSale(data)
      setCart([])
      setSelectedClient(null)
      setMetodoPago('EFECTIVO')
      setReferenciaPago('')
      setMixedPayments([])
      setShowTicket(true)
    } catch { toast.error('Error al procesar venta') }
    finally { setCheckoutLoading(false) }
  }

  const addMixedPayment = () => {
    setMixedPayments(prev => [...prev, { metodo: 'EFECTIVO', monto: '0', referencia: '' }])
  }

  const updateMixedPayment = (index: number, field: string, value: string) => {
    setMixedPayments(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p))
  }

  const removeMixedPayment = (index: number) => {
    setMixedPayments(prev => prev.filter((_, i) => i !== index))
  }

  const mixedTotal = mixedPayments.reduce((sum, p) => sum + (Number(p.monto) || 0), 0)

  const renderTicket = () => {
    if (!lastSale) return ''
    const line = '-'.repeat(configFiscal.ancho_papel === '80mm' ? 48 : 32)
    return `
      <html>
      <head><meta charset="utf-8"><style>
        body { font-family: 'Courier New', monospace; font-size: 12px; width: ${configFiscal.ancho_papel === '80mm' ? '72mm' : '50mm'}; margin: 0; padding: 8px; }
        h2 { text-align: center; margin: 0; font-size: 14px; }
        p { text-align: center; margin: 2px 0; font-size: 11px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { text-align: left; font-size: 11px; }
        .right { text-align: right; }
        .total { font-weight: bold; font-size: 13px; }
        .line { text-align: center; }
      </style></head>
      <body>
        <h2>ThanBel POS</h2>
        <p>${new Date().toLocaleString('es-VE')}</p>
        <div class="line">${line}</div>
        <table>
          <tr><th>Item</th><th class="right">Precio</th></tr>
          ${cart.map(item => `
            <tr>
              <td>${item.nombre} x${item.cantidad}</td>
              <td class="right">${fmtPrincipal(item.cantidad * item.precio_unitario_usd, configDivisas)}</td>
            </tr>
          `).join('')}
        </table>
        <div class="line">${line}</div>
        <table>
          <tr><td>Subtotal:</td><td class="right">${fmtPrincipal(totalUsd - ivaAmount, configDivisas)}</td></tr>
          ${configFiscal.mostrar_iva ? `<tr><td>IVA (${configFiscal.porcentaje_iva}%):</td><td class="right">${fmtPrincipal(ivaAmount, configDivisas)}</td></tr>` : ''}
          <tr class="total"><td>TOTAL:</td><td class="right">${fmtMonto(totalUsd, configDivisas)}</td></tr>
        </table>
        <div class="line">${line}</div>
        <p>¡Gracias por su compra!</p>
        <script>window.print();window.close();</script>
      </body></html>
    `
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-4">
      {/* Open/Close Caja Modals */}
      {openCajaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => {}} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in-fade">
            <h3 className="text-lg font-semibold text-slate-800 mb-1">Abrir caja</h3>
            <p className="text-sm text-slate-500 mb-4">Ingrese los montos iniciales</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Monto inicial (USD)</label>
                <input type="number" step="0.01" value={montoInicialUsd} onChange={e => setMontoInicialUsd(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Monto inicial (VED)</label>
                <input type="number" step="0.01" value={montoInicialVed} onChange={e => setMontoInicialVed(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" />
              </div>
              <button onClick={openCaja} disabled={cajaLoading}
                className="w-full bg-emerald-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50">
                {cajaLoading ? 'Abriendo...' : 'Abrir caja'}
              </button>
            </div>
          </div>
        </div>
      )}

      {closeCajaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => {}} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in-fade">
            <h3 className="text-lg font-semibold text-slate-800 mb-1">Cerrar caja</h3>
            <p className="text-sm text-slate-500 mb-4">¿Está seguro de cerrar la caja?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setCloseCajaModal(false)} className="px-4 py-2 text-sm hover:bg-slate-100 rounded-lg">Cancelar</button>
              <button onClick={closeCaja} disabled={cajaLoading} className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50">
                {cajaLoading ? 'Cerrando...' : 'Cerrar caja'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Grid */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Buscar producto..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" />
            </div>
            <select value={selectedInv} onChange={e => setSelectedInv(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none">
              <option value="all">Todos</option>
              {inventarios.map((inv: any) => (
                <option key={inv.id} value={inv.id}>{inv.nombre_inventario}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            {caja ? (
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                <Check className="w-3 h-3" /> Caja abierta
              </span>
            ) : (
              <button onClick={() => setOpenCajaModal(true)} className="text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                Abrir caja
              </button>
            )}
            {caja && (
              <button onClick={() => setCloseCajaModal(true)} className="text-xs font-medium text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full">
                Cerrar caja
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredProducts.map((p: any) => (
              <button key={p.id} onClick={() => addToCart(p)}
                className="bg-white rounded-xl border border-slate-100 p-3 text-left hover:border-emerald-200 hover:shadow-sm transition-all active:scale-95">
                <p className="text-sm font-medium text-slate-800 truncate">{p.nombre}</p>
                <p className="text-xs text-slate-400 truncate">{p.inventarios?.nombre_inventario}</p>
                <p className="text-sm font-semibold text-emerald-600 mt-2 tabular-nums">{fmtPrincipal(Number(p.precio_venta_usd), configDivisas)}</p>
                <p className="text-xs text-slate-400 tabular-nums">Stock: {Number(p.stock_actual).toLocaleString('es-VE')}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cart */}
      <div className="w-full lg:w-96 flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" /> Carrito ({cart.length})
            </h3>
          </div>

          {/* Client Select */}
          <div className="relative">
            <button onClick={() => setShowClientSelect(!showClientSelect)}
              className="w-full flex items-center gap-2 text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2 hover:bg-slate-100">
              <UserIcon className="w-4 h-4" />
              {selectedClient ? selectedClient.nombre : 'Consumidor Final'}
            </button>
            {showClientSelect && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-slate-100 shadow-lg z-10 max-h-48 overflow-y-auto scrollbar-thin">
                <div className="p-2">
                  <input type="text" placeholder="Buscar cliente..." value={clientSearch} onChange={e => setClientSearch(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none mb-1" />
                </div>
                <button onClick={() => { setSelectedClient(null); setShowClientSelect(false) }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50">
                  Consumidor Final
                </button>
                {filteredClientes.map((c: any) => (
                  <button key={c.id} onClick={() => { setSelectedClient(c); setShowClientSelect(false) }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center justify-between">
                    <span>{c.nombre}</span>
                    {selectedClient?.id === c.id && <Check className="w-3 h-3 text-emerald-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
          {cart.map(item => (
            <div key={item.producto_id} className="flex items-start justify-between gap-2 p-2 rounded-xl bg-slate-50">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{item.nombre}</p>
                <p className="text-xs text-slate-400 tabular-nums">{fmtPrincipal(item.precio_unitario_usd, configDivisas)} c/u</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => updateQuantity(item.producto_id, -1)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-200"><Minus className="w-3 h-3" /></button>
                <span className="w-8 text-center text-sm font-medium tabular-nums">{item.cantidad}</span>
                <button onClick={() => updateQuantity(item.producto_id, 1)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-200"><Plus className="w-3 h-3" /></button>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-800 tabular-nums">{fmtPrincipal(item.cantidad * item.precio_unitario_usd, configDivisas)}</p>
                <button onClick={() => removeFromCart(item.producto_id)} className="text-rose-500 hover:text-rose-700"><Trash2 className="w-3 h-3" /></button>
              </div>
            </div>
          ))}
          {cart.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-8">Seleccione productos para agregar al carrito</p>
          )}
        </div>

        {/* Totals & Checkout */}
        <div className="p-4 border-t border-slate-100 space-y-3">
          <div className="text-sm text-slate-500 space-y-1">
            <div className="flex justify-between"><span>Subtotal sin IVA:</span><span className="tabular-nums">{fmtPrincipal(subtotalSinIva, configDivisas)}</span></div>
            <div className="flex justify-between"><span>Subtotal con IVA:</span><span className="tabular-nums">{fmtPrincipal(subtotalConIva, configDivisas)}</span></div>
            {configFiscal.mostrar_iva && Number(configFiscal.porcentaje_iva) > 0 && (
              <div className="flex justify-between"><span>IVA ({configFiscal.porcentaje_iva}%):</span><span className="tabular-nums">{fmtPrincipal(ivaAmount, configDivisas)}</span></div>
            )}
            <div className="flex justify-between text-base font-bold text-slate-800 pt-2 border-t border-slate-100">
              <span>TOTAL:</span><span className="tabular-nums">{fmtMonto(totalUsd, configDivisas)}</span>
            </div>
          </div>

          {/* Payment Method */}
          {caja && (
            <>
              <div className="flex flex-wrap gap-2">
                {['EFECTIVO', 'PAGO_MOVIL', 'PUNTO_DE_VENTA', 'CREDITO', 'MIXTO'].map(mp => (
                  <button key={mp} onClick={() => { setMetodoPago(mp); setReferenciaPago(''); setShowMixedPayment(false) }}
                    className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                      metodoPago === mp ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}>
                    {mp === 'EFECTIVO' && <Banknote className="w-3 h-3 inline mr-1" />}
                    {mp === 'PAGO_MOVIL' && <Smartphone className="w-3 h-3 inline mr-1" />}
                    {mp === 'PUNTO_DE_VENTA' && <CreditCard className="w-3 h-3 inline mr-1" />}
                    {mp === 'CREDITO' && <Wallet className="w-3 h-3 inline mr-1" />}
                    {mp === 'MIXTO' && <Wallet className="w-3 h-3 inline mr-1" />}
                    {mp === 'EFECTIVO' ? 'Efectivo' : mp === 'PAGO_MOVIL' ? 'Pago Móvil' : mp === 'PUNTO_DE_VENTA' ? 'Punto de Venta' : mp === 'CREDITO' ? 'Crédito' : 'Mixto'}
                  </button>
                ))}
              </div>

              {['PAGO_MOVIL', 'PUNTO_DE_VENTA'].includes(metodoPago) && (
                <input type="text" placeholder="Referencia de pago" value={referenciaPago} onChange={e => setReferenciaPago(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" />
              )}

              {metodoPago === 'MIXTO' && (
                <div className="space-y-2">
                  {mixedPayments.map((p, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <select value={p.metodo} onChange={e => updateMixedPayment(i, 'metodo', e.target.value)}
                        className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none">
                        <option value="EFECTIVO">Efectivo</option>
                        <option value="PAGO_MOVIL">Pago Móvil</option>
                        <option value="PUNTO_DE_VENTA">Punto de Venta</option>
                        <option value="CREDITO">Crédito</option>
                      </select>
                      <input type="number" step="0.01" placeholder="Monto" value={p.monto} onChange={e => updateMixedPayment(i, 'monto', e.target.value)}
                        className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" />
                      <input type="text" placeholder="Ref" value={p.referencia} onChange={e => updateMixedPayment(i, 'referencia', e.target.value)}
                        className="w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" />
                      <button onClick={() => removeMixedPayment(i)} className="text-rose-500 hover:text-rose-700"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                  <button onClick={addMixedPayment} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">
                    + Agregar método de pago
                  </button>
                  <p className="text-xs text-slate-500 tabular-nums">Total: {fmtMonto(totalUsd, configDivisas)} | Asignado: {fmtMonto(mixedTotal, configDivisas)}</p>
                </div>
              )}

              <button onClick={handleCheckout} disabled={checkoutLoading || cart.length === 0}
                className="w-full bg-emerald-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50">
                {checkoutLoading ? 'Procesando...' : `Cobrar ${fmtMonto(totalUsd, configDivisas)}`}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Ticket Preview */}
      {showTicket && lastSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowTicket(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 animate-in-fade max-w-sm w-full">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Venta procesada</h3>
            <p className="text-sm text-slate-500 mb-4">Total: {fmtMonto(lastSale.total_usd, configDivisas)}</p>
            <div className="flex gap-3">
              <button onClick={() => { const w = window.open('', '_blank'); if (w) { w.document.write(renderTicket()); w.document.close(); } }}
                className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 flex items-center justify-center gap-2">
                <Printer className="w-4 h-4" /> Imprimir ticket
              </button>
              <button onClick={() => setShowTicket(false)}
                className="px-4 py-2 text-sm hover:bg-slate-100 rounded-lg">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ShoppingCart, Plus, Minus, Trash2, Search, X, CreditCard, Wallet, Banknote, Smartphone,
  Printer, Check, User as UserIcon, Eraser, Package,
} from 'lucide-react'
import { fmtMonto, fmtPrincipal, fmtSecundaria, ConfigDivisas, DEFAULT_DIVISAS } from '@/lib/divisas'
import { registrarAuditoriaCliente } from '@/lib/auditoria'
import { parseNum } from '@/lib/utils'
import Pagination from '@/components/ui/pagination'

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
  empresa: any
  user: any
}

export default function PosClient({ caja: initialCaja, inventarios, productos, clientes, configFiscal, configDivisas, empresa, user }: PosClientProps) {
  const router = useRouter()
  const [caja, setCaja] = useState(initialCaja)
  const [openCajaModal, setOpenCajaModal] = useState(!initialCaja)
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
  const [saleSnapshot, setSaleSnapshot] = useState<{
    cart: CartItem[]
    selectedClient: any
    subtotalSinIva: number
    subtotalConIva: number
    ivaAmount: number
    totalUsd: number
  } | null>(null)
  const [cajaLoading, setCajaLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [showAddProductModal, setShowAddProductModal] = useState(false)
  const [newProductName, setNewProductName] = useState('')
  const [newProductPrice, setNewProductPrice] = useState('')
  const [editingQty, setEditingQty] = useState<Record<string, string>>({})

  const filteredProducts = productos.filter(p => {
    const matchSearch = p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (p.codigo_barras && p.codigo_barras.toLowerCase().includes(search.toLowerCase()))
    const matchInv = selectedInv === 'all' || p.inventario_id === selectedInv
    return matchSearch && matchInv
  })

  const paginatedProducts = filteredProducts.slice((page - 1) * pageSize, page * pageSize)

  const addCustomProductToCart = () => {
    const name = newProductName.trim()
    const price = parseNum(newProductPrice)
    if (!name) { toast.error('Ingrese un nombre para el producto'); return }
    if (!price || price <= 0) { toast.error('Ingrese un costo unitario válido'); return }
    setCart(prev => [...prev, {
      producto_id: `custom_${Date.now()}`,
      nombre: name,
      cantidad: 1,
      precio_unitario_usd: price,
      exento_iva: false,
      inventario_nombre: 'Personalizado',
    }])
    setNewProductName('')
    setNewProductPrice('')
    setShowAddProductModal(false)
    toast.success('Producto agregado al carrito')
  }

  const resetSale = () => {
    setCart([])
    setSearch('')
    setSelectedInv('all')
    setSelectedClient(null)
    setClientSearch('')
    setMetodoPago('EFECTIVO')
    setReferenciaPago('')
    setMixedPayments([])
    setPage(1)
    toast.success('Venta restablecida')
  }

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

  const setQuantity = (producto_id: string, value: string) => {
    setEditingQty(prev => ({ ...prev, [producto_id]: value }))
  }

  const commitQuantity = (producto_id: string) => {
    const raw = editingQty[producto_id]
    if (raw === undefined) return
    const trimmed = raw.trim()
    if (trimmed === '') {
      setEditingQty(prev => { const { [producto_id]: _, ...rest } = prev; return rest })
      return
    }
    const num = parseNum(trimmed)
    if (isNaN(num) || num <= 0) {
      setEditingQty(prev => { const { [producto_id]: _, ...rest } = prev; return rest })
      return
    }
    setCart(prev => prev.map(item =>
      item.producto_id === producto_id
        ? { ...item, cantidad: Math.max(0.01, num) }
        : item
    ))
    setEditingQty(prev => { const { [producto_id]: _, ...rest } = prev; return rest })
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
          monto_inicial_usd: parseNum(montoInicialUsd) || 0,
          monto_inicial_ved: parseNum(montoInicialVed) || 0,
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success('Caja abierta exitosamente')
      setCaja(data)
      setOpenCajaModal(false)
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
      setCaja(null)
      setCloseCajaModal(false)
      setOpenCajaModal(true)
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
      setSaleSnapshot({
        cart: [...cart],
        selectedClient: selectedClient ? { ...selectedClient } : null,
        subtotalSinIva,
        subtotalConIva,
        ivaAmount,
        totalUsd,
      })
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

  const printTicket = () => {
    const html = renderTicket()
    if (!html) return
    const is80mm = configFiscal.ancho_papel === '80mm'
    const winW = is80mm ? 420 : 340
    const w = window.open('', '_blank', `width=${winW},height=600,menubar=no,scrollbars=yes`)
    if (w) {
      w.document.write(html)
      w.document.close()
      w.focus()
    } else {
      const iframe = document.createElement('iframe')
      iframe.style.position = 'fixed'
      iframe.style.top = '-9999px'
      iframe.style.left = '-9999px'
      document.body.appendChild(iframe)
      const doc = iframe.contentDocument || iframe.contentWindow?.document
      if (doc) {
        doc.write(html)
        doc.close()
        setTimeout(() => { iframe.contentWindow?.print(); document.body.removeChild(iframe) }, 300)
      }
    }
  }

  const renderTicket = () => {
    if (!lastSale || !saleSnapshot) return ''
    const snap = saleSnapshot
    const line = '-'.repeat(configFiscal.ancho_papel === '80mm' ? 48 : 32)
    const showIva = configFiscal.mostrar_iva && Number(configFiscal.porcentaje_iva) > 0
    const mensaje = configFiscal.mensaje_agradecimiento || '¡Gracias por su compra!'
    const fechaEmision = new Date().toLocaleString('es-VE')
    const clienteNombre = snap.selectedClient?.nombre || 'Consumidor Final'
    const clienteRif = snap.selectedClient?.identificacion_cedula_rif || ''
    const tasaStr = `1 ${configDivisas.divisa_principal || 'USD'} = ${Number(configDivisas.tasa_cambio).toLocaleString('es-VE')} ${configDivisas.divisa_secundaria || 'VED'}`

    return `
      <html>
      <head><meta charset="utf-8"><style>
        @page { size: ${configFiscal.ancho_papel === '80mm' ? '80mm' : '58mm'} 297mm; margin: 0; }
        body { font-family: 'Courier New', monospace; font-size: 12px; width: ${configFiscal.ancho_papel === '80mm' ? '72mm' : '50mm'}; margin: 0 auto; padding: 4mm; }
        h2 { text-align: center; margin: 0; font-size: 14px; }
        p { text-align: center; margin: 2px 0; font-size: 11px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { text-align: left; font-size: 11px; padding: 1px 0; }
        .right { text-align: right; }
        .center { text-align: center; }
        .total { font-weight: bold; font-size: 13px; }
        .line { text-align: center; }
        .header { font-size: 11px; text-align: center; margin: 1px 0; }
        .label { font-weight: bold; }
        @media print { body { margin: 0; padding: 4mm; } }
      </style></head>
      <body>
        <h2>${empresa?.nombre || 'ThanBel POS'}</h2>
        ${empresa?.direccion ? `<p class="header">${empresa.direccion}</p>` : ''}
        ${empresa?.rif_identificacion ? `<p class="header">RIF: ${empresa.rif_identificacion}</p>` : ''}
        ${empresa?.telefono ? `<p class="header">Telf: ${empresa.telefono}</p>` : ''}
        <div class="line">${line}</div>
        <p class="header">${fechaEmision}</p>
        <p class="header"># Factura: ${lastSale.venta_id || ''}</p>
        <p class="header">Cliente: ${clienteNombre}${clienteRif ? ' / ' + clienteRif : ''}</p>
        <div class="line">${line}</div>
        <p class="center label">FACTURA</p>
        <div class="line">${line}</div>
        <table>
          <tr><th>Cant</th><th>Descripción</th><th class="right">Precio</th><th class="right">Total</th></tr>
          ${snap.cart.map(item => {
            const totalItem = item.cantidad * item.precio_unitario_usd
            return `
            <tr>
              <td>${item.cantidad}</td>
              <td>${item.nombre}</td>
              <td class="right">${fmtPrincipal(item.precio_unitario_usd, configDivisas)}</td>
              <td class="right">${fmtPrincipal(totalItem, configDivisas)}</td>
            </tr>`
          }).join('')}
        </table>
        <div class="line">${line}</div>
        ${showIva ? `
        <table>
          <tr><td>Subtotal (Base IVA):</td><td class="right">${fmtPrincipal(snap.subtotalConIva, configDivisas)}</td></tr>
          <tr><td>IVA (${configFiscal.porcentaje_iva}%):</td><td class="right">${fmtPrincipal(snap.ivaAmount, configDivisas)}</td></tr>
          <tr><td>Exento:</td><td class="right">${fmtPrincipal(snap.subtotalSinIva, configDivisas)}</td></tr>
          <tr class="total"><td>TOTAL:</td><td class="right">${fmtMonto(snap.totalUsd, configDivisas)}</td></tr>
        </table>
        ` : `
        <table>
          <tr class="total"><td>TOTAL:</td><td class="right">${fmtMonto(snap.totalUsd, configDivisas)}</td></tr>
        </table>
        `}
        <p class="center">Tasa: ${tasaStr}</p>
        <div class="line">${line}</div>
        <p class="center">${mensaje}</p>
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
                <input type="text" inputMode="decimal" value={montoInicialUsd} onChange={e => setMontoInicialUsd(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Monto inicial (VED)</label>
                <input type="text" inputMode="decimal" value={montoInicialVed} onChange={e => setMontoInicialVed(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" />
              </div>
              <button onClick={openCaja} disabled={cajaLoading}
                className="w-full bg-emerald-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50">
                {cajaLoading ? 'Abriendo...' : 'Abrir caja'}
              </button>
              <button onClick={() => router.push('/')}
                className="w-full bg-slate-100 text-slate-600 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors mt-2">
                Volver al inicio
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

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowAddProductModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in-fade">
            <h3 className="text-lg font-semibold text-slate-800 mb-1">Agregar producto</h3>
            <p className="text-sm text-slate-500 mb-4">Ingrese el nombre y costo unitario del producto</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del producto</label>
                <input type="text" value={newProductName} onChange={e => setNewProductName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none"
                  placeholder="Ej: Producto personalizado" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Costo unitario (USD)</label>
                <input type="text" inputMode="decimal" value={newProductPrice} onChange={e => setNewProductPrice(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none"
                  placeholder="0.00" />
              </div>
              <div className="flex gap-3">
                <button onClick={addCustomProductToCart}
                  className="flex-1 bg-emerald-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors">
                  Agregar al carrito
                </button>
                <button onClick={() => setShowAddProductModal(false)}
                  className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  Cancelar
                </button>
              </div>
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
              <input type="text" placeholder="Buscar producto..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
                className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" />
            </div>
            <select value={selectedInv} onChange={e => { setSelectedInv(e.target.value); setPage(1) }}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none">
              <option value="all">Todos</option>
              {inventarios.map((inv: any) => (
                <option key={inv.id} value={inv.id}>{inv.nombre_inventario}</option>
              ))}
            </select>
            <button onClick={() => setShowAddProductModal(true)}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-colors">
              <Plus className="w-4 h-4" />
            </button>
            <button onClick={resetSale}
              className="flex items-center gap-1.5 rounded-lg border border-rose-200 text-rose-600 px-3 py-2 text-sm font-medium hover:bg-rose-50 transition-colors">
              <Eraser className="w-4 h-4" /> Limpiar
            </button>
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
            {paginatedProducts.map((p: any) => {
              const cartItem = cart.find(item => item.producto_id === p.id)
              const enCarrito = !!cartItem
              return (
              <button key={p.id} onClick={() => addToCart(p)}
                className={`relative rounded-xl border-2 p-3 text-left transition-all active:scale-95 ${
                  enCarrito
                    ? 'bg-emerald-50 border-emerald-300 hover:border-emerald-400 shadow-sm'
                    : 'bg-white border-emerald-100 hover:border-emerald-400 hover:shadow-md'
                }`}>
                <p className="text-sm font-medium text-slate-800 truncate">{p.nombre}</p>
                <p className="text-xs text-slate-400 truncate">{p.inventarios?.nombre_inventario}</p>
                <p className="text-sm font-semibold text-emerald-600 mt-2 tabular-nums">{fmtPrincipal(Number(p.precio_venta_usd), configDivisas)}</p>
                <p className="text-xs text-slate-400 tabular-nums">Stock: {Number(p.stock_actual).toLocaleString('es-VE')}</p>
                {enCarrito && (
                  <span className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center shadow-sm">
                    {cartItem!.cantidad}
                  </span>
                )}
              </button>
            )})}
          </div>
          <Pagination
            data={filteredProducts}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => { setPageSize(size); setPage(1) }}
          />
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
              className={`w-full flex items-center gap-2 text-sm rounded-lg px-3 py-2 transition-all ${
                selectedClient
                  ? 'text-slate-700 bg-white border-2 border-emerald-300 hover:border-emerald-400'
                  : 'text-slate-600 bg-slate-50 border-2 border-slate-200 hover:border-slate-300'
              }`}>
              <UserIcon className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-left truncate">{selectedClient ? selectedClient.nombre : 'Consumidor Final'}</span>
              {selectedClient && (
                <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-white" />
                </span>
              )}
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
                <input type="text" inputMode="decimal"
                  value={editingQty[item.producto_id] ?? item.cantidad}
                  onChange={e => setQuantity(item.producto_id, e.target.value)}
                  onBlur={() => commitQuantity(item.producto_id)}
                  className="w-14 text-center text-sm font-medium tabular-nums bg-white border border-slate-200 rounded-lg px-1 py-0.5 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" />
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
                    <div key={i} className="flex items-center gap-1 min-w-0">
                      <select value={p.metodo} onChange={e => updateMixedPayment(i, 'metodo', e.target.value)}
                        className="shrink-0 rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none w-[100px]">
                        <option value="EFECTIVO">Efectivo</option>
                        <option value="PAGO_MOVIL">Pago Móvil</option>
                        <option value="PUNTO_DE_VENTA">Punto de Venta</option>
                        <option value="CREDITO">Crédito</option>
                      </select>
                      <input type="text" inputMode="decimal" placeholder="Monto" value={p.monto} onChange={e => updateMixedPayment(i, 'monto', e.target.value)}
                        className="w-[80px] shrink-0 rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" />
                      <input type="text" placeholder="Ref" value={p.referencia} onChange={e => updateMixedPayment(i, 'referencia', e.target.value)}
                        className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" />
                      <button onClick={() => removeMixedPayment(i)} className="shrink-0 text-rose-500 hover:text-rose-700"><X className="w-4 h-4" /></button>
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
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => { setShowTicket(false); setSaleSnapshot(null) }} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 animate-in-fade max-w-sm w-full">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Venta procesada</h3>
            <p className="text-sm text-slate-500 mb-4">Total: {fmtMonto(lastSale.total_usd, configDivisas)}</p>
            <div className="flex gap-3">
              <button onClick={printTicket}
                className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 flex items-center justify-center gap-2">
                <Printer className="w-4 h-4" /> Imprimir ticket
              </button>
              <button onClick={() => { setShowTicket(false); setSaleSnapshot(null) }}
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

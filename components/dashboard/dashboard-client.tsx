'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import {
  DollarSign, ShoppingCart, Users, Eye, EyeOff,
  LayoutDashboard, ShoppingCart as ShoppingCartIcon, Users as UsersIcon, Truck, Boxes, Factory,
  ArrowLeftRight, FileBarChart, UserCog, ScrollText, Settings,
} from 'lucide-react'
import { fmtMonto, ConfigDivisas, DEFAULT_DIVISAS } from '@/lib/divisas'

interface DashboardClientProps {
  ventasHoy: { total_usd: number }[]
  transaccionesHoy: number
  clientesActivos: number
  ventas7: { cantidad: number; ventas: { fecha_venta: string } }[]
  config: ConfigDivisas
}

const quickLinks = [
  { href: '/pos', label: 'Ventas POS', icon: ShoppingCartIcon, color: 'text-emerald-600 bg-emerald-50' },
  { href: '/clientes', label: 'Clientes', icon: UsersIcon, color: 'text-blue-600 bg-blue-50' },
  { href: '/proveedores', label: 'Proveedores', icon: Truck, color: 'text-amber-600 bg-amber-50' },
  { href: '/inventarios', label: 'Inventarios', icon: Boxes, color: 'text-violet-600 bg-violet-50' },
  { href: '/produccion', label: 'Producción', icon: Factory, color: 'text-rose-600 bg-rose-50' },
  { href: '/transacciones', label: 'Transacciones', icon: ArrowLeftRight, color: 'text-cyan-600 bg-cyan-50' },
  { href: '/reportes', label: 'Reportes', icon: FileBarChart, color: 'text-emerald-600 bg-emerald-50' },
  { href: '/usuarios', label: 'Usuarios', icon: UserCog, color: 'text-slate-600 bg-slate-100' },
  { href: '/auditoria', label: 'Auditoría', icon: ScrollText, color: 'text-amber-600 bg-amber-50' },
  { href: '/configuracion', label: 'Configuración', icon: Settings, color: 'text-slate-600 bg-slate-100' },
]

export default function DashboardClient({ ventasHoy, transaccionesHoy, clientesActivos, ventas7, config }: DashboardClientProps) {
  const [hidden, setHidden] = useState(false)
  const totalVentasHoy = ventasHoy.reduce((sum, v) => sum + Number(v.total_usd), 0)

  const ventasPorDia: Record<string, number> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toLocaleDateString('es-VE', { weekday: 'short', day: 'numeric' })
    ventasPorDia[key] = 0
  }

  ventas7.forEach(item => {
    const d = new Date(item.ventas.fecha_venta)
    const key = d.toLocaleDateString('es-VE', { weekday: 'short', day: 'numeric' })
    if (ventasPorDia[key] !== undefined) {
      ventasPorDia[key] += Number(item.cantidad)
    }
  })

  const chartData = Object.entries(ventasPorDia).map(([fecha, cantidad]) => ({ fecha, cantidad }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Resumen del día</p>
        </div>
        <button
          onClick={() => setHidden(!hidden)}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100"
        >
          {hidden ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-sm text-slate-500 mb-1">Ventas del día</p>
          <p className="text-2xl font-bold text-slate-800 tabular-nums">
            {hidden ? '••••' : fmtMonto(totalVentasHoy, config)}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-slate-500 mb-1">Transacciones hoy</p>
          <p className="text-2xl font-bold text-slate-800 tabular-nums">{hidden ? '••••' : transaccionesHoy}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <p className="text-sm text-slate-500 mb-1">Clientes activos</p>
          <p className="text-2xl font-bold text-slate-800 tabular-nums">{hidden ? '••••' : clientesActivos}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Productos vendidos (7 días)</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="fecha" tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip
                contentStyle={{
                  borderRadius: '0.75rem',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <Line type="monotone" dataKey="cantidad" stroke="#00B074" strokeWidth={2} dot={{ fill: '#00B074', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Accesos rápidos</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {quickLinks.map(link => {
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-shadow"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${link.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium text-slate-700">{link.label}</p>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ShoppingCart, Users, Truck, Boxes, Factory,
  ArrowLeftRight, FileBarChart, UserCog, ScrollText, Settings, LogOut, X, Store,
} from 'lucide-react'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pos', label: 'Ventas POS', icon: ShoppingCart },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/proveedores', label: 'Proveedores', icon: Truck },
  { href: '/inventarios', label: 'Inventarios', icon: Boxes },
  { href: '/produccion', label: 'Producción', icon: Factory },
  { href: '/transacciones', label: 'Transacciones', icon: ArrowLeftRight },
  { href: '/reportes', label: 'Reportes', icon: FileBarChart },
  { href: '/usuarios', label: 'Usuarios', icon: UserCog },
  { href: '/auditoria', label: 'Auditoría', icon: ScrollText },
  { href: '/configuracion', label: 'Configuración', icon: Settings },
]

interface MobileNavProps {
  open: boolean
  onClose: () => void
  onLogout: () => void
}

export default function MobileNav({ open, onClose, onLogout }: MobileNavProps) {
  const pathname = usePathname()

  if (!open) return null

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 left-0 w-72 bg-white shadow-2xl animate-in-fade">
        <div className="flex items-center justify-between px-4 h-16 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm font-semibold text-slate-800">ThanBel POS</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <nav className="overflow-y-auto scrollbar-thin px-3 py-4 space-y-1" style={{ height: 'calc(100vh - 140px)' }}>
          {navItems.map(item => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 px-3 pb-4 bg-white border-t border-slate-100 pt-3">
          <button
            onClick={() => { onLogout(); onClose() }}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>
    </div>
  )
}

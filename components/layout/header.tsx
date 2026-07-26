'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import {
  Menu, LayoutDashboard, ShoppingCart, Package, Users, Truck,
  UserCog, BarChart3, ArrowLeftRight, Factory, Settings, ScrollText,
} from 'lucide-react'
import { getConfigDivisas, fmtTasa, ConfigDivisas, DEFAULT_DIVISAS } from '@/lib/divisas'

const moduleMap: Record<string, { name: string; icon: React.ReactNode }> = {
  '/': { name: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  '/pos': { name: 'Ventas POS', icon: <ShoppingCart className="w-5 h-5" /> },
  '/inventarios': { name: 'Inventarios', icon: <Package className="w-5 h-5" /> },
  '/clientes': { name: 'Clientes', icon: <Users className="w-5 h-5" /> },
  '/proveedores': { name: 'Proveedores', icon: <Truck className="w-5 h-5" /> },
  '/usuarios': { name: 'Usuarios', icon: <UserCog className="w-5 h-5" /> },
  '/reportes': { name: 'Reportes', icon: <BarChart3 className="w-5 h-5" /> },
  '/transacciones': { name: 'Transacciones', icon: <ArrowLeftRight className="w-5 h-5" /> },
  '/produccion': { name: 'Producción', icon: <Factory className="w-5 h-5" /> },
  '/configuracion': { name: 'Configuración', icon: <Settings className="w-5 h-5" /> },
  '/auditoria': { name: 'Auditoría', icon: <ScrollText className="w-5 h-5" /> },
}

interface HeaderProps {
  onMenuClick: () => void
  userName: string
}

export default function Header({ onMenuClick, userName }: HeaderProps) {
  const [time, setTime] = useState(new Date())
  const [config, setConfig] = useState<ConfigDivisas>(DEFAULT_DIVISAS)
  const pathname = usePathname()

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    getConfigDivisas().then(setConfig)
    return () => clearInterval(timer)
  }, [])

  const initial = userName?.charAt(0)?.toUpperCase() || 'U'

  const moduleInfo = moduleMap[pathname] || { name: 'ThanBel POS', icon: <LayoutDashboard className="w-5 h-5" /> }

  const dateStr = time.toLocaleDateString('es-VE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Caracas',
  })

  const timeStr = time.toLocaleString('es-VE', {
    timeZone: 'America/Caracas',
    hour12: true,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/80 backdrop-blur border-b border-slate-100 flex items-center justify-between px-4 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100"
        >
          <Menu className="w-5 h-5 text-slate-600" />
        </button>
        <div className="hidden lg:flex items-center gap-2 text-slate-700">
          {moduleInfo.icon}
          <span className="text-sm font-semibold">{moduleInfo.name}</span>
        </div>
      </div>

      <div className="flex items-center gap-4 ml-auto">
        <div className="hidden sm:block text-right">
          <p className="text-xs text-slate-400 capitalize">{dateStr}</p>
          <p className="text-sm font-medium text-slate-600 tabular-nums leading-tight">{timeStr}</p>
        </div>

        <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
          {fmtTasa(config)}
        </span>

        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-sm font-semibold shadow-sm">
          {initial}
        </div>
      </div>
    </header>
  )
}

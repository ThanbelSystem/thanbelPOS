'use client'

import { useEffect, useState } from 'react'
import { Bell, Menu } from 'lucide-react'
import { getConfigDivisas, fmtTasa, ConfigDivisas, DEFAULT_DIVISAS } from '@/lib/divisas'

interface HeaderProps {
  onMenuClick: () => void
  userName: string
}

export default function Header({ onMenuClick, userName }: HeaderProps) {
  const [time, setTime] = useState(new Date())
  const [config, setConfig] = useState<ConfigDivisas>(DEFAULT_DIVISAS)

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    getConfigDivisas().then(setConfig)
    return () => clearInterval(timer)
  }, [])

  const initial = userName?.charAt(0)?.toUpperCase() || 'U'

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/80 backdrop-blur border-b border-slate-100 flex items-center justify-between px-4 lg:px-8">
      <button
        onClick={onMenuClick}
        className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100"
      >
        <Menu className="w-5 h-5 text-slate-600" />
      </button>

      <div className="hidden lg:block" />

      <div className="flex items-center gap-4 ml-auto">
        <span className="text-sm text-slate-500 tabular-nums">
          {time.toLocaleString('es-VE', { timeZone: 'America/Caracas', hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>

        <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
          {fmtTasa(config)}
        </span>

        <button className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100">
          <Bell className="w-4 h-4 text-slate-500" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-rose-500" />
        </button>

        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-sm font-semibold">
          {initial}
        </div>
      </div>
    </header>
  )
}

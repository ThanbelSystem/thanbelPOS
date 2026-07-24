'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Toaster, toast } from 'sonner'
import Sidebar from './sidebar'
import Header from './header'
import MobileNav from './mobile-nav'
import type { AuthUser } from '@/lib/auth'

interface AppShellProps {
  children: React.ReactNode
  user: AuthUser
}

export default function AppShell({ children, user }: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const router = useRouter()

  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
    } catch {
      toast.error('Error al cerrar sesión')
    }
  }, [router])

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar onLogout={handleLogout} />
      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} onLogout={handleLogout} />
      <div className="lg:pl-64">
        <Header onMenuClick={() => setMobileNavOpen(true)} userName={user.nombre} />
        <main className="p-4 lg:p-8 animate-in-fade">
          {children}
        </main>
      </div>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: { borderRadius: '0.75rem', background: '#1E293B', color: 'white' },
        }}
      />
    </div>
  )
}

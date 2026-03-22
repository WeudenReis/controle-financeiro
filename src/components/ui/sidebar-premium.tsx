'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, List, Tag, BarChart2, Calendar, Target, Download, Settings, ChevronLeft, ChevronRight, Zap } from 'lucide-react'

const items = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/transactions', label: 'Transações', icon: List },
  { href: '/categories', label: 'Categorias', icon: Tag },
  { href: '/reports', label: 'Relatórios', icon: BarChart2 },
  { href: '/planning', label: 'Planejamento', icon: Calendar },
  { href: '/goals', label: 'Metas', icon: Target },
  { href: '/export', label: 'Exportar', icon: Download },
  { href: '/settings', label: 'Configurações', icon: Settings },
]

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <div className="min-h-screen flex bg-navy-900">
      <aside className={`flex flex-col transition-all duration-300 ease-out ${collapsed ? 'w-20' : 'w-64'} bg-gradient-to-b from-navy-900/95 to-navy-850/95 border-r border-navy-700/50 backdrop-blur-xl fixed h-screen z-50`}>
        {/* Logo/Header */}
        <div className="flex items-center justify-between px-5 py-6 border-b border-navy-700/30">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white">Finanças</h2>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-navy-700/50 transition-all duration-300 text-navy-300 hover:text-blue-400"
            aria-label="Toggle sidebar"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
          {items.map((it) => {
            const Icon = it.icon
            const isActive = pathname?.includes(it.href.split('/')[2])

            return (
              <Link
                key={it.href}
                href={it.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-soft-lg'
                    : 'text-navy-300 hover:bg-navy-700/50 hover:text-blue-400'
                } ${collapsed ? 'justify-center' : ''}`}
              >
                <div className={`transition-all duration-300 ${isActive ? 'text-white' : 'group-hover:text-blue-400'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                {!collapsed && (
                  <span className="text-sm font-medium truncate">{it.label}</span>
                )}
                {isActive && !collapsed && (
                  <div className="ml-auto w-1 h-6 bg-white rounded-full"></div>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-navy-700/30">
          <button className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium transition-all duration-300 shadow-soft-lg hover:shadow-glow-blue ${collapsed ? 'h-10 w-10' : ''}`}>
            {!collapsed ? '+ Nova Transação' : '+'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-64'}`}>
        {children}
      </div>
    </div>
  )
}

"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ArrowLeftRight, Tag, BarChart2, Calendar, Target, Download, Settings, Wallet, ChevronLeft, ChevronRight } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useState } from 'react'

const items = [
  { href: '/dashboard',    label: 'Dashboard',    icon: Home },
  { href: '/transactions', label: 'Transações',   icon: ArrowLeftRight },
  { href: '/categories',   label: 'Categorias',   icon: Tag },
  { href: '/reports',      label: 'Relatórios',   icon: BarChart2 },
  { href: '/planning',     label: 'Planejamento', icon: Calendar },
  { href: '/goals',        label: 'Metas',        icon: Target },
  { href: '/export',       label: 'Exportar',     icon: Download },
  { href: '/settings',     label: 'Config.',      icon: Settings },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <aside className={`relative flex flex-col h-screen flex-shrink-0 transition-all duration-300 ${collapsed ? 'w-[64px]' : 'w-52'} glass-sidebar`}>
      {/* Logo */}
      <div className={`flex items-center gap-2.5 ${collapsed ? 'justify-center px-0 py-5' : 'px-5 py-5'} border-b border-white/30 dark:border-white/5`}>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center flex-shrink-0 shadow-sm glow-primary">
          <Wallet size={15} className="text-white" />
        </div>
        {!collapsed && <span className="font-bold text-base gradient-text">Finanças</span>}
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                collapsed ? 'justify-center px-0' : ''
              } ${
                active
                  ? 'bg-gradient-to-r from-primary/15 to-cyan-400/10 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:bg-white/50 dark:hover:bg-white/5 hover:text-foreground'
              }`}
            >
              <Icon size={17} strokeWidth={active ? 2.5 : 1.8} className="flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className={`px-2 py-3 border-t border-white/30 dark:border-white/5 space-y-1.5`}>
        <ThemeToggle isCollapsed={collapsed} className={collapsed ? 'w-full justify-center' : 'w-full'} />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs text-muted-foreground hover:bg-white/50 dark:hover:bg-white/5 transition"
        >
          {collapsed ? <ChevronRight size={15} /> : <><ChevronLeft size={15} /><span>Recolher</span></>}
        </button>
      </div>
    </aside>
  )
}

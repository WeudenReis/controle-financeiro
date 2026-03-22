"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ArrowLeftRight, Calendar, Target, Settings } from 'lucide-react'

const items = [
  { href: '/dashboard',    label: 'Início',  icon: Home },
  { href: '/transactions', label: 'Gastos',  icon: ArrowLeftRight },
  { href: '/planning',     label: 'Planos',  icon: Calendar },
  { href: '/goals',        label: 'Metas',   icon: Target },
  { href: '/settings',     label: 'Ajustes', icon: Settings },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden glass-nav-mobile">
      {/* Linha de destaque teal no topo */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 h-[1px] w-24 pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, hsl(var(--primary) / 0.8), transparent)' }}
      />

      <div className="flex items-center justify-around px-1 pt-2 pb-[env(safe-area-inset-bottom,8px)]" style={{paddingBottom:'max(8px,env(safe-area-inset-bottom))'}}>
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-0.5 px-2 py-1 min-w-[56px] transition-all duration-150 active:scale-90"
            >
              <div
                className="relative w-10 h-10 flex items-center justify-center rounded-2xl transition-all duration-200"
                style={active ? {
                  background: 'hsl(var(--primary) / 0.15)',
                  border: '1px solid hsl(var(--primary) / 0.3)',
                  boxShadow: '0 0 16px hsl(var(--primary) / 0.2)',
                } : {}}
              >
                <Icon
                  size={21}
                  strokeWidth={active ? 2.5 : 1.8}
                  className={active ? 'text-primary' : 'text-muted-foreground'}
                />
                {active && (
                  <span
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    style={{ background: 'radial-gradient(circle at 50% 40%, hsl(var(--primary) / 0.25) 0%, transparent 65%)' }}
                  />
                )}
              </div>
              <span className={`text-[10px] font-semibold leading-none transition-colors ${active ? 'text-primary' : 'text-muted-foreground opacity-60'}`}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

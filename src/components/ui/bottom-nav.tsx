"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ArrowLeftRight, Calendar, Target, Settings } from 'lucide-react'

const items = [
  { href: '/dashboard',    label: 'Início',     icon: Home },
  { href: '/transactions', label: 'Gastos',     icon: ArrowLeftRight },
  { href: '/planning',     label: 'Planos',     icon: Calendar },
  { href: '/goals',        label: 'Metas',      icon: Target },
  { href: '/settings',     label: 'Ajustes',    icon: Settings },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-safe" style={{
      background: 'rgba(255,255,255,0.75)',
      backdropFilter: 'blur(24px) saturate(180%)',
      WebkitBackdropFilter: 'blur(24px) saturate(180%)',
      borderTop: '1px solid rgba(255,255,255,0.80)',
    }}>
      <div className="dark:hidden absolute inset-0 pointer-events-none" style={{
        background: 'rgba(255,255,255,0.75)',
        backdropFilter: 'blur(24px)',
      }} />
      <div
        className="dark:block hidden absolute inset-0 pointer-events-none"
        style={{ background:'rgba(18,24,44,0.80)', backdropFilter:'blur(24px)', borderTop:'1px solid rgba(255,255,255,0.05)' }}
      />
      <div className="relative flex items-center justify-around px-2 pt-2 pb-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all duration-200 ${
                active ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${active ? 'bg-primary/12 glow-primary' : ''}`}>
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              </div>
              <span className={`text-[10px] font-semibold transition-all ${active ? 'opacity-100' : 'opacity-60'}`}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

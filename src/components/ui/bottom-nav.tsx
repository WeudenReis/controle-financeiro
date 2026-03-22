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
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{
        /* Camada base com blur + saturação */
        backdropFilter: 'blur(28px) saturate(200%)',
        WebkitBackdropFilter: 'blur(28px) saturate(200%)',
        /* Fundo translúcido — claro/escuro via CSS variable */
        background: 'rgba(var(--nav-bg, 255,255,255), 0.72)',
        /* Borda superior luminosa (efeito glass) */
        borderTop: '1px solid rgba(255,255,255,0.25)',
        /* Sombra suave para profundidade */
        boxShadow: '0 -4px 30px rgba(0,0,0,0.10), 0 -1px 0 rgba(255,255,255,0.35) inset',
      }}
    >
      {/* Overlay dark mode */}
      <div
        className="hidden dark:block absolute inset-0 pointer-events-none"
        style={{
          background: 'rgba(10,14,30,0.78)',
          backdropFilter: 'blur(28px)',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.35)',
        }}
      />

      {/* Linha de destaque primária no topo */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 h-[1.5px] w-20 rounded-full pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent, hsl(var(--primary)), transparent)',
          opacity: 0.7,
        }}
      />

      <div className="relative flex items-center justify-around px-2 pt-2.5 pb-3">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 px-3 py-0.5 rounded-2xl transition-all duration-200 active:scale-90"
            >
              {/* Pill com efeito glass no item ativo */}
              <div
                className={`relative p-2 rounded-2xl transition-all duration-200 ${
                  active
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                style={active ? {
                  background: 'rgba(45,212,191,0.15)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(45,212,191,0.25)',
                  boxShadow: '0 2px 12px rgba(45,212,191,0.18), 0 0 0 1px rgba(45,212,191,0.08) inset',
                } : {}}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                {/* Brilho radial no ativo */}
                {active && (
                  <span
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    style={{
                      background: 'radial-gradient(circle at 50% 30%, rgba(45,212,191,0.3) 0%, transparent 70%)',
                    }}
                  />
                )}
              </div>

              <span
                className={`text-[10px] font-semibold transition-all duration-200 ${
                  active ? 'text-primary opacity-100' : 'text-muted-foreground opacity-55'
                }`}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

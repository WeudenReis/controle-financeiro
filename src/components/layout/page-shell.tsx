'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ReactNode } from 'react'

interface Props {
  title: string
  icon?: ReactNode
  backHref?: string
  children: ReactNode
}

export default function PageShell({ title, icon, backHref, children }: Props) {
  return (
    <div className="page-bg min-h-screen">
      {/* Header da página */}
      <div className="glass-header sticky top-0 z-30 px-5 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          {backHref && (
            <Link href={backHref} className="p-2 rounded-xl hover:bg-white/50 dark:hover:bg-white/5 transition text-muted-foreground">
              <ArrowLeft size={18} />
            </Link>
          )}
          {icon && <div className="flex-shrink-0">{icon}</div>}
          <h1 className="text-lg font-bold text-foreground">{title}</h1>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-2xl mx-auto px-4 pt-5">
        {children}
      </div>
    </div>
  )
}

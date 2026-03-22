"use client"

import Sidebar from '@/components/ui/sidebar'
import BottomNav from '@/components/ui/bottom-nav'
import Chatbot from '@/components/ui/chatbot'
import { ReactNode } from 'react'

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden page-bg">
      {/* Sidebar - somente desktop */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Conteúdo principal */}
      <main className="flex-1 overflow-y-auto w-full pb-20 md:pb-0">
        {children}
      </main>

      {/* Bottom nav - somente mobile */}
      <BottomNav />

      {/* Chatbot flutuante */}
      <Chatbot />
    </div>
  )
}

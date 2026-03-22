import Link from 'next/link'
import { AlertTriangle, Home } from 'lucide-react'

export default function NotFound() {
    return (
        <div className="min-h-screen bg-[#0a192f] flex items-center justify-center p-4">
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#40E0D0]/5 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#3b82f6]/5 rounded-full blur-[100px] animate-pulse"></div>
            </div>

            <div className="relative z-10 max-w-md w-full bg-[#112240]/60 backdrop-blur-[16px] border border-[#233554] p-8 rounded-[24px] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] text-center space-y-6">
                <div className="w-20 h-20 bg-gradient-to-br from-[#40E0D0]/20 to-[#3b82f6]/20 rounded-full flex items-center justify-center mx-auto border border-[#40E0D0]/30 shadow-[0_0_20px_rgba(64,224,208,0.2)]">
                    <AlertTriangle className="w-10 h-10 text-[#40E0D0]" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-[#40E0D0] to-[#3b82f6] bg-clip-text text-transparent">404</h1>
                    <h2 className="text-xl font-semibold text-white">Oops! Rota não encontrada.</h2>
                    <p className="text-[#829ab1] text-sm">
                        Parece que você tentou acessar uma página que não existe no nosso sistema ou a URL está incorreta.
                    </p>
                </div>

                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#233554] hover:from-[#40E0D0]/20 hover:to-[#3b82f6]/20 border border-[#40E0D0]/30 text-white font-medium transition-all duration-300 hover:shadow-[0_0_20px_rgba(64,224,208,0.2)]"
                >
                    <Home size={18} />
                    Voltar ao Dashboard
                </Link>
            </div>
        </div>
    )
}

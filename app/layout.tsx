import { Analytics } from "@vercel/analytics/next"
import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './Providers'

export const metadata: Metadata = {
  title: 'Simulador de Planificación de Discos',
  description: 'Simulador interactivo para algoritmos de planificación de discos',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <Providers>
          {children}
          <Analytics />
        </Providers>
      </body>
    </html>
  )
}


import type { Metadata } from 'next'
import './globals.css'

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
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}


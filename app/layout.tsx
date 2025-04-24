import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { SimulationProvider } from "./simulation-provider"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <SimulationProvider key="simulation-provider-v3">{children}</SimulationProvider>
      </body>
    </html>
  )
}



import './globals.css'

export const metadata = {
      generator: 'v0.dev'
    };

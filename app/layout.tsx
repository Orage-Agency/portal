import type React from "react"
import type { Metadata } from "next"
import { Bebas_Neue, Montserrat } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
})

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
})

export const metadata: Metadata = {
  title: "Orage Client Portal - Orage AI Agency",
  description: "Executive client onboarding portal",
  generator: "v0.app",
  icons: {
    icon: "https://storage.googleapis.com/msgsndr/651kIrlKk834C2FEl66i/media/689237b57b1adb8feb0f2f45.png",
    apple: "https://storage.googleapis.com/msgsndr/651kIrlKk834C2FEl66i/media/689237b57b1adb8feb0f2f45.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${bebasNeue.variable} ${montserrat.variable}`}>
      <body className={`font-body antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}

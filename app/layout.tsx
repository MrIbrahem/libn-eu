import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: "حساب مساحة المثلثات (لبنة) - Triangle Area Calculator",
  description: "حاسبة دقيقة لمساحة المثلثات بالوحدات اليمنية مع قاعدة بيانات SQLite",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}

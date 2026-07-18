import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import NativeAppGuard from "@/components/NativeAppGuard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#06060b",
};

export const metadata: Metadata = {
  title: "Gestão Financeira - Administração Financeira",
  description: "Sistema de gestão financeira pessoal. Controle salários, dívidas e compras de supermercado.",
  keywords: ["gastos", "finanças", "administração", "orçamento", "despesas"],
  authors: [{ name: "Gestão Financeira" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Gestão Financeira",
  },
  openGraph: {
    type: "website",
    title: "Gestão Financeira",
    description: "Sistema de administração de gastos pessoais",
    siteName: "Gestão Financeira",
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Gestão Financeira" />
        <meta name="apple-mobile-web-app-title" content="Gestão Financeira" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ServiceWorkerRegistrar />
        <NativeAppGuard />
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#16162a',
              border: '1px solid rgba(0, 255, 136, 0.15)',
              color: '#eeeef4',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
            },
          }}
        />
      </body>
    </html>
  );
}

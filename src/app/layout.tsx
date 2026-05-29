import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Fluent AI — Aprenda Inglês com Inteligência Artificial",
    template: "%s | Fluent AI",
  },
  description:
    "Aprenda inglês de forma inteligente com microlearning, gamificação e tarefas personalizadas geradas por IA. Resultados reais em minutos por dia.",
  keywords: ["aprender inglês", "inglês online", "IA", "gamificação", "microlearning", "fluent"],
  authors: [{ name: "Fluent AI" }],
  creator: "Fluent AI",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "Fluent AI",
    title: "Fluent AI — Aprenda Inglês com IA",
    description: "Microlearning, gamificação e IA para você aprender inglês de verdade.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fluent AI — Aprenda Inglês com IA",
    description: "Microlearning, gamificação e IA para você aprender inglês de verdade.",
    images: ["/og-image.png"],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Fluent AI",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
    { media: "(prefers-color-scheme: light)", color: "#0ea5e9" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="mask-icon" href="/icons/safari-pinned-tab.svg" color="#0ea5e9" />
        <meta name="msapplication-TileColor" content="#0f172a" />
      </head>
      <body
        className={`${inter.variable} ${plusJakarta.variable} font-sans antialiased min-h-screen bg-slate-950 text-slate-50`}
        suppressHydrationWarning
      >
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#1e293b",
              color: "#f1f5f9",
              border: "1px solid #334155",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: "500",
            },
            success: {
              iconTheme: { primary: "#22c55e", secondary: "#0f172a" },
            },
            error: {
              iconTheme: { primary: "#ef4444", secondary: "#0f172a" },
            },
          }}
        />
      </body>
    </html>
  );
}

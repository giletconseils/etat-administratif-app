import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { HeaderNav } from "@/components/HeaderNav";

const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "État Administratif - Vérification SIRET",
  description: "Analyse du statut administratif des intervenants réseaux avec vérification SIRENE",
  icons: {
    icon: '/fairfair-icon.png',
    shortcut: '/fairfair-icon.png',
    apple: '/fairfair-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" data-theme="dark">
      <body className={`${sans.variable} ${mono.variable} antialiased bg-cursor-bg-primary text-cursor-text-primary`}>
        <div className="min-h-screen">
          {/* Header avec logo et navigation */}
          <header className="fixed top-0 left-0 right-0 z-50 bg-cursor-bg-primary/95 backdrop-blur-md border-b border-white/[0.08]">
            <div className="px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Icône du logo - crop pour ne montrer que la partie graphique (gauche) */}
                <div className="w-7 h-8 overflow-hidden flex-shrink-0">
                  <img 
                    src="/fairfair-logo.png" 
                    alt="" 
                    className="h-8 w-auto"
                    style={{ 
                      maxWidth: 'none',
                      objectFit: 'cover',
                      objectPosition: 'left center'
                    }}
                  />
                </div>
                {/* Texte en vrai HTML */}
                <Link href="/" className="text-xl font-bold text-cursor-text-primary tracking-tight hover:text-cursor-text-secondary transition-colors">
                  FAIRFAIR Group
                </Link>
              </div>
              
              {/* Navigation */}
              <HeaderNav />
            </div>
          </header>
          
          {/* CURSOR-style main content avec padding-top pour compenser le header fixe */}
          <main className="mx-auto max-w-7xl px-6 py-8 pt-20">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

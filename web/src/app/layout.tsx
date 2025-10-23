import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

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
          <header className="fixed top-0 left-0 right-0 z-50 bg-cursor-bg-primary/95 backdrop-blur-md border-b border-cursor-border-primary/10">
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
              <nav className="flex items-center gap-1">
                <Link 
                  href="/"
                  className="px-4 py-2 text-sm text-cursor-text-secondary hover:text-cursor-text-primary hover:bg-cursor-hover rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span>Revenir aux traitements</span>
                </Link>
                <Link 
                  href="/data"
                  className="px-4 py-2 text-sm text-cursor-text-secondary hover:text-cursor-text-primary hover:bg-cursor-hover rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Paramètres</span>
                </Link>
              </nav>
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

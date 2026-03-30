import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ptBR } from "@clerk/localizations";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import SearchModal from "@/components/SearchModal";
import Providers from "@/components/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Odd — Mercado de previsões",
    template: "%s | Odd",
  },
  description: "Negocie probabilidades sobre o que vai acontecer no Brasil e no mundo. Futebol, política, economia, cripto e cultura pop.",
  metadataBase: new URL("https://oddbr.com"),
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Odd",
  },
};

function AuthProvider({ children }: { children: React.ReactNode }) {
  return <ClerkProvider localization={ptBR}>{children}</ClerkProvider>;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <html lang="pt-BR" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
        <head>
          <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('odd-theme');var d=t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches);if(d)document.documentElement.classList.add('dark')}catch(e){}` }} />
        </head>
        <body className="min-h-screen pb-14 md:pb-0">
          <Providers>
            <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-accent focus:text-white focus:rounded-md focus:text-sm focus:font-medium">
              Pular para o conteúdo
            </a>
            <Navbar />
            <div id="main-content">{children}</div>
            <Footer />
            <BottomNav />
            <SearchModal />
          </Providers>
        </body>
      </html>
    </AuthProvider>
  );
}

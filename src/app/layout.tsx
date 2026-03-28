import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ptBR } from "@clerk/localizations";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: {
    default: "Odd — Mercado de previsões",
    template: "%s | Odd",
  },
  description: "Negocie probabilidades sobre o que vai acontecer no Brasil e no mundo. Futebol, política, economia, cripto e cultura pop.",
  metadataBase: new URL("https://odd.com.br"),
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Odd",
  },
};

const hasClerkKeys =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes("placeholder");

function AuthProvider({ children }: { children: React.ReactNode }) {
  if (!hasClerkKeys) return <>{children}</>;
  return <ClerkProvider localization={ptBR}>{children}</ClerkProvider>;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <html lang="pt-BR">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
        </head>
        <body className="min-h-screen">
          <Providers>
            <Navbar />
            {children}
          </Providers>
        </body>
      </html>
    </AuthProvider>
  );
}

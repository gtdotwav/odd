import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Criar conta",
  description: "Crie sua conta na Odd e comece a negociar mercados de previsão.",
};

export default function CadastroPage() {
  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text mb-2">Criar sua conta</h1>
          <p className="text-sm text-text-secondary">
            Negocie probabilidades sobre o que vai acontecer no Brasil e no mundo.
          </p>
        </div>
        <SignUp
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-none border border-border rounded-xl bg-surface",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              socialButtonsBlockButton: "border-border hover:bg-surface-raised",
              formButtonPrimary: "bg-highlight hover:bg-highlight-hover",
              footerActionLink: "text-accent hover:text-accent-hover",
            },
          }}
        />
      </div>
    </div>
  );
}

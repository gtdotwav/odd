import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Faça login na Odd para negociar mercados de previsão.",
};

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text mb-2">Bem-vindo de volta</h1>
          <p className="text-sm text-text-secondary">
            Entre na sua conta para continuar negociando.
          </p>
        </div>
        <SignIn
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-none border border-border rounded-xl bg-surface",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              socialButtonsBlockButton: "border-border hover:bg-surface-raised text-text font-medium",
              socialButtonsBlockButtonText: "text-text",
              socialButtonsProviderIcon: "w-5 h-5",
              dividerLine: "bg-border",
              dividerText: "text-text-tertiary",
              formButtonPrimary: "bg-highlight hover:bg-highlight-hover",
              formFieldInput: "border-border bg-surface text-text",
              formFieldLabel: "text-text-secondary",
              footerActionLink: "text-accent hover:text-accent-hover",
              identityPreviewEditButton: "text-accent",
            },
          }}
        />
      </div>
    </div>
  );
}

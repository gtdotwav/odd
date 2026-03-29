import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-4">
      <span className="text-6xl font-mono font-bold text-text-tertiary mb-4">404</span>
      <h1 className="text-xl font-semibold text-text mb-2">Página não encontrada</h1>
      <p className="text-sm text-text-secondary mb-6 max-w-sm">
        O mercado que você está procurando pode ter sido resolvido ou não existe mais.
      </p>
      <div className="flex gap-3">
        <Link
          href="/"
          className="px-5 py-2 rounded-md bg-accent text-white text-sm font-semibold hover:bg-accent-hover transition-colors"
        >
          Voltar ao início
        </Link>
        <Link
          href="/explorar"
          className="px-5 py-2 rounded-md border border-border text-sm font-medium text-text-secondary hover:text-text hover:border-border-strong transition-colors"
        >
          Explorar mercados
        </Link>
      </div>
    </div>
  );
}

"use client";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-4">
      <div className="w-14 h-14 rounded-full bg-down/10 flex items-center justify-center mb-4">
        <svg className="w-7 h-7 text-down" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-text mb-1">Algo deu errado</h2>
      <p className="text-sm text-text-secondary mb-6 max-w-sm">
        {error.message || "Ocorreu um erro inesperado. Tente novamente."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="px-5 py-2 rounded-md bg-accent text-white text-sm font-semibold hover:bg-accent-hover transition-colors"
      >
        Tentar novamente
      </button>
    </div>
  );
}

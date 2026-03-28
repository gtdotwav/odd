import Sidebar from "@/components/Sidebar";
import Link from "next/link";

export default function MarketNotFound() {
  return (
    <div className="flex max-w-[1440px] mx-auto">
      <Sidebar />
      <main className="flex-1 px-6 py-20 text-center">
        <h1 className="text-xl font-bold text-text mb-2">Mercado não encontrado</h1>
        <p className="text-text-secondary mb-4">Este mercado não existe ou foi removido.</p>
        <Link href="/explorar" className="text-accent hover:underline">← Voltar para explorar</Link>
      </main>
    </div>
  );
}

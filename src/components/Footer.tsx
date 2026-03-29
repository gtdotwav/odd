import Link from "next/link";
import Image from "next/image";

const links = [
  { href: "/sobre", label: "Sobre" },
  { href: "/docs", label: "API" },
  { href: "/termos", label: "Termos de uso" },
  { href: "/privacidade", label: "Privacidade" },
  { href: "/suporte", label: "Suporte" },
];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface mt-12">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <Link href="/" className="inline-block mb-2">
              <Image src="/logo.png" alt="Odd" width={120} height={45} className="h-10 w-auto" />
            </Link>
            <p className="text-xs text-text-secondary max-w-sm">
              Negocie probabilidades sobre o que vai acontecer no Brasil e no mundo.
            </p>
          </div>

          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2" aria-label="Footer">
            {links.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="text-sm text-text-secondary hover:text-text transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-6 pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-text-tertiary">
          <span>&copy; {new Date().getFullYear()} Odd. Todos os direitos reservados.</span>
          <span>oddsbr.com</span>
        </div>
      </div>
    </footer>
  );
}

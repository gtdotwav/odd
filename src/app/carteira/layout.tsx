import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Carteira",
  description: "Gerencie seu saldo, depositos e saques na Odd.",
};

export default function CarteiraLayout({ children }: { children: React.ReactNode }) {
  return children;
}

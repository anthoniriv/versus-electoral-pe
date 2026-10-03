"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

export function FooterApoyanos() {
  const pathname = usePathname();

  if (pathname === "/apoyanos") return null;

  return (
    <Link
      prefetch={false}
      href="/apoyanos"
      className="mt-6 inline-block rounded-lg bg-red-500 px-6 py-2.5 text-sm font-bold text-white uppercase tracking-wider hover:bg-red-400 transition-colors"
    >
      Apóyanos
    </Link>
  );
}

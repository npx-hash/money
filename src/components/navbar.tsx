"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/components/cart-provider";

const links = [
  { href: "/", label: "Landing" },
  { href: "/collections", label: "Collections" },
  { href: "/admin", label: "Admin" },
];

export function Navbar() {
  const pathname = usePathname();
  const { count } = useCart();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="text-lg font-black tracking-tight text-slate-900">
          MarginMint
        </Link>
        <nav className="flex items-center gap-4">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition ${active ? "text-emerald-700" : "text-slate-600 hover:text-slate-900"}`}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            href="/cart"
            className="rounded-full border border-emerald-700 px-3 py-1 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
          >
            Cart ({count})
          </Link>
        </nav>
      </div>
    </header>
  );
}

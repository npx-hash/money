import Link from "next/link";

const adminLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/suppliers", label: "Suppliers" },
  { href: "/admin/pricing", label: "Pricing" },
  { href: "/admin/products", label: "Products" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-shell space-y-6">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Admin</p>
        <h1 className="text-3xl font-black text-slate-900">Operations Control Center</h1>
        <div className="flex flex-wrap gap-2">
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full border border-slate-300 bg-white px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </header>
      {children}
    </div>
  );
}

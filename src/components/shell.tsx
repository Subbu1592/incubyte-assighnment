"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Overview" },
  { href: "/employees", label: "People" },
  { href: "/bands", label: "Pay bands" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="app">
      <aside className="nav">
        <div className="brand">
          <span className="mark">Pb</span>
          <div>
            <strong>Paybook</strong>
            <em>ACME HR</em>
          </div>
        </div>
        <nav>
          {LINKS.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link key={link.href} href={link.href} className={active ? "active" : ""}>
                {link.label}
              </Link>
            );
          })}
        </nav>
        <p className="nav-foot">Local currency is the record. USD is only for comparison.</p>
      </aside>
      <div className="content">{children}</div>
    </div>
  );
}

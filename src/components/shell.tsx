"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Overview", icon: "grid" },
  { href: "/employees", label: "People", icon: "people" },
  { href: "/bands", label: "Pay bands", icon: "bands" },
] as const;

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
                <NavIcon name={link.icon} />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <p className="nav-foot">Local currency is the record. USD is the comparison view.</p>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div>
            <strong>Compensation</strong>
            <span>ACME Corporation</span>
          </div>
          <div className="topbar-user">
            <span className="avatar avatar-hr">HR</span>
            <span>HR workspace</span>
          </div>
        </header>
        <div className="content">{children}</div>
      </div>
    </div>
  );
}

function NavIcon({ name }: { name: "grid" | "people" | "bands" }) {
  if (name === "people") {
    return (
      <svg viewBox="0 0 16 16" aria-hidden>
        <circle cx="6" cy="5" r="2.2" />
        <path d="M2.2 13.2c.5-2.2 2-3.4 3.8-3.4s3.3 1.2 3.8 3.4" />
        <circle cx="11.2" cy="5.4" r="1.6" />
        <path d="M10.2 9.8c1.5.2 2.6 1.2 3.2 3" />
      </svg>
    );
  }
  if (name === "bands") {
    return (
      <svg viewBox="0 0 16 16" aria-hidden>
        <path d="M2 12.5h12M3 9.5h7M3 6.5h10M3 3.5h5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 16 16" aria-hidden>
      <rect x="2" y="2" width="5" height="5" rx="1" />
      <rect x="9" y="2" width="5" height="5" rx="1" />
      <rect x="2" y="9" width="5" height="5" rx="1" />
      <rect x="9" y="9" width="5" height="5" rx="1" />
    </svg>
  );
}

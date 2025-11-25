
'use client';

import Link from "next/link";
import { usePathname } from 'next/navigation';
import { Home } from "lucide-react";

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`relative px-3 py-2 text-sm font-medium rounded-md transition-all duration-300 ease-in-out ${
        isActive
          ? "text-primary-foreground"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {isActive && (
        <span className="absolute inset-0 z-0 bg-primary rounded-md transition-all duration-300"></span>
      )}
      <span className="relative z-10">{children}</span>
    </Link>
  );
};

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center">
          <Link href="/" className="flex items-center space-x-2 text-foreground group">
            <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
              <Home className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <span className="font-bold text-lg">Dashboard</span>
          </Link>
          <nav className="ml-auto flex items-center space-x-2">
            <NavLink href="/seguimiento-de-paquetes">Seguimiento Hoy</NavLink>
            <NavLink href="/registros-historicos">Historial</NavLink>
            <NavLink href="/seguimiento-de-etiquetas">Etiquetas</NavLink>
            <NavLink href="/reportes">Reportes</NavLink>
          </nav>
        </div>
      </div>
    </header>
  );
}

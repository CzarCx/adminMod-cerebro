
import Link from "next/link";
import { Home } from "lucide-react";

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link
    href={href}
    className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
  >
    {children}
  </Link>
);

export default function Navbar() {
  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2 text-foreground">
              <Home className="w-6 h-6" />
              <span className="font-bold">Dashboard</span>
            </Link>
          </div>
          <div className="ml-auto flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-6">
              <NavLink href="/seguimiento-de-paquetes">Seguimiento Hoy</NavLink>
              <NavLink href="/registros-historicos">Historial</NavLink>
              <NavLink href="/seguimiento-de-etiquetas">Etiquetas</NavLink>
              <NavLink href="/reportes">Reportes</NavLink>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}


'use client';

import Link from "next/link";
import { usePathname } from 'next/navigation';
import { Home, Menu, Timer, Calendar } from "lucide-react";

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  isReport?: boolean;
}

const NavLink = ({ href, children, onClick, className = '', isReport = false }: NavLinkProps) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`relative px-3 py-2 text-sm font-medium rounded-md transition-all duration-300 ease-in-out ${
        isActive
          ? "text-primary-foreground"
          : `text-muted-foreground ${isReport ? 'hover:text-destructive' : 'hover:text-foreground'}`
      } ${className}`}
    >
      {isActive && (
        <span className={`absolute inset-0 z-0 rounded-md transition-all duration-300 ${isReport ? 'bg-destructive' : 'bg-primary'}`}></span>
      )}
      <span className="relative z-10">{children}</span>
    </Link>
  );
};

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
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
          
          {/* Desktop Navigation */}
          <nav className="ml-auto hidden md:flex items-center space-x-1">
            <NavLink href="/seguimiento-de-paquetes">Seguimiento Hoy</NavLink>
            <NavLink href="/registros-historicos">Historial</NavLink>
            <NavLink href="/seguimiento-de-etiquetas">Etiquetas</NavLink>
            <NavLink href="/tiempo-restante">Disponibilidad</NavLink>
            <NavLink href="/tareas-programadas">Programadas</NavLink>
            <NavLink href="/reportes" isReport={true}>Reportes</NavLink>
          </nav>

          {/* Mobile Menu Button */}
          <div className="ml-auto md:hidden">
            <button
              onClick={onMenuClick}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
              aria-label="Open navigation menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

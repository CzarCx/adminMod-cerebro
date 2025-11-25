
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PackageSearch, History, Tags, FileText, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavLinkProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClose: () => void;
}

const NavLink = ({ href, icon, children, onClose }: NavLinkProps) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      onClick={onClose}
      className={`flex items-center gap-4 p-3 rounded-lg text-lg font-medium transition-colors ${
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-foreground hover:bg-muted'
      }`}
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
};

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const onAnimationEnd = () => {
    if (!isOpen) {
      setIsRendered(false);
    }
  };

  if (!isRendered) {
    return null;
  }
  
  return (
    <div
      className="fixed inset-0 z-50 md:hidden"
      role="dialog"
      aria-modal="true"
    >
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Sidebar Panel */}
      <div
        className={`fixed top-0 left-0 h-full w-4/5 max-w-sm bg-card border-r shadow-xl flex flex-col p-6 ${isOpen ? 'animate-slide-in-left' : 'animate-slide-out-left'}`}
        onAnimationEnd={onAnimationEnd}
      >
        <div className="flex items-center justify-between mb-8">
          <Link href="/" onClick={onClose} className="flex items-center space-x-2 text-foreground group">
            <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
              <Home className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <span className="font-bold text-xl">Dashboard</span>
          </Link>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label="Close navigation menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="flex flex-col space-y-3">
          <NavLink href="/seguimiento-de-paquetes" icon={<PackageSearch className="w-6 h-6" />} onClose={onClose}>
            Seguimiento Hoy
          </NavLink>
          <NavLink href="/registros-historicos" icon={<History className="w-6 h-6" />} onClose={onClose}>
            Historial
          </NavLink>
          <NavLink href="/seguimiento-de-etiquetas" icon={<Tags className="w-6 h-6" />} onClose={onClose}>
            Etiquetas
          </NavLink>
          <NavLink href="/reportes" icon={<FileText className="w-6 h-6" />} onClose={onClose}>
            Reportes
          </NavLink>
        </nav>
      </div>
    </div>
  );
}

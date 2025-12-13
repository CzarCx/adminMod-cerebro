
'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { MoreHorizontal, Tag, Timer, Calendar, FileText, Clock } from 'lucide-react';

interface DropdownLinkProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isReport?: boolean;
  onClick: () => void;
}

const DropdownLink = ({ href, icon, children, isReport, onClick }: DropdownLinkProps) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-md p-2 text-sm font-medium transition-colors ${
        isActive
          ? isReport ? 'bg-destructive text-destructive-foreground' : 'bg-primary text-primary-foreground'
          : isReport ? 'text-destructive hover:bg-destructive/10' : 'text-foreground hover:bg-muted'
      }`}
    >
      {icon}
      {children}
    </Link>
  );
};

export const NavDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleClose = () => setIsOpen(false);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-transparent text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Más opciones"
      >
        <MoreHorizontal className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border bg-card p-2 shadow-lg animate-in fade-in-20 slide-in-from-top-3">
          <DropdownLink href="/etiquetas-sin-asignar" icon={<Tag className="w-4 h-4" />} onClick={handleClose}>
            Sin Asignar
          </DropdownLink>
          <DropdownLink href="/tiempo-restante" icon={<Timer className="w-4 h-4" />} onClick={handleClose}>
            Disponibilidad
          </DropdownLink>
          <DropdownLink href="/tiempos-muertos" icon={<Clock className="w-4 h-4" />} onClick={handleClose}>
            Tiempos Muertos
          </DropdownLink>
          <DropdownLink href="/tareas-programadas" icon={<Calendar className="w-4 h-4" />} onClick={handleClose}>
            Programadas
          </DropdownLink>
          <div className="my-1 h-px bg-border" />
          <DropdownLink href="/reportes" icon={<FileText className="w-4 h-4" />} isReport onClick={handleClose}>
            Reportes
          </DropdownLink>
        </div>
      )}
    </div>
  );
};

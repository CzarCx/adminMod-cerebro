import Link from "next/link";

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link
    href={href}
    className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
  >
    {children}
  </Link>
);

const QrIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="6" height="6" />
    <path d="M15 3h6" />
    <path d="M21 9v6" />
    <path d="M15 21h6" />
    <path d="M3 15v6" />
    <rect x="15" y="15" width="6" height="6" />
    <path d="M9 3v6" />
    <path d="M3 9h6" />
    <path d="M9 21v-6" />
    <path d="M21 15h-6" />
  </svg>
)

export default function Navbar() {
  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2 text-foreground">
              <QrIcon />
              <span className="font-bold">QR Scanner</span>
            </Link>
          </div>
          <div className="ml-auto flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-6">
              <NavLink href="/seguimiento-de-paquetes">Seguimiento</NavLink>
              <NavLink href="/reportes">Reportes</NavLink>
              <Link
                href="/scanner"
                className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
              >
                Escanear
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

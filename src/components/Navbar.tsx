import Link from "next/link";

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link
    href={href}
    className="text-gray-600 hover:text-green-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
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
    <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 text-xl font-bold text-green-700">
              <QrIcon />
              <span>QR Scanner</span>
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-2">
              <NavLink href="/seguimiento-de-paquetes">Seguimiento</NavLink>
              <NavLink href="/reportes">Reportes</NavLink>
              <Link
                href="/scanner"
                className="bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded-md text-sm font-bold transition-colors shadow-sm"
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

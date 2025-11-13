import Link from "next/link";

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link
    href={href}
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
    <nav>
      <div>
        <div>
          <div>
            <Link href="/">
              <QrIcon />
              <span>QR Scanner</span>
            </Link>
          </div>
          <div>
            <div>
              <NavLink href="/seguimiento-de-paquetes">Seguimiento</NavLink>
              <NavLink href="/reportes">Reportes</NavLink>
              <Link
                href="/scanner"
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

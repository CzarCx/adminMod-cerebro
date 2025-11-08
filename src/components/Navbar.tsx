import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-green-700">
              QR Scanner App
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link
                href="/reportes"
                className="text-gray-600 hover:bg-green-100 hover:text-green-800 px-3 py-2 rounded-md text-sm font-medium"
              >
                Reportes
              </Link>
              <Link
                href="/seguimiento-de-paquetes"
                className="text-gray-600 hover:bg-green-100 hover:text-green-800 px-3 py-2 rounded-md text-sm font-medium"
              >
                Seguimiento de Paquetes
              </Link>
              <Link
                href="/scanner"
                className="text-gray-600 hover:bg-green-100 hover:text-green-800 px-3 py-2 rounded-md text-sm font-medium"
              >
                Scanner
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

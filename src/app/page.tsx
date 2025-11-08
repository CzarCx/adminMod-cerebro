import Link from 'next/link';

export default function Home() {
  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6 md:p-8 space-y-6">
      <header className="text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-green-800">Bienvenido a la App de Escáner QR</h1>
        <p className="text-gray-600 mt-1">Navega a las diferentes secciones de la aplicación.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
        <Link href="/seguimiento-de-paquetes" className="block p-6 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition-colors duration-200">
          <h2 className="text-xl font-bold">Seguimiento de Paquetes</h2>
          <p>Rastrea el estado de tus paquetes.</p>
        </Link>
        <Link href="/reportes" className="block p-6 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition-colors duration-200">
          <h2 className="text-xl font-bold">Reportes</h2>
          <p>Ve los reportes de los paquetes escaneados.</p>
        </Link>
      </div>
    </div>
  );
}

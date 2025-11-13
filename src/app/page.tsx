import Link from 'next/link';

const FeatureCard = ({ href, title, description, icon }: { href: string; title: string; description: string; icon: React.ReactNode }) => (
  <Link href={href} className="group block p-8 bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-200/80 hover:border-green-500/50">
    <div className="flex items-center justify-center h-16 w-16 bg-green-100 rounded-full mb-6 group-hover:bg-green-500 transition-colors duration-300">
      <div className="text-green-600 group-hover:text-white transition-colors duration-300">
        {icon}
      </div>
    </div>
    <h2 className="text-xl font-bold text-gray-800">{title}</h2>
    <p className="text-gray-500 mt-2">{description}</p>
    <div className="mt-6 text-sm font-semibold text-green-600 group-hover:text-green-700">
      Ir a {title} &rarr;
    </div>
  </Link>
);

const ScanIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /><rect x="7" y="7" width="10" height="10" rx="1" /></svg>
);
const PackageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16.5 9.4a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z"/><path d="M19.5 12.5a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z"/><path d="M15 9.4a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z"/><path d="M18 12.5a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z"/><path d="m21 15-1.6-1.4a4.5 4.5 0 0 0-6.3-6.3L11.5 6l-3 3 1.6 1.4a4.5 4.5 0 0 0 6.3 6.3L18 21l3-3Z"/><path d="M9.4 15a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9Z"/><path d="M12.5 18a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9Z"/><path d="m6 11.5 3-3 1.4 1.6a4.5 4.5 0 0 0 6.3 6.3L18 21"/></svg>
);
const ReportIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><path d="M12 18v-6" /><path d="M12 12h-1" /></svg>
);


export default function Home() {
  return (
    <div className="w-full">
      <header className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">App de Escáner QR</h1>
        <p className="text-lg text-gray-500 mt-3 max-w-2xl mx-auto">Una solución integral para el seguimiento y reporte de paquetes en su almacén.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <FeatureCard 
          href="/scanner"
          title="Escanear Paquetes"
          description="Inicia el proceso de escaneo usando la cámara de tu dispositivo o un escáner físico."
          icon={<ScanIcon />}
        />
        <FeatureCard 
          href="/seguimiento-de-paquetes"
          title="Seguimiento de Paquetes"
          description="Rastrea el estado de tus paquetes y visualiza estadísticas de revisión."
          icon={<PackageIcon />}
        />
        <FeatureCard 
          href="/reportes"
          title="Reportes"
          description="Consulta los paquetes que han sido marcados con incidencias para su revisión."
          icon={<ReportIcon />}
        />
      </div>
    </div>
  );
}

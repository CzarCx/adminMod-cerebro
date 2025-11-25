import Link from 'next/link';

const FeatureCard = ({ href, title, description, icon }: { href: string; title: string; description: string; icon: React.ReactNode }) => (
  <Link href={href} className="block p-6 bg-card rounded-lg border border-border hover:bg-accent hover:border-primary transition-all duration-200 group">
    <div className="flex items-center gap-4 mb-4">
      <div className="bg-primary/10 text-primary p-3 rounded-full">
        {icon}
      </div>
      <h2 className="text-xl font-bold text-card-foreground">{title}</h2>
    </div>
    <p className="text-muted-foreground mb-4">{description}</p>
    <div className="text-sm font-semibold text-primary group-hover:underline">
      Ir a {title} &rarr;
    </div>
  </Link>
);

const PackageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16.5 9.4a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z"/><path d="M19.5 12.5a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z"/><path d="M15 9.4a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z"/><path d="M18 12.5a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z"/><path d="m21 15-1.6-1.4a4.5 4.5 0 0 0-6.3-6.3L11.5 6l-3 3 1.6 1.4a4.5 4.5 0 0 0 6.3 6.3L18 21l3-3Z"/><path d="M9.4 15a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9Z"/><path d="M12.5 18a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9Z"/><path d="m6 11.5 3-3 1.4 1.6a4.5 4.5 0 0 0 6.3 6.3L18 21"/></svg>
);
const ReportIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><path d="M12 18v-6" /><path d="M12 12h-1" /></svg>
);


export default function Home() {
  return (
    <div className="space-y-12">
      <header className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-primary">App de Escáner QR</h1>
        <p className="mt-4 text-lg text-muted-foreground">Una solución integral para el seguimiento y reporte de paquetes en su almacén.</p>
      </header>

      <div className="grid md:grid-cols-2 gap-8">
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

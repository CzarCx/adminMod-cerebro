import Link from 'next/link';
import { PackageSearch, FileText, Activity } from 'lucide-react';

const FeatureCard = ({ href, title, description, icon, delay }: { href: string; title: string; description: string; icon: React.ReactNode; delay: string }) => (
  <div className={`animate-in fade-in slide-in-from-bottom-10 duration-500 ${delay}`}>
    <Link href={href} className="group relative block h-full p-8 bg-card rounded-2xl border border-border overflow-hidden shadow-sm transition-all duration-300 hover:border-primary hover:shadow-lg hover:-translate-y-1">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-4">
          <div className="bg-primary/10 text-primary p-3 rounded-xl">
            {icon}
          </div>
          <h2 className="text-xl font-bold text-card-foreground">{title}</h2>
        </div>
        <p className="text-muted-foreground mb-6">{description}</p>
        <div className="text-sm font-semibold text-primary flex items-center gap-2 group-hover:gap-3 transition-all duration-300">
          Ir a {title} <span className="transform transition-transform duration-300 group-hover:translate-x-1">&rarr;</span>
        </div>
      </div>
    </Link>
  </div>
);


export default function Home() {
  return (
    <div className="space-y-16">
      <header className="text-center animate-in fade-in slide-in-from-top-10 duration-500">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">Dashboard de Administrador de Etiquetas</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">Bienvenido</p>
      </header>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        <FeatureCard 
          href="/seguimiento-de-paquetes"
          title="Seguimiento de Paquetes"
          description="Rastrea el estado de tus paquetes en tiempo real y visualiza estadísticas de revisión detalladas."
          icon={<PackageSearch className="w-6 h-6"/>}
          delay="delay-100"
        />
        <FeatureCard 
          href="/reportes"
          title="Reportes de Incidencias"
          description="Consulta, gestiona y da seguimiento a todos los paquetes que han sido marcados con incidencias."
          icon={<FileText className="w-6 h-6"/>}
          delay="delay-200"
        />
        <FeatureCard 
          href="/seguimiento-de-etiquetas"
          title="Monitor de Etiquetas"
          description="Visualiza el flujo completo de etiquetas, desde la impresión hasta la entrega final."
          icon={<Activity className="w-6 h-6"/>}
          delay="delay-300"
        />
      </div>
    </div>
  );
}

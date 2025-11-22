import { Tags, CheckSquare, Truck } from 'lucide-react';

const StatCard = ({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) => (
  <div className="bg-card p-6 rounded-lg border border-border flex items-center gap-6 shadow-sm">
    <div className="p-4 rounded-full bg-primary/10 text-primary">
      {icon}
    </div>
    <div>
      <h3 className="text-muted-foreground text-base font-medium">{title}</h3>
      <p className="text-3xl font-bold text-foreground">{value}</p>
    </div>
  </div>
);

export default function SeguimientoEtiquetasPage() {
  // Placeholder data for now
  const stats = {
    asignadas: '1,250',
    calificadas: '980',
    entregadas: '750',
  };

  return (
    <main className="space-y-8">
      <header className="border-b pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Seguimiento de Etiquetas</h1>
        <p className="mt-2 text-muted-foreground">Aquí se muestra el estado general de las etiquetas en el sistema.</p>
      </header>

      <div className="grid md:grid-cols-3 gap-6">
        <StatCard 
          title="Etiquetas Asignadas"
          value={stats.asignadas}
          icon={<Tags className="w-8 h-8" />}
        />
        <StatCard 
          title="Etiquetas Calificadas"
          value={stats.calificadas}
          icon={<CheckSquare className="w-8 h-8" />}
        />
        <StatCard 
          title="Etiquetas Entregadas"
          value={stats.entregadas}
          icon={<Truck className="w-8 h-8" />}
        />
      </div>
      
      <div className="bg-card p-4 rounded-lg border mt-8">
        <h2 className="text-xl font-semibold text-foreground mb-4">Detalle de Etiquetas</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 font-medium text-left text-muted-foreground">Número de etiquetas asignadas</th>
                <th className="px-6 py-3 font-medium text-left text-muted-foreground">Número de etiquetas calificadas</th>
                <th className="px-6 py-3 font-medium text-left text-muted-foreground">Número de etiquetas entregadas</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="px-6 py-4 text-foreground font-semibold">{stats.asignadas}</td>
                <td className="px-6 py-4 text-foreground font-semibold">{stats.calificadas}</td>
                <td className="px-6 py-4 text-foreground font-semibold">{stats.entregadas}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

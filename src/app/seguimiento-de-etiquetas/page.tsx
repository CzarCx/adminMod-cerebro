
'use client';

import { useState, useEffect } from 'react';
import { Tags, CheckSquare, Truck, Barcode, Factory, Pallet, ClipboardList, Printer } from 'lucide-react';

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

const BreakdownItem = ({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) => (
  <li className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
    <div className="flex items-center gap-4">
      <div className="text-muted-foreground">{icon}</div>
      <span className="font-medium text-foreground">{title}</span>
    </div>
    <span className="font-bold text-lg text-primary">{value}</span>
  </li>
);

export default function SeguimientoEtiquetasPage() {
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    setCurrentDate(today.toLocaleDateString('es-MX', options));
  }, []);

  // Placeholder data for now
  const stats = {
    asignadas: '1,250',
    calificadas: '980',
    entregadas: '750',
  };

  const dailyBreakdown = {
    impresas: 450,
    enBarra: 120,
    enProduccion: 250,
    enTarima: 50,
    pendientes: 30,
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
      
      <div className="bg-card p-6 rounded-lg border mt-8">
        <header className="mb-6">
          <h2 className="text-xl font-semibold text-foreground">Desglose de Hoy</h2>
          <p className="text-muted-foreground">{currentDate}</p>
        </header>

        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-primary/10 rounded-lg">
            <Printer className="w-8 h-8 text-primary" />
            <div>
              <h3 className="text-lg font-bold text-primary">Etiquetas Impresas Hoy</h3>
              <p className="text-3xl font-extrabold text-foreground">{dailyBreakdown.impresas}</p>
            </div>
          </div>
          
          <ul className="space-y-3">
            <BreakdownItem title="En Barra" value={dailyBreakdown.enBarra} icon={<Barcode className="w-6 h-6" />} />
            <BreakdownItem title="En Producción" value={dailyBreakdown.enProduccion} icon={<Factory className="w-6 h-6" />} />
            <BreakdownItem title="En Tarima" value={dailyBreakdown.enTarima} icon={<Pallet className="w-6 h-6" />} />
            <BreakdownItem title="Pendientes" value={dailyBreakdown.pendientes} icon={<ClipboardList className="w-6 h-6" />} />
          </ul>
        </div>
      </div>
    </main>
  );
}

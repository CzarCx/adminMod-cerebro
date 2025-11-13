
'use client';

import { useState, useEffect } from 'react';
import Tabla from '../../components/Tabla';
import EncargadoChart from '../../components/EncargadoChart';
import HistoricoPaquetesChart from '../../components/HistoricoPaquetesChart';
import { UserCheck } from 'lucide-react';

export default function SeguimientoDePaquetesPage() {
  const [selectedEncargado, setSelectedEncargado] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    setCurrentDate(today.toLocaleDateString('es-MX', options));
  }, []);

  const handleRowClick = (encargadoName: string) => {
    setSelectedEncargado(prev => (prev === encargadoName ? null : encargadoName));
  };

  return (
    <div className="space-y-8">
      <header className="border-b pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Seguimiento de Paquetes - Hoy</h1>
        <p className="mt-2 text-muted-foreground">{currentDate}</p>
        <p className="mt-1 text-sm text-muted-foreground">Esta página muestra solo los registros del día de hoy. Haz clic en una fila para ver los detalles del encargado.</p>
      </header>
      
      <div className="bg-card p-4 rounded-lg border">
        <h2 className="text-xl font-semibold text-foreground mb-4">Registros de Hoy</h2>
        <Tabla onRowClick={handleRowClick} pageType="seguimiento" filterByToday={true} />
      </div>
      
      {selectedEncargado && (
        <div className="bg-card p-4 rounded-lg border animate-in fade-in-50">
          <div className="flex items-center gap-3 mb-4">
            <UserCheck className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Registros de Hoy para: {selectedEncargado}</h2>
          </div>
          <Tabla 
            pageType="seguimiento" 
            filterByEncargado={selectedEncargado} 
            filterByToday={true}
            showSummary={true} 
          />
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8 mt-8">
        <div className={`bg-card p-6 rounded-lg border transition-all duration-300 ${selectedEncargado ? 'lg:col-span-1' : 'lg:col-span-2'}`}>
          <HistoricoPaquetesChart />
        </div>
        {selectedEncargado && (
          <div className="bg-card p-6 rounded-lg border">
            <EncargadoChart encargadoName={selectedEncargado} />
          </div>
        )}
      </div>
    </div>
  );
}

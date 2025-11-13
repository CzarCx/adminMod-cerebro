
'use client';

import { useState, useEffect } from 'react';
import Tabla from '../../components/Tabla';
import EncargadoChart from '../../components/EncargadoChart';
import HistoricoPaquetesChart from '../../components/HistoricoPaquetesChart';

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
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Seguimiento de Paquetes</h1>
        <p className="mt-2 text-muted-foreground">{currentDate}</p>
        <p className="mt-1 text-sm text-muted-foreground">Haz clic en un registro de la tabla para ver las estadísticas detalladas del encargado, o visualiza el histórico general de paquetes.</p>
      </header>
      
      <div className="bg-card p-4 rounded-lg border">
        <Tabla onRowClick={handleRowClick} pageType="seguimiento" />
      </div>
      
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

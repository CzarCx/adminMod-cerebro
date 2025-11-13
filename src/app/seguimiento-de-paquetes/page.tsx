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
      <header className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">Seguimiento de Paquetes</h1>
        <p className="text-lg font-semibold text-green-600 mt-2">{currentDate}</p>
        <p className="text-gray-500 mt-1 max-w-2xl mx-auto">Haz clic en un registro de la tabla para ver las estadísticas detalladas del encargado, o visualiza el histórico general de paquetes.</p>
      </header>
      
      <div className="bg-white shadow-md rounded-xl">
        <Tabla onRowClick={handleRowClick} pageType="seguimiento" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start mt-8">
        {selectedEncargado && (
          <div className="w-full">
            <EncargadoChart encargadoName={selectedEncargado} />
          </div>
        )}
        
        <div className={`w-full ${selectedEncargado ? 'lg:col-span-1' : 'lg:col-span-2'} transition-all duration-300`}>
          <HistoricoPaquetesChart />
        </div>
      </div>
    </div>
  );
}

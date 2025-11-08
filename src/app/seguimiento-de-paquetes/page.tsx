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
    <div className="w-full max-w-6xl mx-auto bg-white rounded-xl shadow-2xl p-6 md:p-8 space-y-6">
      <header className="text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-green-800">Seguimiento de Paquetes</h1>
        <p className="text-lg font-semibold text-gray-500 mt-2">{currentDate}</p>
        <p className="text-gray-600 mt-1">Haz clic en un registro de la tabla para ver las estadísticas detalladas del encargado.</p>
      </header>
      
      <Tabla onRowClick={handleRowClick} pageType="seguimiento" />
      
      <div className="flex flex-wrap -mx-4">
        {selectedEncargado && (
          <div className="w-full md:w-1/2 px-4">
            <EncargadoChart encargadoName={selectedEncargado} />
          </div>
        )}
        
        <div className={`w-full ${selectedEncargado ? 'md:w-1/2' : 'md:w-full'} px-4 transition-all duration-300`}>
          <HistoricoPaquetesChart />
        </div>
      </div>
    </div>
  );
}

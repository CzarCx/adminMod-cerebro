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
    <div>
      <header>
        <h1>Seguimiento de Paquetes</h1>
        <p>{currentDate}</p>
        <p>Haz clic en un registro de la tabla para ver las estadísticas detalladas del encargado, o visualiza el histórico general de paquetes.</p>
      </header>
      
      <div>
        <Tabla onRowClick={handleRowClick} pageType="seguimiento" />
      </div>
      
      <div>
        {selectedEncargado && (
          <div>
            <EncargadoChart encargadoName={selectedEncargado} />
          </div>
        )}
        
        <div className={selectedEncargado ? '' : ''}>
          <HistoricoPaquetesChart />
        </div>
      </div>
    </div>
  );
}

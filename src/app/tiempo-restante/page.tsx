
'use client';

import { useState } from 'react';
import Tabla from '../../components/Tabla';
import { UserCheck } from 'lucide-react';

export default function TiempoRestantePage() {
  const [selectedEncargado, setSelectedEncargado] = useState<string | null>(null);

  const handleEncargadoClick = (encargadoName: string) => {
    setSelectedEncargado(prev => (prev === encargadoName ? null : encargadoName));
  };

  return (
    <main className="space-y-8">
      <header className="border-b pb-4 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Tiempo Restante de Hoy</h1>
        <p className="mt-2 text-muted-foreground">
          Aquí se muestra la cuenta regresiva para los registros del día de hoy. 
          { !selectedEncargado && ' Haz clic en un registro para ver el detalle por encargado.' }
        </p>
      </header>
      
      <div className="bg-card p-4 rounded-lg border">
        <Tabla 
          pageType="seguimiento" 
          filterByToday={true} 
          onRowClick={handleEncargadoClick} 
          nameFilter={selectedEncargado || ''}
        />
      </div>

      {selectedEncargado && (
        <div className="bg-card p-6 rounded-lg border animate-in fade-in-50">
          <div className="flex items-center gap-3 mb-4">
            <UserCheck className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Resumen de Tiempo para: {selectedEncargado}</h2>
          </div>
          <Tabla 
            pageType="seguimiento" 
            filterByEncargado={selectedEncargado} 
            filterByToday={true}
            showSummary={true} 
          />
        </div>
      )}
    </main>
  );
}

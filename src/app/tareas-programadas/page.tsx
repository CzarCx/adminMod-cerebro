
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import EncargadoSummaryCard from '../../components/EncargadoSummaryCard';
import TablaProgramadas from '../../components/TablaProgramadas';
import { ArrowLeft } from 'lucide-react';
import type { SummaryData } from '@/app/tiempo-restante/page';

interface ScheduledTask {
  name: string;
  quantity: number;
  status: string | null;
}

export default function TareasProgramadasPage() {
  const [scheduledSummaries, setScheduledSummaries] = useState<SummaryData[]>([]);
  const [selectedEncargado, setSelectedEncargado] = useState<string | null>(null);

  useEffect(() => {
    const fetchScheduledData = async () => {
      const { data: scheduledData, error } = await supabase
        .from('personal_prog')
        .select('name, quantity, status');

      if (error) {
        console.error('Error fetching scheduled data:', error.message);
        return;
      }

      if (scheduledData) {
        const groupedByName = scheduledData.reduce((acc, item) => {
          if (!acc[item.name]) {
            acc[item.name] = [];
          }
          acc[item.name].push(item as ScheduledTask);
          return acc;
        }, {} as Record<string, ScheduledTask[]>);

        const calculatedSummaries: SummaryData[] = Object.keys(groupedByName).map(name => {
          const group = groupedByName[name];
          const totalPackages = group.length;

          const counts = group.reduce((acc, item) => {
            const status = item.status?.trim().toUpperCase();
            
            if (status === 'ENTREGADO') {
                acc.entregados += 1;
            } else if (status === 'CALIFICADO') {
                acc.calificados += 1;
            } else { // Assume ASIGNADO or other non-final states
                acc.asignados += 1;
            }
            return acc;
          }, { asignados: 0, calificados: 0, entregados: 0, reportados: 0 });

          return {
            name,
            totalPackages,
            latestFinishTime: null,
            latestFinishTimeDateObj: null,
            counts,
            isScheduled: true,
          };
        });

        setScheduledSummaries(calculatedSummaries.sort((a, b) => a.name.localeCompare(b.name)));
      }
    };

    fetchScheduledData();
    const intervalId = setInterval(fetchScheduledData, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const handleCardClick = (name: string) => {
    setSelectedEncargado(name);
  };

  const handleBackClick = () => {
    setSelectedEncargado(null);
  };

  if (selectedEncargado) {
    return (
      <main className="space-y-8">
        <header className="border-b pb-4 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Registros de {selectedEncargado}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Detalle de los paquetes programados para este encargado.
          </p>
        </header>
        <div className="space-y-6">
          <button
            onClick={handleBackClick}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al resumen</span>
          </button>
          <div className="bg-card p-4 rounded-lg border">
            <TablaProgramadas 
              filterByEncargado={selectedEncargado}
            />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-8">
      <header className="border-b pb-4 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Tareas Programadas
        </h1>
        <p className="mt-2 text-muted-foreground">
          Resumen de las tareas programadas para el futuro, sin una hora de inicio definida.
        </p>
      </header>
      
      {scheduledSummaries.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
          {scheduledSummaries.map(summary => (
            <EncargadoSummaryCard 
              key={summary.name}
              summary={summary}
              onClick={() => handleCardClick(summary.name)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          No se encontraron tareas programadas.
        </div>
      )}
    </main>
  );
}


'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import EncargadoSummaryCard from '../../components/EncargadoSummaryCard';
import Tabla from '../../components/Tabla';
import { ArrowLeft } from 'lucide-react';

interface Paquete {
  id: number;
  name: string;
  quantity: number;
  date_esti: string | null;
  status?: string | null;
  report?: string | null;
  details?: string | null;
  rea_details?: string | null;
  code?: string;
  date?: string | null;
  date_cal?: string | null;
  date_ini?: string | null;
  eje_time?: string | null;
  sales_num?: string | null;
  product?: string;
  esti_time?: number;
  i_time?: string;
  e_time?: string;
  organization?: string;
}

export interface SummaryData {
  name: string;
  totalPackages: number;
  latestFinishTime: string | null;
  latestFinishTimeDateObj: Date | null;
  counts: {
    asignados: number;
    calificados: number;
    entregados: number;
    reportados: number;
  };
}

export default function TiempoRestantePage() {
  const [summaries, setSummaries] = useState<SummaryData[]>([]);
  const [selectedEncargado, setSelectedEncargado] = useState<string | null>(null);

  useEffect(() => {
    const fetchDataAndProcess = async () => {
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

      const { data: allData, error } = await supabase
        .from('personal')
        .select('id, name, quantity, date_esti, status, report')
        .gte('date', todayStart)
        .lt('date', todayEnd);

      if (error) {
        console.error('Error fetching data for summaries:', error.message);
        return;
      }
      
      if(allData) {
        const groupedByName = allData.reduce((acc, item) => {
          if (!acc[item.name]) {
            acc[item.name] = [];
          }
          acc[item.name].push(item as Paquete);
          return acc;
        }, {} as Record<string, Paquete[]>);

        const calculatedSummaries = Object.keys(groupedByName).map(name => {
          const group = groupedByName[name];
          const totalPackages = group.length;

          const latestFinishTimeObj = group.reduce((latest: Date | null, row) => {
            if (row.date_esti) {
              const finishDate = new Date(row.date_esti);
              if (latest === null || finishDate > latest) {
                return finishDate;
              }
            }
            return latest;
          }, null);
          
          if (latestFinishTimeObj) {
            latestFinishTimeObj.setSeconds(latestFinishTimeObj.getSeconds() + 30);
          }

          const counts = group.reduce((acc, item) => {
              const status = item.status?.trim().toUpperCase();
              const report = item.report?.trim().toUpperCase();
              
              if (report === 'REPORTADO') {
                acc.reportados += 1;
              } else if (status === 'ENTREGADO') {
                acc.entregados += 1;
              } else if (status === 'CALIFICADO') {
                acc.calificados += 1;
              } else if (status === 'ASIGNADO') {
                acc.asignados += 1;
              }
              return acc;
            }, { asignados: 0, calificados: 0, entregados: 0, reportados: 0 });

          return {
            name,
            totalPackages,
            latestFinishTime: latestFinishTimeObj ? latestFinishTimeObj.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true }) : null,
            latestFinishTimeDateObj: latestFinishTimeObj,
            counts,
          };
        });

        calculatedSummaries.sort((a, b) => {
          if (!a.latestFinishTimeDateObj) return 1;
          if (!b.latestFinishTimeDateObj) return -1;
          return a.latestFinishTimeDateObj.getTime() - b.latestFinishTimeDateObj.getTime();
        });

        setSummaries(calculatedSummaries);
      }
    };
    
    fetchDataAndProcess();

    const intervalId = setInterval(fetchDataAndProcess, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const handleCardClick = (name: string) => {
    setSelectedEncargado(name);
  };

  const handleBackClick = () => {
    setSelectedEncargado(null);
  };


  return (
    <main className="space-y-8">
      <header className="border-b pb-4 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {selectedEncargado ? `Registros de ${selectedEncargado}` : 'Disponibilidad del Equipo'}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {selectedEncargado 
            ? 'Detalle de los paquetes asignados para hoy.'
            : 'Resumen de la carga de trabajo de cada encargado, ordenado por quién se desocupa primero.'}
        </p>
      </header>
      
      {selectedEncargado ? (
        <div className="space-y-6">
           <button
            onClick={handleBackClick}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al resumen</span>
          </button>
          <div className="bg-card p-4 rounded-lg border">
            <Tabla 
              pageType="seguimiento" 
              filterByEncargado={selectedEncargado}
              filterByToday={true}
            />
          </div>
        </div>
      ) : summaries.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
          {summaries.map(summary => (
            <EncargadoSummaryCard 
              key={summary.name} 
              summary={summary}
              onClick={() => handleCardClick(summary.name)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          No hay registros de actividad para mostrar el día de hoy.
        </div>
      )}
    </main>
  );
}

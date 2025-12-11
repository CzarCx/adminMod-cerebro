
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import EncargadoSummaryCard from '../../components/EncargadoSummaryCard';
import Tabla from '../../components/Tabla';
import { ArrowLeft, Timer } from 'lucide-react';
import type { SummaryData as TableSummaryData } from '../../components/Tabla';


interface Paquete {
  id: number;
  name: string;
  quantity: number;
  date_esti: string | null;
  status?: string | null;
  details?: string | null;
  code?: string;
  date?: string | null;
  date_ini?: string | null;
  sales_num?: string | null;
  product?: string;
  esti_time?: number;
  organization?: string;
  report?: string | null;
}

export interface SummaryData {
  name: string;
  totalPackages: number;
  latestFinishTime: string | null;
  latestFinishTimeDateObj: Date | null;
  tentativeFinishTime: string | null;
  counts: {
    asignados: number;
    calificados: number;
    entregados: number;
    reportados: number;
  };
  isScheduled?: boolean;
  totalEstiTime?: number | null;
  totalScheduledTime?: number;
}

export default function TiempoRestantePage() {
  const [summaries, setSummaries] = useState<SummaryData[]>([]);
  const [selectedEncargado, setSelectedEncargado] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<TableSummaryData | null>(null);

  useEffect(() => {
    const fetchDataAndProcess = async () => {
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

      // Fetch scheduled tasks from 'personal_prog' table
      const { data: scheduledData, error: scheduledError } = await supabase
        .from('personal_prog')
        .select('name, esti_time');
      
      if (scheduledError) {
        console.error('Error fetching scheduled data:', scheduledError.message);
      }

      const scheduledTimeByName = (scheduledData || []).reduce((acc, item) => {
        if (!acc[item.name]) {
          acc[item.name] = 0;
        }
        acc[item.name] += item.esti_time || 0;
        return acc;
      }, {} as Record<string, number>);


      // Fetch active tasks from 'personal' table for today
      const { data: allData, error } = await supabase
        .from('personal')
        .select('id, name, quantity, date_esti, status, report, esti_time, date_ini')
        .gte('date', todayStart)
        .lt('date', todayEnd);

      if (error) {
        console.error('Error fetching data for summaries:', error.message);
      } else if(allData) {
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

          // Find the last record for the user based on ID
          const lastRecord = group.sort((a, b) => b.id - a.id)[0];
          
          let newLatestFinishTimeObj: Date | null = null;
          if (lastRecord && lastRecord.date_esti) {
             const pendingTasks = group.filter(item => item.status?.trim().toUpperCase() !== 'ENTREGADO');
             if (pendingTasks.length > 0) {
                newLatestFinishTimeObj = new Date(lastRecord.date_esti);
             }
          }
          
          const scheduledMinutes = scheduledTimeByName[name] || 0;
          let tentativeFinishTimeObj: Date | null = null;
          if (newLatestFinishTimeObj) {
            tentativeFinishTimeObj = new Date(newLatestFinishTimeObj.getTime() + scheduledMinutes * 60000);
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
            latestFinishTime: newLatestFinishTimeObj ? newLatestFinishTimeObj.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true }) : null,
            latestFinishTimeDateObj: newLatestFinishTimeObj,
            tentativeFinishTime: tentativeFinishTimeObj ? tentativeFinishTimeObj.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true }) : null,
            counts,
            isScheduled: false,
            totalScheduledTime: scheduledTimeByName[name] || 0,
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
    setSummaryData(null);
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
           <div className="flex justify-between items-center">
              <button
                onClick={handleBackClick}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver al resumen</span>
              </button>

              {summaryData && (
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-full bg-primary/10 text-primary">
                            <Timer className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground uppercase">Minutos Asignados</p>
                            <p className="text-2xl font-bold text-foreground">{summaryData.totalEstiTime} min</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-3">
                        <div className="p-3 rounded-full bg-primary/10 text-primary">
                            <Timer className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground uppercase">minutos laborables</p>
                            <p className="text-2xl font-bold text-foreground">{summaryData.totalRealTime} min</p>
                        </div>
                    </div>
                </div>
              )}
           </div>
          <div className="bg-card p-4 rounded-lg border">
            <Tabla 
              pageType="seguimiento" 
              filterByEncargado={selectedEncargado}
              filterByToday={true}
              onSummaryChange={setSummaryData}
            />
          </div>
        </div>
      ) : summaries.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
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


'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Clock, User, Loader2, Download, Calendar } from 'lucide-react';
import Papa from 'papaparse';


interface Paquete {
  name: string;
  date_ini: string | null;
  date_esti: string | null;
}

interface TiempoMuerto {
  encargado: string;
  tiempoTotal: number;
  periodos: { inicio: string; fin: string; duracion: number }[];
}

export default function TiemposMuertosPage() {
  const [tiemposMuertos, setTiemposMuertos] = useState<TiempoMuerto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const handleDownloadCSV = () => {
    if (tiemposMuertos.length === 0) return;

    const csvData = tiemposMuertos.flatMap(item => 
      item.periodos.map(periodo => ({
        'Encargado': item.encargado,
        'Tiempo Muerto (min)': periodo.duracion,
        'Inicio': periodo.inicio,
        'Fin': periodo.fin,
      }))
    );

    const csv = Papa.unparse(csvData);
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const filenameDate = new Date(selectedDate).toLocaleDateString('es-MX', { timeZone: 'UTC' }).replace(/\//g, '-');
    link.setAttribute('download', `tiempos_muertos_${filenameDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const fetchAndCalculateDeadTimes = async () => {
      setIsLoading(true);
      const targetDate = new Date(selectedDate);
      const dateStart = new Date(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate()).toISOString();
      const dateEnd = new Date(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate() + 1).toISOString();

      const { data, error } = await supabase
        .from('personal')
        .select('name, date_ini, date_esti')
        .gte('date', dateStart)
        .lt('date', dateEnd)
        .order('date_ini', { ascending: true });

      if (error) {
        console.error('Error fetching data:', error.message);
        setTiemposMuertos([]);
        setIsLoading(false);
        return;
      }

      if (data) {
        const groupedByName = (data as Paquete[]).reduce((acc, item) => {
          if (!acc[item.name]) {
            acc[item.name] = [];
          }
          acc[item.name].push(item);
          return acc;
        }, {} as Record<string, Paquete[]>);

        const calculatedDeadTimes: TiempoMuerto[] = [];

        for (const encargado in groupedByName) {
          const tasks = groupedByName[encargado];
          let totalDeadTime = 0;
          const deadTimePeriods: { inicio: string; fin: string; duracion: number }[] = [];

          for (let i = 0; i < tasks.length - 1; i++) {
            const currentTask = tasks[i];
            const nextTask = tasks[i + 1];

            if (currentTask.date_esti && nextTask.date_ini) {
              const finishTime = new Date(currentTask.date_esti);
              const nextStartTime = new Date(nextTask.date_ini);

              if (nextStartTime > finishTime) {
                const deadTime = Math.round((nextStartTime.getTime() - finishTime.getTime()) / 60000);
                if (deadTime > 0) {
                  totalDeadTime += deadTime;
                  deadTimePeriods.push({
                    inicio: formatTime(finishTime),
                    fin: formatTime(nextStartTime),
                    duracion: deadTime,
                  });
                }
              }
            }
          }

          if (totalDeadTime > 0) {
            calculatedDeadTimes.push({
              encargado,
              tiempoTotal: totalDeadTime,
              periodos: deadTimePeriods,
            });
          }
        }

        calculatedDeadTimes.sort((a, b) => b.tiempoTotal - a.tiempoTotal);
        setTiemposMuertos(calculatedDeadTimes);
      }
      setIsLoading(false);
    };

    fetchAndCalculateDeadTimes();
  }, [selectedDate]);
  
  const getHeaderDate = () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const targetDate = new Date(selectedDate);
    
    if (selectedDate === todayStr) {
      return "(Hoy)";
    }
    return `(${targetDate.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })})`;
  }

  return (
    <main className="space-y-8">
      <header className="border-b pb-4 flex flex-wrap justify-between items-center gap-4">
        <div className="text-center flex-grow">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Análisis de Tiempos Muertos {getHeaderDate()}</h1>
            <p className="mt-2 text-muted-foreground">Detalle de los periodos de inactividad de cada encargado durante la jornada.</p>
        </div>
        <div className="flex items-center gap-2">
            <div className="relative">
                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 text-sm font-semibold rounded-md transition-all duration-300 border bg-background border-border focus:outline-none focus:ring-2 focus:ring-ring"
                    style={{colorScheme: 'light'}}
                  />
                   <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
            {!isLoading && tiemposMuertos.length > 0 && (
              <button
                onClick={handleDownloadCSV}
                className="p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                title="Descargar reporte de tiempos muertos (CSV)"
              >
                <Download className="w-6 h-6" />
              </button>
            )}
        </div>
      </header>

      <div className="bg-card p-4 rounded-lg border">
        {isLoading ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground gap-3">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Calculando tiempos muertos...</span>
          </div>
        ) : tiemposMuertos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-3">
             <Clock className="w-12 h-12" />
            <p className="text-lg">¡Excelente! No se encontraron tiempos muertos significativos en la fecha seleccionada.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border no-scrollbar max-h-[70vh]">
            <table className="min-w-full text-sm">
              <thead className="bg-primary/10">
                <tr>
                  <th className="px-4 py-3 font-medium text-left text-primary flex items-center gap-2">
                    <User className="w-4 h-4" /> Encargado
                  </th>
                  <th className="px-4 py-3 font-medium text-center text-primary">Tiempo Muerto Total (min)</th>
                  <th className="px-4 py-3 font-medium text-left text-primary">Periodos de Inactividad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tiemposMuertos.map(({ encargado, tiempoTotal, periodos }) => (
                  <tr key={encargado} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{encargado}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-bold text-lg text-destructive">{tiempoTotal}</span>
                    </td>
                    <td className="px-4 py-3">
                      <ul className="space-y-1">
                        {periodos.map((periodo, index) => (
                          <li key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-mono bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-md">{periodo.duracion} min</span>
                            <span>de</span>
                            <span className="font-semibold text-foreground">{periodo.inicio}</span>
                            <span>a</span>
                            <span className="font-semibold text-foreground">{periodo.fin}</span>
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

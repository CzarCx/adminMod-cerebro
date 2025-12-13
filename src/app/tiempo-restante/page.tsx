
'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import EncargadoSummaryCard from '../../components/EncargadoSummaryCard';
import Tabla from '../../components/Tabla';
import { ArrowLeft, Timer, Download, DownloadCloud, Barcode, AlertTriangle, PlayCircle, PauseCircle } from 'lucide-react';
import type { SummaryData as TableSummaryData } from '../../components/Tabla';
import Papa from 'papaparse';


interface Paquete {
  id: number;
  name: string;
  quantity: number;
  date_esti: string | null;
  status?: string | null;
  details?: string | null;
  code?: number | string;
  date?: string | null;
  date_ini?: string | null;
  sales_num?: string | null;
  product?: string;
  esti_time?: number;
  organization?: string;
  report?: string | null;
  sku?: string;
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
    actividades: number;
  };
  isScheduled?: boolean;
  totalEstiTime?: number | null;
  totalScheduledTime?: number;
  activityCodes?: (string | number)[];
  activeStopwatchSince?: Date | null;
  isBusy?: boolean;
}

const activityCodeMap: { [key: string]: { description: string, time: number } } = {
  '001': { description: 'Hora de Comida', time: 60 },
  '002': { description: 'Descarga de Vehículo', time: 0 },
  '003': { description: 'Descarga de Contenedor', time: 0 },
};

export default function TiempoRestantePage() {
  const [summaries, setSummaries] = useState<SummaryData[]>([]);
  const [selectedEncargado, setSelectedEncargado] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<TableSummaryData | null>(null);
  const [allTodayData, setAllTodayData] = useState<Paquete[]>([]);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [activityCode, setActivityCode] = useState('');
  const [activityTime, setActivityTime] = useState<number | string>(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedEncargados, setSelectedEncargados] = useState<string[]>([]);
  const [extraActivityName, setExtraActivityName] = useState('');
  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
  const [pauseReason, setPauseReason] = useState('');
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');


  const fetchDataAndProcess = useCallback(async () => {
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

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

      const { data: allData, error } = await supabase
        .from('personal')
        .select('id, name, product, quantity, esti_time, organization, status, details, code, date, date_ini, date_esti, sales_num, report, sku')
        .gte('date', todayStart)
        .lt('date', todayEnd);

      if (error) {
        console.error('Error fetching data for summaries:', error.message);
        setAllTodayData([]);
      } else if(allData) {
        setAllTodayData(allData as Paquete[]);
        const groupedByName = allData.reduce((acc, item) => {
          if (!acc[item.name]) {
            acc[item.name] = [];
          }
          acc[item.name].push(item as Paquete);
          return acc;
        }, {} as Record<string, Paquete[]>);

        const calculatedSummaries = Object.keys(groupedByName).map(name => {
          const group = groupedByName[name];
          const totalPackages = group.filter(item => item.status !== 'ACTIVIDAD').length;
          
          const activityCodes = group
            .filter(item => item.status === 'ACTIVIDAD' && item.code)
            .map(item => item.code!);
          
          const activeStopwatchTask = group.find(item => item.status === 'ACTIVIDAD' && item.code === 999 && item.date_ini);
          const activeStopwatchSince = activeStopwatchTask && activeStopwatchTask.date_ini ? new Date(activeStopwatchTask.date_ini) : null;


          let newLatestFinishTimeObj: Date | null = null;
          const pendingTasks = group.filter(item => item.status?.trim().toUpperCase() !== 'ENTREGADO' && item.status?.trim().toUpperCase() !== 'ACTIVIDAD');
          
          if (pendingTasks.length > 0) {
              const lastTaskWithEsti = [...pendingTasks].sort((a, b) => {
                  const dateA = a.date_esti ? new Date(a.date_esti).getTime() : 0;
                  const dateB = b.date_esti ? new Date(b.date_esti).getTime() : 0;
                  return dateB - dateA;
              })[0];
              
              if (lastTaskWithEsti && lastTaskWithEsti.date_esti) {
                  newLatestFinishTimeObj = new Date(lastTaskWithEsti.date_esti);
              }
          }

          const isBusy = newLatestFinishTimeObj ? newLatestFinishTimeObj.getTime() > new Date().getTime() : false;

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
              } else if (status === 'ACTIVIDAD') {
                acc.actividades += 1;
              }
              return acc;
            }, { asignados: 0, calificados: 0, entregados: 0, reportados: 0, actividades: 0 });

          return {
            name,
            totalPackages,
            latestFinishTime: newLatestFinishTimeObj ? newLatestFinishTimeObj.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true }) : null,
            latestFinishTimeDateObj: newLatestFinishTimeObj,
            tentativeFinishTime: tentativeFinishTimeObj ? tentativeFinishTimeObj.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true }) : null,
            counts,
            isScheduled: false,
            totalScheduledTime: scheduledTimeByName[name] || 0,
            activityCodes: [...new Set(activityCodes)],
            activeStopwatchSince,
            isBusy,
          };
        });

        calculatedSummaries.sort((a, b) => {
          if (!a.latestFinishTimeDateObj) return 1;
          if (!b.latestFinishTimeDateObj) return -1;
          return a.latestFinishTimeDateObj.getTime() - b.latestFinishTimeDateObj.getTime();
        });

        setSummaries(calculatedSummaries);
      }
  }, []);
    
  useEffect(() => {
    fetchDataAndProcess();
    const intervalId = setInterval(fetchDataAndProcess, 30000);
    return () => clearInterval(intervalId);
  }, [fetchDataAndProcess]);

  const handleCardClick = (name: string) => {
    setSelectedEncargado(name);
  };
  
  const handleToggleSelection = (name: string) => {
    setSelectedEncargados(prev => 
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const handleBackClick = () => {
    setSelectedEncargado(null);
    setSummaryData(null);
  };
  
  const handleDownloadCSV = () => {
    const csvData = summaries.map(s => ({
      'Encargado': s.name,
      'Paquetes Totales': s.totalPackages,
      'Hora de Fin': s.latestFinishTime || 'N/A',
      'Fin Tentativo': s.tentativeFinishTime || 'N/A',
      'Minutos Programados': s.totalScheduledTime || 0,
      'Asignados': s.counts.asignados,
      'Calificados': s.counts.calificados,
      'Entregados': s.counts.entregados,
      'Reportados': s.counts.reportados,
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const today = new Date().toLocaleDateString('es-MX').replace(/\//g, '-');
    link.setAttribute('download', `resumen_disponibilidad_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('es-MX');
  };

  const formatTime = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });
  };
  
  const handleDownloadEncargadoData = () => {
    if (!selectedEncargado) return;
    const dataToDownload = allTodayData.filter(row => row.name === selectedEncargado);
    if (dataToDownload.length === 0) return;

    const csvData = dataToDownload.map(row => ({
      'ID': row.id,
      'Encargado': row.name,
      'Producto': row.product,
      'Cantidad': row.quantity,
      'SKU': row.sku,
      'Status': row.status,
      'Codigo': row.code,
      'Numero de Venta': row.sales_num,
      'Empresa': row.organization,
      'Fecha Asignacion': formatDate(row.date),
      'Hora Inicio': formatTime(row.date_ini),
      'Hora Fin Estimada': formatTime(row.date_esti),
      'Tiempo Estimado (min)': row.esti_time,
      'Reportado': row.report,
      'Detalles Reporte': row.details,
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const today = new Date().toLocaleDateString('es-MX').replace(/\//g, '-');
    const filename = `registros_${selectedEncargado.replace(/\s+/g, '_')}_${today}.csv`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAllDetailsCSV = () => {
    if (allTodayData.length === 0) {
      alert('No hay datos detallados para descargar.');
      return;
    }

    const csvData = allTodayData.map(row => ({
      'ID': row.id,
      'Encargado': row.name,
      'Producto': row.product,
      'Cantidad': row.quantity,
      'SKU': row.sku,
      'Status': row.status,
      'Codigo': row.code,
      'Numero de Venta': row.sales_num,
      'Empresa': row.organization,
      'Fecha Asignacion': formatDate(row.date),
      'Hora Inicio': formatTime(row.date_ini),
      'Hora Fin Estimada': formatTime(row.date_esti),
      'Tiempo Estimado (min)': row.esti_time,
      'Reportado': row.report,
      'Detalles Reporte': row.details,
    }));

    const csv = Papa.unparse(csvData, { header: true });
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const today = new Date().toLocaleDateString('es-MX').replace(/\//g, '-');
    link.setAttribute('download', `reporte_detallado_hoy_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleOpenCodeModal = () => {
    setActivityCode('');
    setExtraActivityName('');
    setActivityTime(0);
    setIsCodeModalOpen(true);
  };
  
  const handleConfirmActivityCode = async () => {
    const isExtra = !!extraActivityName.trim();
    const isCoded = activityCodeMap[activityCode] && Number(activityTime) > 0;

    if (!isExtra && !isCoded) {
      setValidationMessage('Por favor, introduce un código y tiempo válidos, o el nombre de una actividad extraordinaria.');
      setIsValidationModalOpen(true);
      return;
    }

    if (isExtra) {
      if (selectedEncargados.length === 0) {
        setValidationMessage('Debes seleccionar al menos un encargado para una actividad extraordinaria.');
        setIsValidationModalOpen(true);
        return;
      }
      for (const name of selectedEncargados) {
        const summary = summaries.find(s => s.name === name);
        if (summary?.isBusy) {
          setValidationMessage(`No se puede asignar una actividad a ${name} porque aún está ocupado.`);
          setIsValidationModalOpen(true);
          return;
        }
      }
    }

    setIsUpdating(true);
    
    let targetEncargados = selectedEncargados;
    
    if (selectedEncargados.length === 0 && !isExtra) {
       targetEncargados = summaries.map(s => s.name);
    }
    
    if (targetEncargados.length === 0 && !isExtra) {
      setValidationMessage('No hay encargados a los que aplicar la actividad.');
      setIsValidationModalOpen(true);
      setIsUpdating(false);
      return;
    }

    const timeToAdd = isExtra ? 0 : Number(activityTime);

    if (timeToAdd > 0) {
        const { data: packagesToUpdate, error } = await supabase
        .from('personal')
        .select('id, name, date_esti')
        .in('name', targetEncargados)
        .neq('status', 'ENTREGADO')
        .gte('date', new Date(new Date().setHours(0, 0, 0, 0)).toISOString());

        if (error) {
            console.error('Error fetching packages to update:', error.message);
            setValidationMessage('Error al obtener los paquetes para actualizar.');
            setIsValidationModalOpen(true);
            setIsUpdating(false);
            return;
        }

        if (packagesToUpdate && packagesToUpdate.length > 0) {
            const updates = packagesToUpdate
            .filter(pkg => pkg.date_esti)
            .map(pkg => {
                const currentEsti = new Date(pkg.date_esti);
                const newEsti = new Date(currentEsti.getTime() + timeToAdd * 60000);
                return {
                id: pkg.id,
                name: pkg.name,
                date_esti: newEsti.toISOString()
                };
            });

            if (updates.length > 0) {
                const { error: updateError } = await supabase.from('personal').upsert(updates);
                if (updateError) {
                    console.error('Error updating times:', updateError.message);
                    setValidationMessage('Error al actualizar los tiempos.');
                    setIsValidationModalOpen(true);
                }
            }
        }
    }
    
    const activityRecords = targetEncargados.map(name => ({
      name: name,
      product: isExtra ? extraActivityName.trim() : activityCodeMap[activityCode].description,
      quantity: 0,
      esti_time: timeToAdd,
      status: 'ACTIVIDAD',
      code: isExtra ? 999 : parseInt(activityCode),
      date: new Date().toISOString(),
      date_ini: new Date().toISOString(),
    }));

    const { error: insertError } = await supabase.from('personal').insert(activityRecords);
    
    if (insertError) {
      console.error('Error inserting activity record:', insertError.message);
      setValidationMessage('Error al registrar la actividad en la tabla.');
      setIsValidationModalOpen(true);
    }
    
    setIsUpdating(false);
    setIsCodeModalOpen(false);
    setSelectedEncargados([]);
    fetchDataAndProcess();
  };


  useEffect(() => {
    if (activityCodeMap[activityCode]) {
      setActivityTime(activityCodeMap[activityCode].time);
    } else {
      setActivityTime(0);
    }
  }, [activityCode]);

  const isConfirmDisabled = isUpdating;
  
  const selectedEncargadoSummary = summaries.find(s => s.name === selectedEncargado);

  const handlePauseTimer = async () => {
    if (!selectedEncargado || !pauseReason.trim()) {
      alert('Debes proporcionar un resultado o motivo para pausar la actividad.');
      return;
    }

    const activeActivity = allTodayData.find(
      (item) => item.name === selectedEncargado && item.status === 'ACTIVIDAD' && item.code === 999
    );

    if (!activeActivity) {
      alert('No se encontró una actividad extraordinaria activa para este encargado.');
      return;
    }

    setIsUpdating(true);

    const { error } = await supabase
      .from('personal')
      .update({
        status: 'ENTREGADO', // Mark as finished
        details: pauseReason,
        date_esti: new Date().toISOString(), // Set finish time to now
      })
      .eq('id', activeActivity.id);

    if (error) {
      console.error('Error pausing timer:', error.message);
      alert('Error al pausar la actividad.');
    } else {
      setPauseReason('');
      setIsPauseModalOpen(false);
      await fetchDataAndProcess();
    }
    setIsUpdating(false);
  };

  return (
    <main className="space-y-8">
      <header className="border-b pb-4">
        {selectedEncargado ? (
          <div className="flex justify-between items-center">
            <div className='text-center flex-grow'>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  Registros de {selectedEncargado}
                </h1>
                <p className="mt-2 text-muted-foreground">
                  Detalle de los paquetes asignados para hoy.
                </p>
            </div>
             <button 
              onClick={handleDownloadEncargadoData}
              className="p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              title="Descargar datos del encargado (CSV)"
            >
              <Download className="w-6 h-6" />
            </button>
          </div>
        ) : (
          <div className="flex justify-between items-center">
              <div className='text-center flex-grow'>
                  <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    Disponibilidad del Equipo
                  </h1>
                  <p className="mt-2 text-muted-foreground">
                    Resumen de la carga de trabajo de cada encargado, ordenado por quién se desocupa primero.
                  </p>
              </div>
              {summaries.length > 0 && (
                  <div className="flex items-center gap-2">
                      <button
                        onClick={handleOpenCodeModal}
                        className="p-2 rounded-full text-gray-500 bg-gray-500/10 hover:bg-gray-500/20 transition-colors"
                        title="Registrar Actividad por Código"
                      >
                        <Barcode className="w-6 h-6" />
                      </button>
                      <button 
                        onClick={handleDownloadAllDetailsCSV}
                        className="p-2 rounded-full text-blue-500 bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
                        title="Descargar Reporte Detallado (CSV)"
                      >
                        <DownloadCloud className="w-6 h-6" />
                      </button>
                      <button 
                        onClick={handleDownloadCSV}
                        className="p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        title="Descargar Resumen (CSV)"
                      >
                        <Download className="w-6 h-6" />
                      </button>
                  </div>
              )}
          </div>
        )}
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

            {selectedEncargadoSummary?.activeStopwatchSince && (
              <button
                onClick={() => setIsPauseModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                <PauseCircle className="w-4 h-4" />
                <span>Pausar Temporizador</span>
              </button>
            )}

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
              showDeadTimeIndicator={true}
              latestFinishTimeDateObj={selectedEncargadoSummary?.latestFinishTimeDateObj || null}
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
              onToggleSelection={() => handleToggleSelection(summary.name)}
              isSelected={selectedEncargados.includes(summary.name)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          No hay registros de actividad para mostrar el día de hoy.
        </div>
      )}

      {isCodeModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          onClick={() => isUpdating ? null : setIsCodeModalOpen(false)}
        >
          <div 
            className="w-full max-w-md p-6 space-y-4 bg-card border rounded-lg shadow-lg"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div className="p-3 mb-2 rounded-full bg-primary/10 text-primary">
                <Barcode />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Registrar Actividad</h2>
              <p className="text-sm text-muted-foreground">
                Digita un código o el nombre de una actividad extraordinaria.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="activity-code" className="block mb-2 text-sm font-medium text-foreground">
                  Código de Actividad
                </label>
                <input
                  id="activity-code"
                  type="text"
                  className="w-full p-2 text-2xl text-center font-mono tracking-widest border rounded-md resize-none bg-background border-border placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="000"
                  value={activityCode}
                  onChange={(e) => setActivityCode(e.target.value)}
                  disabled={!!extraActivityName.trim()}
                />
              </div>
              <div>
                <label htmlFor="activity-time" className="block mb-2 text-sm font-medium text-foreground">
                  Minutos a Añadir
                </label>
                <input
                  id="activity-time"
                  type="number"
                  className="w-full p-2 text-2xl text-center font-mono border rounded-md resize-none bg-background border-border placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  value={activityTime}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || value === null) {
                        setActivityTime('');
                    } else {
                        setActivityTime(parseInt(value, 10));
                    }
                  }}
                  disabled={activityCode === '001' || !!extraActivityName.trim()}
                />
              </div>
            </div>

            <div className="relative flex items-center">
              <div className="flex-grow border-t border-border"></div>
              <span className="flex-shrink mx-4 text-xs text-muted-foreground">O</span>
              <div className="flex-grow border-t border-border"></div>
            </div>

             <div>
                <label htmlFor="extra-activity-name" className="block mb-2 text-sm font-medium text-foreground">
                  Actividad Extraordinaria (requiere selección)
                </label>
                <input
                  id="extra-activity-name"
                  type="text"
                  className="w-full p-2 text-sm border rounded-md resize-none bg-background border-border placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Ej: Limpieza de área"
                  value={extraActivityName}
                  onChange={(e) => setExtraActivityName(e.target.value)}
                  disabled={!!activityCode}
                />
            </div>
            
            <div className="h-10 text-center flex items-center justify-center">
              {activityCode && activityCodeMap[activityCode] ? (
                <p className="text-lg font-semibold text-primary animate-in fade-in-50">
                  {activityCodeMap[activityCode].description}
                </p>
              ) : activityCode && !extraActivityName ? (
                <p className="text-sm font-semibold text-destructive animate-in fade-in-50">
                  Código de actividad inválido.
                </p>
              ) : null}
            </div>

            <div className="text-center p-2 rounded-md bg-muted/50 text-sm text-muted-foreground">
              {extraActivityName.trim() && selectedEncargados.length === 0 ? (
                'Debes seleccionar al menos un encargado para una actividad extraordinaria.'
              ) : selectedEncargados.length > 0 ? (
                `La acción se aplicará a ${selectedEncargados.length} encargado(s) seleccionado(s).`
              ) : (
                'La acción se aplicará a todos los encargados.'
              )}
            </div>
            
            <div className="flex justify-end gap-4">
              <button 
                onClick={() => setIsCodeModalOpen(false)}
                className="px-4 py-2 text-sm font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80"
                disabled={isUpdating}
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirmActivityCode}
                disabled={isConfirmDisabled}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-md bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? (
                  <>
                    <Timer className="w-4 h-4 animate-spin" />
                    <span>Actualizando...</span>
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-4 h-4" />
                    <span>Confirmar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {isPauseModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          onClick={() => isUpdating ? null : setIsPauseModalOpen(false)}
        >
          <div 
            className="w-full max-w-md p-6 space-y-4 bg-card border rounded-lg shadow-lg"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div className="p-3 mb-2 rounded-full bg-blue-600/10 text-blue-600">
                <PauseCircle />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Finalizar Actividad Extraordinaria</h2>
              <p className="text-sm text-muted-foreground">
                Documenta el resultado para detener el temporizador.
              </p>
            </div>
            
            <div>
              <label htmlFor="pause-reason" className="block mb-2 text-sm font-medium text-foreground">
                Resultado o Conclusión
              </label>
              <textarea
                id="pause-reason"
                rows={4}
                className="w-full p-2 text-sm border rounded-md resize-none bg-background border-border placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Describe el resultado de la actividad aquí..."
                value={pauseReason}
                onChange={(e) => setPauseReason(e.target.value)}
              />
            </div>
            
            <div className="flex justify-end gap-4">
              <button 
                onClick={() => setIsPauseModalOpen(false)}
                className="px-4 py-2 text-sm font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80"
                disabled={isUpdating}
              >
                Cancelar
              </button>
              <button 
                onClick={handlePauseTimer}
                disabled={isUpdating || !pauseReason.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? (
                  <>
                    <Timer className="w-4 h-4 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <PauseCircle className="w-4 h-4" />
                    <span>Pausar y Guardar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {isValidationModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          onClick={() => setIsValidationModalOpen(false)}
        >
          <div 
            className="w-full max-w-sm p-6 space-y-4 bg-card border rounded-lg shadow-lg"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div className="p-3 mb-2 rounded-full bg-destructive/10 text-destructive">
                <AlertTriangle />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Acción No Permitida</h2>
              <p className="text-sm text-muted-foreground">
                {validationMessage}
              </p>
            </div>
            
            <div className="flex justify-center">
              <button 
                onClick={() => setIsValidationModalOpen(false)}
                className="px-6 py-2 text-sm font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

    

    

    




    
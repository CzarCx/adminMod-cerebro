
'use client'

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { AlertTriangle, Package, Clock, ThumbsUp, ThumbsDown, RefreshCw, Check } from 'lucide-react';

interface Paquete {
  id: number;
  name: string;
  product: string;
  quantity: number;
  esti_time: number;
  i_time: string;
  e_time: string;
  organization: string;
  status: string | null;
  details: string | null;
  rea_details: string | null;
  code: string;
  date: string | null;
  eje_time: string | null;
}

interface TablaProps {
  onRowClick?: (name: string) => void;
  pageType?: 'seguimiento' | 'reportes';
  filterByEncargado?: string | null;
  filterByToday?: boolean;
  showSummary?: boolean;
}

interface SummaryData {
  totalPackages: number;
  avgPackagesPerHour: number | null;
  totalDifferenceSeconds: number;
}

export default function Tabla({ 
  onRowClick, 
  pageType = 'seguimiento', 
  filterByEncargado = null,
  filterByToday = false,
  showSummary = false,
}: TablaProps) {
  const [data, setData] = useState<Paquete[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reportingItem, setReportingItem] = useState<Paquete | null>(null);
  const [reportDetails, setReportDetails] = useState('');
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [reassigningItem, setReassigningItem] = useState<Paquete | null>(null);
  const [reassignableUsers, setReassignableUsers] = useState<string[]>([]);
  const [selectedReassignUser, setSelectedReassignUser] = useState('');
  const [reassignDetails, setReassignDetails] = useState('');

  const fetchData = async () => {
    let query = supabase.from('personal').select('*').order('date', { ascending: true });
    
    if (pageType === 'reportes') {
      query = query.eq('status', 'REPORTADO');
    }

    if (filterByEncargado) {
      query = query.eq('name', filterByEncargado);
    }

    if (filterByToday) {
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();
      
      query = query.gte('date', todayStart).lt('date', todayEnd);
    }

    const { data: fetchedData, error } = await query;
    if (error) {
      console.error('Error fetching data:', error.message);
      setData([]);
    } else {
      const sortedData = fetchedData.sort((a, b) => new Date(b.date as string).getTime() - new Date(a.date as string).getTime()) as Paquete[];
      setData(sortedData);
      if (showSummary) {
        calculateSummary(sortedData);
      }
    }
  };

  useEffect(() => {
    fetchData();

    if (pageType === 'seguimiento') {
        const channel = supabase
        .channel(`personal-db-changes-${pageType}-${filterByEncargado || 'all'}-${filterByToday}`)
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'personal' },
            () => {
              fetchData();
            }
        )
        .subscribe();
        return () => {
            supabase.removeChannel(channel);
        };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageType, filterByEncargado, filterByToday, showSummary]);

  const calculateSummary = (summaryData: Paquete[]) => {
    if (summaryData.length === 0) {
      setSummary(null);
      return;
    }

    const totalPackages = summaryData.reduce((acc, item) => acc + item.quantity, 0);

    let avgPackagesPerHour: number | null = null;
    if (summaryData.length > 1) {
      const firstRecordTime = new Date(summaryData[summaryData.length - 1].date as string).getTime();
      const lastRecordTime = new Date(summaryData[0].date as string).getTime();
      const hoursWorked = (lastRecordTime - firstRecordTime) / (1000 * 60 * 60);

      if (hoursWorked > 0) {
        avgPackagesPerHour = parseFloat((totalPackages / hoursWorked).toFixed(2));
      } else { 
        avgPackagesPerHour = totalPackages;
      }
    } else { 
      avgPackagesPerHour = totalPackages;
    }

    const totalDifferenceSeconds = summaryData.reduce((acc, row) => {
        if (!row.eje_time || !row.date || row.esti_time == null) {
            return acc;
        }
        try {
            const horaDate = new Date(row.date);
            const horaInSeconds = horaDate.getHours() * 3600 + horaDate.getMinutes() * 60 + horaDate.getSeconds();
            
            const timeMatch = row.eje_time.match(/^(\d{2}):(\d{2}):(\d{2})/);
            if (!timeMatch) return acc;
            const [, hours, minutes, seconds] = timeMatch.map(Number);
            const ejeTimeInSeconds = hours * 3600 + minutes * 60 + seconds;
            
            const estiTimeInSeconds = row.esti_time * 60;
            
            const diffSeconds = estiTimeInSeconds - (ejeTimeInSeconds - horaInSeconds);
            return acc + diffSeconds;
        } catch (e) {
            return acc;
        }
    }, 0);

    setSummary({ totalPackages, avgPackagesPerHour, totalDifferenceSeconds });
  };

  const openReportModal = (item: Paquete, event: React.MouseEvent) => {
    event.stopPropagation();
    if (item.status === 'REPORTADO') return;
    setReportingItem(item);
    setReportDetails(item.details || '');
    setIsModalOpen(true);
  };

  const handleSaveReport = async () => {
    if (!reportingItem) return;
    const { error } = await supabase
      .from('personal')
      .update({ status: 'REPORTADO', details: reportDetails })
      .eq('id', reportingItem.id);
    if (error) {
      console.error('Error saving report:', error.message);
      alert('Error: No se pudo guardar el reporte.');
    } else {
      setData(currentData => currentData.map(item =>
        item.id === reportingItem.id ? { ...item, status: 'REPORTADO', details: reportDetails } : item
      ));
      setIsModalOpen(false);
    }
  };

  const handleReassignClick = async (e: React.MouseEvent, row: Paquete) => {
    e.stopPropagation();
    setReassigningItem(row);
    setReassignDetails('');

    const { data: users, error } = await supabase
      .from('personal_name')
      .select('name');

    if (error) {
      console.error('Error fetching users:', error.message);
      alert('Error: No se pudo obtener la lista de encargados.');
      setReassignableUsers([]);
    } else {
      const userNames = users.map(user => user.name).filter(name => name !== row.name);
      setReassignableUsers(userNames);
      if (userNames.length > 0) {
        setSelectedReassignUser(userNames[0]);
      }
    }
    setIsReassignModalOpen(true);
  };

  const handleSaveReassignment = async () => {
    if (!reassigningItem || !selectedReassignUser || !reassignDetails.trim()) {
      alert('El motivo de la reasignación es obligatorio.');
      return;
    }
    
    const finalReassignDetails = `Reasignado de: ${reassigningItem.name}. Motivo: ${reassignDetails}`;

    const { error } = await supabase
      .from('personal')
      .update({ name: selectedReassignUser, rea_details: finalReassignDetails })
      .eq('id', reassigningItem.id);

    if (error) {
      console.error('Error reassigning item:', error.message);
      alert('Error: No se pudo reasignar el registro.');
    } else {
      setData(currentData => currentData.map(item =>
        item.id === reassigningItem.id ? { ...item, name: selectedReassignUser, rea_details: finalReassignDetails } : item
      ));
      setIsReassignModalOpen(false);
    }
  };


  const getStatusBadge = (item: Paquete) => {
    if (item.details && item.details.trim() !== '') {
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-destructive/10 text-red-400 border border-destructive/20">REPORTADO</span>;
    }
    const s = item.status?.trim().toUpperCase() || 'PENDIENTE';
    switch (s) {
      case 'REPORTADO':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-destructive/10 text-red-400 border border-destructive/20">{s}</span>;
      case 'REVISADO':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-primary/10 text-green-400 border border-primary/20">{s}</span>;
      case 'CALIFICADO':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-500/10 text-green-400 border border-green-500/20">{s}</span>;
      case 'ENTREGADO':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">{s}</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">{s}</span>;
    }
  };
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) {
      return '';
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return '';
    }
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) {
      return '';
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleTimeString('es-MX');
  };

  const formatExecutionTime = (timeString: string | null) => {
    if (!timeString) {
        return '';
    }
    const timeMatch = timeString.match(/^(\d{2}):(\d{2}):(\d{2})/);
    if (!timeMatch) return timeString;

    const [ , hours, minutes, seconds] = timeMatch;
    const date = new Date();
    date.setHours(parseInt(hours, 10), parseInt(minutes, 10), parseInt(seconds, 10));
    
    return date.toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit', second: '2-digit' });
  };
  
  const calculateDifference = (row: Paquete) => {
    if (!row.eje_time || !row.date || row.esti_time == null) {
      return { value: null, color: '' };
    }

    try {
      const horaDate = new Date(row.date);
      const horaInSeconds = horaDate.getHours() * 3600 + horaDate.getMinutes() * 60 + horaDate.getSeconds();

      const timeMatch = row.eje_time.match(/^(\d{2}):(\d{2}):(\d{2})/);
      if (!timeMatch) return { value: null, color: '' };
      const [, hours, minutes, seconds] = timeMatch.map(Number);
      const ejeTimeInSeconds = hours * 3600 + minutes * 60 + seconds;
      
      const estiTimeInSeconds = row.esti_time * 60;

      const diffSeconds = estiTimeInSeconds - (ejeTimeInSeconds - horaInSeconds);
      
      const absDiff = Math.abs(diffSeconds);
      const displayHours = Math.floor(absDiff / 3600);
      const displayMinutes = Math.floor((absDiff % 3600) / 60);
      const displaySeconds = absDiff % 60;

      const formattedDiff = [
        String(displayHours).padStart(2, '0'),
        String(displayMinutes).padStart(2, '0'),
        String(displaySeconds).padStart(2, '0')
      ].join(':');

      return {
        value: formattedDiff,
        color: diffSeconds >= 0 ? 'text-green-500' : 'text-red-500'
      };

    } catch (e) {
      return { value: null, color: '' };
    }
  };

  const formatSecondsToHHMMSS = (totalSeconds: number) => {
      const absSeconds = Math.abs(totalSeconds);
      const hours = Math.floor(absSeconds / 3600);
      const minutes = Math.floor((absSeconds % 3600) / 60);
      const seconds = Math.floor(absSeconds % 60);
      return [
        String(hours).padStart(2, '0'),
        String(minutes).padStart(2, '0'),
        String(seconds).padStart(2, '0')
      ].join(':');
  }

  return (
    <div className="w-full">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="min-w-full text-sm divide-y divide-border">
          <thead className="bg-card">
            <tr className="divide-x divide-border">
                <th className="px-4 py-3 font-medium text-left text-muted-foreground">Codigo</th>
                {pageType === 'seguimiento' && (
                  <th className="px-4 py-3 font-medium text-left text-muted-foreground">Status</th>
                )}
                {pageType === 'seguimiento' && (
                  <th className="px-4 py-3 font-medium text-center text-muted-foreground">Entregable</th>
                )}
                <th className="px-4 py-3 font-medium text-left text-muted-foreground">Fecha</th>
                <th className="px-4 py-3 font-medium text-left text-muted-foreground">Hora</th>
                <th className="px-4 py-3 font-medium text-left text-muted-foreground">Encargado</th>
                <th className="px-4 py-3 font-medium text-left text-muted-foreground">Producto</th>
                <th className="px-4 py-3 font-medium text-left text-muted-foreground">Cantidad</th>
                <th className="px-4 py-3 font-medium text-left text-muted-foreground">Tiempo Estimado</th>
                <th className="px-4 py-3 font-medium text-left text-muted-foreground">Tiempo Ejecutado</th>
                <th className="px-4 py-3 font-medium text-left text-muted-foreground">Diferencia</th>
                <th className="px-4 py-3 font-medium text-left text-muted-foreground">Empresa</th>
                {pageType === 'seguimiento' && !filterByEncargado && (
                  <>
                    <th className="px-4 py-3 font-medium text-center text-muted-foreground">Acciones</th>
                    <th className="px-4 py-3 font-medium text-center text-muted-foreground">Reasignar</th>
                  </>
                )}
                {pageType === 'reportes' && (
                  <th className="px-4 py-3 font-medium text-left text-muted-foreground">Motivo del Reporte</th>
                )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((row) => {
              const diff = calculateDifference(row);
              return (
              <tr 
                key={row.id} 
                onClick={() => onRowClick && onRowClick(row.name)} 
                className={`group transition-colors ${onRowClick ? 'hover:bg-primary/5 cursor-pointer' : ''}`}
              >
                  <td className="px-4 py-3 text-foreground font-mono">{row.code}</td>
                  {pageType === 'seguimiento' && (
                    <td className="px-4 py-3">{getStatusBadge(row)}</td>
                  )}
                  {pageType === 'seguimiento' && (
                    <td className="px-4 py-3 text-center">
                      {row.status?.trim().toUpperCase() === 'CALIFICADO' && (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      )}
                      {row.status?.trim().toUpperCase() === 'ENTREGADO' && (
                        <Check className="w-5 h-5 text-blue-500 mx-auto" />
                      )}
                    </td>
                  )}
                  <td className="px-4 py-3 text-foreground">{formatDate(row.date)}</td>
                  <td className="px-4 py-3 text-foreground">{formatTime(row.date)}</td>
                  <td className={`px-4 py-3 font-medium ${row.rea_details && row.rea_details !== 'Sin reasignar' ? 'text-yellow-400' : 'text-foreground'}`}>{row.name}</td>
                  <td className="px-4 py-3 text-foreground">{row.product}</td>
                  <td className="px-4 py-3 text-center text-foreground">{row.quantity}</td>
                  <td className="px-4 py-3 text-center text-foreground">{row.esti_time}</td>
                  <td className="px-4 py-3">{formatExecutionTime(row.eje_time)}</td>
                  <td className={`px-4 py-3 font-bold ${diff.color}`}>{diff.value}</td>
                  <td className="px-4 py-3 text-foreground">{row.organization}</td>
                  {pageType === 'seguimiento' && !filterByEncargado && (
                      <>
                        <td className="px-4 py-3 text-center">
                          <button 
                            onClick={(e) => openReportModal(row, e)}
                            disabled={row.status?.trim().toUpperCase() === 'REPORTADO'}
                            title={row.status?.trim().toUpperCase() === 'REPORTADO' ? 'Este registro ya ha sido reportado' : 'Reportar incidencia'}
                            className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1 text-xs font-medium rounded-md bg-destructive/10 text-red-400 hover:bg-destructive/20 disabled:opacity-50 disabled:cursor-not-allowed border border-destructive/20"
                          >
                            {row.status?.trim().toUpperCase() === 'REPORTADO' ? 'Reportado' : 'Reportar'}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={(e) => handleReassignClick(e, row)}
                            title="Reasignar este registro"
                            className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 mx-auto px-3 py-1 text-xs font-medium rounded-md bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed border border-primary/20"
                          >
                            <RefreshCw className="w-3 h-3"/>
                          </button>
                        </td>
                      </>
                  )}
                  {pageType === 'reportes' && (
                    <td className="px-4 py-3 text-foreground">{row.details}</td>
                  )}
              </tr>
            )})}
          </tbody>
        </table>
      </div>
      
      {showSummary && summary && (
        <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border">
          <h3 className="font-semibold text-lg text-foreground mb-4">Resumen de Actividad</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-primary/10 text-primary">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Paquetes</p>
                <p className="text-2xl font-bold text-foreground">{summary.totalPackages}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-primary/10 text-primary">
                  <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Promedio por Hora</p>
                <p className="text-2xl font-bold text-foreground">
                  {summary.avgPackagesPerHour !== null ? summary.avgPackagesPerHour : 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
                <div className={`p-3 rounded-full ${summary.totalDifferenceSeconds >= 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    {summary.totalDifferenceSeconds >= 0 ? <ThumbsUp className="w-6 h-6" /> : <ThumbsDown className="w-6 h-6" />}
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">
                        {summary.totalDifferenceSeconds >= 0 ? 'Tiempo de Eficiencia' : 'Tiempo Deficiente'}
                    </p>
                    <p className={`text-2xl font-bold ${summary.totalDifferenceSeconds >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {formatSecondsToHHMMSS(summary.totalDifferenceSeconds)}
                    </p>
                </div>
            </div>
          </div>
        </div>
      )}


      {pageType === 'seguimiento' && isModalOpen && reportingItem && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="w-full max-w-md p-6 space-y-4 bg-card border rounded-lg shadow-lg"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div className="p-3 mb-2 rounded-full bg-destructive/10 text-destructive">
                <AlertTriangle />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Levantar Reporte</h2>
              <p className="text-sm text-muted-foreground">
                ID del Registro: <span className="font-mono">{reportingItem.id}</span>
              </p>
            </div>

            <div className="p-3 text-sm text-center rounded-md bg-muted text-muted-foreground">
                Estás reportando el producto <strong>{reportingItem.product}</strong>
                {' '} de la empresa <strong>{reportingItem.organization}</strong>,
                {' '} asignado a <strong>{reportingItem.name}</strong>.
            </div>

            <div>
              <label htmlFor="report-details" className="block mb-2 text-sm font-medium text-foreground">
                Motivo del Reporte
              </label>
              <textarea
                id="report-details"
                rows={4}
                className="w-full p-2 text-sm border rounded-md resize-none bg-background border-border placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Describe el motivo del reporte aquí... (ej. paquete dañado, cantidad incorrecta, etc.)"
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
              />
            </div>
            
            <div className="flex justify-end gap-4">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveReport}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-md bg-destructive hover:bg-destructive/90"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Confirmar Reporte</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {isReassignModalOpen && reassigningItem && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          onClick={() => setIsReassignModalOpen(false)}
        >
          <div 
            className="w-full max-w-md p-6 space-y-4 bg-card border rounded-lg shadow-lg"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div className="p-3 mb-2 rounded-full bg-primary/10 text-primary">
                <RefreshCw />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Reasignar Registro</h2>
              <p className="text-sm text-muted-foreground">
                ID del Registro: <span className="font-mono">{reassigningItem.id}</span>
              </p>
            </div>

            <div className="p-3 text-sm text-center rounded-md bg-muted text-muted-foreground">
                Estás reasignando el producto <strong>{reassigningItem.product}</strong>
                {' '} actualmente asignado a <strong>{reassigningItem.name}</strong>.
            </div>

            <div>
              <label htmlFor="reassign-user" className="block mb-2 text-sm font-medium text-foreground">
                Reasignar a:
              </label>
              <select
                id="reassign-user"
                className="w-full p-2 text-sm border rounded-md bg-background border-border focus:outline-none focus:ring-2 focus:ring-ring"
                value={selectedReassignUser}
                onChange={(e) => setSelectedReassignUser(e.target.value)}
              >
                {reassignableUsers.length > 0 ? (
                  reassignableUsers.map(user => (
                    <option key={user} value={user}>{user}</option>
                  ))
                ) : (
                  <option disabled>No hay otros usuarios disponibles</option>
                )}
              </select>
            </div>

            <div>
              <label htmlFor="reassign-details" className="block mb-2 text-sm font-medium text-foreground">
                Motivo de la Reasignación
              </label>
              <textarea
                id="reassign-details"
                rows={3}
                className="w-full p-2 text-sm border rounded-md resize-none bg-background border-border placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Describe el motivo de la reasignación..."
                value={reassignDetails}
                onChange={(e) => setReassignDetails(e.target.value)}
              />
            </div>
            
            <div className="flex justify-end gap-4">
              <button 
                onClick={() => setIsReassignModalOpen(false)}
                className="px-4 py-2 text-sm font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveReassignment}
                disabled={reassignableUsers.length === 0 || !reassignDetails.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Confirmar Reasignación</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

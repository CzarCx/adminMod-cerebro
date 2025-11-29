
'use client'

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { AlertTriangle, Package, Clock, ThumbsUp, ThumbsDown, RefreshCw, Check, FileText } from 'lucide-react';

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
  date_cal: string | null;
  eje_time: string | null;
  sales_num: string | null;
}

interface FilterProps {
  dateFrom?: string;
  dateTo?: string;
  product?: string;
  name?: string;
  status?: string;
  organization?: string;
}

interface TablaProps {
  onRowClick?: (name: string) => void;
  pageType?: 'seguimiento' | 'reportes';
  filterByEncargado?: string | null;
  filterByToday?: boolean;
  showSummary?: boolean;
  filters?: FilterProps;
  isReportPage?: boolean;
  nameFilter?: string;
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
  filters = {},
  isReportPage = false,
  nameFilter = '',
}: TablaProps) {
  const [data, setData] = useState<Paquete[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reportingItem, setReportingItem] = useState<Paquete | null>(null);
  const [reportDetails, setReportDetails] = useState('');
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [reassignableUsers, setReassignableUsers] = useState<string[]>([]);
  const [selectedReassignUser, setSelectedReassignUser] = useState('');
  const [reassignDetails, setReassignDetails] = useState('');
  const [isReportDetailModalOpen, setIsReportDetailModalOpen] = useState(false);
  const [selectedReportItem, setSelectedReportItem] = useState<Paquete | null>(null);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);


  const fetchData = async () => {
    let query = supabase.from('personal').select('*, date_cal, sales_num');
    
    if (pageType === 'reportes' || isReportPage) {
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
    
    if (nameFilter) {
      query = query.ilike('name', `%${nameFilter}%`);
    }

    // Apply advanced filters
    if (filters.dateFrom) query = query.gte('date', new Date(filters.dateFrom).toISOString());
    if (filters.dateTo) {
      const dateTo = new Date(filters.dateTo);
      dateTo.setHours(23, 59, 59, 999); // Include the whole day
      query = query.lte('date', dateTo.toISOString());
    }
    if (filters.product) query = query.eq('product', filters.product);
    if (filters.name) query = query.eq('name', filters.name);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.organization) query = query.eq('organization', filters.organization);


    const { data: fetchedData, error } = await query.order('date', { ascending: false });

    if (error) {
      console.error('Error fetching data:', error.message);
      setData([]);
    } else {
      setData(fetchedData as Paquete[]);
      if (showSummary) {
        calculateSummary(fetchedData as Paquete[]);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, [pageType, filterByEncargado, filterByToday, showSummary, filters, nameFilter, isReportPage]);

  useEffect(() => {
    // The subscription is only for the "today" view which doesn't use advanced filters and has no name filter
    if (pageType === 'seguimiento' && !Object.values(filters).some(Boolean) && !nameFilter) {
      const channel = supabase
        .channel('personal-db-changes-seguimiento-hoy')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'personal' },
          (payload) => {
            fetchData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [pageType, filters, nameFilter]);

  const handleSelectRow = (id: number) => {
    setSelectedRows(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedRows.length === data.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(data.map(row => row.id));
    }
  };


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
        if (!row.date_cal || !row.date || row.esti_time == null) {
            return acc;
        }
        try {
            const horaDate = new Date(row.date);
            const horaInSeconds = horaDate.getHours() * 3600 + horaDate.getMinutes() * 60 + horaDate.getSeconds();
            
            const dateCal = new Date(row.date_cal);
            const ejeTimeInSeconds = dateCal.getHours() * 3600 + dateCal.getMinutes() * 60 + dateCal.getSeconds();
            
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

  const handleReassignClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (selectedRows.length === 0) return;

    setReassignDetails('');

    const { data: users, error } = await supabase
      .from('personal_name')
      .select('name');

    if (error) {
      console.error('Error fetching users:', error.message);
      alert('Error: No se pudo obtener la lista de encargados.');
      setReassignableUsers([]);
    } else {
      // It's possible to reassign to the same user, so no filtering needed.
      const userNames = users.map(user => user.name);
      setReassignableUsers(userNames);
      if (userNames.length > 0) {
        setSelectedReassignUser(userNames[0]);
      }
    }
    setIsReassignModalOpen(true);
  };

  const handleSaveReassignment = async () => {
    if (selectedRows.length === 0 || !selectedReassignUser) {
      alert('Debes seleccionar registros y un nuevo encargado para la reasignación.');
      return;
    }
    
    const finalReassignDetails = reassignDetails.trim()
      ? `Reasignado masivamente. Motivo: ${reassignDetails}`
      : 'Reasignado masivamente.';

    const { error } = await supabase
      .from('personal')
      .update({ name: selectedReassignUser, rea_details: finalReassignDetails })
      .in('id', selectedRows);

    if (error) {
      console.error('Error reassigning items:', error.message);
      alert('Error: No se pudieron reasignar los registros.');
    } else {
      // Update data locally to reflect the change
      setData(currentData => currentData.map(item =>
        selectedRows.includes(item.id) ? { ...item, name: selectedReassignUser, rea_details: finalReassignDetails } : item
      ));
      setSelectedRows([]);
      setIsReassignModalOpen(false);
    }
  };
  
  const openReportDetailModal = (item: Paquete) => {
    setSelectedReportItem(item);
    setIsReportDetailModalOpen(true);
  };


  const getStatusBadge = (item: Paquete) => {
    const isReportedByDetails = item.details && item.details.trim() !== '';
    const isReportedByStatus = item.status?.trim().toUpperCase() === 'REPORTADO';

    if (isReportedByDetails || isReportedByStatus) {
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-destructive/10 text-red-400 border border-destructive/20">REPORTADO</span>;
    }
    
    const s = item.status?.trim().toUpperCase() || 'PENDIENTE';
    switch (s) {
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
    if (!row.date_cal || !row.date || row.esti_time == null) {
      return { value: null, color: '' };
    }

    try {
      const horaDate = new Date(row.date);
      const horaInSeconds = horaDate.getHours() * 3600 + horaDate.getMinutes() * 60 + horaDate.getSeconds();
      
      const dateCal = new Date(row.date_cal);
      const ejeTimeInSeconds = dateCal.getHours() * 3600 + dateCal.getMinutes() * 60 + dateCal.getSeconds();

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
  
  const isReportTable = pageType === 'reportes' || isReportPage;

  return (
    <div className="w-full relative">
      <div className="overflow-x-auto rounded-lg border border-border no-scrollbar max-h-[600px]">
        <table className="min-w-full text-sm divide-y divide-border responsive-table">
          <thead className={isReportTable ? 'bg-destructive/10' : 'bg-primary/10'}>
            <tr className="divide-x divide-border">
                {pageType === 'seguimiento' && !filterByEncargado && (
                   <th className="px-4 py-3 font-medium text-center">
                     <input
                       type="checkbox"
                       onChange={handleSelectAll}
                       checked={data.length > 0 && selectedRows.length === data.length}
                       className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                     />
                   </th>
                )}
                <th className={`px-4 py-3 font-medium text-center ${isReportTable ? 'text-destructive' : 'text-primary'} hidden md:table-cell`}>Codigo</th>
                <th className={`px-4 py-3 font-medium text-center ${isReportTable ? 'text-destructive' : 'text-primary'}`}>Status</th>
                <th className={`px-4 py-3 font-medium text-center ${isReportTable ? 'text-destructive' : 'text-primary'} hidden md:table-cell`}>Entregable</th>
                <th className={`px-4 py-3 font-medium text-center ${isReportTable ? 'text-destructive' : 'text-primary'} hidden md:table-cell`}>Fecha</th>
                <th className={`px-4 py-3 font-medium text-center ${isReportTable ? 'text-destructive' : 'text-primary'} hidden md:table-cell`}>Hora</th>
                <th className={`px-4 py-3 font-medium text-center ${isReportTable ? 'text-destructive' : 'text-primary'} hidden md:table-cell`}>Número de venta</th>
                <th className={`px-4 py-3 font-medium text-center ${isReportTable ? 'text-destructive' : 'text-primary'}`}>Encargado</th>
                <th className={`px-4 py-3 font-medium text-center ${isReportTable ? 'text-destructive' : 'text-primary'}`}>Producto</th>
                <th className={`px-4 py-3 font-medium text-center ${isReportTable ? 'text-destructive' : 'text-primary'}`}>Cantidad</th>
                <th className={`px-4 py-3 font-medium text-center ${isReportTable ? 'text-destructive' : 'text-primary'} hidden md:table-cell`}>Tiempo Estimado</th>
                <th className={`px-4 py-3 font-medium text-center ${isReportTable ? 'text-destructive' : 'text-primary'} hidden md:table-cell`}>Tiempo Ejecutado</th>
                <th className={`px-4 py-3 font-medium text-center ${isReportTable ? 'text-destructive' : 'text-primary'} hidden md:table-cell`}>Diferencia</th>
                <th className={`px-4 py-3 font-medium text-center ${isReportTable ? 'text-destructive' : 'text-primary'} hidden md:table-cell`}>Empresa</th>
                {pageType === 'seguimiento' && !filterByEncargado && (
                  <>
                    <th className={`px-4 py-3 font-medium text-center ${isReportTable ? 'text-destructive' : 'text-primary'}`}>Acciones</th>
                  </>
                )}
                {pageType === 'reportes' && (
                  <th className={`px-4 py-3 font-medium text-center ${isReportTable ? 'text-destructive' : 'text-primary'} hidden md:table-cell`}>Motivo del Reporte</th>
                )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.length > 0 ? data.map((row) => {
              const diff = calculateDifference(row);
              const isReported = !!(row.status?.trim().toUpperCase() === 'REPORTADO' || (row.details && row.details.trim() !== ''));
              return (
              <tr 
                key={row.id} 
                onClick={() => {
                    if (pageType === 'seguimiento' && !filterByEncargado) {
                      handleSelectRow(row.id);
                    } else if (isReportPage) {
                      openReportDetailModal(row);
                    } else if (onRowClick) {
                      onRowClick(row.name);
                    }
                  }}
                  className={`group transition-colors ${onRowClick || isReportPage || (pageType === 'seguimiento' && !filterByEncargado) ? 'cursor-pointer' : ''} ${selectedRows.includes(row.id) ? 'bg-primary/10' : ''} ${isReportTable ? 'hover:bg-destructive/5' : 'hover:bg-primary/5'}`}
              >
                  {pageType === 'seguimiento' && !filterByEncargado && (
                     <td className="px-4 py-3 text-center">
                       <input
                         type="checkbox"
                         checked={selectedRows.includes(row.id)}
                         onChange={(e) => {
                           e.stopPropagation();
                           handleSelectRow(row.id);
                         }}
                         className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                       />
                     </td>
                  )}
                  <td data-label="Codigo" className="px-4 py-3 text-center text-foreground font-mono hidden md:table-cell">{row.code}</td>
                  <td data-label="Status" className="px-4 py-3 text-center">{getStatusBadge(row)}</td>
                  <td data-label="Entregable" className="px-4 py-3 text-center hidden md:table-cell">
                      {row.status?.trim().toUpperCase() === 'CALIFICADO' && (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      )}
                      {row.status?.trim().toUpperCase() === 'ENTREGADO' && (
                        <Check className="w-5 h-5 text-blue-500 mx-auto" />
                      )}
                    </td>
                  <td data-label="Fecha" className="px-4 py-3 text-center text-foreground hidden md:table-cell">{formatDate(row.date)}</td>
                  <td data-label="Hora" className="px-4 py-3 text-center text-foreground hidden md:table-cell">{formatTime(row.date)}</td>
                  <td data-label="Número de venta" className="px-4 py-3 text-center text-muted-foreground hidden md:table-cell">{row.sales_num || '-'}</td>
                  <td data-label="Encargado" className={`px-4 py-3 text-center ${row.rea_details && row.rea_details !== 'Sin reasignar' ? 'text-yellow-400' : 'text-foreground'} font-medium`}>{row.name}</td>
                  <td data-label="Producto" className="px-4 py-3 text-center text-foreground">{row.product}</td>
                  <td data-label="Cantidad" className="px-4 py-3 text-center font-bold text-foreground">{row.quantity}</td>
                  <td data-label="Tiempo Estimado" className="px-4 py-3 text-center text-foreground hidden md:table-cell">{row.esti_time}</td>
                  <td data-label="Tiempo Ejecutado" className="px-4 py-3 text-center hidden md:table-cell">{formatTime(row.date_cal)}</td>
                  <td data-label="Diferencia" className={`px-4 py-3 font-bold text-center hidden md:table-cell ${diff.color}`}>{diff.value}</td>
                  <td data-label="Empresa" className="px-4 py-3 text-center text-foreground hidden md:table-cell">{row.organization}</td>
                  
                  {pageType === 'seguimiento' && !filterByEncargado && (
                      <>
                        <td data-label="Acciones" className="px-4 py-3 text-center">
                          <button 
                            onClick={(e) => openReportModal(row, e)}
                            disabled={isReported}
                            title={isReported ? 'Este registro ya ha sido reportado' : 'Reportar incidencia'}
                            className="opacity-100 transition-opacity px-3 py-1 text-xs font-medium rounded-md bg-destructive/10 text-red-400 hover:bg-destructive/20 disabled:opacity-50 disabled:cursor-not-allowed border border-destructive/20"
                          >
                            {isReported ? 'Reportado' : 'Reportar'}
                          </button>
                        </td>
                      </>
                  )}
                  {isReportPage && (
                    <td data-label="Motivo del Reporte" className="px-4 py-3 text-center text-foreground hidden md:table-cell">{row.details}</td>
                  )}
              </tr>
            )}) : (
              <tr>
                <td colSpan={15} className="text-center py-12 text-muted-foreground">
                  {Object.values(filters).some(Boolean) || nameFilter ? 'No se encontraron registros que coincidan con los filtros aplicados.' : 'No hay registros para mostrar.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {pageType === 'seguimiento' && !filterByEncargado && selectedRows.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-20">
          <button
            onClick={handleReassignClick}
            className="flex items-center gap-3 px-6 py-3 text-base font-bold rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-transform hover:scale-105"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Reasignar ({selectedRows.length})</span>
          </button>
        </div>
      )}

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

      {isReassignModalOpen && (
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
              <h2 className="text-xl font-semibold text-foreground">Reasignar Registros</h2>
               <p className="text-sm text-muted-foreground">
                 {selectedRows.length} registro(s) seleccionado(s)
               </p>
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
                  <option disabled>No hay usuarios disponibles</option>
                )}
              </select>
            </div>

            <div>
              <label htmlFor="reassign-details" className="block mb-2 text-sm font-medium text-foreground">
                Motivo de la Reasignación (Opcional)
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
              <button onClick={() => setIsReassignModalOpen(false)}
                className="px-4 py-2 text-sm font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveReassignment}
                disabled={reassignableUsers.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Confirmar Reasignación</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {isReportDetailModalOpen && selectedReportItem && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          onClick={() => setIsReportDetailModalOpen(false)}
        >
          <div 
            className="w-full max-w-lg p-6 bg-card border rounded-lg shadow-lg"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-full bg-destructive/10 text-destructive">
                        <FileText />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-foreground">Detalles del Reporte</h2>
                        <p className="text-sm text-muted-foreground">ID del Registro: <span className="font-mono">{selectedReportItem.id}</span></p>
                    </div>
                </div>
                 <button onClick={() => setIsReportDetailModalOpen(false)} className="text-muted-foreground hover:text-foreground">&times;</button>
            </div>
            
            <div className="space-y-4">
              <div className="p-3 rounded-md bg-muted/50 border">
                <label className="text-xs font-semibold text-muted-foreground">Encargado</label>
                <p className="font-medium text-foreground">{selectedReportItem.name}</p>
              </div>
              <div className="p-3 rounded-md bg-muted/50 border">
                <label className="text-xs font-semibold text-muted-foreground">Producto</label>
                <p className="font-medium text-foreground">{selectedReportItem.product}</p>
              </div>
              <div className="p-3 rounded-md bg-muted/50 border">
                <label className="text-xs font-semibold text-muted-foreground">Fecha del Reporte</label>
                <p className="font-medium text-foreground">{formatDate(selectedReportItem.date)}</p>
              </div>
              <div className="p-4 rounded-md bg-destructive/10 border border-destructive/20">
                <label className="text-xs font-semibold text-destructive">Motivo del Reporte</label>
                <p className="font-medium text-foreground whitespace-pre-wrap">{selectedReportItem.details || 'No se especificó un motivo.'}</p>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button 
                onClick={() => setIsReportDetailModalOpen(false)}
                className="px-4 py-2 text-sm font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

    

    

    

    
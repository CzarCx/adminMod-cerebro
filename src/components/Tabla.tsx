
'use client'

import { useEffect, useState, useCallback, Fragment } from 'react';
import { supabase } from '../lib/supabase';
import { AlertTriangle, RefreshCw, X, Trash2, FileText } from 'lucide-react';
import CountdownTimer from './CountdownTimer';

interface Paquete {
  id: number;
  name: string;
  product: string;
  quantity: number;
  esti_time: number;
  organization: string;
  status: string | null;
  details: string | null;
  code: string;
  date: string | null;
  date_ini: string | null;
  date_esti: string | null;
  sales_num: string | null;
  report?: string | null;
  sku?: string;
}

interface FilterProps {
  dateFrom?: string;
  dateTo?: string;
  product?: string;
  name?: string;
  status?: string;
  organization?: string;
  code?: string;
}

export interface SummaryData {
  totalPackages: number;
  avgPackagesPerHour: number | null;
  latestFinishTime: string | null;
  latestFinishTimeDateObj: Date | null;
  totalEstiTime: number;
  totalRealTime: number;
}

interface TablaProps {
  onRowClick?: (name: string) => void;
  pageType?: 'seguimiento' | 'reportes';
  filterByEncargado?: string | null;
  filterByToday?: boolean;
  showSummary?: boolean; // Deprecated, but kept for compatibility
  onSummaryChange?: (summary: SummaryData | null) => void;
  filters?: FilterProps;
  isReportPage?: boolean;
  nameFilter?: string;
  showDeadTimeIndicator?: boolean;
}

const DEASSIGN_VALUE = '__DESASIGNAR__';

export default function Tabla({ 
  onRowClick, 
  pageType = 'seguimiento', 
  filterByEncargado = null,
  filterByToday = false,
  onSummaryChange,
  filters = {},
  isReportPage = false,
  nameFilter = '',
  showDeadTimeIndicator = false,
}: TablaProps) {
  const [data, setData] = useState<Paquete[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reportingItem, setReportingItem] = useState<Paquete | null>(null);
  const [reportDetails, setReportDetails] = useState('');
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [reassignableUsers, setReassignableUsers] = useState<string[]>([]);
  const [selectedReassignUser, setSelectedReassignUser] = useState('');
  const [reassignDetails, setReassignDetails] = useState('');
  const [isReportDetailModalOpen, setIsReportDetailModalOpen] = useState(false);
  const [selectedReportItem, setSelectedReportItem] = useState<Paquete | null>(null);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);


  const calculateSummary = useCallback((summaryData: Paquete[]) => {
    if (summaryData.length === 0) {
      if(onSummaryChange) onSummaryChange(null);
      return;
    }
  
    const totalPackages = summaryData.reduce((acc, item) => acc + item.quantity, 0);
  
    const latestFinishTimeObj = summaryData.reduce((latest: Date | null, row) => {
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
  
    const avgPackagesPerHour: number | null = null; // Calculation is not currently used

    const totalEstiTime = summaryData.reduce((acc, item) => acc + (item.esti_time || 0), 0);
    
    if (onSummaryChange) {
      onSummaryChange({
        totalPackages,
        avgPackagesPerHour,
        latestFinishTime: latestFinishTimeObj ? formatTime(latestFinishTimeObj.toISOString()) : null,
        latestFinishTimeDateObj: latestFinishTimeObj,
        totalEstiTime,
        totalRealTime: 0, // Placeholder
      });
    }
  }, [onSummaryChange]);


  const fetchData = useCallback(async () => {
    let query = supabase.from('personal').select('id, name, product, quantity, esti_time, organization, status, details, code, date, date_ini, date_esti, sales_num, report, sku');
    
    if (pageType === 'reportes' || isReportPage) {
      query = query.eq('report', 'REPORTADO');
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
    if (filters.code) query = query.eq('code', filters.code);


    const { data: fetchedData, error } = await query.order('date_esti', { ascending: true });

    if (error) {
      console.error('Error fetching data:', error.message);
      setData([]);
    } else {
      const paquetes = fetchedData as Paquete[];
      setData(paquetes);
      if (onSummaryChange) {
        calculateSummary(paquetes);
      }
    }
  }, [filterByEncargado, filterByToday, filters, isReportPage, nameFilter, pageType, onSummaryChange, calculateSummary]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    // The subscription is only for the "today" view which doesn't use advanced filters and has no name filter
    if (pageType === 'seguimiento' && !Object.values(filters).some(Boolean) && !nameFilter) {
      const channel = supabase
        .channel('db-changes-personal')
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
  }, [pageType, filters, nameFilter, fetchData]);

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


  const openReportModal = (item: Paquete, event: React.MouseEvent) => {
    event.stopPropagation();
    if (item.status === 'REPORTADO') return;
    setReportingItem(item);
    setReportDetails(item.details || '');
    setIsModalOpen(true);
  };

  const handleSaveReport = async () => {
    if (!reportingItem || !reportDetails.trim()) return;
    const { error } = await supabase
      .from('personal')
      .update({ status: 'REPORTADO', details: reportDetails, report: 'REPORTADO' })
      .eq('id', reportingItem.id);
    if (error) {
      console.error('Error saving report:', error.message);
      alert('Error: No se pudo guardar el reporte.');
    } else {
      setData(currentData => currentData.map(item =>
        item.id === reportingItem.id ? { ...item, status: 'REPORTADO', report: 'REPORTADO', details: reportDetails } : item
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
      .select('name')
      .eq('rol', 'operativo');

    if (error) {
      console.error('Error fetching users:', error.message);
      alert('Error: No se pudo obtener la lista de encargados.');
      setReassignableUsers([]);
    } else {
      const userNames = users.map(user => user.name);
      setReassignableUsers(userNames);
      if (userNames.length > 0) {
        setSelectedReassignUser(userNames[0]);
      } else {
        // If no users, default to de-assign, so the button logic works
        setSelectedReassignUser(DEASSIGN_VALUE);
      }
    }
    setIsReassignModalOpen(true);
  };

  const handleSaveReassignment = async () => {
    if (selectedRows.length === 0 || !selectedReassignUser) {
      alert('Debes seleccionar registros y una opción.');
      return;
    }
    
    const tableName = 'personal';

    // De-assign / Delete logic
    if (selectedReassignUser === DEASSIGN_VALUE) {
      const salesNumbersToDelete = data
        .filter(row => selectedRows.includes(row.id))
        .map(row => row.sales_num)
        .filter((salesNum): salesNum is string => salesNum !== null && salesNum !== '');

      if (salesNumbersToDelete.length === 0) {
        alert('Ninguno de los registros seleccionados tiene un Número de Venta para eliminar.');
        return;
      }

      const { error } = await supabase
        .from(tableName)
        .delete()
        .in('sales_num', salesNumbersToDelete);
      
      if (error) {
        console.error('Error deleting items:', error.message);
        alert('Error: No se pudieron eliminar los registros.');
      } else {
        setData(currentData => currentData.filter(item => !salesNumbersToDelete.includes(item.sales_num || '')));
      }
    } 
    // Re-assign logic
    else {
      const finalReassignDetails = reassignDetails.trim()
        ? `Reasignado masivamente. Motivo: ${reassignDetails}`
        : 'Reasignado masivamente.';

      const { error } = await supabase
        .from(tableName)
        .update({ name: selectedReassignUser, rea_details: finalReassignDetails })
        .in('id', selectedRows);

      if (error) {
        console.error('Error reassigning items:', error.message);
        alert('Error: No se pudieron reasignar los registros.');
      } else {
        // Update data locally to reflect the change
        setData(currentData => currentData.map(item =>
          selectedRows.includes(item.id) ? { ...item, name: selectedReassignUser } : item
        ));
      }
    }
    
    setSelectedRows([]);
    setIsReassignModalOpen(false);
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
    return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });
  };
  
  const getTargetDateForRow = (row: Paquete) => {
    if (!row.date_ini || !row.esti_time) return null;
    const startDate = new Date(row.date_ini);
    if (isNaN(startDate.getTime())) return null;
    const targetDate = new Date(startDate.getTime() + row.esti_time * 60000);
    targetDate.setSeconds(targetDate.getSeconds() + 30); // Add grace period
    return targetDate;
  };
  
  const isReportTable = pageType === 'reportes' || isReportPage;
  const isDeassignSelected = selectedReassignUser === DEASSIGN_VALUE;

  return (
    <div className="w-full relative">
      <div className="overflow-x-auto rounded-lg border border-border no-scrollbar max-h-[600px]">
        <table className="min-w-full text-sm divide-y divide-border responsive-table">
          <thead className={isReportTable ? 'bg-destructive/10' : 'bg-primary/10'}>
            <tr className="divide-x divide-border">
                <th className={`px-4 py-3 font-medium text-center ${isReportTable ? 'text-destructive' : 'text-primary'}`}>Tiempo Restante</th>
                {!filterByEncargado && (
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
                <th className={`px-4 py-3 font-medium text-center ${isReportTable ? 'text-destructive' : 'text-primary'} hidden md:table-cell`}>Fecha</th>
                <th className={`px-4 py-3 font-medium text-center ${isReportTable ? 'text-destructive' : 'text-primary'}`}>Hora de Inicio</th>
                <th className={`px-4 py-3 font-medium text-center ${isReportTable ? 'text-destructive' : 'text-primary'} hidden md:table-cell`}>Número de venta</th>
                <th className={`px-4 py-3 font-medium text-center ${isReportTable ? 'text-destructive' : 'text-primary'}`}>Encargado</th>
                <th className={`px-4 py-3 font-medium text-center ${isReportTable ? 'text-destructive' : 'text-primary'}`}>Producto</th>
                <th className={`px-4 py-3 font-medium text-center ${isReportTable ? 'text-destructive' : 'text-primary'}`}>Cantidad</th>
                <th className={`px-4 py-3 font-medium text-center ${isReportTable ? 'text-destructive' : 'text-primary'} hidden md:table-cell`}>Tiempo Estimado (min)</th>
                <th className={`px-4 py-3 font-medium text-center ${isReportTable ? 'text-destructive' : 'text-primary'}`}>Hora de Finalización (Estimada)</th>
                <th className={`px-4 py-3 font-medium text-center ${isReportTable ? 'text-destructive' : 'text-primary'} hidden md:table-cell`}>Empresa</th>
                {!filterByEncargado && (
                  <>
                    <th className={`px-4 py-3 font-medium text-center ${isReportTable ? 'text-destructive' : 'text-primary'}`}>Acciones</th>
                  </>
                )}
                {isReportPage && (
                  <th className={`px-4 py-3 font-medium text-center ${isReportTable ? 'text-destructive' : 'text-primary'} hidden md:table-cell`}>Motivo del Reporte</th>
                )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.length > 0 ? data.map((row, index) => {
              const isReported = !!(row.status?.trim().toUpperCase() === 'REPORTADO' || (row.details && row.details.trim() !== ''));

              let deadTimeSeparator = null;
              if (showDeadTimeIndicator && index < data.length - 1) {
                const currentRowFinishTime = row.date_esti ? new Date(row.date_esti).getTime() : 0;
                
                const nextRowStartValue = data[index + 1].date_ini;
                let nextRowStartTime = 0;
                if (nextRowStartValue) {
                  const nextRowStartDate = new Date(nextRowStartValue);
                  if (!isNaN(nextRowStartDate.getTime())) {
                    nextRowStartTime = nextRowStartDate.getTime();
                  }
                }
                
                if (currentRowFinishTime > 0 && nextRowStartTime > 0 && nextRowStartTime > currentRowFinishTime) {
                  deadTimeSeparator = (
                    <tr>
                      <td colSpan={14} className="p-0.5 bg-emerald-600"></td>
                    </tr>
                  );
                }
              }

              return (
              <Fragment key={row.id}>
                <tr 
                  onClick={(e) => {
                    if (onRowClick && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLButtonElement || (e.target as HTMLElement).closest('button'))) {
                      onRowClick(row.name);
                    } else if (isReportPage) {
                      openReportDetailModal(row);
                    }
                  }}
                  className={`group transition-colors ${onRowClick || isReportPage ? 'cursor-pointer' : ''} ${selectedRows.includes(row.id) ? 'bg-primary/10' : ''} ${isReportTable ? 'hover:bg-destructive/5' : 'hover:bg-primary/5'}`}
                >
                    <td data-label="Tiempo Restante" className="px-4 py-3 text-center font-bold font-mono">
                      <CountdownTimer targetDate={getTargetDateForRow(row)} />
                    </td>
                    {!filterByEncargado && (
                       <td className="px-4 py-3 text-center">
                         <input
                           type="checkbox"
                           checked={selectedRows.includes(row.id)}
                           onClick={(e) => e.stopPropagation()}
                           onChange={() => {
                             handleSelectRow(row.id);
                           }}
                           className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                         />
                       </td>
                    )}
                    <td data-label="Codigo" className="px-4 py-3 text-center text-foreground font-mono hidden md:table-cell">{row.code}</td>
                    <td data-label="Status" className="px-4 py-3 text-center">{getStatusBadge(row)}</td>
                    <td data-label="Fecha" className="px-4 py-3 text-center text-foreground hidden md:table-cell">{formatDate(row.date)}</td>
                    <td data-label="Hora de Inicio" className="px-4 py-3 text-center text-foreground">{formatTime(row.date_ini)}</td>
                    <td data-label="Número de venta" className="px-4 py-3 text-center text-muted-foreground hidden md:table-cell">{row.sales_num || '-'}</td>
                    <td data-label="Encargado" className={`px-4 py-3 text-center text-foreground font-medium`}>{row.name}</td>
                    <td data-label="Producto" className="px-4 py-3 text-center text-foreground">{row.product}</td>
                    <td data-label="Cantidad" className="px-4 py-3 text-center font-bold text-foreground">{row.quantity}</td>
                    <td data-label="Tiempo Estimado (min)" className="px-4 py-3 text-center text-foreground hidden md:table-cell">{row.esti_time} min</td>
                    <td data-label="Hora de Finalización (Estimada)" className="px-4 py-3 text-center font-semibold text-primary">{formatTime(row.date_esti)}</td>
                    <td data-label="Empresa" className="px-4 py-3 text-center text-foreground hidden md:table-cell">{row.organization}</td>
                    
                    {!filterByEncargado && (
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
                {deadTimeSeparator}
              </Fragment>
            )}) : (
              <tr>
                <td colSpan={13} className="text-center py-12 text-muted-foreground">
                  {Object.values(filters).some(Boolean) || nameFilter ? 'No se encontraron registros que coincidan con los filtros aplicados.' : 'No hay registros para mostrar.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {!filterByEncargado && selectedRows.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
          <button
            onClick={handleReassignClick}
            className="flex items-center gap-3 px-6 py-3 text-base font-bold rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-transform hover:scale-105"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Reasignar ({selectedRows.length})</span>
          </button>
          <button
            onClick={() => setSelectedRows([])}
            className="flex items-center justify-center p-3.5 rounded-full shadow-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-transform hover:scale-105"
            title="Deseleccionar todo"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {isModalOpen && reportingItem && (
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
                disabled={!reportDetails.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-md bg-destructive hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
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
                <option value={DEASSIGN_VALUE}>--- Desasignar (Eliminar) ---</option>
                {reassignableUsers.map(user => (
                  <option key={user} value={user}>{user}</option>
                ))}
              </select>
            </div>

            {!isDeassignSelected && (
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
            )}
            
            <div className="flex justify-end gap-4">
              <button onClick={() => setIsReassignModalOpen(false)}
                className="px-4 py-2 text-sm font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80"
              >
                Cancelar
              </button>
              
              {isDeassignSelected ? (
                <button 
                  onClick={handleSaveReassignment}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar Asignación</span>
                </button>
              ) : (
                <button 
                  onClick={handleSaveReassignment}
                  disabled={reassignableUsers.length === 0}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Confirmar Reasignación</span>
                </button>
              )}
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

'use client'

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

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
}

interface TablaProps {
  onRowClick?: (name: string) => void;
  pageType?: 'seguimiento' | 'reportes';
}

const AlertTriangle = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
    </svg>
);


export default function Tabla({ onRowClick = () => {}, pageType = 'seguimiento' }: TablaProps) {
  const [data, setData] = useState<Paquete[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reportingItem, setReportingItem] = useState<Paquete | null>(null);
  const [reportDetails, setReportDetails] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      let query = supabase.from('personal').select('*').order('id', { ascending: false });
      if (pageType === 'reportes') {
        query = query.eq('status', 'REPORTADO');
      }

      const { data, error } = await query;
      if (error) console.error('Error fetching data:', error);
      else setData(data as Paquete[]);
    };
    fetchData();

    if (pageType === 'seguimiento') {
        const channel = supabase
        .channel(`personal-db-changes-${pageType}`)
        .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'personal' },
            (payload) => {
                const updatedRecord = payload.new as Paquete;
                setData(currentData =>
                  currentData.map(item =>
                    item.id === updatedRecord.id ? updatedRecord : item
                  )
                );
            }
        )
        .subscribe();
        return () => {
            supabase.removeChannel(channel);
        };
    }
  }, [pageType]);

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
      console.error('Error saving report:', error);
      alert('Error: No se pudo guardar el reporte.');
    } else {
      setData(currentData => currentData.map(item =>
        item.id === reportingItem.id ? { ...item, status: 'REPORTADO', details: reportDetails } : item
      ));
      setIsModalOpen(false);
    }
  };

  const getStatusClass = (status: string | null) => {
    if (!status) return "bg-gray-100 text-gray-800";
    const cleanStatus = status.trim().toUpperCase();
    switch (cleanStatus) {
      case "ENTREGADO": case "COMPLETADO": return "bg-green-100 text-green-800";
      case "REVISADO": return "bg-teal-100 text-teal-800";
      case "POR REVISAR": return "bg-yellow-100 text-yellow-800";
      case "REPORTADO": return "bg-red-100 text-red-800 font-medium";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-transparent">
        <thead className="bg-transparent">
          <tr>
            {pageType === 'seguimiento' && (
              <>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Encargado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Empresa</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Acciones</th>
              </>
            )}
            {pageType === 'reportes' && (
              <>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Encargado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Cantidad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Empresa</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Motivo del Reporte</th>
              </>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map((row) => (
            <tr 
              key={row.id} 
              onClick={() => pageType === 'seguimiento' && onRowClick(row.name)} 
              className={pageType === 'seguimiento' ? "hover:bg-accent cursor-pointer transition-colors duration-150 group" : ""}
            >
              {pageType === 'seguimiento' && (
                <>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{row.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{row.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{row.product}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{row.organization}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(row.status)}`}>{row.status ? row.status.trim() : 'PENDIENTE'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button 
                      onClick={(e) => openReportModal(row, e)}
                      className={`text-white text-xs font-bold py-1 px-3 rounded-full transition-all duration-200 ${
                        row.status?.trim().toUpperCase() === 'REPORTADO'
                          ? 'bg-muted text-muted-foreground cursor-not-allowed'
                          : 'opacity-0 group-hover:opacity-100 bg-destructive/80 hover:bg-destructive'
                      }`}
                      disabled={row.status?.trim().toUpperCase() === 'REPORTADO'}
                      title={row.status?.trim().toUpperCase() === 'REPORTADO' ? 'Este registro ya ha sido reportado' : 'Reportar incidencia'}
                    >
                      {row.status?.trim().toUpperCase() === 'REPORTADO' ? 'Reportado' : 'Reportar'}
                    </button>
                  </td>
                </>
              )}
              {pageType === 'reportes' && (
                <>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{row.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{row.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{row.product}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{row.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{row.organization}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{row.details}</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {pageType === 'seguimiento' && isModalOpen && reportingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 transition-opacity duration-300" onClick={() => setIsModalOpen(false)}>
          <div className="bg-card p-8 rounded-2xl shadow-2xl w-full max-w-lg mx-4 border border-border" onClick={e => e.stopPropagation()}>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-full bg-red-500/10">
                <AlertTriangle />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-1 text-card-foreground">Levantar Reporte</h2>
                <p className="text-sm text-muted-foreground">
                  ID del Registro: <span className="font-semibold text-foreground">{reportingItem.id}</span>
                </p>
              </div>
            </div>

            <div className="mt-6 bg-accent p-4 rounded-lg border border-border text-sm">
                Estás reportando el producto <strong className="text-foreground">{reportingItem.product}</strong>
                {' '} de la empresa <strong className="text-foreground">{reportingItem.organization}</strong>,
                {' '} asignado a <strong className="text-foreground">{reportingItem.name}</strong>.
            </div>

            <div className="mt-6">
              <label htmlFor="report-details" className="block text-sm font-medium text-card-foreground mb-2">
                Motivo del Reporte
              </label>
              <textarea
                id="report-details"
                className="w-full bg-input border-border rounded-lg p-3 text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-destructive focus:border-destructive transition-shadow"
                rows={4}
                placeholder="Describe el motivo del reporte aquí... (ej. paquete dañado, cantidad incorrecta, etc.)"
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
              />
            </div>
            
            <div className="mt-8 flex justify-end space-x-3">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-accent font-semibold text-sm transition-colors">Cancelar</button>
              <button onClick={handleSaveReport} className="px-5 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 font-bold text-sm shadow-sm hover:shadow-md transition-all duration-200 flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
                <span>Confirmar Reporte</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

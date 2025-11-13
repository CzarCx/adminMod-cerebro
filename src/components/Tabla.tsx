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
  code: string;
  created_at: string;
}

interface TablaProps {
  onRowClick?: (name: string) => void;
  pageType?: 'seguimiento' | 'reportes';
}

const AlertTriangle = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      if (error) console.error('Error fetching data:', error.message);
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
      console.error('Error saving report:', error.message);
      alert('Error: No se pudo guardar el reporte.');
    } else {
      setData(currentData => currentData.map(item =>
        item.id === reportingItem.id ? { ...item, status: 'REPORTADO', details: reportDetails } : item
      ));
      setIsModalOpen(false);
    }
  };

  const getStatusBadge = (status: string | null) => {
    const s = status?.trim().toUpperCase() || 'PENDIENTE';
    switch (s) {
      case 'REPORTADO':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-destructive/20 text-destructive">{s}</span>;
      case 'REVISADO':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-500/20 text-green-500">{s}</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-500">{s}</span>;
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-border">
      <table className="min-w-full text-sm divide-y divide-border">
        <thead className="bg-card">
          <tr className="divide-x divide-border">
            {pageType === 'seguimiento' && (
              <>
                <th className="px-4 py-3 font-medium text-left text-muted-foreground">ID</th>
                <th className="px-4 py-3 font-medium text-left text-muted-foreground">Fecha</th>
                <th className="px-4 py-3 font-medium text-left text-muted-foreground">Encargado</th>
                <th className="px-4 py-3 font-medium text-left text-muted-foreground">Producto</th>
                <th className="px-4 py-3 font-medium text-left text-muted-foreground">Codigo</th>
                <th className="px-4 py-3 font-medium text-left text-muted-foreground">Empresa</th>
                <th className="px-4 py-3 font-medium text-left text-muted-foreground">Status</th>
                <th className="px-4 py-3 font-medium text-right text-muted-foreground">Acciones</th>
              </>
            )}
            {pageType === 'reportes' && (
              <>
                <th className="px-4 py-3 font-medium text-left text-muted-foreground">ID</th>
                <th className="px-4 py-3 font-medium text-left text-muted-foreground">Fecha</th>
                <th className="px-4 py-3 font-medium text-left text-muted-foreground">Encargado</th>
                <th className="px-4 py-3 font-medium text-left text-muted-foreground">Producto</th>
                <th className="px-4 py-3 font-medium text-left text-muted-foreground">Codigo</th>
                <th className="px-4 py-3 font-medium text-left text-muted-foreground">Cantidad</th>
                <th className="px-4 py-3 font-medium text-left text-muted-foreground">Empresa</th>
                <th className="px-4 py-3 font-medium text-left text-muted-foreground">Motivo del Reporte</th>
              </>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map((row) => (
            <tr 
              key={row.id} 
              onClick={() => pageType === 'seguimiento' && onRowClick(row.name)} 
              className={`group transition-colors ${pageType === 'seguimiento' ? 'hover:bg-primary/5 cursor-pointer' : ''}`}
            >
              {pageType === 'seguimiento' && (
                <>
                  <td className="px-4 py-3 text-muted-foreground">{row.id}</td>
                  <td className="px-4 py-3 text-foreground">{formatDate(row.created_at)}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{row.name}</td>
                  <td className="px-4 py-3 text-foreground">{row.product}</td>
                  <td className="px-4 py-3 text-foreground font-mono">{row.code}</td>
                  <td className="px-4 py-3 text-foreground">{row.organization}</td>
                  <td className="px-4 py-3">
                    {getStatusBadge(row.status)}
                  </td>
                  <td className="px-4 py-3 text-right">
                  <button 
                      onClick={(e) => openReportModal(row, e)}
                      disabled={row.status?.trim().toUpperCase() === 'REPORTADO'}
                      title={row.status?.trim().toUpperCase() === 'REPORTADO' ? 'Este registro ya ha sido reportado' : 'Reportar incidencia'}
                      className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1 text-xs font-medium rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {row.status?.trim().toUpperCase() === 'REPORTADO' ? 'Reportado' : 'Reportar'}
                    </button>
                  </td>
                </>
              )}
              {pageType === 'reportes' && (
                <>
                  <td className="px-4 py-3 text-muted-foreground">{row.id}</td>
                  <td className="px-4 py-3 text-foreground">{formatDate(row.created_at)}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{row.name}</td>
                  <td className="px-4 py-3 text-foreground">{row.product}</td>
                  <td className="px-4 py-3 text-foreground font-mono">{row.code}</td>
                  <td className="px-4 py-3 text-foreground">{row.quantity}</td>
                  <td className="px-4 py-3 text-foreground">{row.organization}</td>
                  <td className="px-4 py-3 text-foreground">{row.details}</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>

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
    </div>
  );
}

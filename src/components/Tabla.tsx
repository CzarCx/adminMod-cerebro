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

  return (
    <div>
      <table>
        <thead>
          <tr>
            {pageType === 'seguimiento' && (
              <>
                <th>ID</th>
                <th>Encargado</th>
                <th>Producto</th>
                <th>Empresa</th>
                <th>Status</th>
                <th>Acciones</th>
              </>
            )}
            {pageType === 'reportes' && (
              <>
                <th>ID</th>
                <th>Encargado</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Empresa</th>
                <th>Motivo del Reporte</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr 
              key={row.id} 
              onClick={() => pageType === 'seguimiento' && onRowClick(row.name)} 
            >
              {pageType === 'seguimiento' && (
                <>
                  <td>{row.id}</td>
                  <td>{row.name}</td>
                  <td>{row.product}</td>
                  <td>{row.organization}</td>
                  <td>
                    <span>{row.status ? row.status.trim() : 'PENDIENTE'}</span>
                  </td>
                  <td>
                    <button 
                      onClick={(e) => openReportModal(row, e)}
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
                  <td>{row.id}</td>
                  <td>{row.name}</td>
                  <td>{row.product}</td>
                  <td>{row.quantity}</td>
                  <td>{row.organization}</td>
                  <td>{row.details}</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {pageType === 'seguimiento' && isModalOpen && reportingItem && (
        <div onClick={() => setIsModalOpen(false)}>
          <div onClick={e => e.stopPropagation()}>
            <div>
              <div>
                <AlertTriangle />
              </div>
              <div>
                <h2>Levantar Reporte</h2>
                <p>
                  ID del Registro: <span>{reportingItem.id}</span>
                </p>
              </div>
            </div>

            <div>
                Estás reportando el producto <strong>{reportingItem.product}</strong>
                {' '} de la empresa <strong>{reportingItem.organization}</strong>,
                {' '} asignado a <strong>{reportingItem.name}</strong>.
            </div>

            <div>
              <label htmlFor="report-details">
                Motivo del Reporte
              </label>
              <textarea
                id="report-details"
                rows={4}
                placeholder="Describe el motivo del reporte aquí... (ej. paquete dañado, cantidad incorrecta, etc.)"
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
              />
            </div>
            
            <div>
              <button onClick={() => setIsModalOpen(false)}>Cancelar</button>
              <button onClick={handleSaveReport}>
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

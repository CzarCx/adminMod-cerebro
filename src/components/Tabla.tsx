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

// 1. AÑADIR PROP 'pageType' PARA REUTILIZAR LA TABLA
interface TablaProps {
  onRowClick?: (name: string) => void;
  pageType?: 'seguimiento' | 'reportes';
}

// Simple AlertTriangle icon for the modal
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
      // 2. MODIFICAR LA CONSULTA BASADO EN 'pageType'
      let query = supabase.from('personal').select('*');
      if (pageType === 'reportes') {
        query = query.eq('status', 'REPORTADO');
      }

      const { data, error } = await query;
      if (error) console.error('Error fetching data:', error);
      else setData(data as Paquete[]);
    };
    fetchData();

    // La suscripción en tiempo real es más crucial para la página de seguimiento principal
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
    if (!status) return "bg-gray-200 text-gray-800";
    const cleanStatus = status.trim().toUpperCase();
    switch (cleanStatus) {
      case "ENTREGADO": case "COMPLETADO": return "bg-green-100 text-green-800";
      case "REVISADO": return "bg-blue-100 text-blue-800";
      case "POR REVISAR": return "bg-yellow-100 text-yellow-800";
      case "REPORTADO": return "bg-red-200 text-red-800 font-bold";
      default: return "bg-gray-200 text-gray-800";
    }
  };

  // 3. RENDERIZADO CONDICIONAL DE LA TABLA
  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="min-w-full bg-white">
        <thead className="bg-[#f3f1e7]">
          <tr>
            {/* Columnas para la página de SEGUIMIENTO */}
            {pageType === 'seguimiento' && (
              <>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#1e3932] uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#1e3932] uppercase tracking-wider">Nombre Encargado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#1e3932] uppercase tracking-wider">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#1e3932] uppercase tracking-wider">Empresa</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#1e3932] uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#1e3932] uppercase tracking-wider">Acciones</th>
              </>
            )}
            {/* Columnas para la página de REPORTES */}
            {pageType === 'reportes' && (
              <>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#1e3932] uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#1e3932] uppercase tracking-wider">Nombre Encargado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#1e3932] uppercase tracking-wider">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#1e3932] uppercase tracking-wider">Cantidad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#1e3932] uppercase tracking-wider">Empresa</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#1e3932] uppercase tracking-wider">Motivo del Reporte</th>
              </>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 text-black">
          {data.map((row) => (
            <tr 
              key={row.id} 
              onClick={() => pageType === 'seguimiento' && onRowClick(row.name)} 
              className={pageType === 'seguimiento' ? "hover:bg-gray-100 cursor-pointer transition-colors duration-200 group" : ""}
            >
              {/* Celdas para la página de SEGUIMIENTO */}
              {pageType === 'seguimiento' && (
                <>
                  <td className="px-6 py-4 whitespace-nowrap">{row.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{row.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{row.product}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{row.organization}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(row.status)}`}>{row.status ? row.status.trim() : 'PENDIENTE'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button 
                      onClick={(e) => openReportModal(row, e)}
                      className={`text-white text-xs font-bold py-1 px-2 rounded-full transition-all duration-200 ${
                        row.status?.trim().toUpperCase() === 'REPORTADO'
                          ? 'visible bg-gray-400 cursor-not-allowed'
                          : 'invisible group-hover:visible bg-red-500 hover:bg-red-700'
                      }`}
                      disabled={row.status?.trim().toUpperCase() === 'REPORTADO'}
                    >
                      {row.status?.trim().toUpperCase() === 'REPORTADO' ? 'Reportado' : 'Reportar'}
                    </button>
                  </td>
                </>
              )}
              {/* Celdas para la página de REPORTES */}
              {pageType === 'reportes' && (
                <>
                  <td className="px-6 py-4 whitespace-nowrap">{row.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{row.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{row.product}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{row.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{row.organization}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium">{row.details}</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {/* El modal solo se muestra en la página de seguimiento */}
      {pageType === 'seguimiento' && isModalOpen && reportingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 transition-opacity duration-300" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-lg mx-4 transform transition-all duration-300 scale-95 animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-full bg-red-100">
                <AlertTriangle />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2 text-gray-900">Levantar Reporte</h2>
                <p className="text-sm text-gray-600">
                  ID del Registro: <span className="font-semibold text-gray-800">{reportingItem.id}</span>
                </p>
              </div>
            </div>

            <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-700">
                Estás reportando el producto <strong className="text-gray-900">{reportingItem.product}</strong>
                {' '} de la empresa <strong className="text-gray-900">{reportingItem.organization}</strong>,
                {' '} asignado a <strong className="text-gray-900">{reportingItem.name}</strong>.
              </p>
            </div>

            <div className="mt-6">
              <label htmlFor="report-details" className="block text-sm font-medium text-gray-700 mb-2">
                Motivo del Reporte
              </label>
              <textarea
                id="report-details"
                className="w-full border-gray-300 rounded-lg p-3 text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-shadow"
                rows={5}
                placeholder="Describe el motivo del reporte aquí... (ej. paquete dañado, cantidad incorrecta, etc.)"
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
              />
            </div>
            
            <div className="mt-8 flex justify-end space-x-4">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-semibold text-sm transition-colors">Cancelar</button>
              <button onClick={handleSaveReport} className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold text-sm shadow-md hover:shadow-lg transition-all duration-200 flex items-center space-x-2">
                <AlertTriangle />
                <span>Confirmar Reporte</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


'use client'

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface PaqueteProgramado {
  id: number;
  name: string;
  product: string;
  quantity: number;
  sku: string;
  status: string | null;
  code: string;
  date: string | null;
  sales_num: string | null;
  esti_time: number | null;
  organization: string | null;
}

interface TablaProgramadasProps {
  filterByEncargado: string;
}

export default function TablaProgramadas({ filterByEncargado }: TablaProgramadasProps) {
  const [data, setData] = useState<PaqueteProgramado[]>([]);

  const fetchData = async () => {
    let query = supabase.from('personal_prog').select('id, name, product, quantity, sku, status, code, date, sales_num, esti_time, organization');
    
    if (filterByEncargado) {
      query = query.eq('name', filterByEncargado);
    }

    const { data: fetchedData, error } = await query.order('name', { ascending: true });

    if (error) {
      console.error('Error fetching scheduled data:', error.message);
      setData([]);
    } else {
      setData(fetchedData as PaqueteProgramado[]);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterByEncargado]);

  
  const getStatusBadge = (item: PaqueteProgramado) => {
    const s = item.status?.trim().toUpperCase() || 'PROGRAMADO';
    switch (s) {
      case 'CALIFICADO':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-500/10 text-green-400 border border-green-500/20">{s}</span>;
      case 'ENTREGADO':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">{s}</span>;
      default: // ASIGNADO, PROGRAMADO, etc.
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">{s}</span>;
    }
  };
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) {
      return 'N/A';
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="w-full relative">
      <div className="overflow-x-auto rounded-lg border border-border no-scrollbar max-h-[600px]">
        <table className="min-w-full text-sm divide-y divide-border responsive-table">
          <thead className="bg-primary/10">
            <tr className="divide-x divide-border">
                <th className="px-4 py-3 font-medium text-center text-primary">Código</th>
                <th className="px-4 py-3 font-medium text-center text-primary">Producto</th>
                <th className="px-4 py-3 font-medium text-center text-primary">Cantidad</th>
                <th className="px-4 py-3 font-medium text-center text-primary hidden md:table-cell">SKU</th>
                <th className="px-4 py-3 font-medium text-center text-primary">Status</th>
                <th className="px-4 py-3 font-medium text-center text-primary hidden md:table-cell">Fecha de Programación</th>
                <th className="px-4 py-3 font-medium text-center text-primary hidden md:table-cell">Número de venta</th>
                <th className="px-4 py-3 font-medium text-center text-primary">Encargado</th>
                <th className="px-4 py-3 font-medium text-center text-primary hidden md:table-cell">Tiempo Estimado (min)</th>
                <th className="px-4 py-3 font-medium text-center text-primary hidden md:table-cell">Empresa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.length > 0 ? data.map((row) => (
              <tr 
                key={row.id} 
                className="group transition-colors hover:bg-primary/5"
              >
                  <td data-label="Código" className="px-4 py-3 text-center text-foreground font-mono">{row.code || '-'}</td>
                  <td data-label="Producto" className="px-4 py-3 text-center text-foreground">{row.product}</td>
                  <td data-label="Cantidad" className="px-4 py-3 text-center font-bold text-foreground">{row.quantity}</td>
                  <td data-label="SKU" className="px-4 py-3 text-center text-foreground hidden md:table-cell">{row.sku || '-'}</td>
                  <td data-label="Status" className="px-4 py-3 text-center">{getStatusBadge(row)}</td>
                  <td data-label="Fecha de Programación" className="px-4 py-3 text-center text-foreground hidden md:table-cell">{formatDate(row.date)}</td>
                  <td data-label="Número de venta" className="px-4 py-3 text-center text-muted-foreground hidden md:table-cell">{row.sales_num || '-'}</td>
                  <td data-label="Encargado" className="px-4 py-3 text-center text-foreground font-medium">{row.name}</td>
                  <td data-label="Tiempo Estimado (min)" className="px-4 py-3 text-center text-foreground hidden md:table-cell">{row.esti_time ? `${row.esti_time} min` : '-'}</td>
                  <td data-label="Empresa" className="px-4 py-3 text-center text-foreground hidden md:table-cell">{row.organization || '-'}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={10} className="text-center py-12 text-muted-foreground">
                  No se encontraron registros que coincidan con los filtros aplicados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

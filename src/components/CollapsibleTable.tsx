
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ChevronDown } from 'lucide-react';

interface RowData {
  code: string;
  product: string;
  sku: string;
  name: string;
  date: string | null;
  date_cal: string | null;
  date_entre: string | null;
}

interface CollapsibleTableProps {
  title: string;
  status: 'PENDIENTE' | 'CALIFICADO' | 'ENTREGADO';
}

export default function CollapsibleTable({ title, status }: CollapsibleTableProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<RowData[]>([]);
  const [count, setCount] = useState(0);

  const formatTime = (dateString: string | null) => {
    if (!dateString) {
      return '-';
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return '-';
    }
    return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  useEffect(() => {
    const fetchData = async () => {
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

      const { data: fetchedData, error, count: fetchedCount } = await supabase
        .from('personal')
        .select('code, product, sku, name, date, date_cal, date_entre', { count: 'exact' })
        .eq('status', status)
        .gte('date', todayStart)
        .lt('date', todayEnd);

      if (error) {
        console.error(`Error fetching data for status ${status}:`, error.message);
      } else {
        setData(fetchedData as RowData[]);
        setCount(fetchedCount || 0);
      }
    };

    fetchData();

    const channel = supabase
      .channel(`collapsible-table-${status}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'personal', filter: `status=eq.${status}` }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [status]);

  const getTimeForStatus = (row: RowData) => {
    switch (status) {
      case 'PENDIENTE':
        return formatTime(row.date);
      case 'CALIFICADO':
        return formatTime(row.date_cal);
      case 'ENTREGADO':
        return formatTime(row.date_entre);
      default:
        return '-';
    }
  };

  return (
    <div className="border rounded-lg bg-card">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left font-semibold text-lg text-foreground"
      >
        <div className="flex items-center gap-3">
          <span>{title}</span>
          <span className="px-2.5 py-0.5 text-sm font-bold rounded-full bg-primary/10 text-primary">{count}</span>
        </div>
        <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="p-4 pt-0">
          {data.length > 0 ? (
            <div className="overflow-x-auto rounded-md border">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 font-medium text-left text-muted-foreground">Código</th>
                    <th className="px-4 py-3 font-medium text-left text-muted-foreground">Hora</th>
                    <th className="px-4 py-3 font-medium text-left text-muted-foreground">Número de venta</th>
                    <th className="px-4 py-3 font-medium text-left text-muted-foreground">Nombre de producto</th>
                    <th className="px-4 py-3 font-medium text-left text-muted-foreground">SKU</th>
                    <th className="px-4 py-3 font-medium text-left text-muted-foreground">Nombre del encargado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.map((row, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-foreground font-mono">{row.code || '-'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{getTimeForStatus(row)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{/* Vacio */}</td>
                      <td className="px-4 py-3 text-foreground">{row.product || '-'}</td>
                      <td className="px-4 py-3 text-foreground">{row.sku || '-'}</td>
                      <td className="px-4 py-3 text-foreground font-medium">{row.name || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">No hay registros para mostrar.</p>
          )}
        </div>
      )}
    </div>
  );
}

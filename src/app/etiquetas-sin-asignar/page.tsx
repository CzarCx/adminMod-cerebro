'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { supabasePROD } from '@/lib/supabasePROD';
import { Loader2, Tag } from 'lucide-react';

interface UnassignedLabel {
  'NOMBRE DE PRODUCTO': string;
  'CANTIDAD': number;
  'SKU': string;
  'Código': string;
  'NUMERO DE VENTA': string;
  'EMPRESA': string;
}

export default function EtiquetasSinAsignarPage() {
  const [unassignedLabels, setUnassignedLabels] = useState<UnassignedLabel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUnassignedLabels = async () => {
      setIsLoading(true);
      setError(null);

      // 1. Fetch all codes from 'BASE DE DATOS ETIQUETAS IMPRESAS'
      const { data: printedLabels, error: printedLabelsError } = await supabasePROD
        .from('BASE DE DATOS ETIQUETAS IMPRESAS')
        .select('Código, "NOMBRE DE PRODUCTO", "CANTIDAD", "SKU", "NUMERO DE VENTA", "EMPRESA"');

      if (printedLabelsError) {
        console.error('Error fetching printed labels:', printedLabelsError.message);
        setError('No se pudieron cargar las etiquetas impresas.');
        setIsLoading(false);
        return;
      }

      const printedCodes = printedLabels.map(label => label.Código);

      // 2. Fetch all codes from 'personal'
      const { data: assignedCodes, error: assignedCodesError } = await supabase
        .from('personal')
        .select('code');

      if (assignedCodesError) {
        console.error('Error fetching assigned codes:', assignedCodesError.message);
        setError('No se pudieron cargar los códigos asignados.');
        setIsLoading(false);
        return;
      }
      
      const assignedCodeSet = new Set(assignedCodes.map(item => item.code));

      // 3. Filter for unassigned labels
      const unassigned = printedLabels.filter(label => !assignedCodeSet.has(label.Código));
      
      setUnassignedLabels(unassigned as UnassignedLabel[]);
      setIsLoading(false);
    };

    fetchUnassignedLabels();
  }, []);

  return (
    <main className="space-y-8">
      <header className="border-b pb-4 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Etiquetas Sin Asignar</h1>
        <p className="mt-2 text-muted-foreground">Etiquetas impresas que aún no han sido asignadas a ningún encargado.</p>
      </header>

      <div className="bg-card p-4 rounded-lg border">
        {isLoading ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground gap-3">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Cargando etiquetas...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">{error}</div>
        ) : (
          <div className="overflow-x-auto rounded-md border no-scrollbar max-h-[70vh]">
            <table className="min-w-full text-sm responsive-table">
              <thead className="bg-primary/10">
                <tr>
                  <th className="px-4 py-3 font-medium text-center text-primary">Producto</th>
                  <th className="px-4 py-3 font-medium text-center text-primary">Cantidad</th>
                  <th className="px-4 py-3 font-medium text-center text-primary">SKU</th>
                  <th className="px-4 py-3 font-medium text-center text-primary">Código</th>
                  <th className="px-4 py-3 font-medium text-center text-primary">Status</th>
                  <th className="px-4 py-3 font-medium text-center text-primary">Número de venta</th>
                  <th className="px-4 py-3 font-medium text-center text-primary">Empresa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {unassignedLabels.length > 0 ? (
                  unassignedLabels.map((row, index) => (
                    <tr key={index} className="hover:bg-muted/50 transition-colors">
                      <td data-label="Producto" className="px-4 py-3 text-center text-foreground">{row['NOMBRE DE PRODUCTO'] || '-'}</td>
                      <td data-label="Cantidad" className="px-4 py-3 text-center font-bold text-foreground">{row['CANTIDAD'] || '-'}</td>
                      <td data-label="SKU" className="px-4 py-3 text-center text-foreground">{row['SKU'] || '-'}</td>
                      <td data-label="Código" className="px-4 py-3 text-center text-foreground font-mono">{row['Código'] || '-'}</td>
                      <td data-label="Status" className="px-4 py-3 text-center">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-500/10 text-gray-400 border border-gray-500/20">SIN ASIGNAR</span>
                      </td>
                      <td data-label="Número de venta" className="px-4 py-3 text-center text-muted-foreground">{row['NUMERO DE VENTA'] || '-'}</td>
                      <td data-label="Empresa" className="px-4 py-3 text-center text-foreground">{row['EMPRESA'] || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center gap-3">
                        <Tag className="w-10 h-10" />
                        <span>¡Excelente! No se encontraron etiquetas sin asignar.</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

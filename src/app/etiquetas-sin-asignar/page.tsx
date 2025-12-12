
'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { supabasePROD } from '@/lib/supabasePROD';
import { Loader2, Tag, ChevronDown, Building, Filter, X } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';


interface UnassignedLabel {
  'Producto': string;
  'Cantidad': number;
  'SKU': string;
  'Código': string;
  'Venta': string;
  'EMPRESA': string;
}

interface Breakdown {
  [company: string]: number;
}

export default function EtiquetasSinAsignarPage() {
  const [unassignedLabels, setUnassignedLabels] = useState<UnassignedLabel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);
  const [breakdownData, setBreakdownData] = useState<Breakdown>({});
  const [filters, setFilters] = useState({ empresa: '', cantidad: '', code: '' });

  const [uniqueEmpresas, setUniqueEmpresas] = useState<string[]>([]);
  const [uniqueCantidades, setUniqueCantidades] = useState<number[]>([]);

  const debouncedFilters = useDebounce(filters, 300);

  useEffect(() => {
    const fetchUnassignedLabels = async () => {
      setIsLoading(true);
      setError(null);

      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString().split('T')[0];
      const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString().split('T')[0];
      
      const { data: printedLabels, error: printedLabelsError } = await supabasePROD
        .from('BASE DE DATOS ETIQUETAS IMPRESAS')
        .select('"Producto", "Cantidad", "SKU", "Código", "Venta", "EMPRESA"')
        .gte('"FECHA DE ENTREGA A COLECTA"', todayStart)
        .lt('"FECHA DE ENTREGA A COLECTA"', todayEnd);


      if (printedLabelsError) {
        console.error('Error fetching printed labels for today:', printedLabelsError.message);
        setError('No se pudieron cargar las etiquetas impresas para hoy.');
        setIsLoading(false);
        return;
      }

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

      const unassigned = printedLabels.filter(label => !assignedCodeSet.has(label['Código']));
      
      setUnassignedLabels(unassigned as UnassignedLabel[]);

      const breakdown = unassigned.reduce((acc, label) => {
        const company = label['EMPRESA'] || 'Sin Empresa';
        if (!acc[company]) {
          acc[company] = 0;
        }
        acc[company]++;
        return acc;
      }, {} as Breakdown);
      setBreakdownData(breakdown);

      // Extract unique values for filters
      const empresas = [...new Set(unassigned.map(label => label['EMPRESA']).filter(Boolean))].sort();
      const cantidades = [...new Set(unassigned.map(label => label['Cantidad']))].sort((a, b) => a - b);
      setUniqueEmpresas(empresas);
      setUniqueCantidades(cantidades);


      setIsLoading(false);
    };

    fetchUnassignedLabels();
  }, []);
  
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const clearFilters = () => {
    setFilters({ empresa: '', cantidad: '', code: '' });
  };

  const filteredLabels = useMemo(() => {
    return unassignedLabels.filter(label => {
      const empresaMatch = debouncedFilters.empresa
        ? label['EMPRESA'] === debouncedFilters.empresa
        : true;
      const cantidadMatch = debouncedFilters.cantidad
        ? label['Cantidad'] === parseInt(debouncedFilters.cantidad, 10)
        : true;
      const codeMatch = debouncedFilters.code
        ? label['Código'] && String(label['Código']).toLowerCase().includes(debouncedFilters.code.toLowerCase())
        : true;
      return empresaMatch && cantidadMatch && codeMatch;
    });
  }, [unassignedLabels, debouncedFilters]);
  
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <main className="space-y-8">
      <header className="border-b pb-4 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Etiquetas Sin Asignar (Hoy)</h1>
        <p className="mt-2 text-muted-foreground">Etiquetas con fecha de entrega de hoy que aún no han sido asignadas.</p>
      </header>

      <div className="bg-card p-6 rounded-2xl border shadow-sm">
        <button
            onClick={() => setIsBreakdownOpen(!isBreakdownOpen)}
            className="w-full flex justify-between items-center text-left transition-colors rounded-lg p-4 hover:bg-muted/50"
            disabled={isLoading || unassignedLabels.length === 0}
        >
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${isLoading ? 'bg-muted' : 'bg-primary/10 text-primary'}`}>
                    {isLoading ? <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /> : <Tag className="w-8 h-8" />}
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-foreground">Total de Etiquetas Sin Asignar</h2>
                    <p className="text-3xl font-extrabold text-primary">{isLoading ? '...' : unassignedLabels.length}</p>
                </div>
            </div>
            {unassignedLabels.length > 0 && !isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-sm font-medium">Desglose</span>
                  <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isBreakdownOpen ? 'rotate-180' : ''}`} />
              </div>
            )}
        </button>
        
        <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isBreakdownOpen ? 'max-h-[1000px] opacity-100 pt-4' : 'max-h-0 opacity-0'}`}>
            <div className="border-t pt-4">
                <h3 className="font-semibold mb-3 text-foreground px-4">Desglose por Empresa</h3>
                <ul className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                    {Object.entries(breakdownData).sort(([, a], [, b]) => b - a).map(([company, count]) => (
                        <li key={company} className="flex items-center justify-between p-3 mx-2 rounded-md transition-colors hover:bg-muted/80">
                            <div className="flex items-center gap-3">
                                <Building className="w-5 h-5 text-muted-foreground" />
                                <span className="font-medium text-foreground">{company}</span>
                            </div>
                            <span className="font-bold text-lg text-primary">{count}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="bg-card p-4 rounded-lg border shadow-sm">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                <div className="flex items-center gap-3">
                    <Filter className="w-5 h-5 text-primary"/>
                    <h2 className="text-lg font-semibold text-foreground">Filtros</h2>
                    {activeFilterCount > 0 && (
                        <span className="px-2.5 py-0.5 text-sm font-bold rounded-full bg-primary/10 text-primary">
                            {activeFilterCount} Activo{activeFilterCount > 1 ? 's' : ''}
                        </span>
                    )}
                </div>
                {activeFilterCount > 0 && (
                     <button 
                        onClick={clearFilters}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                     >
                        <X className="w-3 h-3"/>
                        <span>Limpiar</span>
                    </button>
                )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <select
                    name="empresa"
                    value={filters.empresa}
                    onChange={handleFilterChange}
                    className="w-full p-2 text-sm border rounded-md bg-background border-border focus:outline-none focus:ring-2 focus:ring-ring"
                >
                    <option value="">Todas las empresas</option>
                    {uniqueEmpresas.map(empresa => (
                        <option key={empresa} value={empresa}>{empresa}</option>
                    ))}
                </select>
                <select
                    name="cantidad"
                    value={filters.cantidad}
                    onChange={handleFilterChange}
                    className="w-full p-2 text-sm border rounded-md bg-background border-border focus:outline-none focus:ring-2 focus:ring-ring"
                >
                    <option value="">Todas las cantidades</option>
                    {uniqueCantidades.map(cantidad => (
                        <option key={cantidad} value={cantidad}>{cantidad}</option>
                    ))}
                </select>
                 <input
                    type="text"
                    name="code"
                    placeholder="Buscar por código..."
                    value={filters.code}
                    onChange={handleFilterChange}
                    className="w-full p-2 text-sm border rounded-md bg-background border-border focus:outline-none focus:ring-2 focus:ring-ring"
                />
            </div>
        </div>

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
                    {filteredLabels.length > 0 ? (
                    filteredLabels.map((row, index) => (
                        <tr key={index} className="hover:bg-muted/50 transition-colors">
                        <td data-label="Producto" className="px-4 py-3 text-center text-foreground">{row['Producto'] || '-'}</td>
                        <td data-label="Cantidad" className="px-4 py-3 text-center font-bold text-foreground">{row['Cantidad'] || '-'}</td>
                        <td data-label="SKU" className="px-4 py-3 text-center text-foreground">{row['SKU'] || '-'}</td>
                        <td data-label="Código" className="px-4 py-3 text-center text-foreground font-mono">{row['Código'] || '-'}</td>
                        <td data-label="Status" className="px-4 py-3 text-center">
                            <span className="whitespace-nowrap px-2 py-1 text-xs font-semibold rounded-full bg-gray-500/10 text-gray-400 border border-gray-500/20">SIN ASIGNAR</span>
                        </td>
                        <td data-label="Número de venta" className="px-4 py-3 text-center text-muted-foreground">{row['Venta'] || '-'}</td>
                        <td data-label="Empresa" className="px-4 py-3 text-center text-foreground">{row['EMPRESA'] || '-'}</td>
                        </tr>
                    ))
                    ) : (
                    <tr>
                        <td colSpan={7} className="text-center py-12 text-muted-foreground">
                        <div className="flex flex-col items-center gap-3">
                            <Tag className="w-10 h-10" />
                            {unassignedLabels.length > 0 && filteredLabels.length === 0 ? (
                                <span>No se encontraron resultados para los filtros aplicados.</span>
                            ) : (
                                <span>¡Excelente! No se encontraron etiquetas sin asignar para hoy.</span>
                            )}
                        </div>
                        </td>
                    </tr>
                    )}
                </tbody>
                </table>
            </div>
            )}
        </div>
      </div>
    </main>
  );
}

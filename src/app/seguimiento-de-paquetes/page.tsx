
'use client';

import { useState, useEffect } from 'react';
import Tabla from '../../components/Tabla';
import EncargadoChart from '../../components/EncargadoChart';
import HistoricoPaquetesChart from '../../components/HistoricoPaquetesChart';
import { UserCheck, Search, X } from 'lucide-react';
import ProductosEntregadosChart from '../../components/ProductosEntregadosChart';
import { supabase } from '@/lib/supabase';

export default function SeguimientoDePaquetesPage() {
  const [selectedEncargado, setSelectedEncargado] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [codeFilter, setCodeFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchCodeTerm, setSearchCodeTerm] = useState('');
  const [encargados, setEncargados] = useState<string[]>([]);

  useEffect(() => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    setCurrentDate(today.toLocaleDateString('es-MX', options));

    const fetchEncargados = async () => {
      const { data, error } = await supabase
        .from('personal')
        .select('name');
      
      if (error) {
        console.error('Error fetching encargados:', error.message);
      } else if (data) {
        const uniqueNames = [...new Set(data.map(item => item.name))].sort();
        setEncargados(uniqueNames);
      }
    };
    fetchEncargados();

  }, []);

  const handleRowClick = (encargadoName: string) => {
    setSelectedEncargado(prev => (prev === encargadoName ? null : encargadoName));
  };

  const handleSearch = () => {
    setSearchTerm(nameFilter);
    setSearchCodeTerm(codeFilter);
  };

  const handleClearSearch = () => {
    setNameFilter('');
    setCodeFilter('');
    setSearchTerm('');
    setSearchCodeTerm('');
  };

  return (
    <div className="space-y-8">
      <header className="border-b pb-4 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Seguimiento de Paquetes - Hoy</h1>
        <p className="mt-2 text-muted-foreground">{currentDate}</p>
        <p className="mt-1 text-sm text-muted-foreground">Esta página muestra solo los registros del día de hoy. Haz clic en una fila para ver los detalles del encargado.</p>
      </header>
      
      <div className="bg-card p-4 rounded-lg border">
        <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
          <h2 className="text-xl font-semibold text-foreground">Registros de Hoy</h2>
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <div className="relative flex-grow min-w-[150px]">
              <select
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                className="w-full pl-3 pr-4 py-2 text-sm border rounded-md bg-background border-border focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
              >
                <option value="">Filtrar por encargado...</option>
                {encargados.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            <div className="relative flex-grow min-w-[150px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
               <input
                type="text"
                placeholder="Filtrar por código..."
                value={codeFilter}
                onChange={(e) => setCodeFilter(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                className="w-full pl-10 pr-4 py-2 text-sm border rounded-md bg-background border-border focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Buscar
            </button>
            <button
              onClick={handleClearSearch}
              disabled={!nameFilter && !searchTerm && !codeFilter && !searchCodeTerm}
              className="p-2 text-sm font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50"
              title="Limpiar búsqueda"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <Tabla onRowClick={handleRowClick} pageType="seguimiento" filterByToday={true} nameFilter={searchTerm} codeFilter={searchCodeTerm} />
      </div>
      
      {selectedEncargado && (
        <div className="bg-card p-6 rounded-lg border animate-in fade-in-50">
          <div className="flex items-center gap-3 mb-4">
            <UserCheck className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Registros de Hoy para: {selectedEncargado}</h2>
          </div>
          <div className="space-y-8">
            <Tabla 
              pageType="seguimiento" 
              filterByEncargado={selectedEncargado} 
              filterByToday={true}
              showSummary={true} 
            />
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="bg-muted/30 p-4 rounded-lg">
                <EncargadoChart encargadoName={selectedEncargado} groupBy="product" />
              </div>
              <div className="bg-muted/30 p-4 rounded-lg">
                <EncargadoChart encargadoName={selectedEncargado} groupBy="organization" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8 mt-8">
        {!selectedEncargado && (
          <div className="bg-card p-6 rounded-lg border">
            <ProductosEntregadosChart />
          </div>
        )}

        <div className={`bg-card p-6 rounded-lg border transition-all duration-300 ${selectedEncargado ? 'lg:col-span-2' : 'lg:col-span-1'}`}>
          <HistoricoPaquetesChart />
        </div>
      </div>
    </div>
  );
}


'use client';

import { useState, useEffect } from 'react';
import Tabla from '../../components/Tabla';
import { supabase } from '@/lib/supabase';
import { Filter, X } from 'lucide-react';

export default function RegistrosHistoricosPage() {
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    product: '',
    name: '',
    status: '',
    organization: '',
    code: '',
  });

  const [products, setProducts] = useState<string[]>([]);
  const [encargados, setEncargados] = useState<string[]>([]);
  const [organizations, setOrganizations] = useState<string[]>([]);
  const statuses = ['ASIGNADO', 'CALIFICADO', 'ENTREGADO', 'REPORTADO', 'REVISADO'];

  useEffect(() => {
    const fetchFilterData = async () => {
      // Fetch unique products
      const { data: productsData, error: productsError } = await supabase
        .from('personal')
        .select('product');
      if (productsData) {
        setProducts([...new Set(productsData.map(item => item.product))].sort());
      }

      // Fetch unique names
      const { data: namesData, error: namesError } = await supabase
        .from('personal_name')
        .select('name');
      if (namesData) {
        setEncargados([...new Set(namesData.map(item => item.name))].sort());
      }
      
      // Fetch unique organizations
      const { data: orgsData, error: orgsError } = await supabase
        .from('personal')
        .select('organization');
      if (orgsData) {
        setOrganizations([...new Set(orgsData.map(item => item.organization))].sort());
      }

       if (productsError || namesError || orgsError) {
        console.error('Error fetching filter data:', productsError || namesError || orgsError);
      }
    };
    fetchFilterData();
  }, []);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };
  
  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      product: '',
      name: '',
      status: '',
      organization: '',
      code: '',
    });
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <main className="space-y-8">
      <header className="border-b pb-4 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Registros Históricos</h1>
        <p className="mt-2 text-muted-foreground">Aquí se listan todos los registros históricos de paquetes. Usa los filtros para refinar tu búsqueda.</p>
      </header>
      
      <div className="bg-card p-6 rounded-2xl border shadow-sm space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Filter className="w-6 h-6 text-primary"/>
            <h2 className="text-xl font-semibold text-foreground">Filtros de Búsqueda</h2>
             {activeFilterCount > 0 && (
              <span className="px-2.5 py-0.5 text-sm font-bold rounded-full bg-primary/10 text-primary">
                {activeFilterCount} Activo{activeFilterCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <button 
            onClick={clearFilters}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50"
            disabled={activeFilterCount === 0}
          >
            <X className="w-4 h-4"/>
            <span>Limpiar Filtros</span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Date Filters */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Rango de Fechas</label>
            <div className="flex gap-2">
              <input type="date" name="dateFrom" value={filters.dateFrom} onChange={handleFilterChange} className="w-full p-2 text-sm border rounded-md bg-background border-border focus:outline-none focus:ring-2 focus:ring-ring" />
              <input type="date" name="dateTo" value={filters.dateTo} onChange={handleFilterChange} className="w-full p-2 text-sm border rounded-md bg-background border-border focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          
          {/* Code Filter */}
          <div className="space-y-2">
            <label htmlFor="code-filter" className="text-sm font-medium text-muted-foreground">Código</label>
            <input type="text" id="code-filter" name="code" value={filters.code} onChange={handleFilterChange} className="w-full p-2 text-sm border rounded-md bg-background border-border focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Buscar por código..."/>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <label htmlFor="status-filter" className="text-sm font-medium text-muted-foreground">Status</label>
            <select id="status-filter" name="status" value={filters.status} onChange={handleFilterChange} className="w-full p-2 text-sm border rounded-md bg-background border-border focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">Todos</option>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Encargado Filter */}
          <div className="space-y-2">
            <label htmlFor="name-filter" className="text-sm font-medium text-muted-foreground">Encargado</label>
            <select id="name-filter" name="name" value={filters.name} onChange={handleFilterChange} className="w-full p-2 text-sm border rounded-md bg-background border-border focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">Todos</option>
              {encargados.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>

          {/* Product Filter */}
          <div className="space-y-2">
            <label htmlFor="product-filter" className="text-sm font-medium text-muted-foreground">Producto</label>
            <select id="product-filter" name="product" value={filters.product} onChange={handleFilterChange} className="w-full p-2 text-sm border rounded-md bg-background border-border focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">Todos</option>
              {products.map(product => <option key={product} value={product}>{product}</option>)}
            </select>
          </div>
          
          {/* Organization Filter */}
          <div className="space-y-2">
            <label htmlFor="organization-filter" className="text-sm font-medium text-muted-foreground">Empresa</label>
            <select id="organization-filter" name="organization" value={filters.organization} onChange={handleFilterChange} className="w-full p-2 text-sm border rounded-md bg-background border-border focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">Todos</option>
              {organizations.map(org => <option key={org} value={org}>{org}</option>)}
            </select>
          </div>
        </div>
      </div>
      
      <div className="bg-card p-4 rounded-lg border">
        <Tabla filters={filters} />
      </div>
    </main>
  );
}

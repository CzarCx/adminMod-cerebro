
'use client';

import { useState, useEffect } from 'react';
import { Activity, X, Loader2 } from 'lucide-react';
import ProgressBar from './ProgressBar';
import { supabase } from '@/lib/supabase';
import { supabasePROD } from '@/lib/supabasePROD';

export default function FloatingProgressButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [entregadas, setEntregadas] = useState(0);
  const [collectLabelsCount, setCollectLabelsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

    // Fetch Entregadas, excluding extra activities
    const { count: entregadasCount, error: entregadasError } = await supabase
      .from('personal')
      .select('status', { count: 'exact', head: true })
      .eq('status', 'ENTREGADO')
      .gte('date', todayStart)
      .lt('date', todayEnd)
      .not('code', 'eq', 999); // Exclude extra activities

    if (!entregadasError) {
      setEntregadas(entregadasCount || 0);
    } else {
        setEntregadas(0);
    }

    // Fetch Collect Labels
    const { count: collectCount, error: collectError } = await supabasePROD
      .from('etiquetas_i')
      .select('deli_date', { count: 'exact', head: true })
      .gte('deli_date', todayStart.split('T')[0])
      .lt('deli_date', todayEnd.split('T')[0]);

    if (!collectError) {
      setCollectLabelsCount(collectCount || 0);
    } else {
        setCollectLabelsCount(0);
    }
    
    setIsLoading(false);
  };
  
  useEffect(() => {
    fetchData(); // Initial fetch
    const intervalId = setInterval(fetchData, 60000); // Refresh every 60 seconds
    return () => clearInterval(intervalId);
  }, []);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <button
        onClick={toggleOpen}
        className="fixed bottom-6 right-6 z-40 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110 active:scale-100"
        aria-label="Mostrar progreso de entregas"
      >
        <Activity className="h-8 w-8" />
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-full max-w-md">
          <div className="relative animate-in fade-in-5 slide-in-from-bottom-5 duration-300">
            <div className="rounded-2xl border bg-card p-6 shadow-2xl">
              <button
                onClick={toggleOpen}
                className="absolute top-3 right-3 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted"
                aria-label="Cerrar progreso"
              >
                <X className="h-5 w-5" />
              </button>
              
              {isLoading ? (
                <div className="flex h-24 items-center justify-center gap-3 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>Cargando...</span>
                </div>
              ) : collectLabelsCount > 0 ? (
                <ProgressBar value={entregadas} total={collectLabelsCount} />
              ) : (
                <div className="flex h-24 items-center justify-center text-center text-muted-foreground">
                  <span>No hay etiquetas de colecta programadas para hoy.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

    
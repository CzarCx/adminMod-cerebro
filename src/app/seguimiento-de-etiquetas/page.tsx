

'use client';

import { useState, useEffect } from 'react';
import { Tags, CheckSquare, Truck, Barcode, Factory, Boxes, ClipboardList, Printer, CheckCircle2, AlertCircle, CalendarCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { supabasePROD } from '@/lib/supabasePROD';
import CollapsibleTable from '../../components/CollapsibleTable';
import ProgressBar from '@/components/ProgressBar';


const StatCard = ({ title, value, icon, delay }: { title: string; value: string | number; icon: React.ReactNode, delay: string }) => (
  <div className={`bg-card p-6 rounded-2xl border border-border flex items-center gap-6 shadow-sm animate-in fade-in slide-in-from-bottom-10 duration-500 ${delay} transition-all hover:shadow-lg hover:-translate-y-1`}>
    <div className="p-4 rounded-full bg-primary/10 text-primary">
      {icon}
    </div>
    <div>
      <h3 className="text-muted-foreground text-base font-medium">{title}</h3>
      <p className="text-3xl font-bold text-foreground">{value}</p>
    </div>
  </div>
);

const BreakdownItem = ({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) => (
  <li className="flex items-center justify-between p-4 bg-muted/50 rounded-lg transition-colors hover:bg-muted">
    <div className="flex items-center gap-4">
      <div className="text-muted-foreground">{icon}</div>
      <span className="font-medium text-foreground">{title}</span>
    </div>
    <span className="font-bold text-lg text-primary">{value}</span>
  </li>
);

type ConnectionStatus = 'pending' | 'success' | 'error';

export default function SeguimientoEtiquetasPage() {
  const [currentDate, setCurrentDate] = useState('');
  const [stats, setStats] = useState({
    asignadas: 0,
    calificadas: 0,
    entregadas: 0,
  });
  const [printedLabelsCount, setPrintedLabelsCount] = useState(0);
  const [collectLabelsCount, setCollectLabelsCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('pending');


  useEffect(() => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    setCurrentDate(today.toLocaleDateString('es-MX', options));
    
    const fetchStats = async () => {
        const testDate = new Date();
        const todayStart = new Date(testDate.getFullYear(), testDate.getMonth(), testDate.getDate()).toISOString();
        const todayEnd = new Date(testDate.getFullYear(), testDate.getMonth(), testDate.getDate() + 1).toISOString();

      const { data, error } = await supabase
        .from('personal')
        .select('status')
        .gte('date', todayStart)
        .lt('date', todayEnd);

      if (error) {
        console.error("Error fetching stats:", error.message);
        return;
      }
      
      if(data) {
        const calificadas = data.filter(item => item.status?.trim().toUpperCase() === 'CALIFICADO').length;
        const entregadas = data.filter(item => item.status?.trim().toUpperCase() === 'ENTREGADO').length;
        const asignadas = data.filter(item => item.status?.trim().toUpperCase() === 'ASIGNADO').length;

        setStats({ asignadas, calificadas, entregadas });
      }
    };
    
    const fetchPrintedLabels = async () => {
      setConnectionStatus('pending');
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString().split('T')[0];
      const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString().split('T')[0];

      // Fetch Printed Labels Count
      const { count: printedCount, error: printedError } = await supabasePROD
        .from('BASE DE DATOS ETIQUETAS IMPRESAS')
        .select('"FECHA DE IMPRESIÓN"', { count: 'exact', head: true })
        .gte('"FECHA DE IMPRESIÓN"', todayStart)
        .lt('"FECHA DE IMPRESIÓN"', todayEnd);

      if (printedError) {
        console.error('Error fetching printed labels count:', printedError.message);
        setPrintedLabelsCount(0);
        setConnectionStatus('error');
      } else {
        setPrintedLabelsCount(printedCount || 0);
        setConnectionStatus('success');
      }
      
      // Fetch Collect Labels Count
      const { count: collectCount, error: collectError } = await supabasePROD
        .from('BASE DE DATOS ETIQUETAS IMPRESAS')
        .select('"FECHA DE ENTREGA A COLECTA"', { count: 'exact', head: true })
        .gte('"FECHA DE ENTREGA A COLECTA"', todayStart)
        .lt('"FECHA DE ENTREGA A COLECTA"', todayEnd);

      if (collectError) {
        console.error('Error fetching collect labels count:', collectError.message);
        setCollectLabelsCount(0);
        // If the first one succeeded, we don't want to show an error for the whole component
        if (printedError) setConnectionStatus('error');
      } else {
        setCollectLabelsCount(collectCount || 0);
      }
    };

    // Initial fetch
    fetchStats();
    fetchPrintedLabels();

    // Set up an interval to fetch data every 30 seconds
    const intervalId = setInterval(() => {
      fetchStats();
      fetchPrintedLabels();
    }, 30000); // 30000 milliseconds = 30 seconds

    // Clean up the interval when the component unmounts
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const dailyBreakdown = {
    impresas: printedLabelsCount,
    enBarra: printedLabelsCount > 0 ? printedLabelsCount - (stats.asignadas + stats.calificadas + stats.entregadas) : 0,
    enProduccion: stats.asignadas,
    enTarima: stats.calificadas,
    paquetesEntregados: stats.entregadas,
  };

  return (
    <main className="space-y-8">
      <header className="border-b pb-4 animate-in fade-in slide-in-from-top-10 duration-500 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Seguimiento de Etiquetas</h1>
        <p className="mt-2 text-muted-foreground">Aquí se muestra el estado general de las etiquetas en el sistema para el día de hoy.</p>
      </header>

      <div className="grid md:grid-cols-3 gap-6">
        <StatCard 
          title="Etiquetas Asignadas"
          value={stats.asignadas}
          icon={<Tags className="w-8 h-8" />}
          delay="delay-100"
        />
        <StatCard 
          title="Etiquetas Calificadas"
          value={stats.calificadas}
          icon={<CheckSquare className="w-8 h-8" />}
          delay="delay-200"
        />
        <StatCard 
          title="Etiquetas Entregadas"
          value={stats.entregadas}
          icon={<Truck className="w-8 h-8" />}
          delay="delay-300"
        />
      </div>

      
      <div className="space-y-4 mt-8 animate-in fade-in slide-in-from-bottom-10 duration-500 delay-400">
        <CollapsibleTable title="Productos Asignados" status="ASIGNADO" />
        <CollapsibleTable title="Productos Calificados" status="CALIFICADO" />
        <CollapsibleTable title="Productos Entregados" status="ENTREGADO" />
      </div>

      {collectLabelsCount > 0 && (
        <div className="bg-card p-6 rounded-2xl border mt-8 animate-in fade-in slide-in-from-bottom-10 duration-500 delay-450">
            <ProgressBar value={stats.entregadas} total={collectLabelsCount} />
        </div>
      )}
      
      <div className="bg-card p-6 rounded-2xl border mt-8 animate-in fade-in slide-in-from-bottom-10 duration-500 delay-500">
        <header className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Desglose de Hoy</h2>
              <p className="text-muted-foreground">{currentDate}</p>
            </div>
            {connectionStatus === 'pending' && (
              <div className="flex items-center gap-2 text-sm text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-full">
                <AlertCircle className="w-4 h-4" />
                <span>Conectando...</span>
              </div>
            )}
            {connectionStatus === 'success' && (
              <div className="flex items-center gap-2 text-sm font-semibold text-green-600 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                <CheckCircle2 className="w-4 h-4 animate-in zoom-in-125 duration-500" />
                <span>Conexión a tabla exitosa</span>
              </div>
            )}
            {connectionStatus === 'error' && (
              <div className="flex items-center gap-2 text-sm text-red-500 bg-red-500/10 px-3 py-1 rounded-full">
                <AlertCircle className="w-4 h-4" />
                <span>Error de conexión a tabla</span>
              </div>
            )}
          </div>
        </header>

        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-4 p-4 bg-primary/10 rounded-lg">
                    <Printer className="w-8 h-8 text-primary" />
                    <div>
                    <h3 className="text-lg font-bold text-primary">Etiquetas Impresas Hoy</h3>
                    <p className="text-3xl font-extrabold text-foreground">{dailyBreakdown.impresas}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-accent/50 rounded-lg border border-accent">
                    <CalendarCheck className="w-8 h-8 text-accent-foreground" />
                    <div>
                    <h3 className="text-lg font-bold text-accent-foreground">Etiquetas para Hoy</h3>
                    <p className="text-3xl font-extrabold text-foreground">{collectLabelsCount}</p>
                    </div>
                </div>
            </div>
          
          <ul className="space-y-3">
            <BreakdownItem title="En Barra" value={dailyBreakdown.enBarra} icon={<Barcode className="w-6 h-6" />} />
            <BreakdownItem title="En Producción" value={dailyBreakdown.enProduccion} icon={<Factory className="w-6 h-6" />} />
            <BreakdownItem title="En Tarima" value={dailyBreakdown.enTarima} icon={<Boxes className="w-6 h-6" />} />
            <BreakdownItem title="Paquetes Entregados" value={dailyBreakdown.paquetesEntregados} icon={<ClipboardList className="w-6 h-6" />} />
          </ul>
        </div>
      </div>
    </main>
  );
}

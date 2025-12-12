

'use client';

import { useState, useEffect } from 'react';
import { Tags, CheckSquare, Truck, Printer, CheckCircle2, AlertCircle, CalendarCheck, ChevronDown, Building, CalendarDays } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { supabasePROD } from '@/lib/supabasePROD';
import CollapsibleTable from '../../components/CollapsibleTable';
import BreakdownItemWithDetails from '@/components/BreakdownItemWithDetails';

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

type ConnectionStatus = 'pending' | 'success' | 'error';
type Breakdown = { [company: string]: number };
type SelectedDay = 'Hoy' | 'Mañana' | 'Pasado Mañana';

interface PrintedLabel {
  'EMPRESA': string;
  'Código': string;
}

interface PersonalData {
    code: string;
    status: string | null;
    organization: string;
}

export default function SeguimientoEtiquetasPage() {
  const [stats, setStats] = useState({
    asignadas: 0,
    calificadas: 0,
    entregadas: 0,
  });
  const [printedLabelsCount, setPrintedLabelsCount] = useState(0);
  const [collectLabelsCount, setCollectLabelsCount] = useState(0);
  const [collectLabelsBreakdown, setCollectLabelsBreakdown] = useState<Breakdown>({});
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('pending');
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<SelectedDay>('Hoy');
  const [desgloseDate, setDesgloseDate] = useState('');

  const [personalData, setPersonalData] = useState<PersonalData[]>([]);
  const [enProduccionCount, setEnProduccionCount] = useState(0);


  useEffect(() => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    setDesgloseDate(today.toLocaleDateString('es-MX', options));
    
    const fetchAllDataForBreakdown = async () => {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        
        // 2. Fetch all personal data for today
        const { data, error } = await supabase
        .from('personal')
        .select('code, status, organization')
        .gte('date', todayStart.toISOString())
        .lt('date', todayEnd.toISOString());

      if (error) {
        console.error("Error fetching stats:", error.message);
        setPersonalData([]);
        return;
      }
      
      if(data) {
        setPersonalData(data as PersonalData[]);
        const calificadas = data.filter(item => item.status?.trim().toUpperCase() === 'CALIFICADO').length;
        const entregadas = data.filter(item => item.status?.trim().toUpperCase() === 'ENTREGADO').length;
        const asignadas = data.filter(item => item.status?.trim().toUpperCase() === 'ASIGNADO').length;
        
        setEnProduccionCount(asignadas);
        setStats({ asignadas, calificadas, entregadas });
      }
    };
    
    fetchAllDataForBreakdown();
    const statsIntervalId = setInterval(fetchAllDataForBreakdown, 30000);

    return () => {
      clearInterval(statsIntervalId);
    };
  }, []);


  useEffect(() => {
    const fetchPrintedLabels = async () => {
      setConnectionStatus('pending');
      setIsLoading(true);

      const baseDate = new Date();
      let dayOffset = 0;
      if (selectedDay === 'Mañana') {
        dayOffset = 1;
      } else if (selectedDay === 'Pasado Mañana') {
        dayOffset = 2;
      }
      
      const targetDate = new Date(baseDate);
      targetDate.setDate(baseDate.getDate() + dayOffset);

      const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
      setDesgloseDate(targetDate.toLocaleDateString('es-MX', options));

      const dateStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).toISOString().split('T')[0];
      const dateEnd = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1).toISOString().split('T')[0];

      // Fetch Printed Labels Count (Only for the main 'Impresas' counter for the selected day)
      const { count: printedCount, error: printedError } = await supabasePROD
        .from('BASE DE DATOS ETIQUETAS IMPRESAS')
        .select('"FECHA DE IMPRESIÓN"', { count: 'exact', head: true })
        .gte('"FECHA DE IMPRESIÓN"', dateStart)
        .lt('"FECHA DE IMPRESIÓN"', dateEnd);

      let printedSuccess = false;
      if (printedError) {
        console.error(`Error fetching printed labels count for ${selectedDay}:`, printedError.message);
        setPrintedLabelsCount(0);
      } else {
        setPrintedLabelsCount(printedCount || 0);
        printedSuccess = true;
      }
      
      // Fetch Collect Labels data for breakdown
      const { data: collectData, error: collectError } = await supabasePROD
        .from('BASE DE DATOS ETIQUETAS IMPRESAS')
        .select('"EMPRESA"')
        .gte('"FECHA DE ENTREGA A COLECTA"', dateStart)
        .lt('"FECHA DE ENTREGA A COLECTA"', dateEnd);

      let collectSuccess = false;
      if (collectError) {
        console.error(`Error fetching collect labels data for ${selectedDay}:`, collectError.message);
        setCollectLabelsCount(0);
        setCollectLabelsBreakdown({});
      } else {
        setCollectLabelsCount(collectData.length);
        const breakdown = collectData.reduce((acc, label: { EMPRESA: string | null }) => {
          const company = label.EMPRESA || 'Sin Empresa';
          if (!acc[company]) {
            acc[company] = 0;
          }
          acc[company]++;
          return acc;
        }, {} as Breakdown);
        setCollectLabelsBreakdown(breakdown);
        collectSuccess = true;
      }

      if(printedSuccess && collectSuccess) {
          setConnectionStatus('success');
      } else {
          setConnectionStatus('error');
      }
      setIsLoading(false);
    };

    fetchPrintedLabels();
    const intervalId = setInterval(fetchPrintedLabels, 30000);
    return () => clearInterval(intervalId);
  }, [selectedDay]);

  const [isLoading, setIsLoading] = useState(true);
  
  const DayButton = ({ day }: { day: SelectedDay }) => (
    <button
      onClick={() => setSelectedDay(day)}
      className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-300 flex items-center gap-2 ${
        selectedDay === day
          ? 'bg-primary text-primary-foreground shadow-md'
          : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
      }`}
    >
      <CalendarDays className="w-4 h-4" />
      {day}
    </button>
  );

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

      <div className="bg-card p-6 rounded-2xl border mt-8 animate-in fade-in slide-in-from-bottom-10 duration-500 delay-500">
        <header className="mb-6">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex-grow">
              <h2 className="text-xl font-semibold text-foreground">Desglose de Colecta</h2>
              <p className="text-muted-foreground">{desgloseDate}</p>
            </div>
             <div className="flex items-center gap-2 p-1 rounded-full bg-muted/50">
                <DayButton day="Hoy" />
                <DayButton day="Mañana" />
                <DayButton day="Pasado Mañana" />
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

        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className={`p-4 rounded-lg flex items-center gap-4 ${selectedDay === 'Hoy' ? 'bg-primary/10' : 'bg-muted/50'}`}>
                    <Printer className={`w-8 h-8 ${selectedDay === 'Hoy' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div>
                        <h3 className={`text-lg font-bold ${selectedDay === 'Hoy' ? 'text-primary' : 'text-muted-foreground'}`}>Etiquetas Impresas {selectedDay}</h3>
                        <p className="text-3xl font-extrabold text-foreground">{isLoading ? '...' : printedLabelsCount}</p>
                    </div>
                </div>
                <div className="bg-card rounded-lg border">
                  <button onClick={() => setIsBreakdownOpen(!isBreakdownOpen)} className="w-full flex justify-between items-center text-left p-4" disabled={collectLabelsCount === 0 || isLoading}>
                      <div className="flex items-center gap-4">
                        <CalendarCheck className="w-8 h-8 text-foreground" />
                        <div>
                          <h3 className="text-lg font-bold text-foreground">Etiquetas para {selectedDay}</h3>
                           <p className="text-3xl font-extrabold text-foreground">{isLoading ? '...' : collectLabelsCount}</p>
                        </div>
                      </div>
                      {collectLabelsCount > 0 && !isLoading && (
                        <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${isBreakdownOpen ? 'rotate-180' : ''}`} />
                      )}
                  </button>
                  <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isBreakdownOpen ? 'max-h-[1000px] opacity-100 p-4 pt-0' : 'max-h-0 opacity-0'}`}>
                      <div className="border-t pt-4">
                          <ul className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                              {Object.entries(collectLabelsBreakdown).sort(([, a], [, b]) => b - a).map(([company, count]) => (
                                  <li key={company} className="flex items-center justify-between p-2 mx-2 rounded-md transition-colors hover:bg-muted/80">
                                      <div className="flex items-center gap-3">
                                          <Building className="w-4 h-4 text-muted-foreground" />
                                          <span className="font-medium text-sm text-foreground">{company}</span>
                                      </div>
                                      <span className="font-bold text-base text-primary">{count}</span>
                                  </li>
                              ))}
                          </ul>
                      </div>
                  </div>
                </div>
            </div>
          
            {selectedDay === 'Hoy' && (
              <div className="space-y-3 pt-4 border-t">
                  <BreakdownItemWithDetails 
                      title="En Barra" 
                      initialData={{ total: collectLabelsCount }}
                      subtractCount={enProduccionCount}
                      personalData={personalData}
                  />
                  <BreakdownItemWithDetails 
                      title="En Producción"
                      status="ASIGNADO"
                      personalData={personalData}
                  />
                  <BreakdownItemWithDetails
                      title="En Tarima"
                      status="CALIFICADO"
                      personalData={personalData}
                  />
                  <BreakdownItemWithDetails
                      title="Paquetes Entregados"
                      status="ENTREGADO"
                      personalData={personalData}
                  />
              </div>
            )}
        </div>
      </div>
    </main>
  );
}

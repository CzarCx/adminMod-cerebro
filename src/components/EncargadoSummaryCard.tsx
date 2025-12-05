
'use client';

import { Clock, CheckCircle2, AlertTriangle, Truck, Tags, Package } from 'lucide-react';
import CountdownTimer from './CountdownTimer';
import { useNotificationStore } from '@/lib/use-notification-store';
import type { SummaryData } from '@/app/tiempo-restante/page';

interface EncargadoSummaryCardProps {
  summary: SummaryData;
  onClick: () => void;
}

const StatusCount = ({ icon, value, label, colorClass }: { icon: React.ReactNode, value: number, label: string, colorClass: string }) => (
    <div className="flex items-center gap-2">
        {icon}
        <p className="text-sm text-muted-foreground">{label}:</p>
        <span className={`font-bold text-lg ${colorClass}`}>{value}</span>
    </div>
);


export default function EncargadoSummaryCard({ summary, onClick }: EncargadoSummaryCardProps) {
  const { addNotification } = useNotificationStore();

  const handleTimerFinish = () => {
    addNotification({
      id: `encargado-${summary.name}-${Date.now()}`,
      message: `${summary.name} ha terminado sus tareas.`,
    });
  };

  return (
    <div 
      onClick={onClick}
      className="p-4 bg-card rounded-2xl border shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer flex flex-col"
    >
      <h3 className="font-semibold text-lg text-foreground mb-4 truncate">
        <span className="text-primary">{summary.name}</span>
      </h3>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground">Se desocupa a las</p>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <p className="text-xl font-bold text-foreground">
              {summary.latestFinishTime || 'N/A'}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground">Tiempo Restante</p>
           <p className="text-xl font-bold text-foreground font-mono">
             <CountdownTimer 
                targetDate={summary.latestFinishTimeDateObj}
                onFinish={handleTimerFinish} 
              />
           </p>
        </div>
      </div>
      
      <div className="mt-auto space-y-3 pt-3 border-t">
        <div className="flex justify-between items-center bg-muted/50 p-2 rounded-lg">
            <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-muted-foreground"/>
                <p className="text-sm font-semibold text-foreground">Total de Paquetes</p>
            </div>
            <p className="text-2xl font-bold text-primary">{summary.totalPackages}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
           <StatusCount 
                icon={<Tags className="w-4 h-4 text-muted-foreground"/>}
                value={summary.counts.asignados}
                label="Asignados"
                colorClass="text-amber-500"
            />
            <StatusCount 
                icon={<CheckCircle2 className="w-4 h-4 text-muted-foreground"/>}
                value={summary.counts.calificados}
                label="Calificados"
                colorClass="text-green-500"
            />
            <StatusCount 
                icon={<Truck className="w-4 h-4 text-muted-foreground"/>}
                value={summary.counts.entregados}
                label="Entregados"
                colorClass="text-blue-500"
            />
            <StatusCount 
                icon={<AlertTriangle className="w-4 h-4 text-muted-foreground"/>}
                value={summary.counts.reportados}
                label="Reportados"
                colorClass="text-red-500"
            />
        </div>
      </div>
    </div>
  );
}

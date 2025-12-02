
'use client';

import { Package, Clock } from 'lucide-react';
import CountdownTimer from './CountdownTimer';
import { useNotificationStore } from '@/lib/use-notification-store';

interface SummaryData {
  name: string;
  totalPackages: number;
  latestFinishTime: string | null;
  latestFinishTimeDateObj: Date | null;
}

interface EncargadoSummaryCardProps {
  summary: SummaryData;
  onClick: () => void;
}

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
      className="p-4 bg-card rounded-2xl border shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
    >
      <h3 className="font-semibold text-lg text-foreground mb-4 truncate">
        <span className="text-primary">{summary.name}</span>
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
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
        <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground">Total de Paquetes</p>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            <p className="text-xl font-bold text-foreground">{summary.totalPackages}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

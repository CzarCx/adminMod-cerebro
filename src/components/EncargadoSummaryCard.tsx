
'use client';

import { useState } from 'react';
import { Clock, CheckCircle2, AlertTriangle, Truck, Tags, Package, ChevronDown, Calendar } from 'lucide-react';
import CountdownTimer from './CountdownTimer';
import { useNotificationStore } from '@/lib/use-notification-store';
import type { SummaryData } from '@/app/tiempo-restante/page';

interface EncargadoSummaryCardProps {
  summary: SummaryData;
  onClick: () => void;
}

const StatusCount = ({ icon, value, label, colorClass, isScheduled }: { icon: React.ReactNode, value: number, label: string, colorClass: string, isScheduled?: boolean }) => (
    <div className="flex items-center gap-2">
        {icon}
        <p className="text-sm text-muted-foreground">{label}:</p>
        <span className={`font-bold text-lg ${isScheduled ? 'text-muted-foreground' : colorClass}`}>{value}</span>
    </div>
);


export default function EncargadoSummaryCard({ summary, onClick }: EncargadoSummaryCardProps) {
  const { addNotification } = useNotificationStore();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleTimerFinish = () => {
    addNotification({
      id: `encargado-${summary.name}-${Date.now()}`,
      message: `${summary.name} ha terminado sus tareas.`,
    });
  };
  
  const cardClasses = `
    p-4 bg-card rounded-2xl border shadow-sm flex flex-col
    ${summary.isScheduled 
      ? 'transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer' 
      : 'transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer'}
  `;

  return (
    <div 
      onClick={onClick}
      className={cardClasses}
    >
        <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg text-foreground truncate">
                <span className={!summary.isScheduled ? 'text-primary' : 'text-muted-foreground'}>{summary.name}</span>
            </h3>
            {summary.isScheduled && (
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">
                    <Calendar className="w-3 h-3" />
                    <span>Programado</span>
                </div>
            )}
      </div>

      {!summary.isScheduled && (
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
      )}
      
      <div className={`mt-auto space-y-3 pt-3 ${!summary.isScheduled ? 'border-t' : ''}`}>
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent the card's onClick from firing
            setIsDetailsOpen(!isDetailsOpen);
          }}
          className="toggle-details-button w-full flex justify-between items-center bg-muted/50 p-2 rounded-lg transition-colors hover:bg-muted/70"
        >
            <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-muted-foreground"/>
                <p className="text-sm font-semibold text-foreground">Total de Paquetes</p>
            </div>
            <div className="flex items-center gap-2">
              <p className={`text-2xl font-bold ${summary.isScheduled ? 'text-muted-foreground' : 'text-primary'}`}>{summary.totalPackages}</p>
              <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${isDetailsOpen ? 'rotate-180' : ''}`} />
            </div>
        </button>
        
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isDetailsOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-3 px-1">
           <StatusCount 
                icon={<Tags className="w-4 h-4 text-muted-foreground"/>}
                value={summary.counts.asignados}
                label="Asignados"
                colorClass="text-amber-500"
                isScheduled={summary.isScheduled}
            />
            <StatusCount 
                icon={<CheckCircle2 className="w-4 h-4 text-muted-foreground"/>}
                value={summary.counts.calificados}
                label="Calificados"
                colorClass="text-green-500"
                isScheduled={summary.isScheduled}
            />
            <StatusCount 
                icon={<Truck className="w-4 h-4 text-muted-foreground"/>}
                value={summary.counts.entregados}
                label="Entregados"
                colorClass="text-blue-500"
                isScheduled={summary.isScheduled}
            />
            <StatusCount 
                icon={<AlertTriangle className="w-4 h-4 text-muted-foreground"/>}
                value={summary.counts.reportados}
                label="Reportados"
                colorClass="text-red-500"
                isScheduled={summary.isScheduled}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

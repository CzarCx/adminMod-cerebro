
'use client';

import { useState } from 'react';
import { Clock, CheckCircle2, AlertTriangle, Truck, Tags, Package, ChevronDown, Calendar, Timer as TimerIcon } from 'lucide-react';
import CountdownTimer from './CountdownTimer';
import { useNotificationStore } from '@/lib/use-notification-store';
import type { SummaryData } from '@/app/tiempo-restante/page';

interface EncargadoSummaryCardProps {
  summary: SummaryData;
  onClick: () => void;
}

const StatusCount = ({ icon, value, label, colorClass, isScheduled }: { icon: React.ReactNode, value: number, label: string, colorClass: string, isScheduled?: boolean }) => (
    <div className="flex items-center gap-1.5">
        {icon}
        <p className="text-xs text-muted-foreground">{label}:</p>
        <span className={`font-semibold text-base ${isScheduled ? 'text-muted-foreground' : colorClass}`}>{value}</span>
    </div>
);

const formatMinutes = (minutes: number | null | undefined): string => {
    if (minutes === null || typeof minutes === 'undefined' || minutes === 0) {
      return '0 min';
    }
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    
    const hDisplay = h > 0 ? `${h}h` : '';
    const mDisplay = m > 0 ? `${m} min` : '';
    
    return [hDisplay, mDisplay].filter(Boolean).join(' ');
};

export default function EncargadoSummaryCard({ summary, onClick }: EncargadoSummaryCardProps) {
  const { addNotification } = useNotificationStore();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleTimerFinish = () => {
    addNotification({
      id: `encargado-${summary.name}-${Date.now()}`,
      message: `${summary.name} ha terminado sus tareas.`,
    });
  };

  const getScheduledFinishTime = () => {
    if (!summary.totalEstiTime) return null;
    const startTime = new Date();
    startTime.setHours(8, 0, 0, 0); // 8:00 AM
    const finishTime = new Date(startTime.getTime() + summary.totalEstiTime * 60000);
    return finishTime.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });
  };
  
  const cardClasses = `
    p-3 bg-card rounded-xl border shadow-sm flex flex-col space-y-2
    ${summary.isScheduled 
      ? 'transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer' 
      : 'transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer'}
  `;

  return (
    <div 
      onClick={onClick}
      className={cardClasses}
    >
        <div className="flex justify-between items-center">
            <h3 className="font-semibold text-base text-foreground truncate">
                <span className={!summary.isScheduled ? 'text-primary' : 'text-muted-foreground'}>{summary.name}</span>
            </h3>
            {summary.isScheduled && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    <Clock className="w-3 h-3" />
                    <span className="whitespace-nowrap">{getScheduledFinishTime() || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    <Calendar className="w-3 h-3" />
                    <span>Programado</span>
                </div>
              </div>
            )}
      </div>
      
      {!summary.isScheduled ? (
        <>
          <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-muted/50">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-primary" />
              <p className="text-lg font-bold text-foreground">
                {summary.latestFinishTime || 'N/A'}
              </p>
            </div>
            <p className="text-sm font-bold text-foreground font-mono">
              (<CountdownTimer 
                  targetDate={summary.latestFinishTimeDateObj}
                  onFinish={handleTimerFinish} 
              />)
            </p>
          </div>
          {summary.tentativeFinishTime && (
            <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Fin Tentativo:</span>
                </div>
                <span className="font-bold text-sm text-foreground">{summary.tentativeFinishTime}</span>
            </div>
          )}
          {(summary.totalScheduledTime ?? 0) > 0 && (
             <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <TimerIcon className="w-3.5 h-3.5" />
                    <span>Prog:</span>
                </div>
                <span className="font-bold text-sm text-muted-foreground">{formatMinutes(summary.totalScheduledTime)}</span>
            </div>
          )}
        </>
      ) : (
        <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-muted/50">
            <div className="flex items-center gap-1.5">
                <TimerIcon className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Tiempo Total:</span>
            </div>
            <p className="text-sm font-bold text-foreground">
                {formatMinutes(summary.totalEstiTime)}
            </p>
        </div>
      )}
      
      <div className="mt-auto">
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent the card's onClick from firing
            setIsDetailsOpen(!isDetailsOpen);
          }}
          className="toggle-details-button w-full flex justify-between items-center bg-muted/50 p-1.5 rounded-lg transition-colors hover:bg-muted/70"
        >
            <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-muted-foreground"/>
                <p className="text-xs font-semibold text-foreground">Total de Paquetes</p>
            </div>
            <div className="flex items-center gap-2">
              <p className={`text-xl font-bold ${summary.isScheduled ? 'text-muted-foreground' : 'text-primary'}`}>{summary.totalPackages}</p>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${isDetailsOpen ? 'rotate-180' : ''}`} />
            </div>
        </button>
        
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isDetailsOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 pt-1.5 px-1">
           <StatusCount 
                icon={<Tags className="w-3.5 h-3.5 text-muted-foreground"/>}
                value={summary.counts.asignados}
                label="Asignados"
                colorClass="text-amber-500"
                isScheduled={summary.isScheduled}
            />
            <StatusCount 
                icon={<CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground"/>}
                value={summary.counts.calificados}
                label="Calificados"
                colorClass="text-green-500"
                isScheduled={summary.isScheduled}
            />
            <StatusCount 
                icon={<Truck className="w-3.5 h-3.5 text-muted-foreground"/>}
                value={summary.counts.entregados}
                label="Entregados"
                colorClass="text-blue-500"
                isScheduled={summary.isScheduled}
            />
            <StatusCount 
                icon={<AlertTriangle className="w-3.5 h-3.5 text-muted-foreground"/>}
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

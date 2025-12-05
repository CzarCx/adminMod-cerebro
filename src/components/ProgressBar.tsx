
'use client';

import { PackageCheck, PackageX } from 'lucide-react';

interface ProgressBarProps {
  value: number;
  total: number;
}

export default function ProgressBar({ value, total }: ProgressBarProps) {
  const percentage = total > 0 ? Math.min(Math.round((value / total) * 100), 100) : 0;
  const remaining = total - value;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-foreground">Progreso de Entregas de Hoy</h3>
        <span className="text-xl font-bold text-primary">{percentage}%</span>
      </div>
      <div className="relative w-full h-4 bg-muted rounded-full overflow-hidden border">
        <div
          className="absolute top-0 left-0 h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/50 to-transparent animate-pulse"></div>
        </div>
      </div>
      <div className="flex justify-between items-center mt-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
            <PackageCheck className="w-4 h-4 text-green-500" />
            <span>Entregadas: <span className="font-bold text-foreground">{value}</span></span>
        </div>
        <div className="flex items-center gap-2">
            <PackageX className="w-4 h-4 text-red-500" />
            <span>Faltantes: <span className="font-bold text-foreground">{remaining > 0 ? remaining : 0}</span></span>
        </div>
      </div>
    </div>
  );
}

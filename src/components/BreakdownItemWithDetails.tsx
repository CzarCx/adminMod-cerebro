
'use client';

import { useState } from 'react';
import { ChevronDown, Building, Barcode, Factory, Boxes, ClipboardList } from 'lucide-react';

type Breakdown = { [key: string]: number };

interface BreakdownItemWithDetailsProps {
    title: 'En Barra' | 'En Producción' | 'En Tarima' | 'Paquetes Entregados';
    totalCount: number;
    breakdownData: Breakdown;
}

const ICONS: Record<string, React.ReactNode> = {
    'En Barra': <Barcode className="w-6 h-6" />,
    'En Producción': <Factory className="w-6 h-6" />,
    'En Tarima': <Boxes className="w-6 h-6" />,
    'Paquetes Entregados': <ClipboardList className="w-6 h-6" />,
};

export default function BreakdownItemWithDetails({
    title,
    totalCount,
    breakdownData,
}: BreakdownItemWithDetailsProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Data is now calculated in the parent and passed directly.
    const sortedBreakdown = Object.entries(breakdownData).sort(([, a], [, b]) => b - a);

    return (
        <div className="bg-card rounded-lg border">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 text-left"
                disabled={totalCount === 0 && sortedBreakdown.length === 0}
            >
                <div className="flex items-center gap-4">
                    <div className="text-muted-foreground">{ICONS[title]}</div>
                    <span className="font-medium text-foreground">{title}</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className={`font-bold text-lg ${totalCount < 0 ? 'text-red-500' : 'text-primary'}`}>{totalCount}</span>
                    {sortedBreakdown.length > 0 && (
                        <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                    )}
                </div>
            </button>
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[1000px] opacity-100 p-4 pt-0' : 'max-h-0 opacity-0'}`}>
                {sortedBreakdown.length > 0 && (
                    <div className="border-t pt-4">
                        <ul className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                            {sortedBreakdown.map(([company, count]) => (
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
                )}
            </div>
        </div>
    );
}

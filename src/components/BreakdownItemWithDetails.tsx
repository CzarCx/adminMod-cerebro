
'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Building, Barcode, Factory, Boxes, ClipboardList } from 'lucide-react';

type Breakdown = { [key: string]: number };

interface BreakdownItemWithDetailsProps {
    title: 'En Barra' | 'En Producción' | 'En Tarima' | 'Paquetes Entregados';
    status?: 'ASIGNADO' | 'CALIFICADO' | 'ENTREGADO';
    personalData?: { status: string | null; organization: string }[];
    initialTotal?: number;
    subtractCount?: number;
}

const ICONS: Record<string, React.ReactNode> = {
    'En Barra': <Barcode className="w-6 h-6" />,
    'En Producción': <Factory className="w-6 h-6" />,
    'En Tarima': <Boxes className="w-6 h-6" />,
    'Paquetes Entregados': <ClipboardList className="w-6 h-6" />,
};

export default function BreakdownItemWithDetails({
    title,
    status,
    personalData = [],
    initialTotal = 0,
    subtractCount = 0,
}: BreakdownItemWithDetailsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [breakdownData, setBreakdownData] = useState<Breakdown>({});
    const [totalCount, setTotalCount] = useState(0);

    useEffect(() => {
        let dataToProcess: Breakdown;
        let calculatedTotal: number;

        if (title === 'En Barra') {
            const productionBreakdown = personalData
                .filter(item => item.status?.trim().toUpperCase() === 'ASIGNADO')
                .reduce((acc, item) => {
                    const company = item.organization || 'Sin Empresa';
                    if (!acc[company]) {
                        acc[company] = 0;
                    }
                    acc[company]++;
                    return acc;
                }, {} as Breakdown);
            
            dataToProcess = productionBreakdown;
            // Corrected Calculation: Use the passed initialTotal (from DB)
            calculatedTotal = initialTotal - subtractCount;
        } else {
            const filteredData = personalData.filter(item => item.status?.trim().toUpperCase() === status);
            dataToProcess = filteredData.reduce((acc, item) => {
                const company = item.organization || 'Sin Empresa';
                if (!acc[company]) {
                    acc[company] = 0;
                }
                acc[company]++;
                return acc;
            }, {} as Breakdown);
            calculatedTotal = Object.values(dataToProcess).reduce((sum, count) => sum + count, 0);
        }

        setBreakdownData(dataToProcess);
        setTotalCount(calculatedTotal);

    }, [personalData, status, title, initialTotal, subtractCount]);

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

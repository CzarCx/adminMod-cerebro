
'use client';

import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '../lib/supabase';

interface ChartData {
  date: string;
  packages: number;
}

type Period = '7d' | '1m' | '3m' | '1y';

export default function HistoricoPaquetesChart() {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [period, setPeriod] = useState<Period>('1m');

  const periodLabels: { [key in Period]: string } = {
    '7d': 'Últimos 7 días',
    '1m': 'Último mes',
    '3m': 'Últimos 3 meses',
    '1y': 'Último año',
  };

  useEffect(() => {
    const fetchData = async () => {
      const fromDate = new Date();
      switch (period) {
        case '7d':
          fromDate.setDate(fromDate.getDate() - 7);
          break;
        case '1m':
          fromDate.setMonth(fromDate.getMonth() - 1);
          break;
        case '3m':
          fromDate.setMonth(fromDate.getMonth() - 3);
          break;
        case '1y':
          fromDate.setFullYear(fromDate.getFullYear() - 1);
          break;
      }

      const { data, error } = await supabase
        .from('personal')
        .select('quantity, created_at')
        .eq('status', 'REVISADO')
        .gte('created_at', fromDate.toISOString());

      if (error) {
        console.error('Error fetching historical data:', error.message);
        setChartData([]);
        setGrandTotal(0);
        return;
      }

      if (data) {
        const aggregatedData: { [key: string]: number } = data.reduce((acc, item) => {
          const date = new Date(item.created_at).toISOString().split('T')[0];
          if (!acc[date]) {
            acc[date] = 0;
          }
          acc[date] += item.quantity;
          return acc;
        }, {} as { [key: string]: number });

        const formattedData: ChartData[] = Object.keys(aggregatedData).map(dateStr => {
            return {
                date: dateStr, // Keep date as YYYY-MM-DD for sorting
                packages: aggregatedData[dateStr],
            };
        }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        // Now format the date for display after sorting
        const displayData = formattedData.map(item => {
            const [year, month, day] = item.date.split('-');
            return {
                ...item,
                date: `${day}-${month}-${year.slice(-2)}`,
            };
        });

        const totalOfAllPackages = displayData.reduce((sum, item) => sum + item.packages, 0);
        setGrandTotal(totalOfAllPackages);
        setChartData(displayData);
      }
    };

    fetchData();
  }, [period]);

  const PeriodButton = ({ value, label }: { value: Period; label: string }) => (
    <button
      onClick={() => setPeriod(value)}
      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
        period === value
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground hover:bg-muted/80'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
                <h3 className="text-lg font-semibold text-foreground">Histórico de Paquetes Revisados</h3>
                <p className="text-sm text-muted-foreground">Total en período: {grandTotal} Paquetes</p>
            </div>
            <div className="flex items-center gap-2 p-1 rounded-lg bg-muted/50">
                <PeriodButton value="7d" label="7D" />
                <PeriodButton value="1m" label="1M" />
                <PeriodButton value="3m" label="3M" />
                <PeriodButton value="1y" label="1A" />
            </div>
        </div>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            <p>No se encontraron paquetes revisados en los {periodLabels[period].toLowerCase()}.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPackages" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    formatter={(value) => `${value} paquetes`} 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      borderRadius: '0.5rem',
                      border: '1px solid hsl(var(--border))',
                      color: 'hsl(var(--foreground))'
                    }}
                  />
                  <Legend wrapperStyle={{color: 'hsl(var(--foreground))'}} />
                  <Area type="monotone" dataKey="packages" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorPackages)" name={`Paquetes Revisados (${periodLabels[period]})`} />
              </AreaChart>
          </ResponsiveContainer>
        )}
    </div>
  );
}

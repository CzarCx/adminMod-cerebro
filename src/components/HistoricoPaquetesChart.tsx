'use client';

import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '../lib/supabase';

interface ChartData {
  date: string;
  packages: number;
}

export default function HistoricoPaquetesChart() {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [grandTotal, setGrandTotal] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('personal')
        .select('quantity, created_at');

      if (error) {
        console.error('Error fetching historical data:', error.message);
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
            const [year, month, day] = dateStr.split('-');
            return {
                date: `${day}-${month}-${year.slice(-2)}`,
                packages: aggregatedData[dateStr],
            };
        }).sort((a, b) => new Date(a.date.split('-').reverse().join('-')).getTime() - new Date(b.date.split('-').reverse().join('-')).getTime());

        const totalOfAllPackages = formattedData.reduce((sum, item) => sum + item.packages, 0);
        setGrandTotal(totalOfAllPackages);

        setChartData(formattedData);
      }
    };

    fetchData();
  }, []);

  if (chartData.length === 0) {
    return (
      <div>
          <h3 className="text-lg font-semibold text-foreground">Histórico de Paquetes</h3>
          <p className="text-muted-foreground mt-2">No se encontraron datos históricos para mostrar.</p>
      </div>
    );
  }

  return (
    <div>
        <div>
            <h3 className="text-lg font-semibold text-foreground">Histórico de Paquetes por Día</h3>
            <p className="text-sm text-muted-foreground">Total General: {grandTotal} Paquetes</p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPackages" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
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
                <Area type="monotone" dataKey="packages" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorPackages)" name="Total de Paquetes por Día" />
            </AreaChart>
        </ResponsiveContainer>
    </div>
  );
}

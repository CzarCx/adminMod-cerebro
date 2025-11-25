
'use client';

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, PieLabelRenderProps } from 'recharts';
import { supabase } from '../lib/supabase';

interface ChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = (props: PieLabelRenderProps) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;

  if (typeof cx !== 'number' || typeof cy !== 'number' || typeof midAngle !== 'number' || typeof innerRadius !== 'number' || typeof outerRadius !== 'number' || typeof percent !== 'number') {
    return null;
  }

  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  // Don't render label if percentage is too small
  if ((percent ?? 0) < 0.05) {
    return null;
  }

  return (
    <text x={x} y={y} fill="hsl(var(--foreground))" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs font-bold">
      {`${((percent ?? 0) * 100).toFixed(0)}%`}
    </text>
  );
};

export default function ProductosEntregadosChart() {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);

  const COLORS = ['#10b981', '#f97316', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444', '#f59e0b'];

  useEffect(() => {
    const fetchData = async () => {
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

      const { data, error } = await supabase
        .from('personal')
        .select('product, quantity, status')
        .eq('status', 'ENTREGADO')
        .gte('date', todayStart)
        .lt('date', todayEnd);

      if (error) {
        console.error('Error fetching delivered products data for today:', error.message);
        return;
      }

      if (data) {
        const aggregatedData = data.reduce((acc, item) => {
          const { product, quantity } = item;
          if (!acc[product]) {
            acc[product] = 0;
          }
          acc[product] += quantity;
          return acc;
        }, {} as { [key: string]: number });

        const formattedData: ChartData[] = Object.keys(aggregatedData).map(productName => ({
          name: productName,
          value: aggregatedData[productName],
        }));

        const total = data.reduce((sum, item) => sum + item.quantity, 0);
        setTotalProducts(total);
        setChartData(formattedData.sort((a, b) => b.value - a.value));
      }
    };

    fetchData();
    
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);

  }, []);

  if (chartData.length === 0) {
    return (
      <div className="bg-card p-6 rounded-lg border shadow-sm">
        <h3 className="text-lg font-semibold text-foreground">Total de Productos Entregados Hoy</h3>
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            <p>No se encontraron productos entregados el día de hoy.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card p-6 rounded-lg border shadow-sm">
      <h3 className="text-lg font-semibold text-foreground">Total de Productos Entregados Hoy</h3>
      <p className="text-sm text-muted-foreground">Total General de Hoy: {totalProducts}</p>
      <div className="grid lg:grid-cols-2 gap-4">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <defs>
              <linearGradient id="pieGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip 
              formatter={(value) => `${value} unidades`} 
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                borderRadius: '0.5rem',
                border: '1px solid hsl(var(--border))',
                color: 'hsl(var(--foreground))'
              }}
            />
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={100}
              innerRadius={60}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              paddingAngle={5}
              stroke="hsl(var(--border))"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
             <Legend 
              iconType="circle" 
              wrapperStyle={{
                color: 'hsl(var(--foreground))',
                fontSize: '12px',
                paddingTop: '10px'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-col justify-center text-sm">
            <ul className="space-y-2 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
              {chartData.map((item, index) => (
                <li key={index} className="flex justify-between items-center border-b border-border/50 pb-1 last:border-b-0">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                    <span className="text-muted-foreground truncate" title={item.name}>{item.name}</span>
                  </span>
                  <span className="font-bold text-foreground">{item.value}</span>
                </li>
              ))}
            </ul>
          </div>
      </div>
    </div>
  );
}

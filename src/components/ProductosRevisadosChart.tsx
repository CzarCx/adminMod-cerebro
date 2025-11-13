
'use client';

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '../lib/supabase';

interface ChartData {
  name: string;
  value: number;
}

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function ProductosRevisadosChart() {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);

  const COLORS = ['#10b981', '#f97316', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444', '#f59e0b'];

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('personal')
        .select('product, quantity, status')
        .eq('status', 'REVISADO');

      if (error) {
        console.error('Error fetching revised products data:', error.message);
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
        setChartData(formattedData);
      }
    };

    fetchData();
  }, []);

  if (chartData.length === 0) {
    return (
        <div>
            <h3 className="text-lg font-semibold text-foreground">Total de Productos Revisados</h3>
            <p className="text-muted-foreground mt-2">No se encontraron productos con estado "Revisado".</p>
        </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-foreground">Total de Productos Revisados por Tipo</h3>
      <p className="text-sm text-muted-foreground">Total General: {totalProducts}</p>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
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
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Legend iconType="circle" wrapperStyle={{color: 'hsl(var(--foreground))'}}/>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}


'use client';

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '../lib/supabase';

interface ChartData {
  name: string;
  value: number;
}

interface TooltipPayload {
  payload: ChartData;
  [key: string]: unknown; 
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
}

type GroupByType = 'product' | 'organization';

interface EncargadoChartProps {
    encargadoName: string;
    groupBy: GroupByType;
}

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: {cx: number, cy: number, midAngle: number, innerRadius: number, outerRadius: number, percent: number}) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};


const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
        <p className="font-bold text-foreground">{`${data.name}: ${data.value} unidades`}</p>
      </div>
    );
  }
  return null;
};

export default function EncargadoChart({ encargadoName, groupBy }: EncargadoChartProps) {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);

  const COLORS = ['#10b981', '#14b8a6', '#0891b2', '#0ea5e9', '#3b82f6', '#f97316', '#ec4899'];
  const title = `Revisados por ${groupBy === 'product' ? 'Producto' : 'Empresa'}`;

  useEffect(() => {
    if (!encargadoName) return;

    const fetchData = async () => {
      const { data: allData, error } = await supabase
        .from('personal')
        .select('quantity, product, organization, status')
        .eq('name', encargadoName)
        .eq('status', 'REVISADO');

      if (error) {
        console.error('Error fetching data for chart:', error.message);
        return;
      }

      if (allData) {
        const aggregatedData = allData.reduce((acc, item) => {
          const key = item[groupBy];
          if (!acc[key]) {
            acc[key] = 0;
          }
          acc[key] += item.quantity;
          return acc;
        }, {} as { [key: string]: number });
        
        const formattedData: ChartData[] = Object.keys(aggregatedData).map(keyName => ({
            name: keyName,
            value: aggregatedData[keyName]
        }));

        const total = allData.reduce((sum, item) => sum + item.quantity, 0);
        setTotalProducts(total);
        setChartData(formattedData.sort((a, b) => b.value - a.value));
      }
    };

    fetchData();
  }, [encargadoName, groupBy]);

  if (chartData.length === 0) {
    return (
        <div>
            <div>
                <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                <p className="text-muted-foreground mt-2 text-sm">No se encontraron productos con estado &quot;Revisado&quot; para este encargado.</p>
            </div>
        </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">Total de Productos Revisados: {totalProducts}</p>
      <div className={`grid ${groupBy === 'product' ? 'grid-cols-2 gap-4' : 'grid-cols-1'}`}>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Tooltip content={<CustomTooltip />} />
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

        {groupBy === 'product' && (
          <div className="flex flex-col justify-center text-sm">
            <ul className="space-y-2 max-h-[280px] overflow-y-auto pr-2">
              {chartData.map((item, index) => (
                <li key={index} className="flex justify-between items-center border-b border-border/50 pb-1">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                    <span className="text-muted-foreground">{item.name}</span>
                  </span>
                  <span className="font-bold text-foreground">{item.value}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}


'use client';

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, PieLabelRenderProps } from 'recharts';
import { supabase } from '../lib/supabase';

// This interface is compatible with what Recharts Pie component expects.
// It allows for the 'name' and 'value' properties, plus any other properties.
interface ChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}

// Recharts expects an array of objects that can have any string key.
// We define this type for clarity when passing data to the Pie component.
type ChartDataInput = ChartData[];


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
const renderCustomizedLabel = (props: PieLabelRenderProps) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
  
  if (cx == null || cy == null || midAngle == null || innerRadius == null || outerRadius == null || percent == null) {
    return null;
  }
  
  if (typeof innerRadius !== 'number' || typeof outerRadius !== 'number' || typeof cx !== 'number' || typeof cy !== 'number' || typeof percent !== 'number') {
    return null;
  }

  // Hide label if percent is too small
  if (percent < 0.05) {
    return null;
  }

  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  const text = `${(percent * 100).toFixed(0)}%`;
  const textWidth = 35; // Estimated width of text background
  const textHeight = 18; // Height of text background

  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect 
        x={-textWidth / 2} 
        y={-textHeight / 2} 
        width={textWidth} 
        height={textHeight} 
        rx={8}
        fill="rgba(0,0,0,0.3)" 
      />
      <text 
        x={0} 
        y={0} 
        fill="hsl(var(--primary-foreground))" 
        textAnchor="middle" 
        dominantBaseline="middle" 
        className="text-xs font-bold"
      >
        {text}
      </text>
    </g>
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
  const title = `Entregados por ${groupBy === 'product' ? 'Producto' : 'Empresa'}`;

  useEffect(() => {
    if (!encargadoName) return;

    const fetchData = async () => {
      const { data: allData, error } = await supabase
        .from('personal')
        .select('quantity, product, organization, status')
        .eq('name', encargadoName)
        .eq('status', 'ENTREGADO');

      if (error) {
        console.error('Error fetching data for chart:', error.message);
        return;
      }

      if (allData) {
        const aggregatedData = allData.reduce((acc, item) => {
          const key = item[groupBy] as string;
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
                <p className="text-muted-foreground mt-2 text-sm">No se encontraron productos con estado &quot;Entregado&quot; para este encargado.</p>
            </div>
        </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">Total de Productos Entregados: {totalProducts}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Tooltip content={<CustomTooltip />} />
                <Pie
                data={chartData as ChartDataInput}
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
                {chartData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke={COLORS[index % COLORS.length]} />
                ))}
                </Pie>
            </PieChart>
            </ResponsiveContainer>
        </div>

        <div className="flex flex-col justify-center text-sm">
          <ul className="space-y-2 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
            {chartData.map((item, index) => (
              <li key={index} className="flex justify-between items-center border-b border-border/50 pb-1">
                <span className="flex items-center gap-2 truncate">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                  <span className="text-muted-foreground truncate" title={item.name}>{item.name}</span>
                </span>
                <span className="font-bold text-foreground pl-2">{item.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

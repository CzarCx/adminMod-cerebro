'use client';

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '../lib/supabase';

interface TooltipPayload {
  payload: ChartData;
  [key: string]: any; 
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
}

interface ChartData {
  name: string;
  value: number;
  products: string[];
}

const COLORS = ['#10b981', '#14b8a6', '#0891b2', '#0ea5e9', '#3b82f6'];

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{ backgroundColor: 'white', padding: '12px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <p>{`${data.name}: ${data.value} productos`}</p>
        <p>Desglose de Revisados:</p>
        <ul>
          {data.products.map((productInfo: string, index: number) => (
            <li key={index}>{productInfo}</li>
          ))}
        </ul>
      </div>
    );
  }
  return null;
};

export default function EncargadoChart({ encargadoName }: { encargadoName: string }) {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);

  useEffect(() => {
    if (!encargadoName) return;

    const fetchData = async () => {
      const { data: allData, error } = await supabase
        .from('personal')
        .select('organization, quantity, product, status')
        .eq('name', encargadoName);

      if (error) {
        console.error('Error fetching data for chart:', error);
        return;
      }

      if (allData) {
        const revisedData = allData.filter(item => 
          item.status && item.status.trim().toUpperCase() === 'REVISADO'
        );

        const aggregatedData = revisedData.reduce((acc, item) => {
          const { organization, quantity, product } = item;
          if (!acc[organization]) {
            acc[organization] = { totalValue: 0, productCounts: {} };
          }
          acc[organization].totalValue += quantity;

          if (!acc[organization].productCounts[product]) {
            acc[organization].productCounts[product] = 0;
          }
          acc[organization].productCounts[product] += quantity;
          
          return acc;
        }, {} as { [key: string]: { totalValue: number, productCounts: { [prod: string]: number } } });

        const formattedData: ChartData[] = Object.keys(aggregatedData).map(orgName => {
          const orgData = aggregatedData[orgName];
          const productList = Object.keys(orgData.productCounts).map(productName => {
            const count = orgData.productCounts[productName];
            return `${productName} (${count})`;
          });

          return {
            name: orgName,
            value: orgData.totalValue,
            products: productList,
          };
        });

        const total = revisedData.reduce((sum, item) => sum + item.quantity, 0);
        setTotalProducts(total);
        setChartData(formattedData);
      }
    };

    fetchData();
  }, [encargadoName]);

  if (chartData.length === 0) {
    return (
        <div>
            <div>
                <h3>Productos Revisados de {encargadoName}</h3>
                <p>No se encontraron productos con estado &quot;Revisado&quot; para este encargado.</p>
            </div>
        </div>
    );
  }

  return (
    <div>
      <h3>Productos Revisados de {encargadoName}</h3>
      <p>Total de Productos Revisados: {totalProducts}</p>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Tooltip content={<CustomTooltip />} />
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={100}
            innerRadius={60}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
            paddingAngle={5}
            label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Legend iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

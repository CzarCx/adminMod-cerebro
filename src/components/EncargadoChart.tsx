'use client';

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '../lib/supabase';

// Definiendo un tipo específico para el payload del tooltip
interface TooltipPayload {
  payload: ChartData;
  [key: string]: any; // Para otras propiedades que puedan venir
}

// Definiendo los props para CustomTooltip
interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
}

interface ChartData {
  name: string;
  value: number;
  products: string[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

// Usando los tipos definidos para los props
const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-xl">
        <p className="font-bold text-gray-800">{`${data.name}: ${data.value} productos`}</p>
        <p className="text-sm text-gray-600 font-semibold mt-1">Desglose de Revisados:</p>
        <ul className="list-disc list-inside text-sm text-gray-700">
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
        <div className="text-center p-4 bg-gray-50 rounded-lg shadow-inner h-full flex items-center justify-center">
            <div>
                <h3 className="text-lg font-semibold text-gray-800">Productos Revisados de {encargadoName}</h3>
                {/* Corrigiendo las comillas dobles sin escapar */}
                <p className="text-gray-500 mt-2">No se encontraron productos con estado &quot;Revisado&quot;.</p>
            </div>
        </div>
    );
  }

  return (
    <div className="text-center p-4 bg-white rounded-xl shadow-lg h-full">
      <h3 className="text-xl font-bold text-gray-800">Productos Revisados de {encargadoName}</h3>
      <p className="text-md text-blue-600 font-semibold mb-2">Total de Productos Revisados: {totalProducts}</p>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Tooltip content={<CustomTooltip />} />
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

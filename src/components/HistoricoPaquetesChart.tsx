'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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
        console.error('Error fetching historical data:', error);
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
                date: `${day}-${month}-${year}`,
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
      <div className="text-center p-4 bg-gray-50 rounded-lg shadow-inner h-full flex flex-col justify-center">
          <h3 className="text-lg font-semibold text-gray-800">Histórico de Paquetes</h3>
          <p className="text-gray-500 mt-2">No se encontraron datos históricos para mostrar.</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-xl shadow-lg h-full">
        <div className="text-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">Histórico de Paquetes por Día</h3>
            <p className="text-md text-green-600 font-semibold">Total General: {grandTotal} Paquetes</p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => `${value} paquetes`} />
                <Legend />
                <Bar dataKey="packages" fill="#16a34a" name="Total de Paquetes por Día" />
            </BarChart>
        </ResponsiveContainer>
    </div>
  );
}

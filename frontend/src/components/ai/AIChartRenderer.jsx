import React from 'react';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend
} from 'recharts';

export const AIChartRenderer = ({ chart }) => {
  if (!chart || !chart.data || chart.data.length === 0) return null;

  const { chart_type, title, data, x_key, y_keys } = chart;
  const COLORS = ['#697565', '#4CAF50', '#FFB74D', '#E57373', '#9C9589'];

  return (
    <div className="bg-[#181C14] border border-[#3C3D37] rounded-xl p-3 my-2 w-full">
      <h4 className="text-xs font-semibold text-[#ECDFCC] mb-2">{title}</h4>
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chart_type === 'bar' && (
            <BarChart data={data}>
              <XAxis dataKey={x_key} stroke="#9C9589" fontSize={10} tickLine={false} />
              <YAxis stroke="#9C9589" fontSize={10} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#3C3D37', border: 'none', borderRadius: '8px', color: '#ECDFCC' }} />
              {y_keys.map((key, idx) => (
                <Bar key={key} dataKey={key} fill={COLORS[idx % COLORS.length]} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          )}

          {chart_type === 'line' && (
            <LineChart data={data}>
              <XAxis dataKey={x_key} stroke="#9C9589" fontSize={10} tickLine={false} />
              <YAxis stroke="#9C9589" fontSize={10} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#3C3D37', border: 'none', borderRadius: '8px', color: '#ECDFCC' }} />
              {y_keys.map((key, idx) => (
                <Line key={key} type="monotone" dataKey={key} stroke={COLORS[idx % COLORS.length]} strokeWidth={2} dot={{ r: 3 }} />
              ))}
            </LineChart>
          )}

          {chart_type === 'pie' && (
            <PieChart>
              <Pie
                data={data}
                dataKey={y_keys[0] || 'valor'}
                nameKey={x_key}
                cx="50%"
                cy="50%"
                outerRadius={50}
                fill="#697565"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#3C3D37', border: 'none', borderRadius: '8px', color: '#ECDFCC' }} />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

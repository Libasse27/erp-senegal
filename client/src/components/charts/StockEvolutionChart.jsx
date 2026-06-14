import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border rounded shadow-sm" style={{ fontSize: '0.8rem' }}>
        <p className="mb-1 fw-semibold">{label}</p>
        {payload.map((p) => (
          <p key={p.dataKey} className="mb-0" style={{ color: p.fill }}>
            {p.name} : <strong>{p.value}</strong> unité(s)
          </p>
        ))}
      </div>
    );
  }
  return null;
};

/**
 * Graphique barres groupées entrées / sorties de stock par mois.
 * @param {Array} data - [{mois, entrees, sorties}]
 */
const StockEvolutionChart = ({ data = [], height = 300 }) => (
  <ResponsiveContainer width="100%" height={height}>
    <BarChart data={data} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="mois" style={{ fontSize: '0.75rem' }} />
      <YAxis style={{ fontSize: '0.75rem' }} />
      <Tooltip content={<CustomTooltip />} />
      <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
      <Bar dataKey="entrees" name="Entrées" fill="#059669" radius={[3, 3, 0, 0]} />
      <Bar dataKey="sorties" name="Sorties" fill="#dc2626" radius={[3, 3, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
);

export default StockEvolutionChart;

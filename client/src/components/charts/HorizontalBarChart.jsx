import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { formatMoney } from '../../utils/formatters';

const COLORS = ['#059669', '#1a56db', '#7c3aed', '#d97706', '#dc2626', '#0891b2', '#f59e0b', '#6366f1', '#10b981', '#ef4444'];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border rounded shadow-sm" style={{ fontSize: '0.8rem', maxWidth: 200 }}>
        <p className="mb-1 fw-semibold text-truncate">{payload[0].payload.designation || payload[0].payload.name}</p>
        <p className="mb-0 text-success">{formatMoney(payload[0].value)}</p>
        {payload[0].payload.totalQte && (
          <p className="mb-0 text-muted">Qté : {payload[0].payload.totalQte}</p>
        )}
      </div>
    );
  }
  return null;
};

/**
 * Graphique à barres horizontales — top produits / classements.
 */
const HorizontalBarChart = ({ data = [], dataKey = 'totalCA', nameKey = 'designation', height = 300 }) => (
  <ResponsiveContainer width="100%" height={height}>
    <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
      <XAxis type="number" tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} style={{ fontSize: '0.75rem' }} />
      <YAxis
        type="category"
        dataKey={nameKey}
        width={130}
        style={{ fontSize: '0.75rem' }}
        tickFormatter={(v) => (v?.length > 18 ? `${v.slice(0, 18)}…` : v)}
      />
      <Tooltip content={<CustomTooltip />} />
      <Bar dataKey={dataKey} radius={[0, 4, 4, 0]}>
        {data.map((_, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
);

export default HorizontalBarChart;

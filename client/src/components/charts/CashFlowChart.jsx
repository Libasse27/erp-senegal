import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatMoney } from '../../utils/formatters';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border rounded shadow-sm" style={{ fontSize: '0.875rem' }}>
        <p className="mb-1 fw-semibold">{label}</p>
        {payload.map((p) => (
          <p key={p.dataKey} className="mb-0" style={{ color: p.color }}>
            {p.name} : {formatMoney(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

/**
 * Graphique flux de trésorerie (entrées / sorties).
 * @param {Object} props
 * @param {Array}  props.data       - tableau d'objets { label, entrees, sorties }
 * @param {string} props.labelKey   - clé de l'étiquette X (défaut: 'label')
 * @param {number} props.height     - hauteur en px (défaut: 300)
 * @param {string} props.colorEntrees - couleur entrées (défaut: '#059669')
 * @param {string} props.colorSorties - couleur sorties (défaut: '#dc2626')
 */
const CashFlowChart = ({
  data = [],
  labelKey = 'label',
  height = 300,
  colorEntrees = '#059669',
  colorSorties = '#dc2626',
}) => (
  <ResponsiveContainer width="100%" height={height}>
    <AreaChart data={data}>
      <defs>
        <linearGradient id="gradEntrees" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={colorEntrees} stopOpacity={0.2} />
          <stop offset="95%" stopColor={colorEntrees} stopOpacity={0} />
        </linearGradient>
        <linearGradient id="gradSorties" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={colorSorties} stopOpacity={0.2} />
          <stop offset="95%" stopColor={colorSorties} stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey={labelKey} />
      <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
      <Tooltip content={<CustomTooltip />} />
      <Legend />
      <Area
        type="monotone"
        dataKey="entrees"
        name="Entrées"
        stroke={colorEntrees}
        fill="url(#gradEntrees)"
        strokeWidth={2}
      />
      <Area
        type="monotone"
        dataKey="sorties"
        name="Sorties"
        stroke={colorSorties}
        fill="url(#gradSorties)"
        strokeWidth={2}
      />
    </AreaChart>
  </ResponsiveContainer>
);

export default CashFlowChart;

import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatMoney } from '../../utils/formatters';

const CustomTooltip = ({ active, payload, labelKey }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border rounded shadow-sm" style={{ fontSize: '0.875rem' }}>
        <p className="mb-0 fw-semibold">{payload[0].payload[labelKey]}</p>
        <p className="mb-0 text-success">{formatMoney(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

/**
 * Graphique d'évolution du chiffre d'affaires.
 * @param {Object} props
 * @param {Array}  props.data     - tableau d'objets avec une clé label et une clé valeur
 * @param {string} props.dataKey  - clé de la valeur numérique (défaut: 'ca')
 * @param {string} props.labelKey - clé de l'étiquette X (défaut: 'label')
 * @param {'bar'|'line'} props.type - type de graphique (défaut: 'bar')
 * @param {string} props.color    - couleur principale (défaut: '#059669')
 * @param {number} props.height   - hauteur en px (défaut: 300)
 */
const SalesEvolutionChart = ({
  data = [],
  dataKey = 'ca',
  labelKey = 'label',
  type = 'bar',
  color = '#059669',
  height = 300,
}) => {
  const tooltip = <Tooltip content={<CustomTooltip labelKey={labelKey} />} />;
  const axes = (
    <>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey={labelKey} />
      <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
      {tooltip}
    </>
  );

  return (
    <ResponsiveContainer width="100%" height={height}>
      {type === 'line' ? (
        <LineChart data={data}>
          {axes}
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            dot={{ fill: color, r: 4 }}
          />
        </LineChart>
      ) : (
        <BarChart data={data}>
          {axes}
          <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      )}
    </ResponsiveContainer>
  );
};

export default SalesEvolutionChart;

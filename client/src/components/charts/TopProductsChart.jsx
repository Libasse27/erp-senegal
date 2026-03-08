import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const DEFAULT_COLORS = ['#059669', '#1a56db', '#ff6900', '#00b4d8', '#d97706', '#7c3aed', '#dc2626'];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border rounded shadow-sm" style={{ fontSize: '0.875rem' }}>
        <p className="mb-0 fw-semibold">{payload[0].name}</p>
        <p className="mb-0">{payload[0].value}%</p>
      </div>
    );
  }
  return null;
};

/**
 * Graphique camembert (top produits / modes de paiement).
 * @param {Object}   props
 * @param {Array}    props.data   - tableau d'objets { name, value }
 * @param {string[]} props.colors - couleurs (défaut: palette interne)
 * @param {number}   props.height - hauteur en px (défaut: 300)
 * @param {boolean}  props.showPercentLabel - afficher étiquette % (défaut: true)
 */
const TopProductsChart = ({
  data = [],
  colors = DEFAULT_COLORS,
  height = 300,
  showPercentLabel = true,
}) => (
  <ResponsiveContainer width="100%" height={height}>
    <PieChart>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        labelLine={false}
        label={
          showPercentLabel
            ? ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`
            : false
        }
        outerRadius={80}
        dataKey="value"
      >
        {data.map((_, index) => (
          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
        ))}
      </Pie>
      <Tooltip content={<CustomTooltip />} />
    </PieChart>
  </ResponsiveContainer>
);

export default TopProductsChart;

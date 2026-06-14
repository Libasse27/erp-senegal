import React from 'react';
import {
  FunnelChart as RechartsFunnel,
  Funnel,
  LabelList,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border rounded shadow-sm" style={{ fontSize: '0.875rem' }}>
        <p className="mb-0 fw-semibold">{payload[0].payload.name}</p>
        <p className="mb-0 text-muted">{payload[0].payload.value} document(s)</p>
      </div>
    );
  }
  return null;
};

/**
 * Entonnoir de conversion commercial — devis → commandes → factures → paiements.
 * @param {Array}  props.data   - [{name, value, fill}]
 * @param {number} props.height - hauteur px (défaut: 260)
 */
const FunnelChart = ({ data = [], height = 260 }) => (
  <ResponsiveContainer width="100%" height={height}>
    <RechartsFunnel width={400} height={height} data={data}>
      <Tooltip content={<CustomTooltip />} />
      <Funnel dataKey="value" isAnimationActive nameKey="name">
        <LabelList
          position="right"
          fill="#374151"
          stroke="none"
          dataKey="name"
          style={{ fontSize: '0.78rem', fontWeight: 500 }}
        />
        <LabelList
          position="center"
          fill="#fff"
          stroke="none"
          dataKey="value"
          style={{ fontSize: '0.85rem', fontWeight: 700 }}
        />
      </Funnel>
    </RechartsFunnel>
  </ResponsiveContainer>
);

export default FunnelChart;

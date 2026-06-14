import React from 'react';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { formatMoney } from '../../utils/formatters';

const DualTooltip = ({ active, payload, labelKey }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white p-2 border rounded shadow-sm" style={{ fontSize: '0.82rem', minWidth: 170 }}>
      <p className="mb-1 fw-semibold border-bottom pb-1">{payload[0]?.payload[labelKey]}</p>
      {payload.map((entry, i) => (
        <p key={i} className="mb-0" style={{ color: entry.color || entry.fill }}>
          <span className="fw-medium">{entry.name}</span> : {formatMoney(entry.value)}
        </p>
      ))}
    </div>
  );
};

const tickFormatter = (v) => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `${(v / 1_000).toFixed(0)}k`;
  return String(v);
};

/**
 * Graphique évolution CA — supporte une deuxième série N-1.
 *
 * Props:
 *   data          Array — série principale [{mois, ca}]
 *   prevData      Array — série N-1 (même structure), optionnel
 *   showPrev      bool  — afficher N-1
 *   dataKey       string — clé valeur principale (défaut: 'ca')
 *   labelKey      string — clé étiquette X (défaut: 'mois')
 *   type          'bar'|'line'
 *   color         string — couleur série N
 *   prevColor     string — couleur série N-1
 *   height        number
 *   currentLabel  string — libellé légende N
 *   prevLabel     string — libellé légende N-1
 */
const SalesEvolutionChart = ({
  data = [],
  prevData = null,
  showPrev = false,
  dataKey = 'ca',
  labelKey = 'label',
  type = 'bar',
  color = '#059669',
  prevColor = '#a7f3d0',
  height = 300,
  currentLabel = 'N',
  prevLabel = 'N-1',
}) => {
  const prevMergedKey = `${dataKey}Prev`;
  const mergedData = showPrev && prevData
    ? data.map((d, i) => ({ ...d, [prevMergedKey]: prevData[i]?.[dataKey] || 0 }))
    : data;

  const tooltip = <Tooltip content={<DualTooltip labelKey={labelKey} />} />;
  const showLegend = showPrev && prevData;

  const axes = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
      <XAxis dataKey={labelKey} tick={{ fontSize: 11 }} />
      <YAxis tickFormatter={tickFormatter} tick={{ fontSize: 11 }} width={52} />
      {tooltip}
      {showLegend && (
        <Legend
          formatter={(value) => value === dataKey ? currentLabel : prevLabel}
          wrapperStyle={{ fontSize: 12 }}
        />
      )}
    </>
  );

  return (
    <ResponsiveContainer width="100%" height={height}>
      {type === 'line' ? (
        <LineChart data={mergedData}>
          {axes}
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={{ fill: color, r: 3 }} name={currentLabel} />
          {showLegend && (
            <Line type="monotone" dataKey={prevMergedKey} stroke={prevColor} strokeWidth={2} strokeDasharray="5 4" dot={{ fill: prevColor, r: 2 }} name={prevLabel} />
          )}
        </LineChart>
      ) : (
        <BarChart data={mergedData} barGap={2}>
          {axes}
          <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} name={currentLabel} />
          {showLegend && (
            <Bar dataKey={prevMergedKey} fill={prevColor} radius={[4, 4, 0, 0]} name={prevLabel} />
          )}
        </BarChart>
      )}
    </ResponsiveContainer>
  );
};

export default SalesEvolutionChart;

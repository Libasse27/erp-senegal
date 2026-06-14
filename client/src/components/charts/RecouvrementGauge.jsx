import React from 'react';
import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts';

/**
 * Jauge circulaire radiale pour le taux de recouvrement.
 * @param {number} props.value   - Taux en % (0–100)
 * @param {number} props.height  - Hauteur px (défaut: 200)
 * @param {string} props.color   - Couleur de remplissage (auto selon valeur si absent)
 */
const RecouvrementGauge = ({ value = 0, height = 200, color }) => {
  const fill = color || (value >= 80 ? '#059669' : value >= 50 ? '#d97706' : '#dc2626');

  const data = [{ value, fill }];

  return (
    <div style={{ position: 'relative', height }}>
      <ResponsiveContainer width="100%" height={height}>
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="60%"
          outerRadius="85%"
          barSize={18}
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar
            background={{ fill: '#f3f4f6' }}
            dataKey="value"
            angleAxisId={0}
            cornerRadius={8}
          />
        </RadialBarChart>
      </ResponsiveContainer>

      {/* Valeur centrale superposée */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        <div style={{ fontSize: '1.9rem', fontWeight: 700, color: fill, lineHeight: 1 }}>
          {value}%
        </div>
        <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 2 }}>recouvré</div>
      </div>
    </div>
  );
};

export default RecouvrementGauge;

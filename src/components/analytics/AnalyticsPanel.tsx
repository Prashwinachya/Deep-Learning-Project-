import React from 'react';
import { 
  AreaChart, 
  Area, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar 
} from 'recharts';
import { Activity, PieChart as PieIcon, ArrowUpDown } from 'lucide-react';
import type { TimeSeriesPoint, VehicleCounts } from '../../types/traffic';

interface AnalyticsPanelProps {
  timeSeries: TimeSeriesPoint[];
  counts: VehicleCounts;
}

const COLORS = {
  car: '#38bdf8',
  motorcycle: '#a855f7',
  bus: '#10b981',
  truck: '#f59e0b',
  bicycle: '#22d3ee',
  inbound: '#00f2fe',
  outbound: '#6366f1',
};

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({
  timeSeries,
  counts,
}) => {
  // Distribution data for Donut Chart
  const pieData = [
    { name: 'Cars', value: counts.car, color: COLORS.car },
    { name: 'Motorcycles', value: counts.motorcycle, color: COLORS.motorcycle },
    { name: 'Buses', value: counts.bus, color: COLORS.bus },
    { name: 'Trucks', value: counts.truck, color: COLORS.truck },
    { name: 'Bicycles', value: counts.bicycle || 0, color: COLORS.bicycle },
  ].filter(d => d.value > 0);

  // Flow comparison data
  const flowData = [
    { name: 'Inbound (North)', count: counts.inbound, fill: COLORS.inbound },
    { name: 'Outbound (South)', count: counts.outbound, fill: COLORS.outbound },
  ];

  return (
    <div className="analytics-section-container">
      {/* Chart 1: Vehicles Over Time (Area Chart) */}
      <div className="chart-card">
        <div className="chart-header">
          <div className="chart-title-group">
            <span className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={16} style={{ color: 'var(--cyan-primary)' }} />
              Vehicles Detected Over Time
            </span>
            <span className="chart-subtitle">Real-time throughput & traffic density per minute</span>
          </div>

          <span className="badge badge-cyan">LIVE TELEMETRY</span>
        </div>

        <div style={{ width: '100%', height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="cyanArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00f2fe" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#00f2fe" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="purpleArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="custom-recharts-tooltip">
                        <div className="tooltip-title">{label}</div>
                        {payload.map((entry, idx) => (
                          <div key={idx} className="tooltip-row">
                            <span style={{ color: entry.color }}>{entry.name}:</span>
                            <strong>{entry.value}</strong>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="total"
                name="Total Flow"
                stroke="#00f2fe"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#cyanArea)"
              />
              <Area
                type="monotone"
                dataKey="density"
                name="Density Index"
                stroke="#a855f7"
                strokeWidth={1.5}
                fillOpacity={1}
                fill="url(#purpleArea)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Split: Vehicle-Type Distribution & Direction Flow */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Donut Chart: Type Distribution */}
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title-group">
              <span className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <PieIcon size={16} style={{ color: 'var(--color-motorcycle)' }} />
                Vehicle Distribution
              </span>
              <span className="chart-subtitle">Class breakdown</span>
            </div>
          </div>

          <div style={{ width: '100%', height: 180, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0];
                      return (
                        <div className="custom-recharts-tooltip">
                          <span style={{ color: data.payload.color, fontWeight: 600 }}>
                            {data.name}: {data.value}
                          </span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Centered Total */}
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
              <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                {counts.total}
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Total
              </div>
            </div>
          </div>

          {/* Mini Legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 11, justifyContent: 'center' }}>
            {pieData.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
                <span style={{ color: 'var(--text-secondary)' }}>{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar Chart: Entry vs Exit Flow */}
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title-group">
              <span className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ArrowUpDown size={16} style={{ color: 'var(--color-success)' }} />
                Entry vs Exit
              </span>
              <span className="chart-subtitle">Directional split</span>
            </div>
          </div>

          <div style={{ width: '100%', height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={flowData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10.5} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0];
                      return (
                        <div className="custom-recharts-tooltip">
                          <span style={{ color: data.payload.fill, fontWeight: 600 }}>
                            {data.name}: {data.value} vehicles
                          </span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {flowData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: 11, color: 'var(--text-muted)' }}>
            <div>Inbound: <strong style={{ color: COLORS.inbound }}>{counts.inbound}</strong></div>
            <div>Outbound: <strong style={{ color: COLORS.outbound }}>{counts.outbound}</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
};

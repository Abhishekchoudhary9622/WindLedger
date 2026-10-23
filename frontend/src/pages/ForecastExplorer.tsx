import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { fetchEvolution, fetchMeta, type EvolutionVersion } from '../api';
import {
  formatUtcDate,
  formatUtcDateTime,
  formatUtcPublish,
  formatDecisionCutoffLabel,
} from '../utils/formatDate';

export default function ForecastExplorer() {
  const [selectedDate, setSelectedDate] = useState('2026-01-14');
  const [selectedHour, setSelectedHour] = useState('12:00');
  const [cutoffTime, setCutoffTime] = useState('09:20');

  const { data: meta } = useQuery({ queryKey: ['meta'], queryFn: fetchMeta });

  const targetIso = `${selectedDate}T${selectedHour}:00Z`;

  const { data: evolution, isLoading } = useQuery({
    queryKey: ['evolution', targetIso, cutoffTime],
    queryFn: () => fetchEvolution(targetIso, cutoffTime),
  });

  const chartData = evolution?.versions?.map((v: EvolutionVersion, i: number) => ({
    idx: i,
    publishLabel: `${formatUtcPublish(v.publishTime)} UTC`,
    publishFull: `${formatUtcDateTime(v.publishTime)} UTC`,
    publishTime: v.publishTime,
    forecastMW: v.forecastMW,
    horizonHours: v.horizonHours,
    isSelected: v.isSelected,
    isPostCutoff: v.isPostCutoff,
  })) || [];

  const selectedVersion = evolution?.versions?.find((v: EvolutionVersion) => v.isSelected);

  return (
    <div>
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Forecast Explorer</h1>
          <p className="page-subtitle">
            Inspect forecast revisions across successive vintages converging to outturn generation
          </p>
        </div>

        <div className="header-right-badges">
          <div className="select-pill">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <select value={selectedDate} onChange={e => setSelectedDate(e.target.value)}>
              {meta?.availableDates?.map(d => (
                <option key={d} value={d}>
                  {formatUtcDate(d)}
                </option>
              )) || <option value="2026-01-14">14 Jan 2026</option>}
            </select>
          </div>

          <div className="select-pill">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <select value={selectedHour} onChange={e => setSelectedHour(e.target.value)}>
              {Array.from({ length: 24 }, (_, i) => {
                const h = String(i).padStart(2, '0') + ':00';
                return <option key={h} value={h}>{h} UTC</option>;
              })}
            </select>
          </div>

          <div className="select-pill">
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Cutoff:</span>
            <select value={cutoffTime} onChange={e => setCutoffTime(e.target.value)}>
              <option value="09:20">09:20 (EPEX Day-Ahead - UK time / UTC)</option>
              <option value="09:50">09:50 (Nord Pool Day-Ahead - UK time / UTC)</option>
              <option value="10:00">10:00 (Post-Auction Benchmark)</option>
              <option value="12:00">12:00 (Noon)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Evolution Chart */}
      <div className="dashboard-card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-top-header">
          <div>
            <div className="card-heading-title">
              Revision Trajectory for {formatUtcDate(selectedDate)}, {selectedHour} UTC
            </div>
            <div className="card-heading-subtitle">
              {formatDecisionCutoffLabel(selectedDate, cutoffTime)}
            </div>
          </div>
          {selectedVersion && (
            <div className="pill-selected-green" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
              Cutoff Version: {selectedVersion.forecastMW.toLocaleString()} MW (Horizon: {selectedVersion.horizonHours}h)
            </div>
          )}
        </div>

        <div style={{ width: '100%', height: 340 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 15, right: 20, left: 25, bottom: 35 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis
                dataKey="publishLabel"
                stroke="#94A3B8"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: '#E2E8F0' }}
                interval={chartData.length > 8 ? Math.ceil(chartData.length / 6) : 0}
                angle={-20}
                textAnchor="end"
                height={40}
              />
              <YAxis
                width={65}
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                domain={['auto', 'auto']}
                tickFormatter={(val: number) => val.toLocaleString()}
                label={{
                  value: 'Forecast (MW)',
                  angle: -90,
                  position: 'insideLeft',
                  fill: '#94A3B8',
                  fontSize: 11,
                  style: { textAnchor: 'middle' },
                }}
              />
              <Tooltip
                contentStyle={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: 10,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  fontSize: 12,
                }}
                formatter={(val: any) => [`${Number(val).toLocaleString()} MW`, 'Forecast']}
                labelFormatter={(label: any) => `Published: ${label}`}
              />
              {evolution?.actualMW != null && (
                <ReferenceLine
                  y={evolution.actualMW}
                  stroke="#10B981"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  label={{
                    value: `Actual Outturn: ${evolution.actualMW.toLocaleString()} MW`,
                    fill: '#059669',
                    fontSize: 12,
                    fontWeight: 600,
                    position: 'top',
                  }}
                />
              )}
              <Line
                type="monotone"
                dataKey="forecastMW"
                stroke="#2563EB"
                strokeWidth={2.5}
                dot={(props: any) => {
                  const isSel = props.payload.isSelected;
                  return (
                    <circle
                      cx={props.cx}
                      cy={props.cy}
                      r={isSel ? 6 : 3.5}
                      fill={isSel ? '#10B981' : '#2563EB'}
                      stroke="#FFFFFF"
                      strokeWidth={2}
                    />
                  );
                }}
                name="Forecast Version"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Vintages Breakdown Table */}
      <div className="dashboard-card">
        <div className="card-top-header">
          <div className="card-heading-title">Chronological Version Log</div>
          <div className="card-heading-subtitle">All WINDFOR runs recorded for this settlement hour</div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#64748B', background: '#F8FAFC' }}>
                <th style={{ padding: '10px 14px' }}>Publish Timestamp</th>
                <th style={{ padding: '10px 14px' }}>Forecast MW</th>
                <th style={{ padding: '10px 14px' }}>Delta to Actual</th>
                <th style={{ padding: '10px 14px' }}>Lead Time (Horizon)</th>
                <th style={{ padding: '10px 14px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((v, i) => {
                const diff = evolution?.actualMW != null ? v.forecastMW - evolution.actualMW : null;
                const isPost = v.isPostCutoff;
                return (
                  <tr
                    key={i}
                    style={{
                      borderBottom: '1px solid #F1F5F9',
                      background: v.isSelected ? '#F0FDF4' : isPost ? '#F8FAFC' : 'transparent',
                      opacity: isPost ? 0.6 : 1,
                    }}
                  >
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: isPost ? '#64748B' : '#0F172A' }}>
                      {v.publishFull}
                    </td>
                    <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: isPost ? '#64748B' : '#2563EB' }}>
                      {v.forecastMW.toLocaleString()} MW
                    </td>
                    <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: diff && diff < 0 ? '#059669' : '#EF4444' }}>
                      {diff != null ? `${diff > 0 ? '+' : ''}${Math.round(diff).toLocaleString()} MW` : '—'}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#64748B' }}>
                      {v.horizonHours} hours
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      {v.isSelected ? (
                        <span className="pill-selected-green">Selected for Cutoff</span>
                      ) : isPost ? (
                        <span style={{ fontSize: '0.72rem', color: '#64748B', background: '#E2E8F0', padding: '3px 8px', borderRadius: '6px' }}>
                          published after cutoff, not used
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Past revision</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { fetchDecision, type DecisionPoint } from '../api';
import { format } from 'date-fns';

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload;
  return (
    <div className="custom-tooltip">
      <div className="label">{label}</div>
      {p?.forecast != null && (
        <div className="item">
          <span className="dot" style={{ background: '#22D3EE' }} />
          <span>Forecast</span>
          <span className="value">{p.forecast.toLocaleString()} MW</span>
        </div>
      )}
      {p?.actual != null && (
        <div className="item">
          <span className="dot" style={{ background: '#F59E0B' }} />
          <span>Actual</span>
          <span className="value">{p.actual.toLocaleString()} MW</span>
        </div>
      )}
      {p?.error != null && (
        <div className="item">
          <span className="dot" style={{ background: p.error > 0 ? '#F87171' : '#34D399' }} />
          <span>Error</span>
          <span className="value" style={{ color: p.error > 0 ? '#F87171' : '#34D399' }}>
            {p.error > 0 ? '+' : ''}{p.error.toLocaleString()} MW
          </span>
        </div>
      )}
      {p?.bandP10 != null && (
        <div className="item" style={{ opacity: 0.7 }}>
          <span className="dot" style={{ background: '#A78BFA' }} />
          <span>P10–P90 Band</span>
          <span className="value">{p.bandP10.toLocaleString()} – {p.bandP90?.toLocaleString()} MW</span>
        </div>
      )}
    </div>
  );
}

export default function DecisionDesk() {
  const [date, setDate] = useState('2026-01-15');
  const [cutoff, setCutoff] = useState('09:20');

  const { data, isLoading, error } = useQuery({
    queryKey: ['decision', date, cutoff],
    queryFn: () => fetchDecision(date, cutoff),
  });

  const chartData = data?.points?.map((p: DecisionPoint) => ({
    time: format(new Date(p.startTime), 'HH:mm'),
    fullTime: format(new Date(p.startTime), 'dd MMM HH:mm'),
    forecast: p.forecastMW,
    actual: p.actualMW,
    error: p.errorMW,
    bandP10: p.bandP10,
    bandP90: p.bandP90,
    conservative: p.conservativeMW,
    horizon: p.horizonHours,
    publishTime: format(new Date(p.publishTime), 'dd MMM HH:mm'),
  })) || [];

  const exportCSV = () => {
    if (!data?.points?.length) return;
    const headers = ['startTime', 'forecastMW', 'actualMW', 'errorMW', 'publishTime', 'horizonHours', 'bandP10', 'bandP90', 'conservativeMW'];
    const rows = data.points.map((p: DecisionPoint) => headers.map(h => (p as any)[h] ?? '').join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `windlens_decision_${date}_cutoff${cutoff.replace(':', '')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <motion.div
        className="section-header"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="section-title">⚡ Decision Desk</h1>
        <p className="section-subtitle">
          Decision on {format(new Date(date + 'T00:00:00'), 'dd MMMM yyyy')} — cutoff{' '}
          {cutoff} on D-1
        </p>
      </motion.div>

      {/* Controls */}
      <div className="controls-row">
        <div className="control-group">
          <label className="control-label">Delivery date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div className="control-group">
          <label className="control-label">Decision cutoff (D-1)</label>
          <input type="time" value={cutoff} onChange={e => setCutoff(e.target.value)} />
        </div>
        <button className="btn btn-ghost" onClick={exportCSV}>📥 Export CSV</button>
      </div>

      {error ? (
        <div className="error-state">Failed to load forecast data. Is the API running?</div>
      ) : isLoading ? (
        <div className="card" style={{ height: 400 }}>
          <div className="skeleton" style={{ width: '100%', height: '100%' }} />
        </div>
      ) : (
        <div className="desk-layout">
          {/* Main chart */}
          <motion.div
            className="card"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="card-header">
              <div>
                <div className="card-title">Wind Generation — Actual vs Forecast</div>
                <div className="card-subtitle">
                  Showing latest forecast available before {cutoff} on {format(new Date(new Date(date + 'T00:00:00').getTime() - 86400000), 'dd MMM yyyy')}
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={420}>
              <ComposedChart data={chartData}>
                <defs>
                  <linearGradient id="bandGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#A78BFA" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#A78BFA" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#22D3EE" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(34,211,238,0.06)" />
                <XAxis dataKey="time" stroke="#64748B" fontSize={12} tick={{ fill: '#94A3B8' }} />
                <YAxis
                  stroke="#64748B"
                  fontSize={12}
                  tick={{ fill: '#94A3B8' }}
                  tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                  label={{ value: 'MW', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="bandP90"
                  stroke="none"
                  fill="url(#bandGrad2)"
                  name="P90 Band"
                />
                <Area
                  type="monotone"
                  dataKey="bandP10"
                  stroke="none"
                  fill="var(--bg-primary)"
                  name="P10 Band"
                />
                <Line
                  type="monotone"
                  dataKey="conservative"
                  stroke="#A78BFA"
                  strokeWidth={1.5}
                  strokeDasharray="6 3"
                  dot={false}
                  name="Conservative"
                />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="#22D3EE"
                  strokeWidth={2.5}
                  dot={false}
                  name="Forecast"
                  activeDot={{ r: 5, fill: '#22D3EE', stroke: '#0B1220', strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  dot={false}
                  name="Actual"
                />
              </ComposedChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginTop: '0.75rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#94A3B8' }}>
                <span style={{ width: 16, height: 3, background: '#22D3EE', borderRadius: 2, display: 'inline-block' }} /> Forecast
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#94A3B8' }}>
                <span style={{ width: 16, height: 3, background: '#F59E0B', borderRadius: 2, display: 'inline-block' }} /> Actual
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#94A3B8' }}>
                <span style={{ width: 16, height: 8, background: 'rgba(167,139,250,0.2)', borderRadius: 2, display: 'inline-block' }} /> P10–P90 Band
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#94A3B8' }}>
                <span style={{ width: 16, height: 2, background: '#A78BFA', borderRadius: 2, display: 'inline-block', borderTop: '1px dashed #A78BFA' }} /> Conservative
              </span>
            </div>
          </motion.div>

          {/* Side panel */}
          <motion.div
            className="side-panel"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="card" style={{ marginBottom: '1rem' }}>
              <div className="card-title" style={{ marginBottom: '0.75rem' }}>📊 Summary</div>
              {data?.summary && (
                <>
                  <div className="stat-row">
                    <span className="stat-label">Peak forecast</span>
                    <span className="stat-value">{data.summary.peakMW.toLocaleString()} MW</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Trough forecast</span>
                    <span className="stat-value">{data.summary.troughMW.toLocaleString()} MW</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Mean forecast</span>
                    <span className="stat-value">{data.summary.meanMW.toLocaleString()} MW</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Total energy</span>
                    <span className="stat-value">{data.summary.totalMWh.toLocaleString()} MWh</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Avg horizon</span>
                    <span className="stat-value">{data.summary.avgHorizonHours}h</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Periods</span>
                    <span className="stat-value">{data.summary.forecastCount}</span>
                  </div>
                </>
              )}
            </div>

            <div className="card">
              <div className="card-title" style={{ marginBottom: '0.5rem' }}>💡 Insight</div>
              {data?.points && data.points.some((p: DecisionPoint) => p.actualMW !== null) ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.7 }}>
                  {(() => {
                    const errors = data.points.filter((p: DecisionPoint) => p.errorMW !== null).map((p: DecisionPoint) => p.errorMW!);
                    const avgError = errors.reduce((a: number, b: number) => a + b, 0) / errors.length;
                    const maxAbsError = Math.max(...errors.map((e: number) => Math.abs(e)));
                    return avgError < 0
                      ? `Forecasts under-predicted wind by ${Math.abs(Math.round(avgError))} MW on average. Worst absolute error: ${Math.round(maxAbsError)} MW.`
                      : `Forecasts over-predicted wind by ${Math.round(avgError)} MW on average. Worst absolute error: ${Math.round(maxAbsError)} MW.`;
                  })()}
                </p>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  Actuals not yet available for this delivery day. Once the day passes, error analysis will appear here.
                </p>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Half-hourly table */}
      {data?.points && data.points.length > 0 && (
        <motion.div
          className="card"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{ marginTop: '1rem' }}
        >
          <div className="card-header">
            <div className="card-title">📋 Half-hourly Data</div>
            <button className="btn btn-ghost" onClick={exportCSV}>📥 CSV</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Forecast (MW)</th>
                  <th>Actual (MW)</th>
                  <th>Error (MW)</th>
                  <th>Horizon (h)</th>
                  <th>Published</th>
                  <th>Band P10</th>
                  <th>Band P90</th>
                  <th>Conservative</th>
                </tr>
              </thead>
              <tbody>
                {data.points.map((p: DecisionPoint, i: number) => (
                  <tr key={i}>
                    <td>{format(new Date(p.startTime), 'HH:mm')}</td>
                    <td>{p.forecastMW.toLocaleString()}</td>
                    <td>{p.actualMW !== null ? p.actualMW.toLocaleString() : '—'}</td>
                    <td className={p.errorMW !== null ? (p.errorMW > 0 ? 'positive' : 'negative') : ''}>
                      {p.errorMW !== null ? `${p.errorMW > 0 ? '+' : ''}${p.errorMW.toLocaleString()}` : '—'}
                    </td>
                    <td>{p.horizonHours}h</td>
                    <td style={{ fontSize: '0.78rem' }}>{format(new Date(p.publishTime), 'dd MMM HH:mm')}</td>
                    <td>{p.bandP10 !== null ? p.bandP10.toLocaleString() : '—'}</td>
                    <td>{p.bandP90 !== null ? p.bandP90.toLocaleString() : '—'}</td>
                    <td>{p.conservativeMW !== null ? p.conservativeMW.toLocaleString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}

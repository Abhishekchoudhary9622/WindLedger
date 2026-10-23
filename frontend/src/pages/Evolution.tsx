import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { fetchEvolution, type EvolutionVersion } from '../api';
import { format } from 'date-fns';

export default function Evolution() {
  const [targetTime, setTargetTime] = useState('2026-01-15T12:00:00Z');
  const [cutoff, setCutoff] = useState('09:20');

  const targetDate = targetTime.split('T')[0];
  const targetHour = targetTime.split('T')[1]?.substring(0, 5) || '12:00';

  const { data, isLoading } = useQuery({
    queryKey: ['evolution', targetTime, cutoff],
    queryFn: () => fetchEvolution(targetTime, cutoff),
  });

  const chartData = data?.versions?.map((v: EvolutionVersion, i: number) => ({
    idx: i,
    publishTime: v.publishTime,
    publishLabel: format(new Date(v.publishTime), 'dd MMM HH:mm'),
    forecastMW: v.forecastMW,
    horizonHours: v.horizonHours,
    isSelected: v.isSelected,
  })) || [];

  const selectedVersion = data?.versions?.find((v: EvolutionVersion) => v.isSelected);

  return (
    <div>
      <motion.div
        className="section-header"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="section-title">🔄 Forecast Evolution</h1>
        <p className="section-subtitle">
          How successive forecast versions revised toward (or away from) the actual value
        </p>
      </motion.div>

      {/* Controls */}
      <div className="controls-row">
        <div className="control-group">
          <label className="control-label">Target date</label>
          <input
            type="date"
            value={targetDate}
            onChange={e => setTargetTime(`${e.target.value}T${targetHour}:00Z`)}
          />
        </div>
        <div className="control-group">
          <label className="control-label">Target hour (UTC)</label>
          <select
            value={targetHour}
            onChange={e => setTargetTime(`${targetDate}T${e.target.value}:00Z`)}
          >
            {Array.from({ length: 24 }, (_, h) => {
              const hh = h.toString().padStart(2, '0');
              return <option key={h} value={`${hh}:00`}>{hh}:00</option>;
            })}
          </select>
        </div>
        <div className="control-group">
          <label className="control-label">Decision cutoff</label>
          <input type="time" value={cutoff} onChange={e => setCutoff(e.target.value)} />
        </div>
      </div>

      <div className="desk-layout">
        {/* Main evolution chart */}
        <motion.div
          className="card"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="card-header">
            <div>
              <div className="card-title">Forecast versions for {format(new Date(targetTime), 'dd MMM yyyy HH:mm')}</div>
              <div className="card-subtitle">
                {data?.versions?.length || 0} forecast versions found.{' '}
                {selectedVersion && `Selected: published ${format(new Date(selectedVersion.publishTime), 'dd MMM HH:mm')}`}
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="skeleton" style={{ width: '100%', height: 400 }} />
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={420}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(34,211,238,0.06)" />
                <XAxis
                  dataKey="publishLabel"
                  stroke="#64748B"
                  fontSize={10}
                  interval={Math.max(0, Math.floor(chartData.length / 8))}
                  angle={-35}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  stroke="#64748B"
                  fontSize={12}
                  tickFormatter={(v: number) => `${(v / 1000).toFixed(1)}k`}
                  label={{ value: 'MW', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(11,18,32,0.95)',
                    border: '1px solid rgba(34,211,238,0.15)',
                    borderRadius: 8,
                  }}
                  formatter={(val: any) => [`${Number(val).toLocaleString()} MW`, 'Forecast']}
                />
                {data?.actualMW != null && (
                  <ReferenceLine
                    y={data.actualMW}
                    stroke="#F59E0B"
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    label={{
                      value: `Actual: ${data.actualMW.toLocaleString()} MW`,
                      fill: '#F59E0B',
                      fontSize: 12,
                      position: 'right',
                    }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="forecastMW"
                  stroke="#22D3EE"
                  strokeWidth={2}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    if (payload.isSelected) {
                      return (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={7}
                          fill="#22D3EE"
                          stroke="#0B1220"
                          strokeWidth={3}
                        />
                      );
                    }
                    return <circle cx={cx} cy={cy} r={3} fill="#22D3EE" opacity={0.5} />;
                  }}
                  name="Forecast"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📡</div>
              <p>No forecast versions found for this target time.</p>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Try a different date within January 2026.
              </p>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginTop: '0.75rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#94A3B8' }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#22D3EE', display: 'inline-block', border: '2px solid #0B1220' }} /> Selected at cutoff
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#94A3B8' }}>
              <span style={{ width: 16, height: 2, background: '#F59E0B', display: 'inline-block', borderTop: '2px dashed #F59E0B' }} /> Actual value
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#94A3B8' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(34,211,238,0.5)', display: 'inline-block' }} /> Other versions
            </span>
          </div>
        </motion.div>

        {/* Version sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="card">
            <div className="card-title" style={{ marginBottom: '0.75rem' }}>📋 Versions</div>
            <div className="evolution-sidebar">
              {data?.versions?.slice().reverse().map((v: EvolutionVersion, i: number) => (
                <div key={i} className={`version-item ${v.isSelected ? 'selected' : ''}`}>
                  <div
                    className="version-dot"
                    style={{
                      background: v.isSelected ? '#22D3EE' : 'rgba(34,211,238,0.3)',
                      boxShadow: v.isSelected ? '0 0 8px rgba(34,211,238,0.4)' : 'none',
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: v.isSelected ? 600 : 400 }}>
                      {format(new Date(v.publishTime), 'dd MMM, HH:mm')}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {v.horizonHours.toFixed(1)}h ahead
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '0.85rem' }}>
                    {v.forecastMW.toLocaleString()}
                  </div>
                  {v.isSelected && (
                    <span className="badge badge-cyan" style={{ marginLeft: 4 }}>Selected</span>
                  )}
                </div>
              ))}
              {(!data?.versions || data.versions.length === 0) && (
                <div className="empty-state" style={{ padding: '1.5rem 0' }}>No versions found</div>
              )}
            </div>
          </div>

          {data?.actualMW != null && selectedVersion && (
            <div className="card" style={{ marginTop: '1rem' }}>
              <div className="card-title" style={{ marginBottom: '0.5rem' }}>🎯 At-cutoff Accuracy</div>
              <div className="stat-row">
                <span className="stat-label">Selected forecast</span>
                <span className="stat-value">{selectedVersion.forecastMW.toLocaleString()} MW</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Actual</span>
                <span className="stat-value" style={{ color: 'var(--amber)' }}>{data.actualMW.toLocaleString()} MW</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Error</span>
                <span className="stat-value" style={{
                  color: selectedVersion.forecastMW - data.actualMW > 0 ? 'var(--coral)' : 'var(--emerald)'
                }}>
                  {selectedVersion.forecastMW - data.actualMW > 0 ? '+' : ''}
                  {Math.round(selectedVersion.forecastMW - data.actualMW).toLocaleString()} MW
                </span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Horizon</span>
                <span className="stat-value">{selectedVersion.horizonHours.toFixed(1)}h</span>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, ComposedChart, Area,
} from 'recharts';
import {
  fetchAccuracySummary, fetchHorizonAccuracy, fetchDailyAccuracy,
  fetchHourlyAccuracy, fetchErrorDistribution, fetchHeatmap,
  type HorizonBucket, type DailyAccuracy, type HourlyAccuracy, type HeatmapCell,
} from '../api';
import { format } from 'date-fns';

export default function AccuracyLab() {
  const [dateFrom, setDateFrom] = useState('2026-01-01');
  const [dateTo, setDateTo] = useState('2026-01-31');
  const [cutoff, setCutoff] = useState('09:20');

  const { data: summary } = useQuery({
    queryKey: ['acc-summary', dateFrom, dateTo, cutoff],
    queryFn: () => fetchAccuracySummary(dateFrom, dateTo, cutoff),
  });

  const { data: horizon } = useQuery({
    queryKey: ['acc-horizon', dateFrom, dateTo, cutoff],
    queryFn: () => fetchHorizonAccuracy(dateFrom, dateTo, cutoff),
  });

  const { data: daily } = useQuery({
    queryKey: ['acc-daily', dateFrom, dateTo, cutoff],
    queryFn: () => fetchDailyAccuracy(dateFrom, dateTo, cutoff),
  });

  const { data: hourly } = useQuery({
    queryKey: ['acc-hourly', dateFrom, dateTo, cutoff],
    queryFn: () => fetchHourlyAccuracy(dateFrom, dateTo, cutoff),
  });

  const { data: distribution } = useQuery({
    queryKey: ['acc-dist', dateFrom, dateTo, cutoff],
    queryFn: () => fetchErrorDistribution(dateFrom, dateTo, cutoff),
  });

  const { data: heatmap } = useQuery({
    queryKey: ['acc-heatmap', dateFrom, dateTo, cutoff],
    queryFn: () => fetchHeatmap(dateFrom, dateTo, cutoff),
  });

  // Build histogram chart data
  const histData = distribution ? distribution.bins.slice(0, -1).map((bin, i) => ({
    bin: `${Math.round(bin)}`,
    count: distribution.counts[i],
    binStart: bin,
    binEnd: distribution.bins[i + 1],
  })) : [];

  // Build heatmap grid
  const heatmapDates = heatmap ? [...new Set(heatmap.map((c: HeatmapCell) => c.date))].sort() : [];
  const maxMAE = heatmap ? Math.max(...heatmap.map((c: HeatmapCell) => c.mae)) : 1;

  return (
    <div>
      <motion.div
        className="section-header"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="section-title">📊 Accuracy Lab</h1>
        <p className="section-subtitle">
          Forecast error analysis for GB wind generation — January 2026
        </p>
      </motion.div>

      {/* Controls */}
      <div className="controls-row">
        <div className="control-group">
          <label className="control-label">From</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        </div>
        <div className="control-group">
          <label className="control-label">To</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
        <div className="control-group">
          <label className="control-label">Decision cutoff</label>
          <input type="time" value={cutoff} onChange={e => setCutoff(e.target.value)} />
        </div>
      </div>

      {/* KPI Row */}
      {summary && (
        <motion.div
          className="kpi-grid"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="kpi-card" style={{ '--kpi-color': 'var(--cyan)' } as React.CSSProperties}>
            <div className="kpi-label">MAE</div>
            <div className="kpi-value">{Math.round(summary.mae)} <span className="kpi-unit">MW</span></div>
            <div className="kpi-detail" title="Mean of |forecast − actual|">Mean absolute error</div>
          </div>
          <div className="kpi-card" style={{ '--kpi-color': 'var(--violet)' } as React.CSSProperties}>
            <div className="kpi-label">RMSE</div>
            <div className="kpi-value">{Math.round(summary.rmse)} <span className="kpi-unit">MW</span></div>
            <div className="kpi-detail" title="√(mean(error²))">Root mean square error</div>
          </div>
          <div className="kpi-card" style={{ '--kpi-color': summary.bias < 0 ? 'var(--emerald)' : 'var(--coral)' } as React.CSSProperties}>
            <div className="kpi-label">Bias</div>
            <div className="kpi-value">{Math.round(summary.bias)} <span className="kpi-unit">MW</span></div>
            <div className="kpi-detail">{summary.bias < 0 ? 'Under-forecast tendency' : 'Over-forecast tendency'}</div>
          </div>
          <div className="kpi-card" style={{ '--kpi-color': 'var(--amber)' } as React.CSSProperties}>
            <div className="kpi-label">nMAE</div>
            <div className="kpi-value">{summary.nmaePct} <span className="kpi-unit">%</span></div>
            <div className="kpi-detail" title="MAE ÷ mean actual × 100">Normalised MAE (avoids MAPE blow-up)</div>
          </div>
          <div className="kpi-card" style={{ '--kpi-color': 'var(--coral)' } as React.CSSProperties}>
            <div className="kpi-label">P90 Error</div>
            <div className="kpi-value">{Math.round(summary.p90Error)} <span className="kpi-unit">MW</span></div>
            <div className="kpi-detail">90th percentile of |error|</div>
          </div>
        </motion.div>
      )}

      {/* Charts grid */}
      <div className="chart-grid">
        {/* Horizon accuracy */}
        <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="card-title" style={{ marginBottom: '0.75rem' }}>🎯 Error by Forecast Horizon</div>
          <div className="card-subtitle" style={{ marginBottom: '1rem' }}>How accuracy degrades with lead time</div>
          {horizon && horizon.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={horizon}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(34,211,238,0.06)" />
                <XAxis dataKey="bucket" stroke="#64748B" fontSize={12} />
                <YAxis stroke="#64748B" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: 'rgba(11,18,32,0.95)', border: '1px solid rgba(34,211,238,0.15)', borderRadius: 8 }}
                  labelStyle={{ color: '#F1F5F9', fontWeight: 600 }}
                />
                <Bar dataKey="mae" fill="#22D3EE" radius={[4, 4, 0, 0]} name="MAE (MW)" />
                <Bar dataKey="bias" fill="#A78BFA" radius={[4, 4, 0, 0]} name="Bias (MW)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">No horizon data available</div>
          )}
        </motion.div>

        {/* Hourly accuracy */}
        <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="card-title" style={{ marginBottom: '0.75rem' }}>🕐 Hourly Accuracy Profile</div>
          <div className="card-subtitle" style={{ marginBottom: '1rem' }}>MAE by hour of day</div>
          {hourly && hourly.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={hourly}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(34,211,238,0.06)" />
                <XAxis dataKey="hour" stroke="#64748B" fontSize={12} />
                <YAxis stroke="#64748B" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: 'rgba(11,18,32,0.95)', border: '1px solid rgba(34,211,238,0.15)', borderRadius: 8 }}
                />
                <Area type="monotone" dataKey="mae" fill="rgba(34,211,238,0.1)" stroke="#22D3EE" strokeWidth={2} name="MAE (MW)" />
                <Line type="monotone" dataKey="rmse" stroke="#A78BFA" strokeWidth={1.5} dot={false} name="RMSE (MW)" />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">No hourly data available</div>
          )}
        </motion.div>

        {/* Daily MAE timeline */}
        <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <div className="card-title" style={{ marginBottom: '0.75rem' }}>📅 Daily MAE Timeline</div>
          <div className="card-subtitle" style={{ marginBottom: '1rem' }}>Track accuracy over time</div>
          {daily && daily.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(34,211,238,0.06)" />
                <XAxis
                  dataKey="date"
                  stroke="#64748B"
                  fontSize={11}
                  tickFormatter={(d: string) => format(new Date(d + 'T00:00:00'), 'dd')}
                />
                <YAxis stroke="#64748B" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: 'rgba(11,18,32,0.95)', border: '1px solid rgba(34,211,238,0.15)', borderRadius: 8 }}
                  labelFormatter={(d: any) => d ? format(new Date(String(d) + 'T00:00:00'), 'dd MMM yyyy') : ''}
                />
                <Area type="monotone" dataKey="mae" fill="rgba(34,211,238,0.08)" stroke="#22D3EE" strokeWidth={2} name="MAE (MW)" />
                <Line type="monotone" dataKey="bias" stroke="#F87171" strokeWidth={1.5} dot={false} name="Bias (MW)" />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">No daily data available</div>
          )}
        </motion.div>

        {/* Error distribution */}
        <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <div className="card-title" style={{ marginBottom: '0.75rem' }}>📈 Error Distribution</div>
          <div className="card-subtitle" style={{ marginBottom: '1rem' }}>Histogram of forecast errors (MW)</div>
          {histData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={histData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(34,211,238,0.06)" />
                  <XAxis dataKey="bin" stroke="#64748B" fontSize={10} interval={3} />
                  <YAxis stroke="#64748B" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: 'rgba(11,18,32,0.95)', border: '1px solid rgba(34,211,238,0.15)', borderRadius: 8 }}
                    formatter={(val: any) => [val, 'Count']}
                  />
                  <Bar dataKey="count" fill="#22D3EE" radius={[3, 3, 0, 0]} opacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--coral)' }}>
                    {distribution?.largestUnder?.toLocaleString()} MW
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Largest under-forecast</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--amber)' }}>
                    +{distribution?.largestOver?.toLocaleString()} MW
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Largest over-forecast</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--violet)' }}>
                    {distribution?.pctAbove1GW}%
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Periods with &gt;1 GW error</div>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state">No distribution data available</div>
          )}
        </motion.div>
      </div>

      {/* Heatmap */}
      {heatmap && heatmap.length > 0 && (
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          style={{ marginTop: '1rem' }}
        >
          <div className="card-header">
            <div>
              <div className="card-title">🗓️ Error Heatmap — Day × Hour of Day</div>
              <div className="card-subtitle">Darker = higher MAE. Hover for values.</div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>Low</span>
              <div style={{ display: 'flex', gap: 2 }}>
                {[0.1, 0.3, 0.5, 0.7, 0.9].map(o => (
                  <div key={o} style={{ width: 16, height: 12, borderRadius: 2, background: `rgba(34,211,238,${o})` }} />
                ))}
              </div>
              <span>High</span>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto repeat(24, 1fr)', gap: 2, minWidth: 700 }}>
              {/* Header row */}
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', padding: '4px 8px' }}></div>
              {Array.from({ length: 24 }, (_, h) => (
                <div key={h} style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center', padding: 2 }}>
                  {h.toString().padStart(2, '0')}
                </div>
              ))}
              {/* Data rows */}
              {heatmapDates.map(date => (
                <>
                  <div key={`label-${date}`} style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', padding: '4px 8px', whiteSpace: 'nowrap' }}>
                    {format(new Date(date + 'T00:00:00'), 'dd MMM')}
                  </div>
                  {Array.from({ length: 24 }, (_, h) => {
                    const cell = heatmap.find((c: HeatmapCell) => c.date === date && c.hour === h);
                    const intensity = cell ? Math.min(cell.mae / maxMAE, 1) : 0;
                    return (
                      <div
                        key={`${date}-${h}`}
                        style={{
                          background: cell ? `rgba(34,211,238,${0.1 + intensity * 0.8})` : 'rgba(34,211,238,0.03)',
                          borderRadius: 2,
                          aspectRatio: '1',
                          cursor: 'crosshair',
                          minHeight: 18,
                          transition: 'transform 0.15s',
                        }}
                        title={cell ? `${date} ${h}:00 — MAE: ${cell.mae} MW` : `${date} ${h}:00 — No data`}
                      />
                    );
                  })}
                </>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

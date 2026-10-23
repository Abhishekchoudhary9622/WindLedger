import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart,
} from 'recharts';
import { fetchAccuracySummary, fetchDecision, fetchMeta } from '../api';
import { format } from 'date-fns';

function AnimatedValue({ value, suffix = '' }: { value: number | string; suffix?: string }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {typeof value === 'number' ? value.toLocaleString() : value}
      {suffix && <span className="kpi-unit">{suffix}</span>}
    </motion.span>
  );
}

export default function Overview() {
  const navigate = useNavigate();

  const { data: meta } = useQuery({ queryKey: ['meta'], queryFn: fetchMeta });

  const { data: summary } = useQuery({
    queryKey: ['accuracy-summary', '2026-01-01', '2026-01-31', '09:20'],
    queryFn: () => fetchAccuracySummary('2026-01-01', '2026-01-31', '09:20'),
  });

  const { data: latestForecast } = useQuery({
    queryKey: ['decision', '2026-01-15', '09:20'],
    queryFn: () => fetchDecision('2026-01-15', '09:20'),
  });

  const chartData = latestForecast?.points?.map(p => ({
    time: format(new Date(p.startTime), 'HH:mm'),
    forecast: p.forecastMW,
    actual: p.actualMW,
    bandP10: p.bandP10,
    bandP90: p.bandP90,
  })) || [];

  return (
    <div>
      {/* Hero */}
      <motion.div
        className="hero"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="hero-title">Tomorrow's wind, with the error built in.</h1>
        <p className="hero-tagline">
          Know the wind. Know the error. Buy with confidence.
          <br />
          GB national wind forecast accuracy for day-ahead power trading.
        </p>
        <button className="btn btn-primary" onClick={() => navigate('/decision')}>
          ⚡ Open Decision Desk
        </button>
      </motion.div>

      {/* KPI Cards */}
      <motion.div
        className="kpi-grid"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        <div className="kpi-card" style={{ '--kpi-color': 'var(--cyan)' } as React.CSSProperties}>
          <div className="kpi-label">Mean Absolute Error</div>
          <div className="kpi-value">
            {summary ? <AnimatedValue value={Math.round(summary.mae)} suffix=" MW" /> : <span className="skeleton" style={{ width: 80, height: 32, display: 'inline-block' }} />}
          </div>
          <div className="kpi-detail">Jan 2026 • Decision cutoff 09:20</div>
        </div>

        <div className="kpi-card" style={{ '--kpi-color': 'var(--amber)' } as React.CSSProperties}>
          <div className="kpi-label">Normalised MAE</div>
          <div className="kpi-value">
            {summary ? <AnimatedValue value={summary.nmaePct} suffix="%" /> : <span className="skeleton" style={{ width: 60, height: 32, display: 'inline-block' }} />}
          </div>
          <div className="kpi-detail">MAE ÷ mean actual generation</div>
        </div>

        <div className="kpi-card" style={{ '--kpi-color': 'var(--violet)' } as React.CSSProperties}>
          <div className="kpi-label">RMSE</div>
          <div className="kpi-value">
            {summary ? <AnimatedValue value={Math.round(summary.rmse)} suffix=" MW" /> : <span className="skeleton" style={{ width: 80, height: 32, display: 'inline-block' }} />}
          </div>
          <div className="kpi-detail">Root mean square error</div>
        </div>

        <div className="kpi-card" style={{ '--kpi-color': summary?.bias && summary.bias < 0 ? 'var(--emerald)' : 'var(--coral)' } as React.CSSProperties}>
          <div className="kpi-label">Forecast Bias</div>
          <div className="kpi-value">
            {summary ? <AnimatedValue value={Math.round(summary.bias)} suffix=" MW" /> : <span className="skeleton" style={{ width: 80, height: 32, display: 'inline-block' }} />}
          </div>
          <div className="kpi-detail">{summary?.bias && summary.bias < 0 ? 'Slight under-forecast' : 'Slight over-forecast'}</div>
        </div>
      </motion.div>

      {/* Mini chart */}
      <motion.div
        className="card chart-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        <div className="card-header">
          <div>
            <div className="card-title">📈 Decision Forecast Preview — 15 Jan 2026</div>
            <div className="card-subtitle">Latest forecast at 09:20 cutoff, with P10–P90 uncertainty band</div>
          </div>
          <button className="btn btn-ghost" onClick={() => navigate('/decision')}>
            Full view →
          </button>
        </div>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={340}>
            <ComposedChart data={chartData}>
              <defs>
                <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#A78BFA" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#A78BFA" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(34,211,238,0.06)" />
              <XAxis dataKey="time" stroke="#64748B" fontSize={12} />
              <YAxis stroke="#64748B" fontSize={12} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(11,18,32,0.95)',
                  border: '1px solid rgba(34,211,238,0.15)',
                  borderRadius: 8,
                  fontSize: 13,
                }}
                labelStyle={{ color: '#F1F5F9', fontWeight: 600 }}
              />
              <Area dataKey="bandP90" stroke="none" fill="url(#bandGrad)" />
              <Area dataKey="bandP10" stroke="none" fill="transparent" />
              <Line type="monotone" dataKey="forecast" stroke="#22D3EE" strokeWidth={2.5} dot={false} name="Forecast" />
              <Line type="monotone" dataKey="actual" stroke="#F59E0B" strokeWidth={2} dot={false} name="Actual" strokeDasharray="4 2" />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">🌬️</div>
            <p>Loading forecast data...</p>
          </div>
        )}
      </motion.div>

      {/* Data info */}
      {meta && (
        <motion.div
          className="card"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          style={{ marginTop: '1rem' }}
        >
          <div className="card-title" style={{ marginBottom: '0.75rem' }}>📋 Data Summary</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <span className="control-label">Forecast records</span>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 600, marginTop: 4 }}>
                {meta.forecastCount.toLocaleString()}
              </div>
            </div>
            <div>
              <span className="control-label">Actual records</span>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 600, marginTop: 4 }}>
                {meta.actualCount.toLocaleString()}
              </div>
            </div>
            <div>
              <span className="control-label">Available dates</span>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 600, marginTop: 4 }}>
                {meta.availableDates.length} days
              </div>
            </div>
            <div>
              <span className="control-label">Default cutoff</span>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 600, marginTop: 4 }}>
                {meta.defaultCutoff} (D-1)
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

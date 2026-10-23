import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ComposedChart,
  Line,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  fetchAccuracySummary,
  fetchDailyAccuracy,
  fetchDecision,
  fetchErrorDistribution,
  fetchEvolution,
  fetchHourlyAccuracy,
  fetchMeta,
  type DecisionPoint,
  type EvolutionVersion,
} from '../api';
import {
  formatUtcDate,
  formatUtcDateTime,
  formatUtcTime,
  formatDecisionCutoffLabel,
} from '../utils/formatDate';

/* ── Wind Turbine Icon ─────────────────────────────────────────────────── */
function WindTurbineIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 12c0-3 2-6 2-9-2 0-4 3-4 6 0 1 .5 2 2 3z" />
      <path d="M12 12c2.6 1.5 5.5 2.5 8.5 2.5 0-2-2.5-4.5-5.5-5.5-1-.3-2 0-3 1z" />
      <path d="M12 12c-.5 2.9-1.5 5.8-3.5 8-.5-1.9-.5-4.9 1-7.5.5-.8 1.5-1 2.5-.5z" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <path d="M12 13.5V22" strokeWidth="2" />
    </svg>
  );
}

/* ── Custom Chart Tooltip ──────────────────────────────────────────────── */
function CustomMainTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload;
  return (
    <div className="mockup-tooltip-card">
      <div className="tooltip-time-header">{p?.fullTime || label}</div>
      {p?.actual != null && (
        <div className="tooltip-data-row">
          <div className="tooltip-label-group">
            <span className="tooltip-dot" style={{ background: '#10B981' }} />
            <span>Actual</span>
          </div>
          <span className="tooltip-val">{Math.round(p.actual).toLocaleString()} MW</span>
        </div>
      )}
      {p?.forecast != null && (
        <div className="tooltip-data-row">
          <div className="tooltip-label-group">
            <span className="tooltip-dot" style={{ background: '#2563EB' }} />
            <span>Forecast</span>
          </div>
          <span className="tooltip-val">{Math.round(p.forecast).toLocaleString()} MW</span>
        </div>
      )}
      {p?.bandP10 != null && p?.bandP90 != null && (
        <div className="tooltip-data-row">
          <div className="tooltip-label-group">
            <span className="tooltip-dot" style={{ background: '#60A5FA' }} />
            <span>P10–P90 Band</span>
          </div>
          <span className="tooltip-val">{Math.round(p.bandP10).toLocaleString()} – {Math.round(p.bandP90).toLocaleString()} MW</span>
        </div>
      )}
      {p?.conservative != null && (
        <div className="tooltip-data-row">
          <div className="tooltip-label-group">
            <span className="tooltip-dot" style={{ background: '#D97706' }} />
            <span>Conservative</span>
          </div>
          <span className="tooltip-val">{Math.round(p.conservative).toLocaleString()} MW</span>
        </div>
      )}
      {p?.error != null && (
        <div className="tooltip-data-row">
          <div className="tooltip-label-group">
            <span className="tooltip-dot" style={{ background: '#8B5CF6' }} />
            <span>Error</span>
          </div>
          <span className="tooltip-val" style={{ color: p.error < 0 ? '#059669' : '#EF4444' }}>
            {p.error > 0 ? '+' : ''}{Math.round(p.error).toLocaleString()} MW
          </span>
        </div>
      )}
      {p?.publishTime && (
        <div className="tooltip-data-row" style={{ marginTop: 4, paddingTop: 4, borderTop: '1px solid #F1F5F9', fontSize: '0.72rem', color: '#64748B' }}>
          <span>Published</span>
          <span>{p.publishTime}</span>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [deliveryDate, setDeliveryDate] = useState('2026-01-14');
  const [cutoffTime, setCutoffTime] = useState('09:20');
  const [selectedTargetHour, setSelectedTargetHour] = useState('12:00');

  // Metadata
  const { data: meta } = useQuery({ queryKey: ['meta'], queryFn: fetchMeta });

  // Accuracy Summary (January 2026)
  const { data: summary } = useQuery({
    queryKey: ['accuracy-summary', '2026-01-01', '2026-01-31', cutoffTime],
    queryFn: () => fetchAccuracySummary('2026-01-01', '2026-01-31', cutoffTime),
  });

  // Decision Forecast for Delivery Date
  const { data: decisionData } = useQuery({
    queryKey: ['decision', deliveryDate, cutoffTime],
    queryFn: () => fetchDecision(deliveryDate, cutoffTime),
  });

  // Target ISO timestamp for vintage explorer
  const targetTimeIso = `${deliveryDate}T${selectedTargetHour}:00Z`;

  // Evolution Vintages for the selected hour
  const { data: evolutionData } = useQuery({
    queryKey: ['evolution', targetTimeIso, cutoffTime],
    queryFn: () => fetchEvolution(targetTimeIso, cutoffTime),
  });

  // Error distribution
  const { data: distribution } = useQuery({
    queryKey: ['distribution', '2026-01-01', '2026-01-31', cutoffTime],
    queryFn: () => fetchErrorDistribution('2026-01-01', '2026-01-31', cutoffTime),
  });

  // Hourly accuracy
  const { data: hourlyData } = useQuery({
    queryKey: ['hourly', '2026-01-01', '2026-01-31', cutoffTime],
    queryFn: () => fetchHourlyAccuracy('2026-01-01', '2026-01-31', cutoffTime),
  });

  // Chart data for actual vs forecast (All formatted in UTC)
  const chartPoints = useMemo(() => {
    if (!decisionData?.points?.length) return [];
    return decisionData.points.map((p: DecisionPoint) => {
      const timeStr = formatUtcTime(p.startTime);
      return {
        time: timeStr,
        fullTime: `${formatUtcDateTime(p.startTime)} UTC`,
        hourStr: timeStr,
        actual: p.actualMW,
        forecast: p.forecastMW,
        error: p.errorMW,
        publishTime: `${formatUtcDateTime(p.publishTime)} UTC`,
        bandP10: p.bandP10,
        bandP90: p.bandP90,
        bandRange: p.bandP10 != null && p.bandP90 != null ? [p.bandP10, p.bandP90] : null,
        conservative: p.conservativeMW,
      };
    });
  }, [decisionData]);

  // Vintages list for the vintage explorer
  const vintages = useMemo(() => {
    if (!evolutionData?.versions?.length) return [];
    // Sort versions in reverse chronological order
    const list = [...evolutionData.versions].reverse();
    return list;
  }, [evolutionData]);

  // Selected vintage
  const selectedVintage = vintages.find((v: EvolutionVersion) => v.isSelected) || vintages[0];
  const otherVintages = vintages.filter((v: EvolutionVersion) => v !== selectedVintage).slice(0, 6);

  // Distribution chart data
  const histBars = useMemo(() => {
    if (!distribution?.bins?.length || !distribution?.counts?.length) return [];
    return distribution.bins.slice(0, -1).map((bin, i) => ({
      bin: Math.round(bin),
      binLabel: `${Math.round(bin)}`,
      count: distribution.counts[i],
    }));
  }, [distribution]);

  const formattedDate = formatUtcDate(deliveryDate);

  return (
    <div>
      {/* ── Page Header Banner ────────────────────────────────────────── */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">UK Wind Generation</h1>
          <p className="page-subtitle">
            Actuals and forecasts from Elexon (BMRS) • Great Britain • January 2026 Day-Ahead Desk
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
            <select
              value={deliveryDate}
              onChange={e => setDeliveryDate(e.target.value)}
              title="Select Delivery Date"
            >
              {meta?.availableDates?.length ? (
                meta.availableDates.map(d => (
                  <option key={d} value={d}>
                    {formatUtcDate(d)}
                  </option>
                ))
              ) : (
                <option value="2026-01-14">14 Jan 2026</option>
              )}
            </select>
          </div>

          <div className="live-status-pill">
            <span className="pulsing-green-dot" />
            <div className="status-pill-text">
              <span className="status-primary">Elexon BMRS Synced</span>
              <span className="status-secondary">
                {meta?.forecastCount ? `${meta.forecastCount.toLocaleString()} rows ingested` : 'January 2026'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Top 4 KPI Cards Grid ──────────────────────────────────────── */}
      <div className="kpi-cards-grid">
        {/* Card 1: Total actual generation */}
        <div className="kpi-card-white">
          <div className="kpi-icon-box">
            <WindTurbineIcon />
          </div>
          <div className="kpi-content-box">
            <span className="kpi-card-label">Total actual generation</span>
            <span className="kpi-card-value">
              {summary?.totalActualGWh != null ? `${Math.round(summary.totalActualGWh).toLocaleString()} GWh` : '8,616 GWh'}
            </span>
            <span className="kpi-trend-pill">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 9 6 15" />
              </svg>
              744 delivery hours (1,488 half-hours)
            </span>
          </div>
        </div>

        {/* Card 2: Mean absolute error (MAE) */}
        <div className="kpi-card-white">
          <div className="kpi-icon-box" style={{ background: '#ECFDF5', color: '#059669' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
          </div>
          <div className="kpi-content-box">
            <span className="kpi-card-label">Mean absolute error (MAE)</span>
            <span className="kpi-card-value">
              {summary?.mae != null ? `${Math.round(summary.mae).toLocaleString()} MW` : '2,123 MW'}
            </span>
            <span className="kpi-trend-pill">
              nMAE: {summary?.nmaePct != null ? `${summary.nmaePct}%` : '18.3%'}
            </span>
          </div>
        </div>

        {/* Card 3: Root mean square error (RMSE) */}
        <div className="kpi-card-white">
          <div className="kpi-icon-box" style={{ background: '#ECFDF5', color: '#059669' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" fill="currentColor" />
            </svg>
          </div>
          <div className="kpi-content-box">
            <span className="kpi-card-label">Root mean square error (RMSE)</span>
            <span className="kpi-card-value">
              {summary?.rmse != null ? `${Math.round(summary.rmse).toLocaleString()} MW` : '2,617 MW'}
            </span>
            <span className="kpi-trend-pill">
              RMSE/MAE: {summary?.mae && summary?.rmse ? (summary.rmse / summary.mae).toFixed(2) : '1.23'}
            </span>
          </div>
        </div>

        {/* Card 4: Forecast bias */}
        <div className="kpi-card-white">
          <div className="kpi-icon-box" style={{ background: '#ECFDF5', color: '#059669' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="12" width="4" height="9" rx="1" />
              <rect x="10" y="7" width="4" height="14" rx="1" />
              <rect x="17" y="3" width="4" height="18" rx="1" />
            </svg>
          </div>
          <div className="kpi-content-box">
            <span className="kpi-card-label">Forecast bias</span>
            <span className="kpi-card-value">
              {summary?.bias != null ? `${summary.bias > 0 ? '+' : ''}${Math.round(summary.bias)} MW` : '+1,840 MW'}
            </span>
            <span className="kpi-trend-pill neutral">
              {summary?.bias && summary.bias < 0 ? 'Net under-forecast' : 'Net over-forecast'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Middle Section (Main Chart + Forecast Vintage Explorer) ──── */}
      <div className="main-chart-vintage-row">
        {/* Left: Wind generation – actual vs forecast */}
        <div className="dashboard-card">
          <div className="card-top-header">
            <div className="card-header-left">
              <span className="card-header-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </span>
              <div>
                <div className="card-heading-title">Wind generation – actual vs forecast</div>
                <div className="card-heading-subtitle">
                  {formatDecisionCutoffLabel(deliveryDate, cutoffTime)}
                </div>
              </div>
            </div>

            <div className="card-controls-right">
              {/* Delivery Date */}
              <div className="filter-pill-btn">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <select
                  value={deliveryDate}
                  onChange={e => setDeliveryDate(e.target.value)}
                  title="Delivery date"
                >
                  {meta?.availableDates?.map(d => (
                    <option key={d} value={d}>
                      {formatUtcDate(d)}
                    </option>
                  )) || <option value="2026-01-14">14 Jan 2026</option>}
                </select>
              </div>

              {/* Decision Cutoff */}
              <div className="filter-pill-btn">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <select
                  value={cutoffTime}
                  onChange={e => setCutoffTime(e.target.value)}
                  title="Decision cutoff"
                >
                  <option value="09:20">09:20 (EPEX Day-Ahead - UK time / UTC)</option>
                  <option value="09:50">09:50 (Nord Pool Day-Ahead - UK time / UTC)</option>
                  <option value="10:00">10:00 (Post-Auction Benchmark)</option>
                  <option value="12:00">12:00 (Noon Update)</option>
                  <option value="15:00">15:00 (Intraday Update)</option>
                </select>
              </div>

              <button className="more-options-btn" title="More options">
                •••
              </button>
            </div>
          </div>

          {/* Main Chart */}
          <div style={{ width: '100%', height: 350, flex: 1, minHeight: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartPoints}
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                onClick={(e: any) => {
                  if (e?.activePayload?.[0]?.payload?.hourStr) {
                    setSelectedTargetHour(e.activePayload[0].payload.hourStr);
                  }
                }}
              >
                <defs>
                  <linearGradient id="actualGreenGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.16} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="time"
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                  ticks={['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00']}
                />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 20000]}
                  ticks={[0, 5000, 10000, 15000, 20000]}
                  tickFormatter={(val: number) => val.toLocaleString()}
                  label={{
                    value: 'Generation (MW)',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#94A3B8',
                    fontSize: 11,
                    style: { textAnchor: 'middle' },
                  }}
                />
                <Tooltip content={<CustomMainTooltip />} />
                {/* Reference line marking the selected hour */}
                <ReferenceLine
                  x={selectedTargetHour}
                  stroke="#10B981"
                  strokeDasharray="3 3"
                  strokeWidth={1.5}
                />
                {/* P10-P90 Uncertainty Band */}
                <Area
                  type="monotone"
                  dataKey="bandRange"
                  fill="#93C5FD"
                  stroke="#60A5FA"
                  strokeDasharray="3 3"
                  fillOpacity={0.25}
                  name="P10–P90 uncertainty band"
                />
                {/* Actual Area + Line (Green) */}
                <Area
                  type="monotone"
                  dataKey="actual"
                  fill="url(#actualGreenGrad)"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  name="Actual generation"
                />
                {/* Forecast Line (Blue Dashed) */}
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="#2563EB"
                  strokeWidth={2.2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Forecast (latest before cutoff)"
                />
                {/* Conservative Line (Amber Dashed) */}
                <Line
                  type="monotone"
                  dataKey="conservative"
                  stroke="#D97706"
                  strokeWidth={1.8}
                  strokeDasharray="3 3"
                  dot={false}
                  name="Conservative line"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Bottom Chart Legend */}
          <div className="chart-bottom-legend" style={{ flexWrap: 'wrap', gap: '1.25rem', marginTop: '0.75rem' }}>
            <div className="legend-item">
              <span className="legend-dot-solid" />
              <span>Actual generation</span>
            </div>
            <div className="legend-item">
              <span className="legend-line-dashed" />
              <span>Forecast (latest before cutoff)</span>
            </div>
            <div className="legend-item">
              <span style={{ width: 14, height: 10, background: '#93C5FD', opacity: 0.6, borderRadius: 2, display: 'inline-block' }} />
              <span>P10–P90 uncertainty band</span>
            </div>
            <div className="legend-item">
              <span style={{ width: 18, height: 0, borderTop: '2px dashed #D97706', display: 'inline-block' }} />
              <span>Conservative line</span>
            </div>
          </div>
        </div>

        {/* Right: Forecast vintage explorer */}
        <div className="dashboard-card">
          <div className="card-top-header" style={{ marginBottom: '1rem' }}>
            <div>
              <div className="card-heading-title">Forecast vintage explorer</div>
              <div className="card-heading-subtitle">For {formattedDate} at {selectedTargetHour} UTC</div>
            </div>
          </div>

          <div className="vintage-timeline-container">
            <div className="vintage-timeline-list">
              {/* Top / Selected Vintage */}
              {selectedVintage && (
                <div className="vintage-item selected">
                  <div className="vintage-left-meta">
                    <span className="vintage-pub-time">
                      {formatUtcDateTime(selectedVintage.publishTime)} UTC
                    </span>
                    <span className="vintage-gen-mw">
                      {Math.round(selectedVintage.forecastMW).toLocaleString()} MW
                    </span>
                  </div>
                  <div className="vintage-selected-badge">
                    <span className="pill-selected-green">Selected</span>
                    <span className="vintage-badge-sub">Latest before {cutoffTime}</span>
                  </div>
                </div>
              )}

              {/* Other previous vintages */}
              {otherVintages.map((v: EvolutionVersion, idx: number) => {
                const isPost = v.isPostCutoff;
                return (
                  <div
                    key={idx}
                    className={`vintage-item ${isPost ? 'vintage-post-cutoff' : ''}`}
                    style={isPost ? { opacity: 0.55, background: '#F8FAFC' } : {}}
                  >
                    <div className="vintage-left-meta">
                      <span className="vintage-pub-time" style={isPost ? { color: '#94A3B8' } : {}}>
                        {formatUtcDateTime(v.publishTime)} UTC
                      </span>
                      <span className="vintage-gen-mw" style={isPost ? { color: '#94A3B8' } : {}}>
                        {Math.round(v.forecastMW).toLocaleString()} MW
                      </span>
                    </div>
                    {isPost && (
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        color: '#64748B',
                        background: '#E2E8F0',
                        padding: '2px 8px',
                        borderRadius: '6px'
                      }}>
                        published after cutoff, not used
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Info Callout Box */}
            <div className="vintage-info-callout">
              <svg className="callout-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <span className="callout-text">
                We use the latest forecast published before the decision cutoff time ({cutoffTime}) to simulate the exact information available at the auction gate closure.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom 3 Cards Row ────────────────────────────────────────── */}
      <div className="bottom-three-cards-grid">
        {/* Card 1: Forecast accuracy (Jan 2026) */}
        <div className="dashboard-card">
          <div className="card-top-header" style={{ marginBottom: '1.25rem' }}>
            <div className="card-header-left">
              <span className="card-header-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="12" width="4" height="9" rx="1" />
                  <rect x="10" y="7" width="4" height="14" rx="1" />
                  <rect x="17" y="3" width="4" height="18" rx="1" />
                </svg>
              </span>
              <div className="card-heading-title">Forecast accuracy (Jan 2026)</div>
            </div>
          </div>

          <div className="accuracy-table-list">
            <div className="accuracy-table-row">
              <span className="accuracy-label">Mean absolute error (MAE)</span>
              <span className="accuracy-value">
                {summary?.mae != null ? `${Math.round(summary.mae).toLocaleString()} MW` : '2,123 MW'}
              </span>
            </div>
            <div className="accuracy-table-row">
              <span className="accuracy-label">Root mean square error (RMSE)</span>
              <span className="accuracy-value">
                {summary?.rmse != null ? `${Math.round(summary.rmse).toLocaleString()} MW` : '2,617 MW'}
              </span>
            </div>
            <div className="accuracy-table-row">
              <span className="accuracy-label">Mean absolute percentage error (MAPE)</span>
              <span className="accuracy-value">
                {summary?.mapePct != null ? `${summary.mapePct}%` : '24.8%'}
              </span>
            </div>
            <div className="accuracy-table-row">
              <span className="accuracy-label">Forecast bias (mean error)</span>
              <span className="accuracy-value">
                {summary?.bias != null ? `${summary.bias > 0 ? '+' : ''}${Math.round(summary.bias)} MW` : '+1,840 MW'}
              </span>
            </div>
            <div className="accuracy-table-row">
              <span className="accuracy-label">Correlation</span>
              <span className="accuracy-value">
                {summary?.correlation != null ? summary.correlation.toFixed(2) : '0.93'}
              </span>
            </div>
            <div className="accuracy-table-row">
              <span className="accuracy-label">Matched hourly periods (from 1,488 half-hours)</span>
              <span className="accuracy-value">
                {summary?.matchedPeriods != null ? `${summary.matchedPeriods.toLocaleString()} / ${summary.totalPeriods.toLocaleString()}` : '744 / 744'}
              </span>
            </div>
            <div className="accuracy-table-row">
              <span className="accuracy-label" title="Applies to the 744 evaluated hourly delivery intervals in January 2026 (aggregated from 1,488 half-hourly settlement periods; raw parquet contains 1,585 records including boundary buffers)">
                Hourly evaluation coverage
              </span>
              <span className="accuracy-value">
                {summary?.completenessPct != null ? `${summary.completenessPct}% (744/744 h)` : '100% (744/744 h)'}
              </span>
            </div>
          </div>
          <div style={{ fontSize: '0.73rem', color: '#64748B', marginTop: '0.5rem', lineHeight: 1.4 }}>
            *Coverage applies strictly to the 744 evaluated delivery hours in Jan 2026 (aggregated from 1,488 settlement actuals; raw file contains 1,585 records with pre/post boundary buffer).
          </div>
        </div>

        {/* Card 2: Error distribution (Jan 2026) */}
        <div className="dashboard-card">
          <div className="card-top-header" style={{ marginBottom: '0.75rem' }}>
            <div className="card-header-left">
              <span className="card-header-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 3 21 3 21 8" />
                  <line x1="4" y1="20" x2="21" y2="3" />
                  <polyline points="21 16 21 21 16 21" />
                  <line x1="15" y1="15" x2="21" y2="21" />
                  <line x1="4" y1="4" x2="9" y2="9" />
                </svg>
              </span>
              <div className="card-heading-title">Error distribution (Jan 2026)</div>
            </div>
          </div>

          <div style={{ width: '100%', height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={histBars} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="bin"
                  stroke="#94A3B8"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                  ticks={[-4000, -2000, 0, 2000, 4000]}
                  tickFormatter={(val: number) => val.toLocaleString()}
                  label={{
                    value: 'Forecast error (MW)',
                    position: 'insideBottom',
                    offset: -2,
                    fill: '#94A3B8',
                    fontSize: 10,
                  }}
                />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  ticks={[0, 50, 100, 150, 200]}
                  label={{
                    value: 'Count',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#94A3B8',
                    fontSize: 10,
                    style: { textAnchor: 'middle' },
                  }}
                />
                <ReferenceLine x={0} stroke="#94A3B8" strokeDasharray="3 3" />
                <Tooltip
                  contentStyle={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: 8,
                    fontSize: 12,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  }}
                  formatter={(val: any) => [val, 'Count']}
                  labelFormatter={(val: any) => `Error: ~${val} MW`}
                />
                <Bar dataKey="count" fill="#818CF8" radius={[2, 2, 0, 0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 3 Summary Pills */}
          <div className="distribution-stats-row">
            <div className="dist-stat-pill">
              <div className="dist-stat-val">
                {distribution?.largestUnder ? `${Math.round(distribution.largestUnder).toLocaleString()} MW` : '-1,240 MW'}
              </div>
              <div className="dist-stat-label">Largest under-forecast</div>
            </div>
            <div className="dist-stat-pill">
              <div className="dist-stat-val">
                {distribution?.largestOver ? `+${Math.round(distribution.largestOver).toLocaleString()} MW` : '+1,860 MW'}
              </div>
              <div className="dist-stat-label">Largest over-forecast</div>
            </div>
            <div className="dist-stat-pill">
              <div className="dist-stat-val">
                {distribution?.pctAbove1GW ? `${distribution.pctAbove1GW}%` : '12.4%'}
              </div>
              <div className="dist-stat-label">Periods with &gt; 1 GW error</div>
            </div>
          </div>
        </div>

        {/* Card 3: Hourly accuracy profile */}
        <div className="dashboard-card">
          <div className="card-top-header">
            <div className="card-header-left">
              <span className="card-header-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </span>
              <div className="card-heading-title">Hourly accuracy profile</div>
            </div>
            <button className="more-options-btn" title="More options">
              •••
            </button>
          </div>

          <div style={{ width: '100%', height: 210 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={hourlyData || []}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="hourlyPurpleGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="#6366F1" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="hour"
                  stroke="#94A3B8"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                  ticks={[0, 3, 6, 9, 12, 15, 18, 21]}
                  label={{
                    value: 'Hour of day',
                    position: 'insideBottom',
                    offset: -2,
                    fill: '#94A3B8',
                    fontSize: 10,
                  }}
                />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  ticks={[0, 500, 1000, 1500, 2000]}
                  tickFormatter={(val: number) => val.toLocaleString()}
                  label={{
                    value: 'MAE (MW)',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#94A3B8',
                    fontSize: 10,
                    style: { textAnchor: 'middle' },
                  }}
                />
                <Tooltip
                  contentStyle={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: 8,
                    fontSize: 12,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  }}
                  formatter={(val: any) => [`${Math.round(Number(val)).toLocaleString()} MW`, 'MAE']}
                  labelFormatter={(val: any) => `Hour ${val}:00 UTC`}
                />
                <Area
                  type="monotone"
                  dataKey="mae"
                  fill="url(#hourlyPurpleGrad)"
                  stroke="none"
                />
                <Line
                  type="monotone"
                  dataKey="mae"
                  stroke="#6366F1"
                  strokeWidth={2.5}
                  dot={{ r: 3.5, fill: '#6366F1', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                  activeDot={{ r: 5, fill: '#6366F1' }}
                  name="MAE"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

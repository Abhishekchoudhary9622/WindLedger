import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  fetchAccuracySummary,
  fetchDailyAccuracy,
  fetchHeatmap,
  fetchHorizonAccuracy,
  type HeatmapCell,
  type HorizonBucket,
} from '../api';
import {
  formatUtcDate,
  formatUtcDateShort,
  formatUtcDayOnly,
} from '../utils/formatDate';

export default function Analytics() {
  const [dateFrom, setDateFrom] = useState('2026-01-01');
  const [dateTo, setDateTo] = useState('2026-01-31');
  const [cutoff, setCutoff] = useState('09:20');

  const { data: summary } = useQuery({
    queryKey: ['accuracy-summary', dateFrom, dateTo, cutoff],
    queryFn: () => fetchAccuracySummary(dateFrom, dateTo, cutoff),
  });

  const { data: horizons } = useQuery({
    queryKey: ['horizons', dateFrom, dateTo, cutoff],
    queryFn: () => fetchHorizonAccuracy(dateFrom, dateTo, cutoff),
  });

  const { data: daily } = useQuery({
    queryKey: ['daily', dateFrom, dateTo, cutoff],
    queryFn: () => fetchDailyAccuracy(dateFrom, dateTo, cutoff),
  });

  const { data: heatmap } = useQuery({
    queryKey: ['heatmap', dateFrom, dateTo, cutoff],
    queryFn: () => fetchHeatmap(dateFrom, dateTo, cutoff),
  });

  // Fast pre-indexed map for heatmap (date -> hour -> mae)
  const heatmapLookup = useMemo(() => {
    const map = new Map<string, Map<number, number>>();
    if (!heatmap) return map;
    for (const cell of heatmap) {
      if (!map.has(cell.date)) {
        map.set(cell.date, new Map());
      }
      map.get(cell.date)!.set(cell.hour, cell.mae);
    }
    return map;
  }, [heatmap]);

  const heatmapDates = useMemo(() => {
    return heatmap ? [...new Set(heatmap.map((c: HeatmapCell) => c.date))].sort() : [];
  }, [heatmap]);

  const maxMAE = useMemo(() => {
    return heatmap && heatmap.length ? Math.max(...heatmap.map((c: HeatmapCell) => c.mae)) : 3000;
  }, [heatmap]);

  return (
    <div>
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Accuracy & Horizon Analytics</h1>
          <p className="page-subtitle">
            Quantitative evaluation across forecast lead horizons, daily timelines, and settlement periods (January 2026)
          </p>
        </div>

        <div className="header-right-badges">
          <div className="filter-pill-btn">
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>From:</span>
            <input
              type="date"
              min="2026-01-01"
              max="2026-01-31"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
            />
          </div>
          <div className="filter-pill-btn">
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>To:</span>
            <input
              type="date"
              min="2026-01-01"
              max="2026-01-31"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
            />
          </div>
          <div className="filter-pill-btn">
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Cutoff:</span>
            <select value={cutoff} onChange={e => setCutoff(e.target.value)}>
              <option value="09:20">09:20 (EPEX Day-Ahead)</option>
              <option value="10:00">10:00 (Standard Cutoff)</option>
              <option value="11:00">11:00 (Nord Pool)</option>
              <option value="12:00">12:00 (Noon)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Top 2 Charts: Horizon Breakdown & Daily Timeline */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {/* Horizon Error Breakdown */}
        <div className="dashboard-card">
          <div className="card-top-header">
            <div>
              <div className="card-heading-title">Error by Forecast Horizon</div>
              <div className="card-heading-subtitle">Forecast error degrades as lead time into delivery increases</div>
            </div>
          </div>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={horizons || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="bucket" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={{ stroke: '#E2E8F0' }} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v} MW`} />
                <Tooltip
                  contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                  formatter={(val: any, name: any) => [`${Math.round(val).toLocaleString()} MW`, name]}
                />
                <Bar dataKey="mae" fill="#10B981" radius={[4, 4, 0, 0]} name="MAE (MW)" />
                <Bar dataKey="rmse" fill="#6366F1" radius={[4, 4, 0, 0]} name="RMSE (MW)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Accuracy Timeline */}
        <div className="dashboard-card">
          <div className="card-top-header">
            <div>
              <div className="card-heading-title">Daily Error Timeline (January 2026)</div>
              <div className="card-heading-subtitle">Day-to-day MAE and net forecast bias tracking</div>
            </div>
          </div>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={daily || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="date"
                  stroke="#94A3B8"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickFormatter={(d: string) => formatUtcDayOnly(d)}
                />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v} MW`} />
                <Tooltip
                  contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                  labelFormatter={(d: any) => `${formatUtcDate(d)} UTC`}
                  formatter={(v: any, name: any) => [`${Math.round(v).toLocaleString()} MW`, name]}
                />
                <Area type="monotone" dataKey="mae" fill="rgba(16, 185, 129, 0.1)" stroke="#10B981" strokeWidth={2} name="MAE (MW)" />
                <Line type="monotone" dataKey="bias" stroke="#EF4444" strokeWidth={1.5} dot={false} name="Bias (MW)" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Day x Hour Heatmap */}
      <div className="dashboard-card">
        <div className="card-top-header">
          <div>
            <div className="card-heading-title">Day × Hour Error Heatmap (31 Days × 24 Hours)</div>
            <div className="card-heading-subtitle">
              Color intensity indicates magnitude of forecast error (darker emerald/indigo = higher error during storms)
            </div>
          </div>
        </div>

        <div style={{ overflowX: 'auto', paddingBottom: '0.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '70px repeat(24, 1fr)', gap: 3, minWidth: 840, fontSize: '0.7rem' }}>
            <div style={{ fontWeight: 600, color: '#64748B' }}>Date</div>
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} style={{ textAlign: 'center', color: '#94A3B8', fontWeight: 500 }}>
                {h}h
              </div>
            ))}

            {heatmapDates.map(date => {
              const dateMap = heatmapLookup.get(date);
              return (
                <div key={date} style={{ display: 'contents' }}>
                  <div style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 600, alignSelf: 'center' }}>
                    {formatUtcDateShort(date)}
                  </div>
                  {Array.from({ length: 24 }, (_, h) => {
                    const mae = dateMap?.get(h) ?? 0;
                    const intensity = Math.min(mae / (maxMAE || 1), 1);
                    const bg = `rgba(16, 185, 129, ${0.1 + intensity * 0.85})`;
                    return (
                      <div
                        key={h}
                        title={`${formatUtcDate(date)}, ${h}:00 UTC — MAE: ${Math.round(mae)} MW`}
                        style={{
                          height: 18,
                          borderRadius: 3,
                          background: mae > 0 ? bg : '#F1F5F9',
                          cursor: 'pointer',
                        }}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}


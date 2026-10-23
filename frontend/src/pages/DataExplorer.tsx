import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchDecision, fetchMeta, type DecisionPoint } from '../api';
import {
  formatUtcDate,
  formatUtcDateTime,
  formatUtcTime,
} from '../utils/formatDate';

export default function DataExplorer() {
  const [selectedDate, setSelectedDate] = useState('2026-01-14');
  const [cutoff, setCutoff] = useState('09:20');
  const [search, setSearch] = useState('');

  const { data: meta } = useQuery({ queryKey: ['meta'], queryFn: fetchMeta });

  const { data: decision, isLoading } = useQuery({
    queryKey: ['decision', selectedDate, cutoff],
    queryFn: () => fetchDecision(selectedDate, cutoff),
  });

  const filteredPoints = useMemo(() => {
    if (!decision?.points) return [];
    if (!search.trim()) return decision.points;
    const q = search.toLowerCase();
    return decision.points.filter((p: DecisionPoint) =>
      p.startTime.toLowerCase().includes(q) ||
      p.publishTime.toLowerCase().includes(q)
    );
  }, [decision, search]);

  const exportCSV = () => {
    if (!decision?.points?.length) return;
    const headers = ['Target Time (UTC)', 'Forecast (MW)', 'Actual (MW)', 'Error (MW)', 'Horizon (hours)', 'Publish Time (UTC)'];
    const rows = decision.points.map((p: DecisionPoint) => [
      `${formatUtcDate(p.startTime)} ${formatUtcTime(p.startTime)}`,
      p.forecastMW,
      p.actualMW ?? '',
      p.errorMW ?? '',
      p.horizonHours,
      `${formatUtcDate(p.publishTime)} ${formatUtcTime(p.publishTime)}`,
    ].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `windledger_data_${selectedDate}_cutoff_${cutoff.replace(':', '')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Data Explorer</h1>
          <p className="page-subtitle">
            Inspect raw hourly settlement points, latest forecast vintages, and export dataset tables (UTC)
          </p>
        </div>

        <div className="header-right-badges">
          <button
            onClick={exportCSV}
            className="filter-pill-btn"
            style={{ background: '#10B981', color: '#FFFFFF', borderColor: '#059669', fontWeight: 600 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      <div className="dashboard-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div className="filter-pill-btn">
            <span style={{ color: '#64748B', fontSize: '0.8rem' }}>Date:</span>
            <select value={selectedDate} onChange={e => setSelectedDate(e.target.value)}>
              {meta?.availableDates?.map(d => (
                <option key={d} value={d}>
                  {formatUtcDate(d)}
                </option>
              )) || <option value="2026-01-14">14 Jan 2026</option>}
            </select>
          </div>

          <div className="filter-pill-btn">
            <span style={{ color: '#64748B', fontSize: '0.8rem' }}>Cutoff:</span>
            <select value={cutoff} onChange={e => setCutoff(e.target.value)}>
              <option value="09:20">09:20 (EPEX Day-Ahead)</option>
              <option value="10:00">10:00 (Standard Cutoff)</option>
              <option value="11:00">11:00 (Nord Pool)</option>
              <option value="12:00">12:00 (Noon)</option>
            </select>
          </div>

          <div style={{ marginLeft: 'auto' }}>
            <input
              type="text"
              placeholder="Search time or period..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                padding: '6px 14px',
                borderRadius: '9999px',
                border: '1px solid #E2E8F0',
                outline: 'none',
                fontSize: '0.825rem',
                width: 220,
              }}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#64748B', background: '#F8FAFC' }}>
                <th style={{ padding: '10px 14px' }}>Target Hour (UTC)</th>
                <th style={{ padding: '10px 14px' }}>Forecast (MW)</th>
                <th style={{ padding: '10px 14px' }}>Actual (MW)</th>
                <th style={{ padding: '10px 14px' }}>Error (MW)</th>
                <th style={{ padding: '10px 14px' }}>Lead Horizon</th>
                <th style={{ padding: '10px 14px' }}>Publish Time (UTC)</th>
              </tr>
            </thead>
            <tbody>
              {filteredPoints.map((p: DecisionPoint, idx: number) => {
                const isUnder = (p.errorMW || 0) < 0;
                return (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: '1px solid #F1F5F9',
                      transition: 'background 0.15s',
                    }}
                  >
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0F172A' }}>
                      {formatUtcDateTime(p.startTime)} UTC
                    </td>
                    <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#2563EB' }}>
                      {p.forecastMW.toLocaleString()} MW
                    </td>
                    <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#059669' }}>
                      {p.actualMW != null ? `${p.actualMW.toLocaleString()} MW` : '—'}
                    </td>
                    <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: isUnder ? '#059669' : '#EF4444' }}>
                      {p.errorMW != null ? `${p.errorMW > 0 ? '+' : ''}${p.errorMW.toLocaleString()} MW` : '—'}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#64748B' }}>
                      {p.horizonHours}h
                    </td>
                    <td style={{ padding: '10px 14px', color: '#64748B', fontSize: '0.8rem' }}>
                      {formatUtcDateTime(p.publishTime)} UTC
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


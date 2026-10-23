import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface SearchItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'Page' | 'Trading Day' | 'Metric' | 'API';
  badge: string;
  badgeColor: string;
  path: string;
  keywords: string[];
}

const SEARCH_DATABASE: SearchItem[] = [
  // Pages
  {
    id: 'page-dash',
    title: 'Executive Trading Dashboard',
    subtitle: 'Macro KPIs, actual vs forecast power curves, vintage stepper, and diurnal MAE profile',
    category: 'Page',
    badge: 'View',
    badgeColor: '#3b82f6',
    path: '/',
    keywords: ['dashboard', 'home', 'kpi', 'actual', 'forecast', 'overview', 'summary', 'chart']
  },
  {
    id: 'page-forecast',
    title: 'Forecast Trajectory Explorer',
    subtitle: 'Multi-vintage spaghetti evolution plots and chronological publication audit log',
    category: 'Page',
    badge: 'View',
    badgeColor: '#3b82f6',
    path: '/forecast-explorer',
    keywords: ['evolution', 'trajectory', 'spaghetti', 'vintage', 'lead time', 'audit', 'publish time']
  },
  {
    id: 'page-analytics',
    title: 'Accuracy Lab & 31×24 Heatmap',
    subtitle: 'Lead time horizon decay curves and interactive delivery month error matrix',
    category: 'Page',
    badge: 'View',
    badgeColor: '#3b82f6',
    path: '/analytics',
    keywords: ['analytics', 'heatmap', 'matrix', 'horizon', 'decay', 'error', 'mae', 'rmse']
  },
  {
    id: 'page-data',
    title: 'Data Explorer & CSV Export',
    subtitle: 'Tabular view of all 744 settlement hours with one-click dataset download',
    category: 'Page',
    badge: 'View',
    badgeColor: '#3b82f6',
    path: '/data-explorer',
    keywords: ['data', 'table', 'csv', 'export', 'download', 'raw', 'records', 'parquet']
  },
  {
    id: 'page-settings',
    title: 'Trading Settings & Market Handbook',
    subtitle: 'Cutoff time presets (09:20 EPEX / 10:00 Nord Pool) and Elexon BMRS ingestion schema',
    category: 'Page',
    badge: 'View',
    badgeColor: '#3b82f6',
    path: '/settings',
    keywords: ['settings', 'config', 'cutoff', 'epex', 'nord pool', 'bmrs', 'rules', 'elexon']
  },
  {
    id: 'page-docs',
    title: 'Enterprise API Reference',
    subtitle: 'Interactive documentation, schemas, code examples, and live test console',
    category: 'Page',
    badge: 'API',
    badgeColor: '#8b5cf6',
    path: '/api-reference',
    keywords: ['api', 'docs', 'swagger', 'reference', 'endpoints', 'rest', 'developer']
  },

  // Key Trading Days in January 2026
  {
    id: 'day-jan14',
    title: '14 Jan 2026 — Winter Storm Peak (17.8 GW)',
    subtitle: 'Highest wind generation day of January 2026 with sharp frontal passage',
    category: 'Trading Day',
    badge: 'High Volatility',
    badgeColor: '#ef4444',
    path: '/?date=2026-01-14',
    keywords: ['14', 'jan 14', 'january 14', '2026-01-14', 'storm', 'peak', 'record', 'high wind']
  },
  {
    id: 'day-jan25',
    title: '25 Jan 2026 — Major Down-Ramp (-2,420 MW)',
    subtitle: 'Steepest generation down-ramp of the month; forecast lagged outturn drop',
    category: 'Trading Day',
    badge: 'Ramp Event',
    badgeColor: '#f59e0b',
    path: '/analytics?date=2026-01-25',
    keywords: ['25', 'jan 25', 'january 25', '2026-01-25', 'ramp', 'drop', 'lag', 'deficit']
  },
  {
    id: 'day-jan10',
    title: '10 Jan 2026 — Peak Imbalance Risk (£142k)',
    subtitle: 'Largest financial cashout exposure day under GB System Buy Price penalty',
    category: 'Trading Day',
    badge: 'Financial Risk',
    badgeColor: '#ef4444',
    path: '/?date=2026-01-10',
    keywords: ['10', 'jan 10', 'january 10', '2026-01-10', 'cashout', 'imbalance', 'penalty', 'cost']
  },
  {
    id: 'day-jan18',
    title: '18 Jan 2026 — Systematic Over-Forecast Bias',
    subtitle: 'Average forecast over-prediction of +2,850 MW across all peak delivery hours',
    category: 'Trading Day',
    badge: 'High Bias',
    badgeColor: '#f59e0b',
    path: '/forecast-explorer?date=2026-01-18',
    keywords: ['18', 'jan 18', 'january 18', '2026-01-18', 'bias', 'overforecast', 'shortfall']
  },
  {
    id: 'day-jan31',
    title: '31 Jan 2026 — Month-End Gate Closure',
    subtitle: 'Day D-1 decisions procuring electricity for delivery across 01 February 2026',
    category: 'Trading Day',
    badge: 'D-1 Cutoff',
    badgeColor: '#10b981',
    path: '/?date=2026-01-31',
    keywords: ['31', 'jan 31', 'january 31', '2026-01-31', 'month end', 'february', 'd-1']
  },

  // Key Metrics
  {
    id: 'metric-mae',
    title: 'Mean Absolute Error (MAE: 2,142 MW)',
    subtitle: 'Expected absolute forecast miss across all 744 settlement hours at 09:20 cutoff',
    category: 'Metric',
    badge: 'KPI',
    badgeColor: '#10b981',
    path: '/analytics',
    keywords: ['mae', 'mean absolute error', 'accuracy', 'average error', 'mw']
  },
  {
    id: 'metric-rmse',
    title: 'Root Mean Square Error (RMSE: 2,612 MW)',
    subtitle: 'Error variance metric penalizing large forecast misses during volatile frontal shifts',
    category: 'Metric',
    badge: 'KPI',
    badgeColor: '#10b981',
    path: '/analytics',
    keywords: ['rmse', 'root mean square', 'variance', 'penalty']
  },
  {
    id: 'metric-bands',
    title: 'P10 — P90 Uncertainty Bands',
    subtitle: 'Empirical forecast error quantiles based strictly on historical outturn before D-1',
    category: 'Metric',
    badge: 'Model',
    badgeColor: '#059669',
    path: '/',
    keywords: ['p10', 'p90', 'bands', 'uncertainty', 'confidence', 'quantile', 'conservative']
  },

  // APIs
  {
    id: 'api-imbalance',
    title: 'GET /api/trading/imbalance-risk',
    subtitle: 'Balancing mechanism cashout modeling and System Buy/Sell Price penalty exposure',
    category: 'API',
    badge: 'REST',
    badgeColor: '#8b5cf6',
    path: '/api-reference',
    keywords: ['api', 'trading', 'imbalance', 'cashout', 'sbp', 'ssp', 'spread']
  },
  {
    id: 'api-ramps',
    title: 'GET /api/ramps/events',
    subtitle: 'Automated wind power ramp event detection (>800 MW swings) and capture rates',
    category: 'API',
    badge: 'REST',
    badgeColor: '#8b5cf6',
    path: '/api-reference',
    keywords: ['api', 'ramps', 'events', 'volatility', 'swing', 'rate']
  },
  {
    id: 'api-csv',
    title: 'GET /api/data/export/csv',
    subtitle: 'Stream joined point-in-time decision forecasts and outturns for quantitative analysis',
    category: 'API',
    badge: 'CSV',
    badgeColor: '#10b981',
    path: '/api-reference',
    keywords: ['api', 'export', 'csv', 'download', 'stream', 'data']
  }
];

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global keydown listeners for Escape and Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filter items
  const filtered = SEARCH_DATABASE.filter(item => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.keywords.some(k => k.toLowerCase().includes(q))
    );
  }).slice(0, 8);

  const handleSelect = (item: SearchItem) => {
    onClose();
    navigate(item.path);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (filtered.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + (filtered.length || 1)) % (filtered.length || 1));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault();
      handleSelect(filtered[selectedIndex]);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '10vh',
        animation: 'fadeIn 0.15s ease-out'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '620px',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0,0,0,0.08)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Search Input Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px 20px',
          borderBottom: '1px solid #e2e8f0',
          background: '#ffffff'
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search dates (e.g. Jan 14), pages, metrics, or API endpoints..."
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '15px',
              fontFamily: 'inherit',
              color: '#0f172a',
              background: 'transparent'
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{
                border: 'none',
                background: '#f1f5f9',
                color: '#64748b',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px'
              }}
            >
              ✕
            </button>
          )}
          <kbd style={{
            background: '#f1f5f9',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            padding: '2px 7px',
            fontSize: '11px',
            fontWeight: 600,
            color: '#64748b'
          }}>
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div style={{ maxHeight: '380px', overflowY: 'auto', padding: '8px' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '36px 20px', textAlign: 'center', color: '#64748b' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔍</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>No matching results found</div>
              <div style={{ fontSize: '13px', marginTop: '4px' }}>Try searching for "Jan 14", "Heatmap", "MAE", or "Ramp"</div>
            </div>
          ) : (
            filtered.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    background: isSelected ? '#f0fdf4' : 'transparent',
                    border: isSelected ? '1px solid #bbf7d0' : '1px solid transparent',
                    transition: 'all 0.1s ease',
                    marginBottom: '4px'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                        {item.title}
                      </span>
                      <span style={{
                        fontSize: '10.5px',
                        fontWeight: 700,
                        color: item.badgeColor,
                        background: `${item.badgeColor}15`,
                        padding: '2px 8px',
                        borderRadius: '12px'
                      }}>
                        {item.badge}
                      </span>
                    </div>
                    <span style={{ fontSize: '12.5px', color: '#64748b', lineHeight: 1.4 }}>
                      {item.subtitle}
                    </span>
                  </div>

                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isSelected ? '#059669' : '#94a3b8'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info bar */}
        <div style={{
          padding: '10px 18px',
          background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: '#64748b'
        }}>
          <div style={{ display: 'flex', gap: '14px' }}>
            <span><kbd style={{ background: '#e2e8f0', padding: '1px 5px', borderRadius: '4px' }}>↑↓</kbd> Navigate</span>
            <span><kbd style={{ background: '#e2e8f0', padding: '1px 5px', borderRadius: '4px' }}>ENTER</kbd> Select</span>
            <span><kbd style={{ background: '#e2e8f0', padding: '1px 5px', borderRadius: '4px' }}>ESC</kbd> Close</span>
          </div>
          <span style={{ fontWeight: 600, color: '#059669' }}>WindLedger Quick Search</span>
        </div>
      </div>
    </div>
  );
}

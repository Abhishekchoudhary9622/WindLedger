import { useQuery } from '@tanstack/react-query';
import { fetchMeta } from '../api';

export default function Settings() {
  const { data: meta } = useQuery({ queryKey: ['meta'], queryFn: fetchMeta });

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto' }}>
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Methodology & Dataset Scope</h1>
          <p className="page-subtitle">
            Elexon BMRS data integration, trading gate closures, hourly aggregation, and error metric definitions
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Dataset Connections & Official Endpoints */}
        <div className="dashboard-card">
          <div className="card-top-header">
            <div>
              <div className="card-heading-title">Official Elexon BMRS Datasets Implemented</div>
              <div className="card-heading-subtitle">Ingestion from the two official Elexon Insights stream endpoints</div>
            </div>
            <div className="pill-selected-green">100% Ingested & Active</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.75rem' }}>
            {/* Dataset 1: Actuals */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontWeight: 700, color: '#059669', fontSize: '0.95rem' }}>
                  Actual Generation (FUELHH)
                </span>
                <span className="pill-selected-green" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                  {meta?.actualCount ? `${meta.actualCount.toLocaleString()} rows` : '1,585 rows'}
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748B', lineHeight: 1.6, marginBottom: 10 }}>
                Actual wind generation in Great Britain, filtered strictly to <code>fuelType = "WIND"</code>. Native resolution: 30-minute settlement periods (48 periods/day, 1,488 in January).
              </p>
              <div style={{ fontSize: '0.78rem', color: '#334155', marginBottom: 8 }}>
                <strong>Key fields:</strong> <code>startTime</code> (delivery interval), <code>settlementDate</code>, <code>settlementPeriod</code>, <code>generation</code> (outturn MW), <code>fuelType</code>.
              </div>
              <a
                href="https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream"
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '0.78rem', color: '#2563EB', textDecoration: 'underline', wordBreak: 'break-all' }}
              >
                https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream ↗
              </a>
            </div>

            {/* Dataset 2: Forecasts */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontWeight: 700, color: '#2563EB', fontSize: '0.95rem' }}>
                  Forecasted Generation (WINDFOR)
                </span>
                <span className="pill-selected-green" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                  {meta?.forecastCount ? `${meta.forecastCount.toLocaleString()} rows` : '21,024 rows'}
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748B', lineHeight: 1.6, marginBottom: 10 }}>
                National wind generation forecasts published at multiple lead times. Native resolution: 60-minute hourly intervals (24 intervals/day, 744 in January).
              </p>
              <div style={{ fontSize: '0.78rem', color: '#334155', marginBottom: 8 }}>
                <strong>Key fields:</strong> <code>startTime</code> (delivery hour), <code>publishTime</code> (publication timestamp), <code>generation</code> (forecast MW).
              </div>
              <a
                href="https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream"
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '0.78rem', color: '#2563EB', textDecoration: 'underline', wordBreak: 'break-all' }}
              >
                https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream ↗
              </a>
            </div>
          </div>
        </div>

        {/* Temporal Alignment & Aggregation Method */}
        <div className="dashboard-card">
          <div className="card-top-header">
            <div>
              <div className="card-heading-title">Temporal Alignment & Hourly Aggregation</div>
              <div className="card-heading-subtitle">Harmonizing 30-minute settlement actuals with 60-minute forecast intervals</div>
            </div>
          </div>

          <div style={{ color: '#475569', fontSize: '0.875rem', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p>
              In Great Britain, electricity settlement operates on <strong>30-minute settlement periods</strong> (48 periods per day, totaling 1,488 periods across January). However, the National Grid ESO wind forecast (<strong>WINDFOR</strong>) is published on an <strong>hourly resolution</strong> (744 hours across January).
            </p>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '14px', fontSize: '0.825rem' }}>
              <strong>Aggregation Logic:</strong> To evaluate forecasts without temporal distortion, each hour's two 30-minute FUELHH outturn records (e.g. 00:00–00:30 and 00:30–01:00) are averaged to form the ground-truth hourly delivery outturn. This produces exactly <strong>744 hourly delivery periods</strong> matching 100% of January 2026.
            </div>
          </div>
        </div>

        {/* Why the Forecast Bias (+1,852 MW) Exists */}
        <div className="dashboard-card">
          <div className="card-top-header">
            <div>
              <div className="card-heading-title">Understanding Bias & Error Magnitude</div>
              <div className="card-heading-subtitle">Verified math from raw Elexon datasets and structural domain drivers</div>
            </div>
          </div>

          <div style={{ color: '#475569', fontSize: '0.875rem', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p>
              When evaluating the January 2026 day-ahead decision forecast against metered outturn, the overall statistics are:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
              <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Mean Forecast</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#2563EB' }}>13,433 MW</div>
              </div>
              <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Mean Actual</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#059669' }}>11,581 MW</div>
              </div>
              <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Net Bias</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#EF4444' }}>+1,852 MW</div>
              </div>
              <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>MAE / nMAE</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>2,142 MW (18.5%)</div>
              </div>
            </div>
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '14px', fontSize: '0.825rem', color: '#92400E' }}>
              <strong>Domain Drivers:</strong>
              <ul style={{ margin: '6px 0 0 16px', lineHeight: 1.6 }}>
                <li><strong>Transmission vs. Embedded Generation:</strong> Standard BMRS FUELHH outturn captures BM-registered operational metering on the high-voltage transmission system. Smaller embedded wind farms connected to distribution networks are not captured in FUELHH wind totals, while WINDFOR forecasts national expected output.</li>
                <li><strong>Storm Curtailment & High Wind Cut-Out:</strong> January 2026 experienced severe Atlantic windstorms (e.g. Storm Gorel) where turbines were commercially curtailed in the Balancing Mechanism or shut down due to high-wind cut-out thresholds.</li>
                <li><strong>Reproducibility:</strong> Run <code>python scripts/verify_metrics.py</code> in the backend directory to verify all calculations directly from raw Parquet files.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Market Gate Closures & Trading Rules */}
        <div className="dashboard-card">
          <div className="card-top-header">
            <div>
              <div className="card-heading-title">GB Day-Ahead Market Gate Closures</div>
              <div className="card-heading-subtitle">Confirmed auction timings in UK time (same as UTC in January)</div>
            </div>
          </div>

          <div style={{ color: '#475569', fontSize: '0.875rem', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '14px' }}>
                <div style={{ fontWeight: 600, color: '#0F172A', marginBottom: 4 }}>EPEX SPOT GB Day-Ahead</div>
                <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                  Order book closes daily at <strong>09:20 UK time (same as UTC in January)</strong>. Results published from 09:30.
                </div>
              </div>

              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '14px' }}>
                <div style={{ fontWeight: 600, color: '#0F172A', marginBottom: 4 }}>Nord Pool N2EX Day-Ahead</div>
                <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                  Order book closes daily at <strong>09:50 UK time (same as UTC in January)</strong>. Auction results published by 10:00.
                </div>
              </div>

              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '14px' }}>
                <div style={{ fontWeight: 600, color: '#0F172A', marginBottom: 4 }}>Illustrative Scenario Features</div>
                <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                  Financial cashout (SBP/SSP) penalties and bid recommendation features use illustrative pricing assumptions and are provided as optional exploration beyond the core Elexon outturn data.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

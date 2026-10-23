import { motion } from 'framer-motion';

export default function Methodology() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <motion.div
        className="section-header"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span
          style={{
            display: 'inline-block',
            padding: '4px 10px',
            borderRadius: '999px',
            background: 'var(--cyan-dim)',
            color: 'var(--cyan)',
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            marginBottom: '0.5rem',
          }}
        >
          Documentation & Quantitative Standards
        </span>
        <h1 className="section-title">📘 Methodology & Market Handbook</h1>
        <p className="section-subtitle">
          How WindLens extracts actionable day-ahead trading decisions, quantifies forecast risk, and calculates empirical metrics
        </p>
      </motion.div>

      {/* Grid of Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

        {/* Section 1: The Trading Problem */}
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="card-header">
            <div>
              <div className="card-title">🎯 1. The Day-Ahead Trading Dilemma</div>
              <div className="card-subtitle">Why precision at the decision cutoff determines profit & loss</div>
            </div>
          </div>
          <div style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.92rem' }}>
            <p style={{ marginBottom: '1rem' }}>
              Day-ahead power traders at UK energy suppliers and utilities face a daily challenge on day <strong style={{ color: 'var(--text-primary)' }}>D-1</strong>: deciding exactly how much wholesale power to purchase for each hour of delivery day <strong style={{ color: 'var(--text-primary)' }}>D</strong> before the auction gates close.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
              <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 600, color: 'var(--cyan)', marginBottom: '0.25rem' }}>Auction Deadlines</div>
                <div style={{ fontSize: '0.85rem' }}>
                  The primary UK day-ahead auction (EPEX SPOT / Nord Pool) clears around <strong>09:20 – 11:00 UTC</strong> on D-1. Forecasts issued <em>after</em> this gate closure are irrelevant for day-ahead auction bidding.
                </div>
              </div>
              <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 600, color: 'var(--coral)', marginBottom: '0.25rem' }}>Imbalance Cashout Penalties</div>
                <div style={{ fontSize: '0.85rem' }}>
                  If a trader buys too little wind (or over-hedges and wind falls short), the residual volume is settled at the <strong>System Cashout Price</strong> in the Balancing Mechanism, creating severe asymmetric margin risk.
                </div>
              </div>
              <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 600, color: 'var(--amber)', marginBottom: '0.25rem' }}>Lookahead Bias Elimination</div>
                <div style={{ fontSize: '0.85rem' }}>
                  Many backtests unrealistically use the final forecast published 2 hours before delivery. WindLens strictly evaluates the <strong>latest forecast available at the cutoff time</strong> on D-1.
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Section 2: Data Sources & Alignment */}
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="card-header">
            <div>
              <div className="card-title">📡 2. Data Sources & Granularity</div>
              <div className="card-subtitle">Elexon BMRS Open Insights API feeds</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.2rem' }}>🔮</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>WINDFOR (Wind Forecasts)</span>
              </div>
              <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li>National aggregate wind power generation forecast published by the National Energy System Operator (NESO).</li>
                <li>Each record carries a <code>publishTime</code> (when the forecast was generated) and a target <code>startTime</code> (the settlement period it forecasts).</li>
                <li>New runs are published multiple times per day (typically 02:00, 07:00, 09:00, 11:00, 15:00 UTC).</li>
                <li>Over 21,000 forecast data points for January 2026 are processed in WindLens.</li>
              </ul>
            </div>

            <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.2rem' }}>⚡</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>FUELHH (Actual Generation)</span>
              </div>
              <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li>Half-hourly metered generation outturn by fuel type across Great Britain.</li>
                <li>Filtered exclusively for <code>fuelType = 'WIND'</code> to establish ground-truth actual wind generation.</li>
                <li>Aggregated to hourly resolution to precisely match the hourly forecast granularity used in day-ahead wholesale trading.</li>
                <li>Complete 744 hourly settlement intervals across January 2026.</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Section 3: The Point-in-Time Selection Algorithm */}
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="card-header">
            <div>
              <div className="card-title">⚙️ 3. The Point-in-Time Cutoff Algorithm</div>
              <div className="card-subtitle">Exact mathematical formulation of the trader's information set</div>
            </div>
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7 }}>
            <p style={{ marginBottom: '1rem' }}>
              For a given delivery date <code style={{ color: 'var(--cyan)' }}>D</code> and decision cutoff time <code style={{ color: 'var(--cyan)' }}>HH:MM</code>, the effective decision timestamp is:
            </p>
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                padding: '1rem',
                borderRadius: 'var(--radius-sm)',
                fontFamily: 'var(--font-mono)',
                color: 'var(--cyan)',
                borderLeft: '3px solid var(--cyan)',
                marginBottom: '1rem',
              }}
            >
              Cutoff Timestamp = (D - 1 day) at HH:MM:00 UTC
            </div>
            <p style={{ marginBottom: '1rem' }}>
              For every target hour <code style={{ color: 'var(--text-primary)' }}>t ∈ [D 00:00, D 23:00]</code>:
            </p>
            <ol style={{ paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
              <li>
                <strong>Filter admissible runs:</strong> Retain only forecasts with <code>publishTime &le; Cutoff Timestamp</code> and <code>startTime = t</code>.
              </li>
              <li>
                <strong>Select latest version:</strong> Pick the single record with <code>max(publishTime)</code>. This was the most accurate, up-to-date insight on the trader's screen at decision time.
              </li>
              <li>
                <strong>Calculate lead time (Horizon):</strong>
                <br />
                <code style={{ color: 'var(--violet)' }}>Horizon (hours) = (t - publishTime) in hours</code>. For day D, horizons typically range from 14.7 hours (00:00 delivery) to 37.7 hours (23:00 delivery).
              </li>
            </ol>
          </div>
        </motion.div>

        {/* Section 4: Statistical Metrics */}
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="card-header">
            <div>
              <div className="card-title">📐 4. Quantitative Metrics & Formulas</div>
              <div className="card-subtitle">Standardized evaluation metrics for power trading risk</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 600, color: 'var(--cyan)', marginBottom: '0.5rem' }}>Mean Absolute Error (MAE)</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                MAE = (1 / N) &Sigma; |Forecast - Actual|
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Average magnitude of forecast miss in Megawatts. Directly proportional to volume exposure.
              </div>
            </div>

            <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 600, color: 'var(--violet)', marginBottom: '0.5rem' }}>Root Mean Square Error (RMSE)</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                RMSE = &radic; [ (1 / N) &Sigma; (Forecast - Actual)&sup2; ]
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Penalizes large errors quadratically. Critical for spotting volatile wind storm ramps.
              </div>
            </div>

            <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 600, color: 'var(--coral)', marginBottom: '0.5rem' }}>Forecast Bias</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                Bias = (1 / N) &Sigma; (Forecast - Actual)
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Positive bias indicates persistent over-forecasting (expecting more wind than arrived).
              </div>
            </div>

            <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 600, color: 'var(--amber)', marginBottom: '0.5rem' }}>Normalised MAE (nMAE %)</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                nMAE = (MAE / Mean Actual) &times; 100%
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Scale-independent metric allowing comparison across seasonal generation levels.
              </div>
            </div>
          </div>
        </motion.div>

        {/* Section 5: Uncertainty Bands & Conservative Hedging */}
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="card-header">
            <div>
              <div className="card-title">🛡️ 5. Empirical Uncertainty Bands & Conservative Bidding</div>
              <div className="card-subtitle">Transforming raw point forecasts into probabilistic risk parameters</div>
            </div>
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7 }}>
            <p style={{ marginBottom: '1rem' }}>
              A single point forecast is dangerous without confidence intervals. WindLens calculates empirical error distributions conditioned on the forecast horizon bucket:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 600, color: 'var(--violet)', marginBottom: '0.25rem' }}>P10 – P90 Uncertainty Corridor</div>
                <p style={{ fontSize: '0.85rem' }}>
                  The 10th and 90th percentiles of historical forecast error for the specific horizon. There is an 80% empirical probability that actual generation will land within this corridor.
                </p>
              </div>
              <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 600, color: 'var(--emerald)', marginBottom: '0.25rem' }}>Conservative Position (P10 Hedge)</div>
                <p style={{ fontSize: '0.85rem' }}>
                  Calculated as <code style={{ color: 'var(--emerald)' }}>max(0, Forecast - P90_Error)</code>. Guarantees a high degree of confidence that actual wind will meet or exceed this committed volume, minimizing short imbalance cashout risk.
                </p>
              </div>
            </div>
            <div style={{ background: 'rgba(34, 211, 238, 0.05)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--cyan-dim)' }}>
              <strong style={{ color: 'var(--cyan)' }}>Trading Action Tip:</strong> In high-volatility hours (e.g. evening peak demand 17:00–19:00 UTC), hedge to the <em>Conservative Position</em> in the day-ahead auction, then selectively top up in the intraday market as lead times shrink and uncertainty contracts.
            </div>
          </div>
        </motion.div>

        {/* Section 6: Tech Stack & Architecture */}
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="card-header">
            <div>
              <div className="card-title">💻 6. Technical Stack & Execution Architecture</div>
              <div className="card-subtitle">Modern high-performance reactive portal</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', fontSize: '0.85rem' }}>
            <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ color: 'var(--cyan)', fontWeight: 600, marginBottom: '0.25rem' }}>FastAPI Backend</div>
              <div style={{ color: 'var(--text-secondary)' }}>Async REST endpoints with automated OpenAPI schemas, sub-50ms query latency, and vectorized Pandas calculations.</div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ color: 'var(--amber)', fontWeight: 600, marginBottom: '0.25rem' }}>PyArrow Parquet</div>
              <div style={{ color: 'var(--text-secondary)' }}>Columnar compressed storage for over 22,000 time series points, loaded directly into memory at startup.</div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ color: 'var(--violet)', fontWeight: 600, marginBottom: '0.25rem' }}>React 19 + TypeScript</div>
              <div style={{ color: 'var(--text-secondary)' }}>Type-safe frontend with TanStack Query caching, Recharts interactive visualizations, and Framer Motion transitions.</div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ color: 'var(--emerald)', fontWeight: 600, marginBottom: '0.25rem' }}>Trading-Desk Theme</div>
              <div style={{ color: 'var(--text-secondary)' }}>Glassmorphism dark aesthetics, JetBrains Mono typography for precision numerals, and responsive layout.</div>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
